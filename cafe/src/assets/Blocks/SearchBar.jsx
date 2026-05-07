import React from "react";
import { FiSearch } from "react-icons/fi";

export function SearchBar({ placeholder, value, onChange, wrapperClass }) {
    return (
        <div className={`flex-1 ${wrapperClass || ''}`}>
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 dark:focus:ring-[var(--night-dark-blue)] focus:ring-[var(--day-purple)] text-sm transition-all"
                />
            </div>
        </div>
    );
}