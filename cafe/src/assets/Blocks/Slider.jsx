export function Slider({ icon, text, enabled, onChange }) {
    return (
        <button
            onClick={onChange}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors group"
        >
            <div className="flex items-center gap-4">
                <div className={`transition-colors ${enabled ? 'text-[#A599E0]' : 'text-gray-400'}`}>
                    {icon}
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{text}</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${enabled ? 'bg-[#D1CCF4]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
        </button>
    );
}
