import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowUpFromLine, Plus, Search, MoreVertical, Edit2, Trash2, FolderPlus, Tag, GripVertical, CheckSquare, Square, Image as ImageIcon } from 'lucide-react';
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
  const [newLogo, setNewLogo] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (group) {
      setItems(group.items);
      setGroupTitle(group.title);
      setSelectedIds(new Set());
    }
  }, [group]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !group) return null;

  const handleAddItem = async () => {
    if (!newUrl.trim()) return;

    let title = newTitle.trim();
    let finalUrl = newUrl.trim();

    if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
    }

    // Only use AI if title is not provided
    if (!title) {
        setLoadingAi(true);
        const aiTitle = await getSmartTitle(finalUrl);
        setLoadingAi(false);
        if (aiTitle) {
            title = aiTitle;
        } else {
            try {
                const urlObj = new URL(finalUrl);
                title = urlObj.hostname.replace('www.', '');
            } catch (e) {
                title = '新連結';
            }
        }
    }

    const newItem: LinkItem = {
      id: Date.now().toString(),
      title: title,
      url: finalUrl,
      icon: newLogo.trim() ? newLogo.trim() : undefined
    };
    
    setItems([newItem, ...items]);
    setNewUrl('');
    setNewTitle('');
    setNewLogo('');
  };

  const handleDeleteSelected = () => {
    const newItems = items.filter(item => !selectedIds.has(item.id));
    setItems(newItems);
    setSelectedIds(new Set());
  };

  const handleSave = () => {
    onUpdateGroup({
      ...group,
      title: groupTitle,
      items: items,
    });
    onClose();
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const getFavicon = (item: LinkItem) => {
    if (item.icon) return item.icon;
    try {
      const domain = new URL(item.url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return `https://via.placeholder.com/32?text=${groupTitle.charAt(0)}`;
    }
  };

  const handleEditLogo = (id: string) => {
     const item = items.find(i => i.id === id);
     if (!item) return;
     const currentLogo = item.icon || '';
     const newLogoUrl = window.prompt("請輸入新的 Logo 圖片網址 (留空使用預設圖示):", currentLogo);
     
     if (newLogoUrl !== null) {
         setItems(items.map(i => i.id === id ? { ...i, icon: newLogoUrl.trim() || undefined } : i));
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200" onClick={() => setIsMenuOpen(true)}>
               <MoreVertical size={18} className="text-gray-600" />
            </div>
            {isEditingTitle ? (
                 <input 
                    autoFocus
                    className="text-lg font-medium text-gray-800 outline-none border-b border-blue-500 bg-transparent px-1"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                 />
            ) : (
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditingTitle(true)}>
                    <h2 className="text-lg font-medium text-gray-800">{groupTitle}</h2>
                    <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
            )}
          </div>
          <div className="flex gap-2">
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
             </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
             <div ref={menuRef} className="absolute top-14 left-4 w-56 bg-white shadow-xl border border-gray-100 rounded-lg z-50 py-1 text-sm text-gray-700 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="px-4 py-2 font-medium text-gray-500 text-xs">管理工具</div>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                    <Tag size={16} /> 添加標籤
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                    <FolderPlus size={16} /> 導入網址收藏
                </button>
                 <div className="my-1 border-t border-gray-100"></div>
                 {selectedIds.size > 0 && (
                     <button onClick={handleDeleteSelected} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                         <Trash2 size={16} /> 刪除選中 ({selectedIds.size})
                     </button>
                 )}
                 <button onClick={() => { 
                     if(window.confirm('確定要刪除整個群組嗎？')) {
                        onDeleteGroup(group.id);
                        onClose();
                     }
                 }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                    <Trash2 size={16} /> 刪除工具
                </button>
             </div>
        )}

        {/* Add Item Form */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col gap-3">
            <div className="relative flex items-center">
                <input 
                    type="text" 
                    placeholder="添加網址 (例如: gmail.com)"
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
            </div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="標題 (選填)"
                    className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <input 
                    type="text" 
                    placeholder="Logo 連結 (選填)"
                    className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={newLogo}
                    onChange={(e) => setNewLogo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <button 
                    onClick={handleAddItem}
                    disabled={loadingAi}
                    className="shrink-0 text-sm text-white font-medium px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                >
                    {loadingAi ? 'AI...' : <><Plus size={16} /> 添加</>}
                </button>
            </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white text-sm text-gray-500 border-b border-gray-100">
            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={toggleSelectAll}>
                 {selectedIds.size === items.length && items.length > 0 ? (
                     <CheckSquare size={18} className="text-blue-500" />
                 ) : (
                     <Square size={18} className="text-gray-300" />
                 )}
                <span>全選</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                排序 <ArrowUpFromLine size={14} className="rotate-180"/>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-gray-50/50">
            <div className="space-y-1">
                {items.map((item) => (
                    <div 
                        key={item.id} 
                        className={`group flex items-center gap-3 p-3 rounded-md transition-colors ${selectedIds.has(item.id) ? 'bg-blue-50' : 'hover:bg-white hover:shadow-sm'}`}
                    >
                        <div onClick={() => toggleSelection(item.id)} className="cursor-pointer">
                            {selectedIds.has(item.id) ? (
                                <CheckSquare size={20} className="text-blue-500" />
                            ) : (
                                <Square size={20} className="text-gray-300 group-hover:text-gray-400" />
                            )}
                        </div>
                        
                        <div 
                           className="w-8 h-8 rounded bg-white p-1 flex items-center justify-center border border-gray-200 shrink-0 cursor-pointer relative overflow-hidden"
                           onClick={() => handleEditLogo(item.id)}
                           title="點擊修改 Logo"
                        >
                            <img src={getFavicon(item)} alt="" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/32')} />
                            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white">
                                <Edit2 size={12} />
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col">
                            <input 
                                className="text-sm font-medium text-gray-700 bg-transparent outline-none focus:border-b border-blue-400 truncate"
                                value={item.title}
                                onChange={(e) => {
                                    const newItems = items.map(i => i.id === item.id ? { ...i, title: e.target.value } : i);
                                    setItems(newItems);
                                }}
                            />
                            <div className="text-xs text-gray-400 truncate">{item.url}</div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center text-gray-400 cursor-grab active:cursor-grabbing">
                            <GripVertical size={16} />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white">
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow transition-colors text-sm font-medium float-left"
            >
                完成
            </button>
        </div>

      </div>
    </div>
  );
};

export default EditModal;