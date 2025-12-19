import React from 'react';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, X } from 'lucide-react';
import { Group } from '../types';
import { SortableBookmarkItem } from './SortableBookmarkItem';

interface Props {
  group: Group;
  onEdit: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteItem: (groupId: string, itemId: string) => void;
  domId?: string;
}

const BookmarkGroupCard: React.FC<Props> = ({ group, onEdit, onDeleteGroup, onDeleteItem, domId }) => {
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      id={domId}
      style={style}
      className={`
        bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 
        flex flex-col overflow-hidden group relative transition-all duration-300
        h-[200px] hover:shadow-xl hover:-translate-y-1
      `}
    >
      {/* Header */}
      <div 
        {...attributes}
        {...listeners}
        className="px-4 py-3 flex items-center justify-between bg-gradient-to-b from-white/50 to-transparent border-b border-gray-100/50 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 min-w-0">
             <h3 className="font-bold text-gray-800 tracking-tight text-lg truncate">
                {group.title}
             </h3>
             <span className="text-sm text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                {group.items.length} 
             </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                className="p-1.5 bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-gray-200 shadow-sm"
                onPointerDown={(e) => e.stopPropagation()} 
                onClick={(e) => {
                    e.stopPropagation(); 
                    onEdit(group);
                }}
                title="編輯群組"
            >
                <Edit2 size={14} />
            </button>
            <button 
                className="p-1.5 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors border border-gray-200 shadow-sm"
                onPointerDown={(e) => e.stopPropagation()} 
                onClick={(e) => {
                    e.stopPropagation(); 
                    onDeleteGroup(group.id);
                }}
                title="刪除群組"
            >
                <X size={14} />
            </button>
        </div>
      </div>

      {/* Grid of Icons */}
      <SortableContext items={group.items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar grid grid-cols-4 gap-2 content-start">
            {group.items.map((item) => (
                <SortableBookmarkItem 
                    key={item.id} 
                    item={item} 
                    groupId={group.id}
                    onDeleteItem={onDeleteItem}
                />
            ))}
            
            {group.items.length === 0 && (
                <div className="col-span-4 flex flex-col items-center justify-center h-24 text-gray-400 text-sm select-none">
                    <span>拖曳至此或編輯添加</span>
                </div>
            )}
        </div>
      </SortableContext>
    </div>
  );
};

export default BookmarkGroupCard;