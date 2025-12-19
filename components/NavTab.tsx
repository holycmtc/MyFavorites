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

  const baseClasses = "relative w-12 h-12 shrink-0 flex items-center justify-center rounded-xl transition-all duration-200 border cursor-pointer select-none outline-none font-mono text-lg font-bold";
  
  // Active state (Selected)
  const activeStyle = isActive 
    ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110 z-10" 
    : "bg-white/80 border-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hover:scale-105";

  // Visual distinction for empty vs filled pages
  const contentIndicator = hasContent ? "" : "opacity-60";

  // Drag over state
  const dropStyle = isOver 
    ? "ring-4 ring-green-400 scale-110 bg-green-100 border-green-500 text-green-700 z-20" 
    : "";

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${activeStyle}
        ${contentIndicator}
        ${dropStyle}
      `}
    >
      {index + 1}
      
      {/* Has Content Dot */}
      {hasContent && !isActive && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full" />
      )}
    </button>
  );
};