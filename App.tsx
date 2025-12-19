import React, { useState, useEffect, useRef } from 'react';
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
import { Search, Plus, Star, Image as ImageIcon, RefreshCw } from 'lucide-react';
import BookmarkGroupCard from './components/BookmarkGroupCard';
import EditModal from './components/EditModal';
import { SortableBookmarkItem } from './components/SortableBookmarkItem';
import { NavTab } from './components/NavTab';
import { Group, LinkItem } from './types';
import { suggestGroupCategory } from './services/geminiService';

// Initial Mock Data with Page assignments
const INITIAL_GROUPS: Group[] = [
  {
    id: 'g1',
    title: '學習',
    items: [
      { id: 'l1', title: 'LingQ 學英文', url: 'https://www.lingq.com' },
      { id: 'l2', title: 'J&B 線上聖經', url: 'https://bible.com' },
      { id: 'l3', title: '華人基督徒查經', url: 'https://ccbiblestudy.org' },
      { id: 'l4', title: '聖經綜合解讀', url: 'https://bible-study.org' },
    ],
    pageIndex: 0
  },
  {
    id: 'g1-2',
    title: '新聞媒體',
    items: [
      { id: 'l7', title: 'POLITICO', url: 'https://www.politico.com' },
      { id: 'l8', title: 'CBS News', url: 'https://www.cbsnews.com' },
    ],
    pageIndex: 0
  },
  {
    id: 'g2',
    title: 'Shopping',
    items: [
      { id: 's1', title: '蝦皮', url: 'https://shopee.tw' },
      { id: 's2', title: '淘寶', url: 'https://world.taobao.com' },
    ],
    pageIndex: 1
  },
  {
    id: 'g3',
    title: 'AI Tools',
    items: [
      { id: 'a1', title: 'ChatGPT', url: 'https://chat.openai.com' },
      { id: 'a2', title: 'Gemini', url: 'https://gemini.google.com' },
    ],
    pageIndex: 2
  },
  {
    id: 'g4',
    title: 'Popular',
    items: [
      { id: 'p1', title: 'Youtube', url: 'https://youtube.com' },
      { id: 'p2', title: 'Google', url: 'https://google.com' },
      { id: 'p3', title: 'Facebook', url: 'https://facebook.com' },
    ],
    pageIndex: 0
  },
  {
    id: 'g5',
    title: '網路工具',
    items: [
      { id: 't1', title: 'Nas 雲盤', url: 'https://synology.com' },
      { id: 't2', title: 'NAS 相簿', url: 'https://photos.google.com' },
    ],
    pageIndex: 9
  }
];

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [modalState, setModalState] = useState<{isOpen: boolean, group: Group | null}>({ 
    isOpen: false, 
    group: null 
  });
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  // Background Image State
  const [bgUrl, setBgUrl] = useState(`https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop`);
  const [isBgLoading, setIsBgLoading] = useState(false);
  
  // Dragging State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<LinkItem | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<Group | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const changeBackground = () => {
    if (isBgLoading) return;
    setIsBgLoading(true);
    
    // Using a high-quality Unsplash source with a random sig to avoid cache and infinite spinner
    const randomSig = Math.floor(Math.random() * 100000);
    const newUrl = `https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop&sig=${randomSig}`;
    
    const img = new Image();
    
    const timeoutId = setTimeout(() => {
        setIsBgLoading(false);
    }, 8000); // 8 second timeout for cloud environments

    img.onload = () => {
        clearTimeout(timeoutId);
        setBgUrl(newUrl);
        setIsBgLoading(false);
    };

    img.onerror = () => {
        clearTimeout(timeoutId);
        setIsBgLoading(false);
        // Fallback to picsum if unsplash fails
        setBgUrl(`https://picsum.photos/seed/${randomSig}/1920/1080`);
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
        setActiveItem(null);
    } else if (active.data.current?.type === 'Item') {
        setActiveItem(active.data.current.item);
        setDraggedGroup(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeType = active.data.current?.type;
    const overType = over?.data.current?.type;

    if (activeType === 'Item') {
        const activeContainer = findContainer(active.id as string);
        const overContainer = overType === 'Group' 
            ? (overId as string) 
            : findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setGroups((prev) => {
            const activeGroupIndex = prev.findIndex((g) => g.id === activeContainer);
            const overGroupIndex = prev.findIndex((g) => g.id === overContainer);

            if (activeGroupIndex === -1 || overGroupIndex === -1) return prev;

            const activeGroup = prev[activeGroupIndex];
            const activeItemIndex = activeGroup.items.findIndex((i) => i.id === active.id);
            const itemToMove = activeGroup.items[activeItemIndex];
            
            let newIndex;
            if (overType === 'Group') {
                newIndex = prev[overGroupIndex].items.length;
            } else {
                const overItemIndex = prev[overGroupIndex].items.findIndex((i) => i.id === overId);
                newIndex = overItemIndex >= 0 ? overItemIndex : prev[overGroupIndex].items.length;
            }

            return prev.map((g) => {
                if (g.id === activeContainer) {
                    return { ...g, items: g.items.filter((i) => i.id !== active.id) };
                }
                if (g.id === overContainer) {
                    const newItems = [...g.items];
                    newItems.splice(newIndex, 0, itemToMove);
                    return { ...g, items: newItems };
                }
                return g;
            });
        });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeType = active.data.current?.type;
    const overType = over?.data.current?.type;

    if (activeType === 'Group' && over) {
        if (overType === 'Tab') {
             const targetPageIndex = over.data.current?.index;
             setGroups(prev => prev.map(g => g.id === active.id ? { ...g, pageIndex: targetPageIndex } : g));
        } else if (overType === 'Group') {
             const oldIndex = groups.findIndex(g => g.id === active.id);
             const newIndex = groups.findIndex(g => g.id === over.id);
             if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                 setGroups(arrayMove(groups, oldIndex, newIndex));
             }
        }
    }

    if (activeType === 'Item' && over) {
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over.id as string);

        if (activeContainer && overContainer && activeContainer === overContainer) {
             const groupIndex = groups.findIndex(g => g.id === activeContainer);
             const group = groups[groupIndex];
             const oldIndex = group.items.findIndex(i => i.id === active.id);
             const newIndex = group.items.findIndex(i => i.id === over.id);

             if (oldIndex !== newIndex && newIndex !== -1) {
                 const newItems = arrayMove(group.items, oldIndex, newIndex);
                 setGroups(prev => prev.map(g => g.id === activeContainer ? { ...g, items: newItems } : g));
             }
        }
    }

    setActiveId(null);
    setActiveItem(null);
    setDraggedGroup(null);
  };

  const handleEditGroup = (group: Group) => {
    setModalState({ isOpen: true, group });
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('確定要刪除整個群組嗎？')) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    }
  };

  const handleDeleteItem = (groupId: string, itemId: string) => {
    if (window.confirm('確定要刪除這個連結嗎？')) {
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    items: group.items.filter(item => item.id !== itemId)
                };
            }
            return group;
        }));
    }
  };

  const handleCreateGroup = async () => {
      setIsSuggesting(true);
      const newId = `new-${Date.now()}`;
      
      let newTitle = "新分類";
      const currentTitles = visibleGroups.flatMap(g => g.items.map(i => i.title));
      
      try {
         const suggestion = await suggestGroupCategory(currentTitles);
         if (suggestion) newTitle = suggestion;
      } catch(e) {
          console.error("AI Suggestion failed", e);
      }
      setIsSuggesting(false);

      const newGroup: Group = {
          id: newId,
          title: newTitle,
          items: [],
          pageIndex: activeTabIndex
      };
      
      setGroups([...groups, newGroup]);
      setModalState({ isOpen: true, group: newGroup });
  };

  const visibleGroups = searchQuery
    ? groups.filter(g => g.items.some(i => 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.url.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    : groups.filter(g => g.pageIndex === activeTabIndex);

  const dropAnimation: DropAnimation = {
      sideEffects: defaultDropAnimationSideEffects({
        styles: {
          active: {
            opacity: '0.5',
          },
        },
      }),
  };

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
    >
        <div 
            className="min-h-screen bg-cover bg-center bg-fixed font-sans flex flex-col transition-all duration-700 ease-in-out" 
            style={{ backgroundImage: `url("${bgUrl}")` }}
        >
          
          <div className="flex-1 bg-black/40 w-full relative flex flex-col backdrop-blur-sm">
            
            {/* Header Section */}
            <div className="pt-8 px-4 sm:px-8 pb-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    <div className="flex items-center gap-4 select-none">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg cursor-default">
                                <Star className="text-yellow-400 fill-yellow-400 drop-shadow-sm" size={24} />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide drop-shadow-md">
                                我的最愛
                            </h1>
                        </div>
                        
                        <button 
                            onClick={changeBackground}
                            disabled={isBgLoading}
                            className={`p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 transition-all ${isBgLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                            title="隨機切換背景風景"
                        >
                            <RefreshCw size={18} className={`${isBgLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="relative w-full max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="text-white/60 group-focus-within:text-white transition-colors" size={18} />
                        </div>
                        <input 
                            type="text"
                            className="block w-full pl-11 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-white/50 shadow-sm focus:bg-white/20 focus:ring-2 focus:ring-white/30 focus:border-white/50 focus:outline-none transition-all text-sm"
                            placeholder="搜索網頁..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {!searchQuery && (
                <div className="px-4 py-2 w-full z-20">
                    <div className="max-w-7xl mx-auto flex justify-center">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-x-auto max-w-full no-scrollbar">
                            {Array.from({ length: 10 }).map((_, i) => {
                                const hasContent = groups.some(g => g.pageIndex === i);
                                return (
                                    <NavTab 
                                        key={i}
                                        index={i}
                                        hasContent={hasContent}
                                        isActive={activeTabIndex === i}
                                        onClick={() => setActiveTabIndex(i)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    
                    <SortableContext 
                        items={visibleGroups.map(g => g.id)} 
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300 pb-20">
                            {visibleGroups.map(group => (
                                <BookmarkGroupCard 
                                    key={group.id} 
                                    group={group} 
                                    onEdit={handleEditGroup}
                                    onDeleteGroup={handleDeleteGroup}
                                    onDeleteItem={handleDeleteItem}
                                />
                            ))}

                            {!searchQuery && (
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={isSuggesting}
                                    className="h-[200px] border-3 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center text-white/60 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all group disabled:opacity-50"
                                >
                                    <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors mb-2">
                                        <Plus size={32} />
                                    </div>
                                    <span className="font-bold text-xl">新增分類框</span>
                                    <span className="text-base opacity-70 mt-1">{isSuggesting ? 'AI 構思中...' : '建立新的連結集合'}</span>
                                </button>
                            )}
                        </div>
                    </SortableContext>
                    
                </div>
            </div>

            <EditModal 
                isOpen={modalState.isOpen}
                group={modalState.group}
                onClose={() => setModalState({ isOpen: false, group: null })}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
            />

            <DragOverlay dropAnimation={dropAnimation}>
                {draggedGroup ? (
                    <BookmarkGroupCard 
                        group={draggedGroup} 
                        onEdit={() => {}} 
                        onDeleteGroup={() => {}} 
                        onDeleteItem={() => {}}
                    />
                ) : activeItem ? (
                     <div className="w-16 h-16 bg-white/90 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-2xl border-2 border-blue-400">
                        <SortableBookmarkItem 
                            item={activeItem} 
                            groupId="overlay" 
                            onDeleteItem={() => {}} 
                        />
                     </div>
                ) : null}
            </DragOverlay>

          </div>
        </div>
    </DndContext>
  );
};

export default App;