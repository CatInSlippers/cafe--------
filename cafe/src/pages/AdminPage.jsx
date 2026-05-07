import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiBarChart2, FiCalendar, FiMap, FiLogOut, FiTrash2, FiEdit, FiSlash, FiX, FiCheck, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { SearchBar } from '../assets/Blocks/SearchBar';
import { toast } from 'react-toastify';

const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userStats, setUserStats] = useState({ total_bookings: 0, active_bookings: 0, total_spent: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: '', phone: '', role: 'client' });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });


    // --- СТАНИ ДЛЯ СТАТИСТИКИ ---
    const defaultStart = new Date();
    defaultStart.setDate(1);
    const [statsStartDate, setStatsStartDate] = useState(defaultStart.toISOString().split('T')[0]);
    const [statsEndDate, setStatsEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [statsSeatFilter, setStatsSeatFilter] = useState('');
    const [statsData, setStatsData] = useState({ summary: {}, daily: [] });
    const [isStatsLoading, setIsStatsLoading] = useState(false);


    // --- СТАНИ ДЛЯ БРОНЮВАНЬ ---
    const [adminBookings, setAdminBookings] = useState([]);
    const [bookingFilterTimeframe, setBookingFilterTimeframe] = useState('specific');
    const [bookingFilterDate, setBookingFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingFilterStatus, setBookingFilterStatus] = useState('all');
    const [isAdminBookingsLoading, setIsAdminBookingsLoading] = useState(false);

    // --- СТАНИ ДЛЯ КІМНАТ ---
    const [rooms, setRooms] = useState([]);
    const [isRoomsLoading, setIsRoomsLoading] = useState(false);

    // Завантаження даних залежно від активної вкладки
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3005/api/admin/users');
                setUsers(response.data);
            } catch (error) {
                console.error("Помилка завантаження користувачів:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchStats = async () => {
            try {
                setIsStatsLoading(true);
                const response = await axios.get(`http://localhost:3005/api/admin/stats?startDate=${statsStartDate}&endDate=${statsEndDate}&seatId=${statsSeatFilter}`);
                setStatsData(response.data);
            } catch (error) {
                console.error("Помилка завантаження статистики:", error);
            } finally {
                setIsStatsLoading(false);
            }
        };

        const fetchBookings = async () => {
            try {
                setIsAdminBookingsLoading(true);
                const response = await axios.get(
                    `http://localhost:3005/api/admin/bookings?timeframe=${bookingFilterTimeframe}&date=${bookingFilterDate}&status=${bookingFilterStatus}`
                );
                setAdminBookings(response.data);
            } catch (error) {
                console.error("Помилка завантаження бронювань:", error);
            } finally {
                setIsAdminBookingsLoading(false);
            }
        };

        const fetchRooms = async () => {
            try {
                setIsRoomsLoading(true);
                const response = await axios.get('http://localhost:3005/api/maps');
                setRooms(response.data);
            } catch (error) {
                console.error("Помилка завантаження кімнат:", error);
            } finally {
                setIsRoomsLoading(false);
            }
        };

        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'stats') fetchStats();
        if (activeTab === 'bookings') fetchBookings();
        if (activeTab === 'rooms') fetchRooms();
    }, [
        activeTab,
        statsStartDate,
        statsEndDate,
        statsSeatFilter,
        bookingFilterDate,
        bookingFilterStatus,
        bookingFilterTimeframe
    ]);

    const handleDeleteUser = async (id, name) => {
        if (window.confirm(`Ви впевнені, що хочете видалити користувача ${name}? Усі його бронювання також будуть видалені.`)) {
            try {
                await axios.delete(`http://localhost:3005/api/admin/users/${id}`);
                setUsers(users.filter(u => u.user_id !== id));
            } catch (error) {
                toast.error("Помилка при видаленні користувача.");
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleToggleBan = async (id, name, currentBanStatus) => {
        const actionText = currentBanStatus ? 'розблокувати' : 'заблокувати';
        if (window.confirm(`Ви впевнені, що хочете ${actionText} користувача ${name}?`)) {
            try {
                // Відправляємо протилежний статус
                const response = await axios.patch(`http://localhost:3005/api/admin/users/${id}/ban`, {
                    banned: !currentBanStatus
                });

                // Оновлюємо стан локально, щоб не робити зайвий запит на сервер
                setUsers(users.map(u => {
                    if (u.user_id === id) {
                        return {
                            ...u,
                            banned: response.data.user.banned,
                            banned_time: response.data.user.banned_time
                        };
                    }
                    return u;
                }));
            } catch (error) {
                toast.error(`Помилка при спробі ${actionText} користувача.`);
            }
        }
    };

    // Відкрити модальне вікно та завантажити статистику
    const handleOpenProfile = async (user) => {
        setSelectedUser(user);
        setEditForm({ full_name: user.full_name, phone: user.phone || '', role: user.role });
        setIsModalOpen(true);

        try {
            const response = await axios.get(`http://localhost:3005/api/admin/users/${user.user_id}/stats`);
            setUserStats(response.data);
        } catch (error) {
            console.error("Помилка завантаження статистики:", error);
        }
    };

    // Зберегти відредаговані дані
    const handleSaveProfile = async () => {
        try {
            const response = await axios.put(`http://localhost:3005/api/admin/users/${selectedUser.user_id}`, editForm);

            // Оновлюємо користувача в локальному списку
            setUsers(users.map(u => u.user_id === selectedUser.user_id ? { ...u, ...response.data.user } : u));

            toast.info(`Користувача успішно ${actionText}.`);
            setIsModalOpen(false);
        } catch (error) {
            toast.error(`Помилка при спробі змінити статус бану.`);
        }
    };

    // Функція зміни напрямку сортування
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleCancelBooking = async (bookingId, userName) => {
        if (window.confirm(`Ви впевнені, що хочете скасувати бронювання клієнта ${userName}?`)) {
            try {
                await axios.patch(`http://localhost:3005/api/admin/bookings/${bookingId}/cancel`);
                // Оновлюємо локальний стейт
                setAdminBookings(adminBookings.map(b =>
                    b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b
                ));
            } catch (error) {
                toast.error("Помилка при скасуванні бронювання.");
            }
        }
    };

    // Обчислюємо фінальний список користувачів (фільтрація + сортування)
    const filteredAndSortedUsers = useMemo(() => {
        // 1. Пошук (Фільтрація)
        let processedUsers = users;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            processedUsers = processedUsers.filter(u =>
                (u.full_name && u.full_name.toLowerCase().includes(query)) ||
                (u.email && u.email.toLowerCase().includes(query)) ||
                (u.phone && u.phone.toLowerCase().includes(query))
            );
        }

        // 2. Сортування
        if (sortConfig.key) {
            processedUsers = [...processedUsers].sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Безпечна обробка рядків
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();

                // Для балансу перетворюємо рядок на число
                if (sortConfig.key === 'balance') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processedUsers;
    }, [users, searchQuery, sortConfig]);

    // Допоміжний компонент для відображення іконки сортування
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="w-4 h-4 opacity-0 group-hover:opacity-30"><FiChevronDown /></span>;
        return sortConfig.direction === 'asc' ? <FiChevronUp className="text-purple-500" /> : <FiChevronDown className="text-purple-500" />;
    };

    const handleCreateRoom = () => {
        const newRoomName = prompt("Введіть назву нової кімнати (англійською, без пробілів, наприклад: meeting_room_1):");
        if (newRoomName && newRoomName.trim() !== '') {
            navigate(`/admin/editor/${newRoomName.trim()}`);
        }
    };

    const handleDeleteRoom = async (roomName) => {
        if (window.confirm(`Ви впевнені, що хочете видалити кімнату "${roomName}"? Це незворотня дія.`)) {
            try {
                await axios.delete(`http://localhost:3005/api/maps/${roomName}`);
                setRooms(rooms.filter(r => r.name !== roomName));
            } catch (error) {
                toast.error("Помилка при видаленні кімнати.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Бокова панель (Sidebar) */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-wider text-purple-400">AdminPanel</h1>
                    <p className="text-xs text-gray-400 mt-1">TimeGuard System</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'stats' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                        <FiBarChart2 /> Статистика
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                        <FiUsers /> Користувачі
                    </button>
                    <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'bookings' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                        <FiCalendar /> Бронювання
                    </button>
                    <button onClick={() => setActiveTab('rooms')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'rooms' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                        <FiMap /> Кімнати
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
                        <FiLogOut /> Вийти
                    </button>
                </div>
            </aside>

            {/* Основний контент */}
            <main className="flex-1 p-8 overflow-y-auto">
                {/* ВКЛАДКА: КОРИСТУВАЧІ */}
                {activeTab === 'users' && (
                    <div className="animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Управління користувачами</h2>

                            <div className="w-1/3">
                                <SearchBar
                                    placeholder="Пошук за ім'ям, email або телефоном..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full font-bold text-sm">
                                Всього: {users.length}
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Користувач</th>
                                        <th className="p-4 font-semibold">Контакти</th>
                                        <th className="p-4 font-semibold">Роль</th>
                                        <th className="p-4 font-semibold">Баланс</th>
                                        <th className="p-4 font-semibold text-right">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-400">Завантаження...</td></tr>
                                    ) : filteredAndSortedUsers.length === 0 ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-400">Користувачів не знайдено</td></tr>
                                    ) : (
                                        filteredAndSortedUsers.map(u => (
                                            <tr key={u.user_id} className={`transition-colors ${u.banned ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${u.banned ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                                                            {u.full_name}
                                                        </span>
                                                        {u.banned && (
                                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Banned</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">Реєстрація: {new Date(u.created_at).toLocaleDateString()}</div>
                                                    {u.banned && u.banned_time && (
                                                        <div className="text-xs text-red-500">Заблоковано: {new Date(u.banned_time).toLocaleDateString()}</div>
                                                    )}
                                                </td>
                                                {/* Контакти, Роль, Баланс залишаються без змін... */}
                                                <td className="p-4 text-sm text-gray-600">
                                                    <div>{u.email}</div>
                                                    <div>{u.phone || '-'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-md ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        {u.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-gray-700">
                                                    {Number(u.balance).toFixed(2)} ₴
                                                </td>

                                                {/* ОНОВЛЕНІ КНОПКИ */}
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleOpenProfile(u)} className="p-2 text-blue-500 hover:bg-blue-50 rounded transition" title="Профіль та Редагування">
                                                            <FiEdit />
                                                        </button>

                                                        {/* Кнопка Бан / Розбан */}
                                                        {u.role !== 'admin' && ( // Адміна банити не можна
                                                            <button
                                                                onClick={() => handleToggleBan(u.user_id, u.full_name, u.banned)}
                                                                className={`p-2 rounded transition ${u.banned ? 'text-green-500 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                                                                title={u.banned ? "Розблокувати" : "Забанити"}
                                                            >
                                                                <FiSlash />
                                                            </button>
                                                        )}

                                                        <button onClick={() => handleDeleteUser(u.user_id, u.full_name)} className="p-2 text-red-500 hover:bg-red-50 rounded transition" title="Видалити">
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* ВКЛАДКА: СТАТИСТИКА */}
                {activeTab === 'stats' && (
                    <div className="animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Аналітика бронювань</h2>
                        </div>

                        {/* Панель фільтрів */}
                        {/* Панель фільтрів */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end mb-6">

                            {/* Новий фільтр періоду */}
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Період</label>
                                <select
                                    value={bookingFilterTimeframe}
                                    onChange={(e) => setBookingFilterTimeframe(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 font-bold text-gray-700"
                                >
                                    <option value="specific">Конкретна дата</option>
                                    <option value="upcoming">Майбутні (і сьогодні)</option>
                                    <option value="past">Минулі (Історія)</option>
                                    <option value="all">Увесь час</option>
                                </select>
                            </div>

                            {/* Поле дати (показуємо тільки якщо обрано "Конкретна дата") */}
                            {bookingFilterTimeframe === 'specific' && (
                                <div className="flex-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Дата</label>
                                    <input
                                        type="date"
                                        value={bookingFilterDate}
                                        onChange={(e) => setBookingFilterDate(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            )}

                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Статус</label>
                                <select
                                    value={bookingFilterStatus}
                                    onChange={(e) => setBookingFilterStatus(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 font-bold text-gray-700"
                                >
                                    <option value="all">Усі статуси</option>
                                    <option value="active">Тільки активні</option>
                                    <option value="cancelled">Скасовані</option>
                                </select>
                            </div>

                            <div>
                                <button
                                    onClick={() => {
                                        setBookingFilterTimeframe('specific');
                                        setBookingFilterDate(new Date().toISOString().split('T')[0]);
                                        setBookingFilterStatus('all');
                                    }}
                                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition"
                                >
                                    Скинути фільтри
                                </button>
                            </div>
                        </div>

                        {isStatsLoading ? (
                            <div className="text-center py-10 text-gray-400 font-bold">Оновлення даних...</div>
                        ) : (
                            <>
                                {/* Картки підсумків */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-2xl text-white shadow-lg shadow-purple-200">
                                        <div className="text-purple-200 text-sm font-bold uppercase mb-2">Загальний дохід</div>
                                        <div className="text-3xl font-black">{Number(statsData.summary.total_revenue || 0).toFixed(0)} ₴</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="text-gray-400 text-sm font-bold uppercase mb-2">Усього броней</div>
                                        <div className="text-3xl font-black text-gray-800">{statsData.summary.total_bookings || 0}</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="text-gray-400 text-sm font-bold uppercase mb-2 text-green-500">Активних</div>
                                        <div className="text-3xl font-black text-gray-800">{statsData.summary.active_bookings || 0}</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="text-gray-400 text-sm font-bold uppercase mb-2 text-red-500">Скасованих</div>
                                        <div className="text-3xl font-black text-gray-800">{statsData.summary.cancelled_bookings || 0}</div>
                                    </div>
                                </div>

                                {/* Графік доходів (Створений засобами CSS) */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-6">Графік доходів по днях</h3>
                                    {statsData.daily.length === 0 ? (
                                        <div className="text-center text-gray-400 py-10">Немає даних за обраний період</div>
                                    ) : (
                                        <div className="h-64 flex items-end gap-2">
                                            {statsData.daily.map((day, i) => {
                                                // Рахуємо максимальний дохід для обчислення висоти стовпчика у відсотках
                                                const maxRevenue = Math.max(...statsData.daily.map(d => Number(d.daily_revenue)));
                                                const heightPercent = maxRevenue === 0 ? 0 : (Number(day.daily_revenue) / maxRevenue) * 100;

                                                return (
                                                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                                        {/* Спливаюча підказка (Tooltip) */}
                                                        <div className="absolute -top-10 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            {day.date}: {day.daily_revenue} ₴
                                                        </div>
                                                        {/* Стовпчик графіка */}
                                                        <div
                                                            className="w-full bg-purple-200 hover:bg-purple-500 transition-colors rounded-t-sm"
                                                            style={{ height: `${heightPercent}%`, minHeight: heightPercent > 0 ? '4px' : '0' }}
                                                        ></div>
                                                        {/* Дата під стовпчиком (показуємо лише день, щоб не захаращувати) */}
                                                        <div className="text-[10px] text-gray-400 mt-2 rotate-45 origin-left">
                                                            {day.date.split('-')[2]}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
                {/* ВКЛАДКА: БРОНЮВАННЯ */}
                {activeTab === 'bookings' && (
                    <div className="animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Управління бронюваннями</h2>
                            {/* Заділ на майбутнє: кнопка додавання */}
                            <button onClick={() => navigate('/book-map')} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition shadow-md">
                                + Створити бронювання
                            </button>
                        </div>

                        {/* Панель фільтрів */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-end mb-6">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Дата</label>
                                <input
                                    type="date"
                                    value={bookingFilterDate}
                                    onChange={(e) => setBookingFilterDate(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Статус</label>
                                <select
                                    value={bookingFilterStatus}
                                    onChange={(e) => setBookingFilterStatus(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                                >
                                    <option value="all">Усі статуси</option>
                                    <option value="active">Тільки активні</option>
                                    <option value="cancelled">Скасовані</option>
                                </select>
                            </div>
                            <div>
                                <button
                                    onClick={() => { setBookingFilterDate(''); setBookingFilterStatus('all'); }}
                                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition"
                                >
                                    Скинути фільтри
                                </button>
                            </div>
                        </div>

                        {/* Таблиця бронювань */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Клієнт</th>
                                        <th className="p-4 font-semibold">Місце</th>
                                        <th className="p-4 font-semibold">Час та Тривалість</th>
                                        <th className="p-4 font-semibold">Сума / Послуги</th>
                                        <th className="p-4 font-semibold">Статус</th>
                                        <th className="p-4 font-semibold text-right">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isAdminBookingsLoading ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-gray-400">Завантаження...</td></tr>
                                    ) : adminBookings.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-gray-400">На обрану дату бронювань немає</td></tr>
                                    ) : (
                                        adminBookings.map(b => {
                                            // Безпечний парсинг послуг
                                            let parsedExtras = [];
                                            try { parsedExtras = typeof b.extras === 'string' ? JSON.parse(b.extras) : b.extras; } catch (e) { }

                                            return (
                                                <tr key={b.booking_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-gray-900">{b.full_name || 'Невідомий клієнт'}</div>
                                                        <div className="text-xs text-gray-500">{b.email}</div>
                                                        {b.phone && <div className="text-xs text-gray-500">{b.phone}</div>}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-gray-800">{b.seat_label}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{b.seat_id}</div>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-700">
                                                        <div className="font-bold text-purple-600">{b.start_time ? b.start_time.slice(0, 5) : '--:--'}</div>
                                                        <div className="text-xs text-gray-500 mt-1">{b.duration_hours} год.</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900">{Number(b.total_price).toFixed(0)} ₴</div>
                                                        {parsedExtras && parsedExtras.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {parsedExtras.map((ext, idx) => (
                                                                    <span key={idx} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded border border-purple-100">
                                                                        {ext}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${b.status === 'active' ? 'bg-green-100 text-green-600' :
                                                            b.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {b.status === 'active' && (
                                                            <button
                                                                onClick={() => handleCancelBooking(b.booking_id, b.full_name)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                                                                title="Скасувати бронювання"
                                                            >
                                                                <FiSlash />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ВКЛАДКА: КІМНАТИ */}
                {activeTab === 'rooms' && (
                    <div className="animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Управління кімнатами</h2>
                            <button onClick={handleCreateRoom} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition shadow-md">
                                + Додати нову кімнату
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isRoomsLoading ? (
                                <div className="col-span-full text-center py-10 text-gray-400">Завантаження кімнат...</div>
                            ) : rooms.length === 0 ? (
                                <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                                    Жодної кімнати ще не створено.
                                </div>
                            ) : (
                                rooms.map((room) => (
                                    <div key={room.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                                <FiMap size={24} />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRoom(room.name)}
                                                className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                                title="Видалити кімнату"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-1">{room.name}</h3>
                                        {room.updated_at && (
                                            <p className="text-xs text-gray-500 mb-6">
                                                Оновлено: {new Date(room.updated_at).toLocaleDateString()}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => navigate(`/admin/editor/${room.name}`)}
                                            className="w-full py-2.5 bg-gray-50 hover:bg-purple-50 text-purple-600 font-bold rounded-xl transition border border-gray-100 hover:border-purple-200"
                                        >
                                            Відкрити в редакторі
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* МОДАЛЬНЕ ВІКНО ПРОФІЛЮ ТА РЕДАГУВАННЯ */}
                {isModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {/* Хедер модалки */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    Профіль користувача
                                    {selectedUser.banned && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Заблокований</span>}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Секція статистики */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center">
                                        <div className="text-purple-500 text-xs font-bold uppercase mb-1">Усього бронювань</div>
                                        <div className="text-2xl font-black text-purple-700">{userStats.total_bookings}</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                                        <div className="text-green-600 text-xs font-bold uppercase mb-1">Активних броней</div>
                                        <div className="text-2xl font-black text-green-700">{userStats.active_bookings}</div>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
                                        <div className="text-orange-600 text-xs font-bold uppercase mb-1">Витрачено коштів</div>
                                        <div className="text-2xl font-black text-orange-700">{Number(userStats.total_spent).toFixed(0)} ₴</div>
                                    </div>
                                </div>

                                {/* Форма редагування */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-700 border-b pb-2">Редагування даних</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Повне ім'я</label>
                                            <input
                                                type="text"
                                                value={editForm.full_name}
                                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Телефон</label>
                                            <input
                                                type="text"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Email (Не редагується)</label>
                                            <input
                                                type="email"
                                                value={selectedUser.email}
                                                disabled
                                                className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 text-sm cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Роль</label>
                                            <select
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                                            >
                                                <option value="client">Client (Клієнт)</option>
                                                <option value="admin">Admin (Адміністратор)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Футер модалки */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition">
                                    Скасувати
                                </button>
                                <button onClick={handleSaveProfile} className="px-5 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-2 transition shadow-lg shadow-purple-200">
                                    <FiCheck /> Зберегти зміни
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;