// src/lib/llm.ts
export interface LLMSettings {
  provider: 'openai' | 'gemini' | 'deepseek' | 'local';
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

export const DEFAULT_SETTINGS: LLMSettings = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: 'https://generativelanguage.googleapis.com',
  modelName: 'gemini-1.5-pro'
};

const SETTINGS_KEY = 'cyberslide_llm_settings';

export function getLLMSettings(): LLMSettings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveLLMSettings(settings: LLMSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function analyzeImageLLM(
  base64DataUrl: string,
  prompt: string = "请用一句非常简短的话描述这张图片的主要内容和主题，用于后续的演讲幻灯片主题词。不要超过30个字。"
): Promise<string> {
  const settings = getLLMSettings();
  const apiKey = (settings.apiKey || "").trim();
  const baseUrlRaw = (settings.baseUrl || "").trim();
  const modelName = (settings.modelName || "").trim();
  
  if (!apiKey) throw new Error("API Key 未配置");

  // Extract base64 and mime type from dataUrl
  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("无效的图片格式");
  
  const mimeType = match[1];
  const base64Data = match[2];

  if (settings.provider === 'gemini') {
    const baseUrl = (baseUrlRaw || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
    const apiBaseUrl = baseUrl.endsWith('/v1beta') ? baseUrl : `${baseUrl}/v1beta`;
    const model = modelName || 'gemini-1.5-pro';
    
    const finalUrl = `${apiBaseUrl}/models/${model}:generateContent&key=${apiKey}`;
    
    const body = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }]
    };

    const res = await fetch("/api/proxy/chat", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: finalUrl, headers: { 'Content-Type': 'application/json' }, body }),
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "暂无描述";
  } else {
    // OpenAI vision equivalent
    const baseUrl = baseUrlRaw.replace(/\/+$/, '');
    const finalUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
    
    // Fallback to text model if modelName isn't vision capable, but typically any recent openAI model supports `image_url`
    const body = {
      model: modelName,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: base64DataUrl } }
        ]
      }]
    };

    const res = await fetch("/api/proxy/chat", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: finalUrl, headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body }),
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "暂无描述";
  }
}

export async function fetchLLM(
  prompt: string, 
  systemPrompt?: string, 
  isJson: boolean = false, 
  signal?: AbortSignal,
  onProgress?: (text: string) => void
): Promise<string> {
  const settings = getLLMSettings();

  const apiKey = (settings.apiKey || "").trim();
  const baseUrlRaw = (settings.baseUrl || "").trim();
  const modelName = (settings.modelName || "").trim();

  // (Internal function to handle streaming text reader)
  const processStream = async (res: Response, formatChunk: (chunk: any) => string | null): Promise<string> => {
    if (!res.body) throw new Error("No response body");
    
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data._proxy_error) throw new Error(`API Error: ${data.status} - ${data.message}`);
      
      let text = "";
      if (data.candidates) {
         text = data.candidates[0]?.content?.parts?.[0]?.text || '';
      } else if (data.choices) {
         text = data.choices[0]?.message?.content || '';
      } else {
         text = JSON.stringify(data);
      }
      if (onProgress && text) onProgress(text);
      return text;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let resultText = "";
    let buffer = "";
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        let lines = buffer.split('\n');
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') continue;
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;
            
            try {
               const parsed = JSON.parse(dataStr);
               const delta = formatChunk(parsed);
               if (delta) {
                 resultText += delta;
                 if (onProgress) onProgress(resultText);
               }
            } catch (e) {
               // ignore partial chunks or bad formats
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    return resultText;
  };

  if (settings.provider === 'gemini') {
    const baseUrl = (baseUrlRaw || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
    const apiBaseUrl = baseUrl.endsWith('/v1beta') ? baseUrl : `${baseUrl}/v1beta`;
    const model = modelName || 'gemini-1.5-pro';
    
    const action = onProgress ? 'streamGenerateContent?alt=sse' : 'generateContent';
    const finalUrl = `${apiBaseUrl}/models/${model}:${action}&key=${apiKey}`;
    
    const contents = [];
    if (systemPrompt) {
       contents.push({ role: "user", parts: [{ text: "System Prompt: " + systemPrompt }] });
       contents.push({ role: "model", parts: [{ text: "Understood." }] });
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const body: any = {
      contents,
      generationConfig: {}
    };

    if (isJson) body.generationConfig.responseMimeType = "application/json";

    let res;
    try {
      res = await fetch("/api/proxy/chat", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, headers: { 'Content-Type': 'application/json' }, body }),
        signal
      });
    } catch (e: any) {
      if (e.name === 'AbortError') throw e;
      throw new Error(`代理请求失败 (Failed to fetch)。如果网络面板显示 403，请检查后端代理是否成功运行，或 API Key 是否无效导致远端拒绝。`);
    }

    if (!res.ok) {
       const errText = await res.text();
       throw new Error(`Gemini Error: ${res.status} - ${errText}`);
    }

    if (onProgress) {
      return await processStream(res, (data: any) => data.candidates?.[0]?.content?.parts?.[0]?.text || null);
    } else {
      let data;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
          if (data._proxy_error) throw new Error(`Gemini Error: ${data.status} - ${data.message}`);
        } catch (e: any) {
          if (e.message.includes('Gemini Error')) throw e;
          throw new Error(`无法解析接口的返回值。这通常是因为接口地址错误，或者是模型被防火墙。前100字符: ${text.slice(0, 100)}`);
        }
      } catch(e: any) {
        if (e.name === 'AbortError') throw e;
        throw e;
      }
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    
  } else {
    // OpenAI Equivalent
    const baseUrl = baseUrlRaw.replace(/\/+$/, '');
    const finalUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
    
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const body: any = { model: modelName, messages };
    if (isJson && settings.provider !== 'local') body.response_format = { type: "json_object" };
    if (onProgress && !isJson) body.stream = true;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    let res;
    try {
      res = await fetch("/api/proxy/chat", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, headers, body }),
        signal
      });
    } catch (e: any) {
      if (e.name === 'AbortError') throw e;
      throw new Error(`代理请求失败 (Failed to fetch)。如果网络面板显示 403，请检查后端代理是否成功运行，或者是 API Key 无效/账户无余额导致服务器拒绝访问。`);
    }

    if (!res.ok) {
       const errText = await res.text();
       throw new Error(`${settings.provider.toUpperCase()} API Error: ${res.status} - ${errText}`);
    }

    if (onProgress && !isJson) {
       return await processStream(res, (data: any) => data.choices?.[0]?.delta?.content || null);
    } else {
      let data;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
          if (data._proxy_error) throw new Error(`${settings.provider.toUpperCase()} API Error: ${data.status} - ${data.message}`);
        } catch (e: any) {
          if (e.message.includes('API Error:')) throw e;
          throw new Error(`无法解析接口的返回值。这通常是因为接口地址拼写错误。前100字符: ${text.slice(0, 100)}`);
        }
      } catch(e: any) {
        if (e.name === 'AbortError') throw e;
        throw e;
      }
      return data.choices?.[0]?.message?.content || "";
    }
  }
}
