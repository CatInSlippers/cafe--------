import React from 'react';


export const StatusButton = React.memo(({ label, color, isActive, onClick }) => (
    <button onClick={onClick}
        className={
            `text-xs py-1.5 px-2 rounded border transition-colors flex items-center justify-center gap-1 
          ${isActive
                ? 'bg-white border-transparent shadow-sm font-bold'
                : 'bg-transparent border-gray-200 text-gray-500 hover:bg-white'}`}

        style={{ backgroundColor: isActive ? color : undefined }}>
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : ''}`}
            style={{ backgroundColor: isActive ? undefined : color }} />
        {label}
    </button>
));