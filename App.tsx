
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { Search, Plus, Star, RefreshCw, LayoutDashboard, Globe, Download, Upload, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import BookmarkGroupCard from './components/BookmarkGroupCard';
import EditModal from './components/EditModal';
import { NavTab } from './components/NavTab';
import { Group } from './types';

const STORAGE_KEY = 'mystart_favorites_data_v2';
const BG_STORAGE_KEY = 'mystart_selected_bg';

// 精選桌布庫 - 使用穩定的 Unsplash ID
const WALLPAPER_COLLECTIONS = [
  { 
    id: 'nature', 
    label: '自然', 
    images: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop'
    ]
  },
  { 
    id: 'city', 
    label: '城市', 
    images: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1920&auto=format&fit=crop'
    ]
  },
  { 
    id: 'abstract', 
    label: '抽象', 
    images: [
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=1920&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?q=80&w=1920&auto=format&fit=crop'
    ]
  }
];

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modalState, setModalState] = useState<{isOpen: boolean, group: Group | null}>({ 
    isOpen: false, 
    group: null 
  });
  const [bgUrl, setBgUrl] = useState(`https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1920&auto=format&fit=crop`);
  const [isBgLoading, setIsBgLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(WALLPAPER_COLLECTIONS[0]);
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [bgError, setBgError] = useState(false);
  
  const [draggedGroup, setDraggedGroup] = useState<Group | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setGroups(JSON.parse(savedData));
      } catch (e) {
        setGroups([]);
      }
    }
    const savedBg = localStorage.getItem(BG_STORAGE_KEY);
    if (savedBg) {
      setBgUrl(savedBg);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    }
  }, [groups, isLoaded]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const stats = useMemo(() => {
    const totalLinks = groups.reduce((acc, g) => acc + g.items.length, 0);
    const totalGroups = groups.length;
    return { totalLinks, totalGroups };
  }, [groups]);

  const changeBackground = (url: string) => {
    if (!url) return;
    setIsBgLoading(true);
    setBgError(false);
    const img = new Image();
    img.onload = () => { 
        setBgUrl(url); 
        localStorage.setItem(BG_STORAGE_KEY, url);
        setIsBgLoading(false); 
    };
    img.onerror = () => {
        setIsBgLoading(false);
        setBgError(true);
        setTimeout(() => setBgError(false), 3000);
    };
    img.src = url;
  };

  const handleCustomBgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customBgUrl.trim()) {
      changeBackground(customBgUrl.trim());
      setCustomBgUrl('');
    }
  };

  const shuffleRandomBackground = () => {
    const randomSig = Math.floor(Math.random() * 1000);
    const newUrl = `https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920&auto=format&fit=crop&sig=${randomSig}`;
    changeBackground(newUrl);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(groups, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `mystart_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedGroups = JSON.parse(content);
        if (Array.isArray(importedGroups)) {
          if (confirm('匯入將會覆蓋目前的設定，確定要繼續嗎？')) {
            setGroups(importedGroups);
          }
        }
      } catch (error) {
        alert('匯入失敗：格式錯誤');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type === 'Group') {
        if (over.data.current?.type === 'Tab') {
             const targetIdx = over.data.current.index;
             setGroups(prev => prev.map(g => g.id === active.id ? { ...g, pageIndex: targetIdx } : g));
        } else {
             const oldIdx = groups.findIndex(g => g.id === active.id);
             const newIdx = groups.findIndex(g => g.id === over.id);
             if (oldIdx !== -1 && newIdx !== -1) setGroups(arrayMove(groups, oldIdx, newIdx));
        }
    }
    setDraggedGroup(null);
  };

  const handleCreateGroup = () => {
      const newGroup: Group = {
          id: `g-${Date.now()}`,
          title: "新分類",
          items: [],
          pageIndex: activeTabIndex
      };
      setGroups([...groups, newGroup]);
      setModalState({ isOpen: true, group: newGroup });
  };

  const visibleGroups = searchQuery
    ? groups.filter(g => g.items.some(i => i.title.includes(searchQuery) || i.url.includes(searchQuery)))
    : groups.filter(g => g.pageIndex === activeTabIndex);

  if (!isLoaded) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => { if(e.active.data.current?.type === 'Group') setDraggedGroup(e.active.data.current.group); }} onDragEnd={handleDragEnd}>
        <div 
            className="flex h-screen w-screen overflow-hidden bg-cover bg-center transition-all duration-1000 ease-in-out relative" 
            style={{ backgroundImage: `url("${bgUrl}")` }}
        >
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          {/* Sidebar */}
          <aside className="w-20 md:w-64 flex flex-col bg-black/60 backdrop-blur-3xl border-r border-white/10 z-50 relative">
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Star className="text-white fill-white" size={20} />
              </div>
              <span className="hidden md:block text-xl font-black text-white tracking-tighter italic">MY DASHBOARD</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
              {Array.from({ length: 10 }).map((_, i) => (
                <NavTab key={i} index={i} hasContent={groups.some(g => g.pageIndex === i)} isActive={activeTabIndex === i} onClick={() => setActiveTabIndex(i)} />
              ))}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-4 hidden md:block overflow-hidden bg-black/20">
              
              {/* Wallpaper Hub */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <ImageIcon size={12} /> 個人化桌布
                    </span>
                    <button onClick={shuffleRandomBackground} className={`text-blue-400 hover:text-blue-300 transition-all ${isBgLoading ? 'animate-spin' : ''}`} title="隨機切換">
                        <RefreshCw size={12} />
                    </button>
                  </div>
                  
                  <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                      {WALLPAPER_COLLECTIONS.map(cat => (
                          <button 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-2 py-1 rounded-md text-[10px] font-bold transition-all ${selectedCategory.id === cat.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                          >
                            {cat.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {selectedCategory.images.map((url, i) => (
                          <button 
                            key={i}
                            onClick={() => changeBackground(url)}
                            className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0 hover:border-blue-500 hover:scale-105 transition-all active:scale-95"
                          >
                            <img src={url} className="w-full h-full object-cover opacity-60 hover:opacity-100" alt="p" loading="lazy" />
                          </button>
                      ))}
                  </div>

                  {/* Custom URL Input */}
                  <form onSubmit={handleCustomBgSubmit} className="relative group">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={10} />
                    <input 
                      type="text" 
                      placeholder="貼上桌布網址..."
                      value={customBgUrl}
                      onChange={(e) => setCustomBgUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-7 pr-2 text-[10px] text-white placeholder-white/20 focus:outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all"
                    />
                  </form>
                  {bgError && (
                    <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold animate-pulse">
                      <AlertCircle size={10} /> 圖片網址無效
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleExportData} className="py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/5">
                    <Download size={14} /> 匯出
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/5">
                    <Upload size={14} /> 匯入
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden relative z-10">
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md border-b border-white/10 shrink-0">
                <div className="flex-1 max-w-xl relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="搜尋您的連結..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:bg-white/10 focus:border-blue-500/30 transition-all shadow-inner"
                  />
                </div>
                <div className="flex items-center gap-4 ml-6">
                   <button 
                    onClick={handleCreateGroup}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                   >
                    <Plus size={18} />
                    <span className="hidden sm:inline text-sm">新增分類</span>
                   </button>
                </div>
            </header>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-7xl mx-auto">
                <SortableContext items={visibleGroups.map(g => g.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {visibleGroups.map(group => (
                      <BookmarkGroupCard 
                        key={group.id} 
                        group={group} 
                        onEdit={(g) => setModalState({ isOpen: true, group: g })}
                        onDeleteGroup={(id) => setGroups(prev => prev.filter(g => g.id !== id))}
                        onDeleteItem={(gid, iid) => setGroups(prev => prev.map(g => g.id === gid ? { ...g, items: g.items.filter(i => i.id !== iid) } : g))}
                      />
                    ))}
                    {visibleGroups.length === 0 && !searchQuery && (
                      <div className="col-span-full py-32 flex flex-col items-center justify-center text-white/20">
                        <LayoutDashboard size={100} strokeWidth={0.5} className="mb-6 opacity-30" />
                        <h3 className="text-2xl font-black tracking-tight uppercase">這個分頁目前是空的</h3>
                        <p className="text-sm font-medium">點擊右上角「新增分類」來佈置您的看板</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </div>
          </main>

          <EditModal 
            isOpen={modalState.isOpen}
            group={modalState.group}
            onClose={() => setModalState({ isOpen: false, group: null })}
            onUpdateGroup={(updated) => setGroups(prev => prev.map(g => g.id === updated.id ? updated : g))}
            onDeleteGroup={(id) => setGroups(prev => prev.filter(g => g.id !== id))}
          />

          <DragOverlay>
            {draggedGroup && (
              <div className="opacity-90 scale-105">
                <BookmarkGroupCard group={draggedGroup} onEdit={()=>{}} onDeleteGroup={()=>{}} onDeleteItem={()=>{}} />
              </div>
            )}
          </DragOverlay>
        </div>
    </DndContext>
  );
};

export default App;
