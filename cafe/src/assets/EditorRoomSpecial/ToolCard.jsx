import React from "react";

export const ToolCard = React.memo(({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition group">
        <Icon size={24} className="text-gray-600 group-hover:text-orange-500 mb-1" />
        <span className="break-normal text-[10px] uppercase text-gray-500 group-hover:text-orange-600 text-center leading-tight">{label}</span>
    </button>
));