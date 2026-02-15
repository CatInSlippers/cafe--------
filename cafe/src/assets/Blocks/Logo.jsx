import React from "react";

export function Logo({ day }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--day-pink)] dark:bg-[var(--night-dark-blue)] rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <span className="text-xl font-bold text-gray-800 dark:text-white">TimeGuard</span>
        </div>
    );
}
