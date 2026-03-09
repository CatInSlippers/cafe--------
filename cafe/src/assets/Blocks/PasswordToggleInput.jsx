import { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const PasswordToggleInput = ({ placeholder, icon: Icon, value, onChange, name }) => {
    const [inputType, setInputType] = useState('password');

    const handleToggle = () => {
        setInputType(prev => prev === 'password' ? 'text' : 'password');
    };

    return (
        <div className="relative mb-4">
            <input
                type={inputType}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full py-3 px-4 dark:border-gray-700 border dark:bg-gray-800 dark:text-gray-400 border-gray-300 rounded-lg focus:outline-none dark:focus:ring-[var(--night-dark-blue)] focus:ring-[var(--day-purple)] text-gray-600 placeholder-gray-400 shadow-sm"
                required
            />

            <button
                type="button"
                onClick={handleToggle}
                className="absolute inset-y-0 right-10 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-purple-200 transition-colors z-10"
            >
                {inputType === 'password' ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
            </button>

            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <Icon size={20} />
            </div>
        </div>
    );
};

export default PasswordToggleInput;