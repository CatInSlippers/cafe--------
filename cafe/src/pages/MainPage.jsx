import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import MainPageHeader from "../assets/BiggerFish/MainPageHeader";
import { FiCheckCircle, FiCircle, FiClock, FiMapPin, FiCalendar } from "react-icons/fi";
import axios from 'axios';

// --- Фейкові дані (поки немає бекенду для цього) ---
export const CATEGORIES = [
    { id: 'desk', label: 'Робочі місця' },
    { id: 'meeting', label: 'Переговорні кімнати' },
    { id: 'office', label: 'Приватні офіси' },
    { id: 'lounge', label: 'Лаунж зона' },
];

const SERVICES = [
    {
        id: 1,
        category: 'desk',
        title: 'Hot Desk (Вільна посадка)',
        description: 'Будь-яке вільне місце в опен-спейсі. Доступ до розетки та Wi-Fi.',
        price: 50,
        duration: '1 год',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: 2,
        category: 'desk',
        title: 'Dedicated Desk (Фіксоване)',
        description: 'Ваш особистий стіл з монітором та зручним кріслом.',
        price: 80,
        duration: '1 год',
        image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: 3,
        category: 'meeting',
        title: 'Small Meeting Room',
        description: 'Кімната для зустрічей на 4 особи. TV, дошка.',
        price: 200,
        duration: '1 год',
        image: 'https://images.unsplash.com/photo-1517502884422-41e157d4ed30?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: 4,
        category: 'meeting',
        title: 'Conference Hall',
        description: 'Великий зал для лекцій та презентацій (до 20 осіб).',
        price: 500,
        duration: '1 год',
        image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=200'
    },
];

function MainPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeCategory, setActiveCategory] = useState('desk');
    const [selectedItem, setSelectedItem] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Перевірка авторизації та прослуховування змін
    useEffect(() => {
        const loadUser = async () => {
            const storedUserStr = localStorage.getItem('user');
            
            if (storedUserStr) {
                const storedUser = JSON.parse(storedUserStr);
                // 1. Одразу встановлюємо локальні дані, щоб інтерфейс не "стрибав"
                setUser(storedUser); 

                // 2. Фоново робимо запит до БД за найсвіжішими даними (аватар, баланс тощо)
                const userId = storedUser.user_id || storedUser.id;
                if (userId) {
                    try {
                        const response = await axios.get(`http://localhost:3005/api/user/${userId}`);
                        // Об'єднуємо старі дані з новими
                        const freshUserData = { ...storedUser, ...response.data };
                        
                        setUser(freshUserData);
                        // Оновлюємо localStorage, щоб інші сторінки теж бачили свіжі дані
                        localStorage.setItem('user', JSON.stringify(freshUserData));
                    } catch (error) {
                        console.error("Не вдалося оновити дані користувача на головній сторінці:", error);
                    }
                }
            }
        };

        loadUser();

        // Прослуховуємо подію оновлення (наприклад, коли змінили аватар в налаштуваннях)
        window.addEventListener("userUpdated", loadUser);
        
        return () => window.removeEventListener("userUpdated", loadUser);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        location.reload();
    };

    // Фільтрація послуг
    const filteredServices = SERVICES.filter(s => s.category === activeCategory);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--day-pink)] to-[var(--day-purple)] dark:from-[var(--night-dark-blue)] dark:to-[var(--night-dark-purple)] font-sans">
            <MainPageHeader
                user={user}
                setIsOpen={setIsOpen}
                setUser={setUser}
                isOpen={isOpen}
                navigate={navigate}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                handleLogout={handleLogout}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Services */}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Оберіть робочий простір</h1>
                        <p className="text-gray-500 mb-8">Забронюйте ідеальне місце для продуктивної роботи</p>

                        {/* Categories (Tabs) */}
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === cat.id
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* List of Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((item, index) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`p-6 flex items-center gap-4 cursor-pointer transition-colors border-b last:border-b-0 hover:bg-gray-50 ${selectedItem?.id === item.id ? 'bg-purple-50' : ''
                                            }`}
                                    >
                                        {/* Radio Circle */}
                                        <div className={`flex-shrink-0 text-2xl ${selectedItem?.id === item.id ? 'text-[#D1CCF4]' : 'text-gray-300'}`}>
                                            {selectedItem?.id === item.id ? <FiCheckCircle /> : <FiCircle />}
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                                                <span className="font-bold text-gray-900">{item.price} ₴</span>
                                            </div>
                                            <p className="text-gray-500 text-sm">{item.description}</p>
                                            <div className="mt-2 text-xs text-gray-400 flex gap-2">
                                                <span className="flex items-center gap-1"><FiClock /> {item.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    У цій категорії поки немає доступних опцій.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar (Sticky) */}
                    <div className="lg:w-96">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Ваше бронювання</h2>

                            {selectedItem ? (
                                <>
                                    <div className="mb-6">
                                        <img
                                            src={selectedItem.image}
                                            alt="Selected"
                                            className="w-full h-40 object-cover rounded-xl mb-4 shadow-sm"
                                        />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{selectedItem.title}</h3>
                                                <p className="text-sm text-gray-500">TimeGuard Coworking Space</p>
                                            </div>
                                            <span className="font-bold text-[#D1CCF4]">{selectedItem.price} ₴</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                            <FiMapPin className="text-purple-500" />
                                            <span>Вул. Шевченка, 12, Івано-Франківськ</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                            <FiCalendar className="text-purple-500" />
                                            <span>Сьогодні, 24 Грудня</span>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4 mb-6">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Всього</span>
                                            <span>{selectedItem.price} ₴</span>
                                        </div>
                                    </div>

                                    <button
                                        // ТУТ ми пізніше додамо перехід на карту
                                        onClick={() => alert("Перехід на карту для вибору конкретного столу...")}
                                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-[#D1CCF4] transition-colors shadow-lg shadow-purple-200"
                                    >
                                        Продовжити
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <FiCheckCircle size={32} />
                                    </div>
                                    <p className="text-gray-500">Оберіть послугу зі списку зліва, щоб побачити деталі.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>)
}


export default MainPage;




