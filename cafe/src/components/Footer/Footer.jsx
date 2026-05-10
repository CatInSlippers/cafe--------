import React from 'react';
import { FiMapPin, FiPhone } from 'react-icons/fi';

export function Footer() {
    return (
        <footer className="bg-gray-900 text-[var(--day-purple)] py-12 mt-auto border-t border-gray-800 w-full">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 className="text-[var(--day-purple)] text-xl font-bold mb-4 tracking-wider flex items-center gap-2">
                        TimeGuard
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                        Сучасний простір для вашої продуктивності. Гнучкі робочі місця, комфортні переговорні кімнати та безперебійний інтернет для реалізації найсміливіших ідей.
                    </p>
                </div>
                <div>
                    <h4 className="text-[var(--day-purple)] font-bold mb-4 uppercase tracking-wider text-sm">Контакти</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-3 hover:text-purple-400 transition">
                            <FiMapPin className="mt-1 text-[var(--night-dark-blue)] shrink-0" />
                            <span>вул. Незалежності, 42<br />м. Івано-Франківськ, 76000</span>
                        </li>
                        <li className="flex items-center gap-3 hover:text-purple-400 transition">
                            <FiPhone className="text-[var(--night-dark-blue)] shrink-0" />
                            <span>+38 (050) 123-45-67</span>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-[var(--day-purple)] font-bold mb-4 uppercase tracking-wider text-sm">Графік роботи</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between border-b border-gray-800 pb-2">
                            <span>Пн - Пт</span><span className="font-medium text-[var(--day-purple)]">08:00 - 22:00</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Сб - Нд</span><span className="font-medium text-purple-400">10:00 - 20:00</span>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}