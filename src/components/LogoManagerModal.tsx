import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Trash2, CheckCircle2 } from 'lucide-react';

export interface LogoConfig {
  url: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedLogos: string[];
  activeLogo?: LogoConfig;
  onLogosChange: (logos: string[]) => void;
  onActiveLogoChange: (logo?: LogoConfig) => void;
}

export default function LogoManagerModal({ isOpen, onClose, savedLogos, activeLogo, onLogosChange, onActiveLogoChange }: LogoManagerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const newLogo = e.target?.result as string;
      const newSavedLogos = [...savedLogos, newLogo];
      onLogosChange(newSavedLogos);
      if (!activeLogo) {
        onActiveLogoChange({ url: newLogo, position: 'top-left' });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveSaved = (index: number) => {
    const newLogos = [...savedLogos];
    const removed = newLogos.splice(index, 1)[0];
    onLogosChange(newLogos);
    if (activeLogo?.url === removed) {
      onActiveLogoChange(undefined);
    }
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Logo 管理</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 block">上传 Logo</h4>
              <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={18} />
                </div>
                <span className="text-sm font-medium text-gray-600">点击上传新 Logo</span>
                <span className="text-xs text-gray-400 mt-1">支持 PNG, JPG, SVG</span>
              </button>
            </div>

            {savedLogos.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 block">我的 Logo</h4>
                <div className="grid grid-cols-2 gap-3">
                  {savedLogos.map((logo, index) => {
                    const isActive = activeLogo?.url === logo;
                    return (
                      <div 
                        key={index}
                        onClick={() => onActiveLogoChange({ url: logo, position: activeLogo?.position || 'top-left' })}
                        className={`group relative aspect-video rounded-lg border-2 p-2 flex items-center justify-center cursor-pointer transition-all ${isActive ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
                      >
                        <img src={logo} alt="Saved Logo" className="max-w-full max-h-full object-contain" />
                        {isActive && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-0.5">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSaved(index);
                          }}
                          className="absolute bottom-1 right-1 p-1.5 bg-red-50 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeLogo && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 block">已选 Logo 位置</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'top-left', label: '左上角' },
                    { id: 'top-right', label: '右上角' },
                    { id: 'bottom-left', label: '左下角' },
                    { id: 'bottom-right', label: '右下角' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => onActiveLogoChange({ ...activeLogo, position: pos.id as LogoConfig['position'] })}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border text-center transition-colors ${activeLogo.position === pos.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                   <button 
                    onClick={() => onActiveLogoChange(undefined)}
                    className="text-sm text-red-500 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                   >
                     不使用 Logo
                   </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-100 flex justify-end">
             <button 
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
             >
               完成
             </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
