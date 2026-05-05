import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiBarChart2, FiCalendar, FiMap, FiLogOut, FiTrash2, FiEdit, FiSlash } from 'react-icons/fi';

const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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

        if (activeTab === 'users') fetchUsers();
        // В майбутньому тут будуть умови для 'stats', 'bookings' тощо
    }, [activeTab]);

    const handleDeleteUser = async (id, name) => {
        if (window.confirm(`Ви впевнені, що хочете видалити користувача ${name}? Усі його бронювання також будуть видалені.`)) {
            try {
                await axios.delete(`http://localhost:3005/api/admin/users/${id}`);
                setUsers(users.filter(u => u.user_id !== id));
            } catch (error) {
                alert("Помилка при видаленні користувача.");
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
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
                    <button onClick={() => navigate('/admin/editor')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 transition-colors">
                        <FiMap /> Редактор карт
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
                                    ) : (
                                        users.map(u => (
                                            <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900">{u.full_name}</div>
                                                    <div className="text-xs text-gray-500">Реєстрація: {new Date(u.created_at).toLocaleDateString()}</div>
                                                </td>
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
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded transition" title="Редагувати">
                                                            <FiEdit />
                                                        </button>
                                                        <button className="p-2 text-orange-500 hover:bg-orange-50 rounded transition" title="Забанити">
                                                            <FiSlash />
                                                        </button>
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

                {/* Заглушки для інших вкладок */}
                {activeTab === 'stats' && <h2 className="text-2xl font-bold text-gray-800">Статистика (В розробці)</h2>}
                {activeTab === 'bookings' && <h2 className="text-2xl font-bold text-gray-800">Бронювання (В розробці)</h2>}
            </main>
        </div>
    );
};

export default AdminPage;