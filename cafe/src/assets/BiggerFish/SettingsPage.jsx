import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiX, FiBell, FiLock, FiGlobe, FiMoon, FiCamera, FiUser, FiPhone, FiTrash2 } from 'react-icons/fi';
import { Slider } from '../Blocks/Slider';
import { MenuButton } from '../Blocks/MenuButton';
import InputField from '../Blocks/InputField';
import PasswordToggleInput from '../Blocks/PasswordToggleInput';
import axios from '../../api/axios';


export default function SettingsModal({ isOpen, onClose, user }) {
    const [activeTab, setActiveTab] = useState('general');
    const { isDarkMode, toggleTheme } = useTheme();
    const modalRef = useRef(null);

    // 1. Додаємо реф для прихованого інпуту та локальний стейт для миттєвого відображення картинки
    const fileInputRef = useRef(null);
    const [localAvatar, setLocalAvatar] = useState(user?.avatar || null);

    // Оновлюємо локальний аватар, якщо змінився користувач (наприклад, перезайшли)
    useEffect(() => {
        setLocalAvatar(user?.avatar || null);
    }, [user]);

    // 2. Функція відправки файлу на сервер
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Перевіряємо, чи це дійсно картинка
        if (!file.type.startsWith('image/')) {
            alert('Будь ласка, оберіть зображення (JPG, PNG)');
            return;
        }

        const userId = user?.id || user?.user_id;
        if (!userId) return;

        // Для файлів ми використовуємо FormData, а не JSON!
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`http://localhost:3005/api/user/${userId}/avatar`, {
                method: 'POST',
                // Увага: при FormData ми НЕ вказуємо 'Content-Type', браузер зробить це сам
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
                return;
            }

            // Оновлюємо картинку локально
            const fullAvatarUrl = `http://localhost:3005${data.avatarUrl}`;
            setLocalAvatar(fullAvatarUrl);

            // ДОДАНО: Оновлюємо localStorage, щоб інші компоненти побачили нову картинку
            const storedUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...storedUser, avatar: data.avatarUrl }));

            // Тут також варто викликати подію...
            window.dispatchEvent(new Event("userUpdated"));

            // Тут також варто викликати подію, щоб App.jsx оновив аватар у шапці сайту
            window.dispatchEvent(new Event("userUpdated"));

        } catch (error) {
            console.error("Помилка завантаження:", error);
            alert("Не вдалося завантажити картинку");
        }
    };

    // Стейт для налаштувань та профілю
    const [settings, setSettings] = useState({
        notifications: true,
        darkMode: isDarkMode,
        language: 'UA',
        name: user?.name || '',
        phone: user?.phone || '',
        currentPassword: '', // Поточний пароль
        newPassword: ''      // Новий пароль
    });

    // Завантаження налаштувань з localStorage
    // Завантаження налаштувань та синхронізація з поточним користувачем
    useEffect(() => {
        if (isOpen) {
            // 1. Читаємо ТІЛЬКИ глобальні налаштування
            const saved = localStorage.getItem('app-settings');
            let parsedSettings = {};
            if (saved) {
                parsedSettings = JSON.parse(saved);
            }

            // 2. Змішуємо глобальні налаштування з АКТУАЛЬНИМИ даними поточного юзера
            setSettings(prev => ({
                ...prev,
                ...parsedSettings,
                name: user?.name || '',
                phone: user?.phone || '',
                currentPassword: '',
                newPassword: ''
            }));
        }
    }, [isOpen, user]); // Додали user у залежності

    // Логіка перемикання темної теми в реальному часі
    useEffect(() => {
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings.darkMode]);

    // Закриття при кліку на фон
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            onClose();
        }
    };

    // Обробник вводу тексту для полів
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleDeleteAccount = async () => {
        // 1. Запитуємо підтвердження у користувача
        const isConfirmed = window.confirm(
            "Ви впевнені, що хочете видалити свій акаунт? Цю дію неможливо скасувати, і всі ваші дані будуть втрачені!"
        );

        // Якщо користувач натиснув "Скасувати", просто зупиняємо функцію
        if (!isConfirmed) return;

        const userId = user?.id || user?.user_id;

        if (userId) {
            try {
                // 2. Відправляємо DELETE запит на сервер
                const response = await fetch(`http://localhost:3005/api/user/${userId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.error || "Виникла помилка при видаленні");
                    return;
                }

                // 3. Якщо видалення успішне
                alert("Ваш акаунт було успішно видалено.");

                // Очищаємо дані користувача з пам'яті браузера
                // (Заміни 'user' на той ключ, який ти використовуєш для зберігання юзера)
                localStorage.removeItem('user');

                onClose(); // Закриваємо модалку

                // 4. Оновлюємо сторінку, щоб скинути всі стейти і повернути юзера на головну/екран логіну
                window.location.reload();

            } catch (error) {
                console.error("Помилка з'єднання з сервером:", error);
                alert("Не вдалося підключитися до сервера");
            }
        }
    };

    const handleSave = async () => {
        const { currentPassword, newPassword, name, phone, ...appSettingsToSave } = settings;

        // Зберігаємо ТІЛЬКИ тему, мову та сповіщення
        localStorage.setItem('app-settings', JSON.stringify(appSettingsToSave));

        toggleTheme(settings.darkMode);
        window.dispatchEvent(new Event("settingsUpdated"));

        // ... далі йде твій код з fetch запитом (він залишається без змін)
        const userId = user?.id || user?.user_id;

        if (userId) {
            try {
                // Відправляємо PUT запит на наш новий маршрут
                const response = await fetch(`http://localhost:3005/api/user/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: settings.name,
                        phone: settings.phone,
                        currentPassword: settings.currentPassword,
                        newPassword: settings.newPassword
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Якщо бекенд повернув помилку (напр. статус 401 "Невірний поточний пароль")
                    alert(data.error);
                    return; // ВАЖЛИВО: перериваємо функцію, щоб модалка НЕ закрилася
                }

                // Якщо все успішно
                console.log(data.message);

                // Очищаємо поля паролів, щоб при наступному відкритті вони були пусті
                setSettings(prev => ({ ...prev, currentPassword: '', newPassword: '' }));

                // ТУТ МОЖНА ОНОВИТИ СТЕЙТ КОРИСТУВАЧА В APP.JSX
                // Наприклад, якщо ти зберігаєш юзера в localStorage:
                // localStorage.setItem('user', JSON.stringify(data.user));

            } catch (error) {
                console.error("Помилка з'єднання з сервером:", error);
                alert("Не вдалося підключитися до сервера");
                return;
            }
        }

        // Закриваємо модалку тільки якщо збереження пройшло успішно
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all"
        >
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-gray-800"
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-center">
                    <div className="flex gap-6">
                        {['general', 'profile'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-xl font-bold transition-all relative ${activeTab === tab ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'
                                    }`}
                            >
                                {tab === 'general' ? 'Загальні' : 'Профіль'}
                                {activeTab === tab && (
                                    <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#D1CCF4] rounded-full animate-in slide-in-from-left-1" />
                                )}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            if (isDarkMode) document.documentElement.classList.add('dark');
                            else document.documentElement.classList.remove('dark');
                            onClose();
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <FiX size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-2 max-h-[60vh] overflow-y-auto"> {/* Додано скрол для контенту, якщо екран малий */}
                    {activeTab === 'general' ? (
                        <>
                            <Slider
                                icon={<FiBell />}
                                text="Сповіщення"
                                enabled={settings.notifications}
                                onChange={() => setSettings(s => ({ ...s, notifications: !s.notifications }))}
                            />
                            <Slider
                                icon={<FiMoon />}
                                text="Темна тема"
                                enabled={settings.darkMode}
                                onChange={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                            />
                            <MenuButton
                                icon={<FiGlobe />}
                                text="Мова застосунку"
                                value={settings.language}
                                onClick={() => setSettings(s => ({ ...s, language: s.language === 'UA' ? 'EN' : 'UA' }))}
                            />
                        </>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                            {/* Блок з аватаром */}
                            <div className="flex flex-col items-center gap-2 mb-6">

                                {/* ПРИХОВАНИЙ ІНПУТ */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                />

                                {/* Клікабельний аватар */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative cursor-pointer group"
                                >
                                    <div className="w-20 h-20 bg-[#D1CCF4]/20 text-[#D1CCF4] rounded-full flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#D1CCF4] transition-all">
                                        {localAvatar ? (
                                            // Відображаємо завантажену картинку. Якщо посилання відносне, додаємо хост сервера
                                            <img
                                                src={localAvatar.startsWith('http') ? localAvatar : `http://localhost:3005${localAvatar}`}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <FiUser size={32} />
                                        )}
                                    </div>

                                    {/* Іконка камери */}
                                    <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-[#D1CCF4] group-hover:text-gray-900 transition-colors">
                                        <FiCamera size={14} />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'email@example.com'}</p>
                            </div>

                            {/* Поля вводу */}
                            <div className="space-y-1">
                                <InputField
                                    type="text"
                                    name="name"
                                    placeholder="Ваше ім'я"
                                    icon={FiUser}
                                    value={settings.name}
                                    onChange={handleInputChange}
                                />
                                <InputField
                                    type="tel"
                                    name="phone"
                                    placeholder='Номер телефону'
                                    icon={FiPhone}
                                    value={settings.phone}
                                    onChange={handleInputChange}
                                />

                                {/* Секція зміни пароля */}
                                <div className="pt-2">
                                    <PasswordToggleInput
                                        type="password"
                                        name="currentPassword"
                                        placeholder="Змінити пароль (спершу поточний )"
                                        icon={FiLock}
                                        value={settings.currentPassword}
                                        onChange={handleInputChange}
                                    />

                                    {/* Показуємо поле для нового пароля тільки якщо введено поточний */}
                                    {settings.currentPassword.length > 0 && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <PasswordToggleInput
                                                type="password"
                                                name="newPassword"
                                                placeholder="Введіть новий пароль"
                                                icon={FiLock}
                                                value={settings.newPassword}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Кнопка видалення акаунта */}
                            <button
                                onClick={handleDeleteAccount}
                                className="w-full flex items-center gap-4 p-4 mt-6 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl transition-colors"
                            >
                                <span>Видалити акаунт</span>
                            </button>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                    <button
                        onClick={() => {
                            if (isDarkMode) document.documentElement.classList.add('dark');
                            else document.documentElement.classList.remove('dark');
                            onClose();
                        }}
                        className="flex-1 py-3.5 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-[2] py-3.5 bg-gray-900 dark:bg-[#D1CCF4] text-white dark:text-gray-900 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
                    >
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    );
}