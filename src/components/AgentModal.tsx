import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, ChevronRight, Ban, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchLLM } from '../lib/llm';
import { v4 as uuidv4 } from 'uuid';
import { LogoConfig } from './LogoManagerModal';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  themeId: string;
  themePromptRule: string;
  activeLogo?: LogoConfig;
  onGenerateComplete: (projectName: string, slides: any[]) => void;
}

export default function AgentModal({ isOpen, onClose, onOpenSettings, themeId, themePromptRule, activeLogo, onGenerateComplete }: AgentModalProps) {
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [outline, setOutline] = useState('');
  const [jsonPlan, setJsonPlan] = useState<any>(null);
  const [progress, setProgress] = useState<{ total: number; completed: number; statusHtml: Record<number, string> }>({ total: 0, completed: 0, statusHtml: {} });
  const [errorMessage, setErrorMessage] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase(0);
      setPrompt('');
      setOutline('');
      setJsonPlan(null);
      setProgress({ total: 0, completed: 0, statusHtml: {} });
      setErrorMessage('');
      abortControllerRef.current = new AbortController();
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen]);



  const handleError = (err: any) => {
    console.error(err);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setErrorMessage(err.message || '发生未知错误，请检查大模型配置');
    setPhase(0);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setErrorMessage('用户已中止生成');
      setPhase(0);
    }
  };

  const startGeneration = async () => {
    if (!prompt.trim()) return;
    setErrorMessage('');
    setPhase(1);
    abortControllerRef.current = new AbortController();

    try {
      const systemPrompt = `你是一个专业的幻灯片内容架构师。用户将提供一个主题或需求，你需要生成一个详细的培训大纲。
大纲只要纯文本，层级清晰。不要包含任何多余的客套话。`;
      const result = await fetchLLM(prompt, systemPrompt, false, abortControllerRef.current.signal, (chunk) => {
          setPhase(2);
          setOutline(chunk);
      });
      setOutline(result);
      setPhase(2);
    } catch (err: any) {
      if (err.name !== 'AbortError') handleError(err);
    }
  };

  const confirmOutline = async () => {
    setErrorMessage('');
    setPhase(3);
    
    try {
      const systemPrompt = `你是一个结构化数据拆解引擎。请将以下培训大纲转化为严格的 JSON 格式。
必须包含："presentation_title", "total_slides", "slides_plan" (数组，每个元素包含 slide_index, topic, generation_prompt)。
generation_prompt 这个字段应该是一段详细的指令，用于告诉下一个大模型这一页幻灯片具体要放什么内容要点。格式要求为 JSON object。`;
      
      const result = await fetchLLM(outline, systemPrompt, true, abortControllerRef.current.signal);
      
      let parsedPlan;
      try {
         const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
         parsedPlan = JSON.parse(jsonStr);
      } catch (e) {
         throw new Error("解析 AI 返回的大纲结构失败，JSON 格式可能不正确。");
      }

      setJsonPlan(parsedPlan);
      startConcurrentGeneration(parsedPlan);
    } catch (err: any) {
       if (err.name !== 'AbortError') handleError(err);
    }
  };

  const startConcurrentGeneration = async (plan: any) => {
    setPhase(4);
    setProgress({ total: plan.total_slides || plan.slides_plan.length, completed: 0, statusHtml: {} });

    const slidesParams = plan.slides_plan || [];
    const generatedResults = new Array(slidesParams.length).fill(null);
    let completedCount = 0;

    const generateSingleSlide = async (slide: any, index: number) => {
      try {
        const generationSystemPrompt = `你是一个专业的 UI 设计师和网络安全专家。
当前幻灯片主题：${slide.topic}
【主题色配置】：当前选择的主题是「${themeId}」
${themePromptRule}

【设计要求】：
- 仅提供 HTML 代码片段，使用 Tailwind CSS 处理样式。
- 采用高级的排版原则：大留白、层级分明、视线聚焦。
- 【多元化布局设计 CRITICAL】：请根据内容自动选择居中聚焦、左右分割、横向步骤、统计指标、错落卡片等多种布局形式之一。
- 确保最外层容器（例如 <div class="w-full h-full p-16 flex flex-col justify-center"> 或左右形式）高度撑满，并加入需要的背景、字体色修饰。
- 单页幻灯片空间固定（16:9比例），绝对禁止堆砌！
${activeLogo ? `- **【全局Logo避让 CRITICAL】**：用户已在页面${activeLogo.position.includes('left') ? '左' : '右'}${activeLogo.position.includes('top') ? '上' : '下'}角设置了公司Logo。请务必在该区域（大约宽 250px，高 100px 的矩形范围）内不能放置任何核心文本和交互元素，必须留白（仅可放置纯背景图、底色或无意义的装饰性图纹），绝对防止内容被Logo遮挡。\n` : ''}- 【交互与动效 CRITICAL】：为元素增加 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl 等效果，使用 animate-fade-in-up 错落入场。
- **【样式与脚本隔离约束（防污染）CRITICAL】**：
    1. **局部作用域隔离**：你在页面中编写的任意 \`<script>\` 逻辑，必须使用独立块或立即执行函数 IIFE 即 \`(function() { ... })();\` 包裹，绝对禁止在全局作用域中声明 const/let 变量，否则会导致多页面变量名冲突！
    2. **全局事件限制**：尽可能避免绑定全局 \`window\` 或 \`document\` 事件。如果必须绑定，务必在回调执行时首先判断自身的根节点 \`.closest('.slide')\` 是否包含 \`.active\` 类，若非激活状态请直接 return，以免干扰其他页面体验。
    3. **CSS 命名空间隔离**：严禁在内嵌 \`<style>\` 标签中编写如 \`.title\`, \`.card\` 这种泛型类名。所有自定义类名、\`@keyframes\` 动画名称，都必须带上与当前页面高度相关的专属前缀（如 \`.slide-abc-card\`, \`@keyframes slide-abc-fadeIn\`），确保多页叠加时样式不发生污染交错。
    4. **【强制】禁止输出完整骨架**：你的代码将被直接以 DOM 片段的形式插入宿主页面，因此**绝对禁止**输出 \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, \`<body>\` 等环境及包裹标签！

请直接输出最外层为 <div class="..."> 包装的局部 HTML 代码块片段片段即可，不要包含 markdown \`\`\`html 标签包围。不要解释！`;

        const resHtml = await fetchLLM(slide.generation_prompt, generationSystemPrompt, false, abortControllerRef.current!.signal, (chunk) => {
            setProgress(p => ({
                ...p,
                statusHtml: { ...p.statusHtml, [index]: chunk }
            }));
        });
        
        let cleanHtml = resHtml.trim();
        const htmlMatch = cleanHtml.match(/<div[\s\S]*<\/div>/i);
        if (htmlMatch && htmlMatch[0]) {
            cleanHtml = htmlMatch[0];
        }

        generatedResults[index] = {
           id: uuidv4(),
           title: slide.topic || `第 ${slide.slide_index} 页`,
           code: cleanHtml,
           isDefault: false
        };
        
        completedCount++;
        setProgress(p => ({ ...p, completed: completedCount }));
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          throw new Error(`第 ${slide.slide_index} 页生成失败: ${err.message}`);
        }
      }
    };

    try {
      await Promise.all(slidesParams.map((s: any, idx: number) => generateSingleSlide(s, idx)));
      onGenerateComplete(plan.presentation_title || 'AI 生成项目', generatedResults);
      onClose();
    } catch (err: any) {
      if (err.name !== 'AbortError') handleError(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
        >
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles size={20} className="text-blue-500" />
              Agentic Workflow 一键生成
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={onOpenSettings} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-1.5 text-sm font-medium">
                <Settings2 size={16} /> 大模型配置
              </button>
              <div className="w-px h-5 bg-gray-200"></div>
              <button disabled={phase === 1 || phase === 3 || phase === 4} onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
                <Ban className="shrink-0 mt-0.5" size={18} />
                <div className="text-sm">{errorMessage}</div>
              </div>
            )}

            {phase === 0 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">想要制作什么主题的幻灯片？</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="例如：生成一份关于“防范社交工程攻击”的培训课件，包含定义、常见手段、防御措施，要求富有科技感。"
                  className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 resize-none"
                />
              </div>
            )}

            {phase === 1 && (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <Loader2 size={36} className="animate-spin text-blue-500" />
                <p className="text-sm font-medium animate-pulse">正在利用大模型分析需求并规划大纲...</p>
              </div>
            )}

            {phase === 2 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Review 培训大纲</label>
                <p className="text-xs text-gray-500">您可以直接修改下方的大纲，调整无误后点击“确定并拆解”。</p>
                <textarea
                  value={outline}
                  onChange={e => setOutline(e.target.value)}
                  className="w-full h-64 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 text-sm font-mono leading-relaxed resize-none"
                />
              </div>
            )}

            {(phase === 3 || phase === 4) && (
              <div className="py-10 flex flex-col items-center justify-center space-y-6">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <motion.circle 
                      cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 45}
                      strokeDashoffset={2 * Math.PI * 45 * (1 - (progress.completed / Math.max(progress.total, 1)))}
                      strokeLinecap="round"
                      className="transition-all duration-300 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-700">
                    {progress.total === 0 ? <Loader2 size={24} className="animate-spin text-blue-500" /> : `${progress.completed}/${progress.total}`}
                  </div>
                </div>

                <div className="text-center space-y-2 w-full">
                  <h3 className="text-gray-900 font-medium">
                    {phase === 3 ? '正在拆解 JSON 架构计划...' : 'Agent 并发执行中...'}
                  </h3>
                  {phase === 4 && progress.total > 0 && (
                    <div className="w-full flex justify-center text-sm text-gray-500">
                      并行调度子 Agent 渲染 HTML 代码，实时注入设定主题
                    </div>
                  )}
                  {phase === 4 && (
                    <div className="w-full max-h-40 overflow-y-auto mt-4 text-left space-y-2 bg-gray-50 border border-gray-100 p-3 rounded-lg flex flex-col gap-1">
                      {jsonPlan?.slides_plan?.map((slide: any, idx: number) => {
                         const chunk = progress.statusHtml[idx];
                         const isDone = progress.completed > idx && progress.completed > 0 && !!chunk && chunk.includes('</div');
                         return (
                           <div key={idx} className="flex flex-col border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                              <div className="flex justify-between items-center text-xs">
                                <span className={`font-medium ${isDone ? 'text-green-600' : 'text-blue-600'}`}>
                                  {slide.topic}
                                </span>
                                {isDone && <CheckCircle2 size={12} className="text-green-500" />}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono truncate w-full flex-1">
                                {chunk ? chunk : '等待调度...'}
                              </div>
                           </div>
                         );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            {phase === 0 ? (
               <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors">
                 取消
               </button>
            ) : (phase === 1 || phase === 3 || phase === 4) ? (
               <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors flex items-center gap-2 border border-red-200 uppercase text-sm tracking-widest">
                 <Ban size={16} /> 紧急中止
               </button>
            ) : (
               <button onClick={() => setPhase(0)} className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors">
                 返回修改
               </button>
            )}

            {phase === 0 && (
              <button 
                onClick={startGeneration}
                disabled={!prompt.trim()}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                生成提案 <ChevronRight size={18} />
              </button>
            )}

            {phase === 2 && (
              <button 
                onClick={confirmOutline}
                className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium shadow-md shadow-green-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={18} /> 确认并开始渲染
              </button>
            )}

            {(phase === 1 || phase === 3 || phase === 4) && (
              <div className="text-sm text-gray-500 italic pr-2">
                 正在云端运转...
              </div>
            )}
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
