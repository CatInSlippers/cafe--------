import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiCalendar, FiClock, FiMapPin, FiCreditCard,
    FiSettings, FiLogOut, FiArrowLeft, FiPlus
} from 'react-icons/fi';
import { Logo } from '../assets/Blocks/Logo';
import UserIcon from '../assets/Blocks/UserIcon';
import axios from '../api/axios';

const UserPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bookings');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);

    // Стейт для редагування профілю
    const [editForm, setEditForm] = useState({ full_name: '', phone: '' });

    // 1. Отримання даних користувача з БД
    useEffect(() => {
        const fetchUserData = async () => {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (!storedUser || (!storedUser.user_id && !storedUser.id)) {
                navigate('/login');
                return;
            }
            const userId = storedUser.user_id || storedUser.id;
            try {
                // Паралельно завантажуємо дані користувача та його бронювання
                const [userResponse, bookingsResponse] = await Promise.all([
                    axios.get(`http://localhost:3005/api/user/${userId}`),
                    axios.get(`http://localhost:3005/api/user/${userId}/bookings`)
                ]);

                const userData = userResponse.data;
                setUser(userData);
                setBookings(bookingsResponse.data); // Зберігаємо реальні бронювання

                setEditForm({
                    full_name: userData.full_name || '',
                    phone: userData.phone || ''
                });
            } catch (error) {
                console.error("Помилка завантаження даних:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);

    // 2. Функція збереження змін (Налаштування)
    const handleSaveChanges = async () => {
        try {
            const response = await axios.put(`http://localhost:3005/api/user/${user.user_id}`, {
                full_name: editForm.full_name,
                phone: editForm.phone
            });

            if (response.status === 200) {
                alert("Дані успішно оновлено!");
                // Оновлюємо локальний стейт
                setUser(prev => ({ ...prev, full_name: editForm.full_name, phone: editForm.phone }));

                // Оновлюємо ім'я в localStorage, щоб шапка сайту теж підтягнула зміни
                const storedUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...storedUser, name: editForm.full_name }));
                window.dispatchEvent(new Event("userUpdated"));
            }
        } catch (error) {
            console.error("Помилка при оновленні:", error);
            alert("Не вдалося оновити дані.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center dark:bg-[var(--night-dark-purple)]">
            <p className="text-[var(--day-purple)] font-bold animate-pulse">Завантаження профілю...</p>
        </div>
    );

    if (!user) return null;

    // Форматування дати реєстрації
    const joiningDate = new Date(user.created_at).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });

    // Форматування URL аватара (якщо в базі просто шлях /uploads/...)
    const avatarUrl = user.avatar
        ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:3005${user.avatar}`)
        : null;

    return (
        <div className="min-h-screen bg-[var(--day-pink)] dark:bg-[var(--night-dark-purple)] font-sans transition-colors duration-300">

            {/* --- Шапка --- */}
            <header className="bg-white dark:bg-black shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500"
                        >
                            <FiArrowLeft size={20} />
                        </button>
                        <Logo />
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('user');
                            window.location.href = '/login';
                        }}
                        className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition font-bold text-sm"
                    >
                        <FiLogOut /> <span className="hidden sm:inline">Вийти</span>
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* --- Картка Профілю --- */}
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 mb-8 flex flex-col md:flex-row items-center gap-8">

                    {/* Аватар */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg bg-purple-100 flex items-center justify-center">
                            <UserIcon w={24} h={24} image={avatarUrl} />
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full" title="Онлайн"></div>
                    </div>

                    {/* Інформація */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.full_name}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{user.email}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="px-4 py-1 bg-[var(--day-pink)]/20 text-[var(--day-purple)] dark:text-[var(--day-pink)] rounded-full text-xs font-bold border border-[var(--day-pink)]/30">
                                {user.role === 'admin' ? 'Адміністратор' : 'Клієнт'}
                            </span>
                            <span className="px-4 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                                З нами з: {joiningDate}
                            </span>
                        </div>
                    </div>

                    {/* Баланс */}
                    <div className="w-full md:w-auto bg-gradient-to-br from-[var(--day-pink)] to-[var(--day-purple)] dark:from-[var(--night-dark-blue)] dark:to-[var(--night-dark-purple)] rounded-3xl p-6 text-white min-w-[220px] shadow-lg">
                        <p className="text-sm opacity-80 mb-1">Баланс гаманця</p>
                        <div className="text-3xl font-bold mb-4">{Number(user.balance).toFixed(2)} ₴</div>
                        <button className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                            <FiPlus /> Поповнити
                        </button>
                    </div>
                </div>

                {/* --- Навігація (Таби) --- */}
                <div className="flex gap-8 border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'bookings', label: 'Бронювання', icon: <FiCalendar /> },
                        { id: 'statistics', label: 'Статистика', icon: <FiCreditCard /> },
                        { id: 'settings', label: 'Профіль', icon: <FiSettings /> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-[var(--night-dark-purple)] text-[var(--night-dark-purple)] dark:text-[var(--day-pink)] dark:border-[var(--day-pink)]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* --- Контентна частина --- */}
                <div className="animate-in fade-in duration-500">

                    {/* ТАБ 1: Бронювання */}
                    {/* Вкладка 1: Бронювання */}
                    {activeTab === 'bookings' && (
                        <div className="space-y-4">
                            {bookings.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <p>У вас поки немає активних бронювань.</p>
                                    <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-[var(--day-purple)] text-white rounded-xl font-bold">
                                        Забронювати місце
                                    </button>
                                </div>
                            ) : (
                                bookings.map(booking => (
                                    <div key={booking.booking_id} className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-5">
                                        {/* Оскільки в БД ми не зберігали картинку, поставимо заглушку або іконку */}
                                        <div className="w-full sm:w-32 h-32 bg-purple-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-[var(--day-purple)]">
                                            <FiMapPin size={40} />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                                        {booking.seat_label || 'Робоче місце'}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.status === 'active' ? 'bg-green-100 text-green-600' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {booking.status === 'active' ? 'Активне' : booking.status === 'cancelled' ? 'Скасоване' : 'Завершене'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <FiCalendar className="text-[var(--day-purple)]" />
                                                        {new Date(booking.booking_date).toLocaleDateString('uk-UA')} о {booking.start_time.slice(0, 5)}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <FiClock className="text-[var(--day-purple)]" />
                                                        Тривалість: {booking.duration_hours} год.
                                                    </div>

                                                    {/* Відображення додаткових послуг */}
                                                    {booking.extras && booking.extras.length > 0 && (
                                                        <div className="md:col-span-2 flex flex-wrap gap-2 mt-1">
                                                            {booking.extras.map((extra, index) => (
                                                                <span key={index} className="px-2 py-1 bg-purple-50 text-[var(--day-purple)] text-xs rounded-md border border-purple-100 font-medium">
                                                                    + {extra}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right font-bold text-xl text-gray-900 dark:text-white mt-4 sm:mt-0">
                                                {Number(booking.total_price).toFixed(2)} грн
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ТАБ 2: Гаманець */}
                    {activeTab === 'statistics' && (
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <FiCreditCard size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Статистика</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Тут буде відображено вашу статистику користування послугами</p>
                            {/* <button className="px-8 py-3 bg-gray-900 dark:bg-[var(--night-dark-blue)] text-white rounded-xl font-bold hover:opacity-90 transition-all">
                              
                            </button> */}
                        </div>
                    )}

                    {/* ТАБ 3: Налаштування Профілю */}
                    {activeTab === 'settings' && (
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Особисті дані</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Повне ім'я (ПІБ)</label>
                                    <input
                                        type="text"
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--day-purple)] outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Телефон</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[var(--day-purple)] outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Імейл (не змінюється)</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-400 cursor-not-allowed"
                                    />
                                </div>

                                <button
                                    onClick={handleSaveChanges}
                                    className="w-full py-4 bg-[var(--day-purple)] dark:bg-[var(--night-dark-blue)] text-white rounded-xl font-bold shadow-lg shadow-purple-100 dark:shadow-none hover:opacity-90 transition-all mt-4"
                                >
                                    Зберегти зміни
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserPage;