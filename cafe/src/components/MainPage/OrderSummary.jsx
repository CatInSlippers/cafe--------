// src/components/MainPage/OrderSummary.jsx
import React from 'react';
import { FiMapPin, FiCalendar } from 'react-icons/fi';

export function OrderSummary({
    selectedSeat, selectedCategory, selectedRoom,
    date, hours, basePrice, totalAmount,
    selectedExtras, EXTRA_SERVICES,
    handleGoToMap, handleConfirmBooking, handleCancelSeat
}) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Ваше бронювання</h2>

            {!selectedSeat ? (
                <>
                    <div className="bg-gray-50 p-4 rounded-xl mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 text-[var(--night-dark-blue)] rounded-lg">{selectedCategory.icon}</div>
                            <h3 className="font-bold text-gray-900">{selectedCategory.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500">{selectedCategory.description}</p>
                    </div>
                    <button onClick={handleGoToMap} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-[var(--night-dark-blue)] transition-colors shadow-lg shadow-blue-200">
                        Обрати на карті ➔
                    </button>
                </>
            ) : (
                <>
                    <div className="mb-6 space-y-4">
                        {/* ПОФІКШЕНО БАГ ТУТ: Прибрано зайвий div */}
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-600">
                                <FiMapPin className="text-[var(--night-dark-blue)]" />
                                <span>Обране місце</span>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">{selectedSeat.label || 'Робоче місце'}</div>
                                {selectedRoom && <div className="text-xs text-gray-500">{selectedRoom.replace(/_/g, ' ')}</div>}
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-600">
                                <FiCalendar className="text-[var(--night-dark-blue)]" /> Дата
                            </div>
                            <span className="font-bold text-gray-900">{new Date(date).toLocaleDateString('uk-UA')}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mb-6 space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Оренда ({hours} год. × {basePrice} ₴)</span>
                            <span className="font-medium">{basePrice * hours} ₴</span>
                        </div>
                        {selectedExtras.map(extId => {
                            const ext = EXTRA_SERVICES.find(e => e.id === extId);
                            return (
                                <div key={ext.id} className="flex justify-between text-gray-500">
                                    <span>{ext.label}</span>
                                    <span>{ext.price} ₴</span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-6">
                        <div className="flex justify-between text-xl font-black text-gray-900">
                            <span>Всього</span>
                            <span className="text-[var(--night-dark-blue)]">{totalAmount} ₴</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button onClick={handleConfirmBooking} className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-200">
                            Оплатити та забронювати
                        </button>
                        <button onClick={handleCancelSeat} className="w-full py-3 bg-white text-gray-500 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                            Змінити місце
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}