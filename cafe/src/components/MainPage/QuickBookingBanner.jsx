import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { FiZap, FiArrowRight } from 'react-icons/fi';

export function QuickBookingBanner({ user, onQuickBook }) {
    const [lastBooking, setLastBooking] = useState(null);

    useEffect(() => {
        if (user?.user_id || user?.id) {
            const userId = user.user_id || user.id;
            axios.get(`/api/user/${userId}/bookings`)
                .then(res => {
                    const validBookings = res.data.filter(b => b.status !== 'cancelled');
                    if (validBookings.length > 0) setLastBooking(validBookings[0]); // Беремо найсвіжіше
                }).catch(() => { });
        }
    }, [user]);

    if (!lastBooking) return null;

    return (
        <div className="bg-gradient-to-r from-[var(--night-dark-blue)] to-[var(--night-dark-purple)] rounded-3xl p-6 mb-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <FiZap size={24} className="text-yellow-300" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">З поверненням! Швидке бронювання ⚡</h3>
                    <p className="text-purple-100 text-sm">Ваше улюблене місце: <b>{lastBooking.seat_label}</b></p>
                </div>
            </div>
            <button
                onClick={() => onQuickBook(lastBooking)}
                className="w-full md:w-auto px-6 py-3 bg-white text-[var(--night-dark-blue)] font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 group"
            >
                Забронювати на завтра <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}