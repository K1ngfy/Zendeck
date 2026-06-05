import React, { useState, useEffect } from 'react';
import { X, Save, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LLMSettings, getLLMSettings, saveLLMSettings, DEFAULT_SETTINGS } from '../lib/llm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<LLMSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      setSettings(getLLMSettings());
    }
  }, [isOpen]);



  const handleSave = () => {
    saveLLMSettings(settings);
    onClose();
  };

  const providers = [
    { id: 'openai', name: 'OpenAI', defBase: 'https://api.openai.com/v1', defModel: 'gpt-4o' },
    { id: 'gemini', name: 'Gemini', defBase: 'https://generativelanguage.googleapis.com', defModel: 'gemini-1.5-pro' },
    { id: 'deepseek', name: 'DeepSeek', defBase: 'https://api.deepseek.com/v1', defModel: 'deepseek-chat' },
    { id: 'local', name: 'Local/Custom', defBase: 'http://localhost:11434/v1', defModel: 'Custom Model' }
  ];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const providerId = e.target.value as LLMSettings['provider'];
    const pInfo = providers.find(p => p.id === providerId);
    setSettings({
      ...settings,
      provider: providerId,
      baseUrl: pInfo?.defBase || '',
      modelName: pInfo?.defModel || ''
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
        >
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings2 size={20} className="text-blue-500" />
              大模型配置
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Provider 服务商</label>
              <select 
                value={settings.provider} 
                onChange={handleProviderChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">API Key 凭证</label>
              <input 
                type="password" 
                value={settings.apiKey}
                onChange={e => setSettings({...settings, apiKey: e.target.value})}
                placeholder={settings.provider === 'local' ? '本地免凭证留空' : 'sk-...'}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Base URL 接口地址</label>
              <input 
                type="text" 
                value={settings.baseUrl}
                onChange={e => setSettings({...settings, baseUrl: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Model Name 模型名称</label>
              <input 
                type="text" 
                value={settings.modelName}
                onChange={e => setSettings({...settings, modelName: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 font-mono text-sm"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Save size={18} />
              保存配置
            </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
