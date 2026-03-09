import React from 'react'

export function MenuButton({ icon, text, value, onClick }) {
    return (
        <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors group">
            <div className="flex items-center gap-4 text-gray-700 dark:text-gray-200">
                <span className="dark:text-[#A599E0] text-gray-400 group-hover:text-[#D1CCF4] transition-colors">{icon}</span>
                
                <span className="font-semibold">{text}</span>
            </div>
            <span className="text-sm font-bold text-[#D1CCF4]">{value}</span>
        </button>
    );
}
