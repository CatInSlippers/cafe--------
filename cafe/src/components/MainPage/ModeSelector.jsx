import React from 'react';
import { FiMonitor, FiLayout } from 'react-icons/fi';

export function ModeSelector({ setBookingMode }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <span className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-2 block">Початок</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Як ви плануєте працювати?</h1>
            <p className="text-gray-500 mb-8">Оберіть оренду окремого робочого місця або бронювання цілої кімнати для команди.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Картка 1: Стіл */}
                <div onClick={() => setBookingMode('seat')} className="bg-white p-8 rounded-3xl border-2 border-transparent hover:border-purple-500 shadow-sm hover:shadow-md cursor-pointer transition-all group">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FiMonitor size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Робоче місце</h2>
                    <p className="text-gray-500">Індивідуальні столи, лаунж-зони та місця для невеликих мітів у загальному просторі.</p>
                </div>

                {/* Картка 2: Кімната */}
                <div onClick={() => setBookingMode('room')} className="bg-white p-8 rounded-3xl border-2 border-transparent hover:border-orange-500 shadow-sm hover:shadow-md cursor-pointer transition-all group">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FiLayout size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Окрема кімната</h2>
                    <p className="text-gray-500">Закриті переговорні та VIP-кімнати для повної приватності вашої команди.</p>
                </div>
            </div>
        </div>
    );
}