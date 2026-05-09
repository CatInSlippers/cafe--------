import { useState } from 'react';
import { HiOutlineMail } from 'react-icons/hi';
import { BiUser, BiLockAlt, BiPhone } from 'react-icons/bi';
import InputField from '../Blocks/InputField';
import PasswordToggleInput from '../Blocks/PasswordToggleInput';
import axios from 'axios';

export default function Right({ type }) {
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        password: '',
        phone: '',
        createdAt: new Date().toISOString(),
        role: 'client',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (type === 'register') {
            try {
                const response = await axios.post('http://localhost:3005/register', formData);

                alert(`Успіх! Користувач ${response.data.user.name} створений.`);
                console.log(response.data);
                window.location.href = '/login';

            } catch (error) {
                if (error.response) {
                    alert("Помилка: " + error.response.data.error);
                } else {
                    alert("Помилка з'єднання з сервером");
                }
                console.error(error);
            }
        }
        else if (type === 'login') {
            try {
                const response = await axios.post('http://localhost:3005/login', formData);

                const token = response.data.token;
                const userData = response.data.user;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));

                alert(`Вітаємо, ${userData.name}! Ви успішно увійшли.`);
                console.log("Logged in user:", userData);
                window.location.href = '/';

            } catch (error) {
                if (error.response) {
                    alert("Помилка входу: " + error.response.data.error);
                } else {
                    alert("Помилка з'єднання з сервером");
                }
            }
        }
    }

    if (type === 'register') {
        return (
            <div className="w-full md:w-7/12 p-8 md:p-8 bg-white dark:bg-black md:rounded-r-[2.5rem]">
                <h3 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-300">Створіть акаунт</h3>

                {/* Поля форми (використовуємо наш компонент InputField) */}
                <form onSubmit={handleSubmit}>
                    <InputField
                        type="email"
                        name="email"
                        placeholder="Імейл"
                        icon={HiOutlineMail}
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <InputField
                        type="text"
                        name="full_name"
                        placeholder="ПІБ (Ім'я користувача)"
                        icon={BiUser}
                        value={formData.full_name}
                        onChange={handleChange}
                    />

                    <InputField
                        type="text"
                        name="phone"
                        placeholder="Телефон"
                        icon={BiPhone}
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <PasswordToggleInput
                        name='password'
                        placeholder='Пароль'
                        value={formData.password}
                        onChange={handleChange}
                        icon={BiLockAlt}
                    />

                    <button
                        type="submit"
                        className="w-full mb-3 py-3 bg-gradient-to-r from-[var(--day-pink)] to-[var(--day-purple)] dark:from-[var(--night-dark-blue)] dark:to-[var(--night-dark-purple)] text-white font-bold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Створити аккаунт
                    </button>

                    <div className="text-center text-sm text-gray-500 mt-2">
                        Якщо ви вже маєте акаунт, <a href="/login" className="text-blue-400 font-semibold hover:underline">натисніть сюди.</a>
                    </div>
                </form>
            </div>
        )
    }
    else if (type === 'login') {
        return (
            <div className="w-full md:w-7/12 p-8 md:p-8 bg-white dark:bg-black md:rounded-r-[2.5rem] flex flex-col justify-center">
                <h3 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-300">Вхід в акаунт</h3>

                <form onSubmit={handleSubmit}>
                    <InputField
                        type="email"
                        name="email"
                        placeholder="Імейл"
                        icon={HiOutlineMail}
                        value={formData.email}
                        onChange={handleChange}
                    />


                    <PasswordToggleInput
                        name='password'
                        placeholder='Пароль'
                        value={formData.password}
                        onChange={handleChange}
                        icon={BiLockAlt}
                    />

                    {/* Посилання "Забули пароль?" */}
                    <div className="flex justify-end mb-4">
                        <a href="/forgot-password" className="text-sm text-[var(--day-purple)] hover:text-[var(--day-pink)] font-semibold">
                            Забули пароль?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="w-full mb-3 py-3 bg-gradient-to-r from-[var(--day-pink)] to-[var(--day-purple)] dark:from-[var(--night-dark-blue)] dark:to-[var(--night-dark-purple)] text-white font-bold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Увійти
                    </button>

                    <div className="text-center text-sm text-gray-500 mt-2">
                        Ще не маєте акаунту? <a href="/register" className="text-blue-400 font-semibold hover:underline">Зареєструватися</a>
                    </div>
                </form>
            </div>
        )
    }
}