import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FolderPlus, Folder, Image as ImageIcon, Trash2, Edit2, Check } from 'lucide-react';
import { Asset, AssetGroup, getAssets, saveAssets, getAssetGroups, saveAssetGroups, addAsset, addAssetGroup, deleteAsset } from '../lib/assets';
import { analyzeImageLLM } from '../lib/llm';

export default function AssetLibraryPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('default');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const loadedGroups = await getAssetGroups();
    const loadedAssets = await getAssets();
    setGroups(loadedGroups);
    setAssets(loadedAssets);
  };

  const handleCreateGroup = async () => {
    const name = prompt("请输入新分组名称：");
    if (name) {
      const newGroup = await addAssetGroup(name);
      setGroups(prev => [...prev, newGroup]);
      setActiveGroupId(newGroup.id);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const total = files.length;
    let completed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 2 * 1024 * 1024) {
        alert(`文件 ${file.name} 超过 2MB 限制，已跳过。`);
        continue;
      }

      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Try to analyze image with LLM
        let aiPrompt = "";
        try {
          aiPrompt = await analyzeImageLLM(dataUrl);
        } catch (err: any) {
          console.warn("AI Caption failed", err);
        }

        await addAsset(file, dataUrl, activeGroupId, aiPrompt);
      } catch (err) {
        console.error("Failed to upload", err);
      }
      completed++;
      setUploadProgress(Math.round((completed / total) * 100));
    }

    await loadData();
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyCode = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    const imgTag = `<img src="${asset.dataUrl}" alt="${asset.aiPrompt || asset.name}" class="max-w-full rounded-lg shadow-sm" />`;
    navigator.clipboard.writeText(imgTag).then(() => {
      alert("图片代码已复制到剪贴板，可直接粘贴到代码编辑器中！");
    }).catch(err => {
      console.error("Copy failed", err);
      prompt("请复制以下代码", imgTag);
    });
  };

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    const imgTag = `<img src="${asset.dataUrl}" alt="${asset.aiPrompt || asset.name}" class="max-w-full rounded-lg shadow-sm" />`;
    e.dataTransfer.setData('text/plain', imgTag);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDeleteAsset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除此图片吗？")) {
      await deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const activeAssets = assets.filter(a => a.groupId === activeGroupId);

  if (!isOpen) return null;

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-3 border-b border-[#ececeb] flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <select 
              value={activeGroupId}
              onChange={(e) => setActiveGroupId(e.target.value)}
              className="flex-1 bg-[#f5f5f7] border-none text-sm rounded-lg px-3 py-1.5 focus:ring-0 outline-none text-[#1d1d1f]"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button 
              onClick={handleCreateGroup}
              className="p-1.5 bg-[#f5f5f7] hover:bg-[#e5e5e7] rounded-lg transition-colors text-[#86868b]"
              title="新建分组"
            >
              <FolderPlus size={16} />
            </button>
          </div>
          
          <div className="text-[11px] text-[#86868b]">
            拖拽图片到居中编辑器区域插入
          </div>
          
          <div className="flex items-center gap-2 w-full">
            <input 
              id="asset-upload-input"
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <label htmlFor="asset-upload-input" className="cursor-pointer w-full">
              <div className={`flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm w-full ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={14} /> 
                {isUploading ? `上传中 (${uploadProgress}%)` : '上传新图片'}
              </div>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {activeAssets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#86868b] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-1">
                <ImageIcon size={20} className="text-[#d1d1d6]" />
              </div>
              <p className="text-xs">当前暂无素材</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activeAssets.map(asset => (
                <div 
                  key={asset.id} 
                  className="group relative bg-[#f5f5f7] rounded-xl border border-transparent hover:border-blue-300 transition-all overflow-hidden flex flex-col cursor-grab active:cursor-grabbing shadow-sm"
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                >
                  <div className="aspect-square p-2 bg-[#fbfbfb] flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={asset.dataUrl} 
                      alt={asset.name} 
                      className="max-w-full max-h-full object-contain relative z-10 drop-shadow-sm cursor-pointer hover:scale-105 transition-transform"
                      title="点击复制图片 HTML"
                      onClick={(e) => handleCopyCode(asset, e)}
                    />
                    
                    <button 
                      onClick={(e) => handleDeleteAsset(asset.id, e)}
                      className="absolute top-1 right-1 p-1 bg-white/90 backdrop-blur text-red-500 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all shadow-sm z-20"
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="p-2 border-t border-[#ececeb] bg-white">
                    <h3 className="text-[10px] font-medium truncate mb-0.5 text-[#1d1d1f]" title={asset.name}>{asset.name}</h3>
                    {asset.aiPrompt ? (
                      <p className="text-[9px] text-[#86868b] line-clamp-2 leading-tight" title={asset.aiPrompt}>
                        {asset.aiPrompt}
                      </p>
                    ) : (
                      <p className="text-[9px] text-[#86868b]">{(asset.size / 1024).toFixed(1)} KB</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
