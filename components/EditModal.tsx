
import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, GripVertical, Check, Search, Link as LinkIcon, Layers, ExternalLink } from 'lucide-react';
import { Group, LinkItem } from '../types';
import { getSmartTitle } from '../services/geminiService';

interface EditModalProps {
  isOpen: boolean;
  group: Group | null;
  onClose: () => void;
  onUpdateGroup: (updatedGroup: Group) => void;
  onDeleteGroup: (groupId: string) => void;
}

interface EditingItemState {
  id: string;
  title: string;
  url: string;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, group, onClose, onUpdateGroup, onDeleteGroup }) => {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItemState | null>(null);

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

  const handleSaveItemEdit = () => {
    if (!editingItem) return;
    setItems(items.map(i => i.id === editingItem.id ? { ...i, title: editingItem.title, url: editingItem.url } : i));
    setEditingItem(null);
  };

  const handleSave = () => {
    onUpdateGroup({ ...group, title: groupTitle, items });
    onClose();
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] scale-in-center border border-gray-100">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
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
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                {items.length} 個連結
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Add Section */}
        <div className="p-6 bg-blue-50/20 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">新增快速連結</h3>
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm shadow-sm"
                        placeholder="輸入網址 (如 google.com)"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                </div>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm shadow-sm"
                        placeholder="顯示名稱 (選填，AI 自動生成)"
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

        {/* List Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">目前的連結清單</h3>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                        <Layers size={48} strokeWidth={1} className="mb-3 opacity-10" />
                        <p className="text-sm font-medium">目前的分類還沒有連結</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className={`group flex flex-col p-1 rounded-2xl border transition-all ${editingItem?.id === item.id ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-100 hover:shadow-sm'}`}>
                            {editingItem?.id === item.id ? (
                                <div className="p-3 space-y-3 animate-in fade-in zoom-in duration-200">
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={editingItem.title}
                                            onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                                            placeholder="連結名稱"
                                        />
                                        <input 
                                            className="flex-[1.5] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={editingItem.url}
                                            onChange={e => setEditingItem({...editingItem, url: e.target.value})}
                                            placeholder="連結網址"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingItem(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg">取消</button>
                                        <button onClick={handleSaveItemEdit} className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-sm">儲存修改</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 p-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shrink-0 shadow-sm overflow-hidden">
                                        <img 
                                            src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=64`} 
                                            className="w-6 h-6 object-contain"
                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/32?text=?')}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-800 truncate">{item.title}</h4>
                                        <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                                            {item.url} <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => setEditingItem({ id: item.id, title: item.title, url: item.url })}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="編輯"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="刪除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="p-2 text-gray-200 cursor-grab active:cursor-grabbing">
                                            <GripVertical size={16} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex justify-between items-center sticky bottom-0 z-10 backdrop-blur-sm">
            <button 
                onClick={() => { if(confirm('確定刪除整個分類嗎？')) { onDeleteGroup(group.id); onClose(); } }}
                className="text-red-400 hover:text-red-600 font-bold flex items-center gap-1.5 text-xs transition-colors"
            >
                <Trash2 size={14} /> 刪除此分類
            </button>
            <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-all text-sm">
                    取消
                </button>
                <button 
                    onClick={handleSave}
                    className="px-8 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all text-sm active:scale-95"
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
