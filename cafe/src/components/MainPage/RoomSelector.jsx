import React, { useState, useEffect } from 'react';
import { FiMap, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import axios from '../../api/axios';

export function RoomSelector({ onSelectRoom, onBack }) {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/maps')
            .then(res => { setRooms(res.data); setLoading(false); })
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-right-4">
            <button onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-purple-600 mb-4 flex items-center gap-2 transition-colors">
                <FiArrowLeft /> Назад до вибору
            </button>
            <span className="text-sm font-bold text-orange-500 tracking-wider uppercase mb-2 block">Оренда кімнати</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Оберіть приміщення</h1>
            <p className="text-gray-500 mb-8">Виберіть простір, який найкраще підходить для вашої зустрічі.</p>

            {loading ? (
                <div className="animate-pulse flex gap-4"><div className="h-32 w-full bg-gray-200 rounded-2xl"></div></div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {rooms.map(room => (
                        <div key={room.name} onClick={() => onSelectRoom(room)} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-orange-500 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                    <FiMap size={28} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900 mb-1">{room.name.replace(/_/g, ' ')}</h3>
                                    <p className="text-sm text-gray-500">Приватна кімната</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs mb-1">Базова ціна</span>
                                <span className="text-orange-600 font-bold flex items-center gap-2">від 400 ₴ / год <FiArrowRight /></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}