
import React, { useState, useEffect } from 'react';
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
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { Search, Plus, Star, RefreshCw, Layers } from 'lucide-react';
import BookmarkGroupCard from './components/BookmarkGroupCard';
import EditModal from './components/EditModal';
import { SortableBookmarkItem } from './components/SortableBookmarkItem';
import { NavTab } from './components/NavTab';
import { Group, LinkItem } from './types';
import { suggestGroupCategory } from './services/geminiService';

const STORAGE_KEY = 'mystart_favorites_data';

const INITIAL_GROUPS: Group[] = [
  {
    id: 'g1',
    title: '常用連結',
    items: [
      { id: 'l1', title: 'Google', url: 'https://www.google.com' },
      { id: 'l2', title: 'ChatGPT', url: 'https://chat.openai.com' },
      { id: 'l3', title: 'YouTube', url: 'https://www.youtube.com' },
    ],
    pageIndex: 0
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
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const [bgUrl, setBgUrl] = useState(`https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop`);
  const [isBgLoading, setIsBgLoading] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<LinkItem | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<Group | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setGroups(JSON.parse(savedData));
      } catch (e) {
        setGroups(INITIAL_GROUPS);
      }
    } else {
      setGroups(INITIAL_GROUPS);
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    }
  }, [groups, isLoaded]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const changeBackground = () => {
    if (isBgLoading) return;
    setIsBgLoading(true);
    const randomSig = Math.floor(Math.random() * 100000);
    const newUrl = `https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop&sig=${randomSig}`;
    
    const img = new Image();
    img.onload = () => {
      setBgUrl(newUrl);
      setIsBgLoading(false);
    };
    img.onerror = () => {
      setBgUrl(`https://picsum.photos/seed/${randomSig}/1920/1080`);
      setIsBgLoading(false);
    };
    img.src = newUrl;
  };

  const findContainer = (id: string): string | undefined => {
    if (groups.find((g) => g.id === id)) return id;
    return groups.find((g) => g.items.some((item) => item.id === id))?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    if (active.data.current?.type === 'Group') {
        setDraggedGroup(active.data.current.group);
    } else if (active.data.current?.type === 'Item') {
        setActiveItem(active.data.current.item);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (active.data.current?.type === 'Item') {
        const activeContainer = findContainer(active.id as string);
        const overContainer = over.data.current?.type === 'Group' 
            ? (over.id as string) 
            : findContainer(over.id as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setGroups((prev) => {
            const activeGroup = prev.find((g) => g.id === activeContainer);
            const overGroup = prev.find((g) => g.id === overContainer);
            if (!activeGroup || !overGroup) return prev;

            const activeItemIndex = activeGroup.items.findIndex((i) => i.id === active.id);
            const itemToMove = activeGroup.items[activeItemIndex];
            
            return prev.map((g) => {
                if (g.id === activeContainer) return { ...g, items: g.items.filter((i) => i.id !== active.id) };
                if (g.id === overContainer) {
                    const newItems = [...g.items];
                    const overIndex = over.data.current?.type === 'Item' 
                        ? g.items.findIndex(i => i.id === over.id) 
                        : g.items.length;
                    newItems.splice(overIndex >= 0 ? overIndex : g.items.length, 0, itemToMove);
                    return { ...g, items: newItems };
                }
                return g;
            });
        });
    }
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

    setActiveId(null);
    setActiveItem(null);
    setDraggedGroup(null);
  };

  const handleCreateGroup = async () => {
      setIsSuggesting(true);
      let newTitle = "新分類";
      try {
         const suggestion = await suggestGroupCategory(groups.flatMap(g => g.items.map(i => i.title)));
         if (suggestion) newTitle = suggestion;
      } catch(e) {}
      setIsSuggesting(false);

      const newGroup: Group = {
          id: `g-${Date.now()}`,
          title: newTitle,
          items: [],
          pageIndex: activeTabIndex
      };
      setGroups([...groups, newGroup]);
      setModalState({ isOpen: true, group: newGroup });
  };

  if (!isLoaded) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">載入中...</div>;

  const visibleGroups = searchQuery
    ? groups.filter(g => g.items.some(i => i.title.includes(searchQuery) || i.url.includes(searchQuery)))
    : groups.filter(g => g.pageIndex === activeTabIndex);

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
    >
        <div 
            className="min-h-screen bg-cover bg-center bg-fixed flex flex-col transition-all duration-700" 
            style={{ backgroundImage: `url("${bgUrl}")` }}
        >
          <div className="flex-1 bg-black/30 w-full flex flex-col backdrop-blur-[2px]">
            
            {/* Top Bar */}
            <div className="pt-10 px-6 pb-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
                            <Star className="text-yellow-400 fill-yellow-400" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white drop-shadow-lg">我的最愛</h1>
                            <p className="text-white/70 text-sm font-medium">個人化連結控制台</p>
                        </div>
                        <button onClick={changeBackground} className="ml-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform active:scale-90">
                            <RefreshCw size={18} className={isBgLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                        <input 
                            type="text"
                            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-white/40 focus:bg-white/20 focus:outline-none transition-all shadow-2xl"
                            placeholder="搜尋網址或名稱..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            {!searchQuery && (
                <div className="px-6 py-2 flex justify-center">
                    <div className="flex items-center gap-2 p-2 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-x-auto no-scrollbar">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <NavTab 
                                key={i}
                                index={i}
                                hasContent={groups.some(g => g.pageIndex === i)}
                                isActive={activeTabIndex === i}
                                onClick={() => setActiveTabIndex(i)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Content Grid */}
            <div className="flex-1 px-6 py-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto pb-24">
                    <SortableContext items={visibleGroups.map(g => g.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {visibleGroups.map(group => (
                                <BookmarkGroupCard 
                                    key={group.id} 
                                    group={group} 
                                    onEdit={(g) => setModalState({ isOpen: true, group: g })}
                                    onDeleteGroup={(id) => {
                                        if(confirm('確定刪除此分類？')) setGroups(prev => prev.filter(g => g.id !== id));
                                    }}
                                    onDeleteItem={(gid, iid) => {
                                        setGroups(prev => prev.map(g => g.id === gid ? { ...g, items: g.items.filter(i => i.id !== iid) } : g));
                                    }}
                                />
                            ))}

                            {!searchQuery && (
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={isSuggesting}
                                    className="h-[200px] border-2 border-dashed border-white/30 rounded-3xl flex flex-col items-center justify-center text-white/50 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all group"
                                >
                                    <div className="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
                                        <Plus size={32} />
                                    </div>
                                    <span className="mt-3 font-bold text-lg">{isSuggesting ? 'AI 構思中...' : '新增分類框'}</span>
                                </button>
                            )}
                        </div>
                    </SortableContext>
                </div>
            </div>

            {/* Modal */}
            <EditModal 
                isOpen={modalState.isOpen}
                group={modalState.group}
                onClose={() => setModalState({ isOpen: false, group: null })}
                onUpdateGroup={(updated) => setGroups(prev => prev.map(g => g.id === updated.id ? updated : g))}
                onDeleteGroup={(id) => setGroups(prev => prev.filter(g => g.id !== id))}
            />

            {/* Drag Overlay */}
            <DragOverlay>
                {draggedGroup && (
                    <div className="opacity-80 scale-105">
                        <BookmarkGroupCard group={draggedGroup} onEdit={()=>{}} onDeleteGroup={()=>{}} onDeleteItem={()=>{}} />
                    </div>
                )}
                {activeItem && (
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl border-2 border-blue-500">
                        <img src={`https://www.google.com/s2/favicons?domain=${new URL(activeItem.url).hostname}&sz=64`} className="w-10 h-10" />
                    </div>
                )}
            </DragOverlay>
          </div>
        </div>
    </DndContext>
  );
};

export default App;
