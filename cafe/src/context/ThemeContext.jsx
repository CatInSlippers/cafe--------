import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('app-settings');
        return saved ? JSON.parse(saved).darkMode : false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = (value) => {
        setIsDarkMode(value);
        // Оновлюємо localStorage, щоб зберегти вибір
        const saved = JSON.parse(localStorage.getItem('app-settings') || '{}');
        localStorage.setItem('app-settings', JSON.stringify({ ...saved, darkMode: value }));
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);