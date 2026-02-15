import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import MainPageHeader from "../assets/BiggerFish/MainPageHeader";

function MainPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeCategory, setActiveCategory] = useState('desk');
    const [selectedItem, setSelectedItem] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Перевірка авторизації при завантаженні
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        location.reload();
    };
    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--night-dark-blue)] to-[var(--night-dark-purple)] dark:[from-[var(--day-pink)] to-[var(--day-purple)]] font-sans">
            {MainPageHeader(user, setIsOpen, isOpen, navigate, setIsSettingsOpen, handleLogout)}
            
        </div>)
}


export default MainPage;




