function InputField({ type, placeholder, icon: Icon, value, onChange, name }) {
    return (
        <div className="relative mb-4">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full py-3 px-4 border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 border-gray-300 rounded-lg focus:outline-none dark:focus:ring-[var(--night-dark-blue)] focus:ring-[var(--day-purple)] text-gray-600 placeholder-gray-400 shadow-sm"
                required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <Icon size={20} />
            </div>
        </div>
    )
}

export default InputField;