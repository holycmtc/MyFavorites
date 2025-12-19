

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, GripVertical, Check, Search, Link as LinkIcon, Layers } from 'lucide-react';
import { Group, LinkItem } from '../types';
import { getSmartTitle } from '../services/geminiService';

interface EditModalProps {
  isOpen: boolean;
  group: Group | null;
  onClose: () => void;
  onUpdateGroup: (updatedGroup: Group) => void;
  onDeleteGroup: (groupId: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, group, onClose, onUpdateGroup, onDeleteGroup }) => {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  useEffect(() => {
    if (group) {
      setItems(group.items);
      setGroupTitle(group.title);
    }
  }, [group]);

  if (!isOpen || !group) return null;

  const handleAddItem = async () => {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    setLoadingAi(true);
    let title = newTitle.trim();
    if (!title) {
        title = await getSmartTitle(url) || url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
    setLoadingAi(false);

    const newItem: LinkItem = {
      id: Date.now().toString(),
      title,
      url
    };
    setItems([newItem, ...items]);
    setNewUrl('');
    setNewTitle('');
  };

  const handleSave = () => {
    onUpdateGroup({ ...group, title: groupTitle, items });
    onClose();
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] scale-in-center">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            {isEditingHeader ? (
                <div className="flex items-center gap-2">
                    <input 
                        autoFocus
                        className="text-xl font-bold text-gray-800 outline-none border-b-2 border-blue-500 pb-1 w-48 bg-transparent"
                        value={groupTitle}
                        onChange={(e) => setGroupTitle(e.target.value)}
                        onBlur={() => setIsEditingHeader(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingHeader(false)}
                    />
                    <button onClick={() => setIsEditingHeader(false)} className="text-green-600"><Check size={20}/></button>
                </div>
            ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingHeader(true)}>
                    <h2 className="text-xl font-bold text-gray-800">{groupTitle}</h2>
                    <Edit2 size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                {items.length} 個連結
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Add Section */}
        <div className="p-6 bg-blue-50/30 border-b border-gray-100">
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                        placeholder="輸入網址 (如 google.com)"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                </div>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                        placeholder="顯示名稱 (選填，由 AI 自動生成)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                    <button 
                        onClick={handleAddItem}
                        disabled={loadingAi || !newUrl}
                        className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        {loadingAi ? 'AI 抓取中...' : <><Plus size={20}/> 新增</>}
                    </button>
                </div>
            </div>
        </div>

        {/* List Section - Referencing User's Screenshot style */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white">
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                        {/* Corrected: Layers icon is now imported correctly */}
                        <Layers size={48} strokeWidth={1} className="mb-2 opacity-20" />
                        <p>目前沒有連結，請從上方新增</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm overflow-hidden">
                                <img 
                                    src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=64`} 
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/32?text=?')}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-800 truncate">{item.title}</h4>
                                <p className="text-xs text-gray-400 truncate">{item.url}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="刪除"
                                >
                                    <X size={18} />
                                </button>
                                <div className="p-2 text-gray-300 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={18} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <button 
                onClick={() => { if(confirm('確定刪除整個分類嗎？')) { onDeleteGroup(group.id); onClose(); } }}
                className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1 text-sm"
            >
                <Trash2 size={16} /> 刪除此分類
            </button>
            <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-all text-sm">
                    取消
                </button>
                <button 
                    onClick={handleSave}
                    className="px-8 py-2.5 bg-gray-800 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                >
                    完成保存
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default EditModal;
