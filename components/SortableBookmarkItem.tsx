import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { LinkItem } from '../types';

interface Props {
  item: LinkItem;
  groupId: string;
  onDeleteItem: (groupId: string, itemId: string) => void;
}

export const SortableBookmarkItem: React.FC<Props> = ({ item, groupId, onDeleteItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'Item',
      item,
      groupId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const getFavicon = (item: LinkItem) => {
    if (item.icon) return item.icon;
    try {
      const domain = new URL(item.url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group/item flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing touch-none"
    >
      <div 
        onClick={(e) => {
            // Prevent navigation if we are just finishing a drag (optional optimization)
            // But mainly allow clicking to open link
            if (!isDragging) {
                 window.open(item.url, '_blank', 'noopener,noreferrer');
            }
        }}
        className="flex flex-col items-center gap-1 w-full"
        title={item.title}
      >
        <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center transition-transform group-hover/item:scale-105 p-1.5 overflow-hidden relative">
          <img
            src={getFavicon(item)}
            alt={item.title}
            className="w-full h-full object-contain pointer-events-none" // pointer-events-none prevents image drag interference
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                 e.currentTarget.parentElement.innerText = item.title.charAt(0);
              }
            }}
          />
        </div>
        <span className="text-sm text-gray-600 truncate w-full text-center group-hover/item:text-gray-900 pointer-events-none select-none font-medium">
          {item.title}
        </span>
      </div>

      {/* Delete Item Button */}
      <button
        className="absolute top-0 right-1.5 translate-x-1/2 -translate-y-1/2 z-20 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-full p-0.5 opacity-0 group-hover/item:opacity-100 transition-all shadow-sm scale-75 hover:scale-100 cursor-pointer"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDeleteItem(groupId, item.id);
        }}
        title="刪除連結"
      >
        <X size={12} strokeWidth={3} />
      </button>
    </div>
  );
};