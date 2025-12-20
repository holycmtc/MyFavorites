
import React from 'react';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, MoreVertical, Trash2, GripVertical } from 'lucide-react';
import { Group } from '../types';
import { SortableBookmarkItem } from './SortableBookmarkItem';

interface Props {
  group: Group;
  onEdit: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteItem: (groupId: string, itemId: string) => void;
}

const BookmarkGroupCard: React.FC<Props> = ({ group, onEdit, onDeleteGroup, onDeleteItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
      id: group.id,
      data: {
          type: 'Group',
          group
      }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 flex flex-col overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 min-h-[220px] max-h-[400px]"
    >
      {/* Card Header */}
      <div 
        {...attributes}
        {...listeners}
        className="px-7 py-5 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0">
             <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
             <h3 className="font-black text-white text-lg truncate tracking-tight leading-none">
                {group.title}
             </h3>
             <span className="text-[10px] bg-white/20 text-white/80 px-2 py-0.5 rounded-lg font-black tabular-nums border border-white/10">
                {group.items.length} 
             </span>
        </div>

        <button 
            className="p-2.5 text-white/30 hover:text-white hover:bg-white/20 rounded-2xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => { e.stopPropagation(); onEdit(group); }}
        >
            <Edit2 size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Grid of Icons */}
      <div className="flex-1 px-5 pb-7 overflow-y-auto custom-scrollbar">
          <SortableContext items={group.items.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-4 content-start">
                {group.items.map((item) => (
                    <SortableBookmarkItem 
                        key={item.id} 
                        item={item} 
                        groupId={group.id}
                        onDeleteItem={onDeleteItem}
                    />
                ))}
            </div>
          </SortableContext>
          
          {group.items.length === 0 && (
              <div className="h-full py-10 flex flex-col items-center justify-center text-white/20 text-xs font-bold tracking-widest uppercase">
                  分類為空
              </div>
          )}
      </div>
    </div>
  );
};

export default BookmarkGroupCard;
