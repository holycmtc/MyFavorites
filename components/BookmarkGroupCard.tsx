
import React from 'react';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
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
      className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 flex flex-col overflow-hidden group shadow-2xl transition-all duration-300 hover:bg-white/15 hover:border-white/30 h-[220px]"
    >
      {/* Card Header */}
      <div 
        {...attributes}
        {...listeners}
        className="px-6 py-4 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0">
             <div className="w-2 h-6 bg-blue-500 rounded-full" />
             <h3 className="font-bold text-white text-lg truncate leading-none">
                {group.title}
             </h3>
             <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">
                {group.items.length} 
             </span>
        </div>

        <button 
            className="p-2 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => { e.stopPropagation(); onEdit(group); }}
        >
            <Edit2 size={16} />
        </button>
      </div>

      {/* Grid of Icons */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar no-scrollbar">
          <SortableContext items={group.items.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-3 content-start">
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
              <div className="h-full flex flex-col items-center justify-center text-white/20 text-xs italic">
                  暫無連結
              </div>
          )}
      </div>
    </div>
  );
};

export default BookmarkGroupCard;
