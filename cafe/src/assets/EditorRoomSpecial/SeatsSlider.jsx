import React from 'react';

export const SeatsSlider = React.memo(({ label, min, max, value, onChange }) => (
    <div>
        <label className="text-[10px] font-bold text-gray-400 block mb-1">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="range"
                min={min}
                max={max}
                step="1"
                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                value={value}
                onChange={onChange}
            />
            <span className="text-sm font-bold text-gray-700 bg-white px-2 py-0.5 rounded border">
                {value}
            </span>
        </div>
    </div>
));