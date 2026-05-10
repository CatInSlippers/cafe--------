// src/components/MainPage/ServiceCard.jsx
import React from 'react';
import { FiCheckCircle, FiCircle } from 'react-icons/fi';

export function ServiceCard({ type, isSelected, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`p-6 rounded-2xl cursor-pointer transition-all border-2 
                ${isSelected ? 'border-[var(--night-dark-blue)] bg-purple-50 shadow-md transform scale-[1.02]' 
                    : 'border-transparent bg-white shadow-sm hover:shadow-md'}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${isSelected ? 'bg-[var(--night-dark-blue)] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {type.icon}
                </div>
                <div className={`text-2xl ${isSelected ? 'text-[var(--night-dark-blue)]' : 'text-gray-300'}`}>
                    {isSelected ? <FiCheckCircle /> : <FiCircle />}
                </div>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">{type.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{type.description}</p>
            <div className="font-bold text-gray-900 bg-white inline-block px-3 py-1 rounded-full text-sm border">
                від {type.basePrice} ₴ / год
            </div>
        </div>
    );
}