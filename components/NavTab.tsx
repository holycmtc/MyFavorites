
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface Props {
  index: number;
  hasContent: boolean;
  isActive: boolean;
  onClick: () => void;
}

export const NavTab: React.FC<Props> = ({ index, hasContent, isActive, onClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `tab-${index}`,
    data: {
        type: 'Tab',
        index: index
    },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`
        w-full group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/20' 
          : 'text-white/50 hover:bg-white/5 hover:text-white'
        }
        ${isOver ? 'ring-2 ring-blue-400 scale-105 bg-blue-600/20' : ''}
      `}
    >
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm
        ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 group-hover:text-white'}
      `}>
        {index + 1}
      </div>
      <span className="hidden md:block font-bold text-sm">看板 {index + 1}</span>
      
      {hasContent && !isActive && (
          <div className="absolute right-4 w-1.5 h-1.5 bg-blue-400 rounded-full hidden md:block" />
      )}

      {isActive && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
      )}
    </button>
  );
};
