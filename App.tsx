
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { Search, Plus, Star, RefreshCw, LayoutDashboard, Settings, Bookmark, Trash2, Globe, Download, Upload } from 'lucide-react';
import BookmarkGroupCard from './components/BookmarkGroupCard';
import EditModal from './components/EditModal';
import { NavTab } from './components/NavTab';
import { Group, LinkItem } from './types';
import { suggestGroupCategory } from './services/geminiService';

const STORAGE_KEY = 'mystart_favorites_data_v2';

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modalState, setModalState] = useState<{isOpen: boolean, group: Group | null}>({ 
    isOpen: false, 
    group: null 
  });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [bgUrl, setBgUrl] = useState(`https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1920&auto=format&fit=crop`);
  const [isBgLoading, setIsBgLoading] = useState(false);
  
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

  const changeBackground = () => {
    setIsBgLoading(true);
    const randomSig = Math.floor(Math.random() * 100000);
    const newUrl = `https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920&auto=format&fit=crop&sig=${randomSig}`;
    const img = new Image();
    img.onload = () => { setBgUrl(newUrl); setIsBgLoading(false); };
    img.src = newUrl;
  };

  // 匯出資料功能
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

  // 匯入資料功能
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedGroups = JSON.parse(content);

        // 簡單的驗證
        if (Array.isArray(importedGroups) && (importedGroups.length === 0 || (importedGroups[0].id && importedGroups[0].items))) {
          if (confirm('匯入將會覆蓋目前的設定，確定要繼續嗎？')) {
            setGroups(importedGroups);
            alert('匯入成功！');
          }
        } else {
          alert('匯入失敗：檔案格式不正確');
        }
      } catch (error) {
        alert('匯入失敗：無法解析 JSON 檔案');
      }
      // 重置 input 以便下次選擇同一檔案
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

  const handleCreateGroup = async () => {
      setIsSuggesting(true);
      const newGroup: Group = {
          id: `g-${Date.now()}`,
          title: "新分類",
          items: [],
          pageIndex: activeTabIndex
      };
      setGroups([...groups, newGroup]);
      setModalState({ isOpen: true, group: newGroup });
      setIsSuggesting(false);
  };

  const visibleGroups = searchQuery
    ? groups.filter(g => g.items.some(i => i.title.includes(searchQuery) || i.url.includes(searchQuery)))
    : groups.filter(g => g.pageIndex === activeTabIndex);

  if (!isLoaded) return null;

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={(e) => { if(e.active.data.current?.type === 'Group') setDraggedGroup(e.active.data.current.group); }}
        onDragEnd={handleDragEnd}
    >
        <div 
            className="flex h-screen w-screen overflow-hidden bg-cover bg-center transition-all duration-1000" 
            style={{ backgroundImage: `url("${bgUrl}")` }}
        >
          {/* Sidebar */}
          <aside className="w-20 md:w-64 flex flex-col bg-black/40 backdrop-blur-3xl border-r border-white/10 z-50">
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Star className="text-white fill-white" size={20} />
              </div>
              <span className="hidden md:block text-xl font-black text-white tracking-tighter">MY START</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
              <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-4 px-2 hidden md:block">我的看板</div>
              {Array.from({ length: 10 }).map((_, i) => (
                <NavTab 
                    key={i}
                    index={i}
                    hasContent={groups.some(g => g.pageIndex === i)}
                    isActive={activeTabIndex === i}
                    onClick={() => setActiveTabIndex(i)}
                />
              ))}
            </nav>

            <div className="p-6 border-t border-white/10 space-y-3 hidden md:block">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-2">
                <p className="text-white/40 text-xs font-medium mb-1">總計連結</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">{stats.totalLinks}</span>
                  <Globe className="text-blue-400 mb-1" size={16} />
                </div>
              </div>

              {/* Data Tools */}
              <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleExportData}
                    className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border border-white/5"
                    title="匯出備份 (JSON)"
                  >
                    <Download size={14} />
                    <span>匯出</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border border-white/5"
                    title="匯入資料 (JSON)"
                  >
                    <Upload size={14} />
                    <span>匯入</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportData} 
                    accept=".json" 
                    className="hidden" 
                  />
              </div>

              <button 
                onClick={changeBackground}
                className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-blue-500/20"
              >
                <RefreshCw size={14} className={isBgLoading ? 'animate-spin' : ''} />
                更換桌布
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-black/20 overflow-hidden relative">
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 bg-white/5 backdrop-blur-md border-b border-white/10 shrink-0">
                <div className="flex-1 max-w-xl relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="搜尋全站連結..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:bg-white/15 focus:border-blue-500/50 transition-all shadow-inner"
                  />
                </div>
                <div className="flex items-center gap-4 ml-6">
                   <button 
                    onClick={handleCreateGroup}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                   >
                    <Plus size={18} />
                    <span className="hidden sm:inline">新增分類</span>
                   </button>
                </div>
            </header>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-7xl mx-auto">
                <SortableContext items={visibleGroups.map(g => g.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/30">
                        <LayoutDashboard size={80} strokeWidth={1} className="mb-4 opacity-20" />
                        <h3 className="text-xl font-bold">這個分頁空空的</h3>
                        <p className="text-sm">點擊右上角新增分類來開始佈置</p>
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
              <div className="opacity-80 scale-105 rotate-2">
                <BookmarkGroupCard group={draggedGroup} onEdit={()=>{}} onDeleteGroup={()=>{}} onDeleteItem={()=>{}} />
              </div>
            )}
          </DragOverlay>
        </div>
    </DndContext>
  );
};

export default App;
