// src/components/MainPage/BookingConfigurator.jsx
import React from 'react';
import { FiClock } from 'react-icons/fi';


export function BookingConfigurator({
    date, setDate, startTime, setStartTime,
    hours, setHours, extraChairs, setExtraChairs,
    selectedExtras, toggleExtra, EXTRA_SERVICES, selectedSeat
}) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <span className="text-sm font-bold text-green-600 tracking-wider uppercase mb-2 block">Крок 3 з 3</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Налаштуйте бронювання</h1>
            <p className="text-gray-500 mb-8">Ви обрали <b className="text-gray-900">{selectedSeat.label || 'місце'}</b>. Вкажіть час та додаткові побажання.</p>

            {/* Вибір дати та часу */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FiClock /> Коли вас чекати?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Дата</label>
                        <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Час початку</label>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Кількість годин</label>
                        <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-1">
                            <button onClick={() => setHours(Math.max(1, hours - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600">-</button>
                            <span className="flex-1 text-center font-bold">{hours} год.</span>
                            <button onClick={() => setHours(Math.min(12, hours + 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600">+</button>
                        </div>
                    </div>
                    {/* Лічильник крісел */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Додаткові крісла</label>
                        <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-1">
                            <button onClick={() => setExtraChairs(Math.max(0, extraChairs - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600">-</button>
                            <span className="flex-1 text-center font-bold">{extraChairs}</span>
                            <button onClick={() => setExtraChairs(extraChairs + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600">+</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Додаткові послуги */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Додати до бронювання</h3>
                <div className="space-y-3">
                    {EXTRA_SERVICES.map(extra => (
                        <label key={extra.id} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${selectedExtras.includes(extra.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={selectedExtras.includes(extra.id)} onChange={() => toggleExtra(extra.id)} className="w-5 h-5 text-purple-600 rounded cursor-pointer" />
                                <div className="flex items-center gap-2 text-gray-700 font-medium">
                                    <span className="text-gray-400">{extra.icon}</span> {extra.label}
                                </div>
                            </div>
                            <span className="font-bold text-gray-900">+{extra.price} ₴</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}