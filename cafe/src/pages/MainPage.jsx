import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Logo } from "../assets/Blocks/Logo";
import { SearchBar } from "../assets/Blocks/SearchBar";
import { Greeting } from "../assets/Blocks/Greeting";

function MainPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

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
            <header className="bg-white dark:bg-black shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Logo />
                    <SearchBar
                        placeholder="Пошук послуги або місця..."
                    />
                    {user
                        ?
                        <Greeting />

                        :
                        <button onClick={() => navigate('/login')} className="text-sm font-bold text-[#D1CCF4] hover:underline">Увійти</button>

                    }
                    {/* <UserIconMainPage /> */}
                </div>
            </header>
        </div>)
}




export default MainPage;