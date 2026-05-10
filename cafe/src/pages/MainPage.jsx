import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { FiUser, FiUsers, FiCircle, FiCoffee, FiMonitor, FiBriefcase, FiArrowLeft } from "react-icons/fi";

// Імпорт компонентів
import MainPageHeader from "../assets/BiggerFish/MainPageHeader";
import { Footer } from "../components/Footer/Footer";
import { ServiceCard } from "../components/MainPage/ServiceCard";
import { BookingConfigurator } from "../components/MainPage/BookingConfigurator";
import { OrderSummary } from "../components/MainPage/OrderSummary";

// НОВІ КОМПОНЕНТИ
import { ModeSelector } from "../components/MainPage/ModeSelector";
import { RoomSelector } from "../components/MainPage/RoomSelector";
import { QuickBookingBanner } from "../components/MainPage/QuickBookingBanner";

const SPACE_TYPES = [
    { id: 'desk', title: 'Робоче місце (Стіл)', icon: <FiUser className="text-2xl" />, description: 'Індивідуальне робоче місце. Доступ до розетки.', basePrice: 50 },
    { id: 'meeting_table', title: 'Переговорний стіл', icon: <FiUsers className="text-2xl" />, description: 'Простір для команди.', basePrice: 200 },
    { id: 'round_table', title: 'Круглий стіл', icon: <FiCircle className="text-2xl" />, description: 'Стіл для обговорень (до 4 осіб).', basePrice: 150 },
    { id: 'sofa', title: 'Лаунж зона (Диван)', icon: <FiCoffee className="text-2xl" />, description: 'М\'яка зона для комфортної роботи.', basePrice: 80 }
];

const EXTRA_SERVICES = [
    { id: 'monitor', label: 'Додатковий монітор 27"', price: 50, icon: <FiMonitor /> },
    { id: 'coffee', label: 'Безлімітна кава/чай', price: 100, icon: <FiCoffee /> },
    { id: 'locker', label: 'Шафка для речей', price: 30, icon: <FiBriefcase /> }
];

function MainPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [bookingMode, setBookingMode] = useState(
        location.state?.mode || (location.state?.selectedSeat ? 'seat' : null)
    );

    const [selectedSeat, setSelectedSeat] = useState(location.state?.selectedSeat || null);
    const [selectedCategory, setSelectedCategory] = useState(SPACE_TYPES[0]);
    const [date, setDate] = useState(location.state?.date || new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(location.state?.startTime || '10:00');
    const [hours, setHours] = useState(location.state?.hours || 1);
    const [extraChairs, setExtraChairs] = useState(0);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(location.state?.room || '');

    useEffect(() => {
        const loadUser = async () => {
            const storedUserStr = localStorage.getItem('user');
            if (storedUserStr) {
                const storedUser = JSON.parse(storedUserStr);
                setUser(storedUser);
                if (storedUser.user_id || storedUser.id) {
                    try {
                        const response = await axios.get(`/api/user/${storedUser.user_id || storedUser.id}`);
                        const freshUserData = { ...storedUser, ...response.data };
                        setUser(freshUserData);
                        localStorage.setItem('user', JSON.stringify(freshUserData));
                    } catch (error) { console.error(error); }
                }
            }
        };
        loadUser();
        window.addEventListener("userUpdated", loadUser);
        return () => window.removeEventListener("userUpdated", loadUser);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.reload();
    };


    const handleResetToHome = () => {
        setBookingMode(null);
        setSelectedSeat(null);
        setSelectedRoom('');
        navigate('/', { replace: true, state: {} });
    };

    const toggleExtra = (id) => setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

    // Перехід на карту для стола
    const handleGoToMap = () => navigate('/book-map', { state: { category: selectedCategory.id, mode: 'seat' } });

    // Вибір всієї кімнати
    const handleRoomSelect = (room) => {
        setSelectedRoom(room.name);
        setSelectedSeat({
            id: `room_${room.name}`,
            type: 'private_room',
            label: `Кімната: ${room.name.replace(/_/g, ' ')}`,
            basePrice: 400 // Базова ціна оренди кімнати
        });
    };

    // Логіка швидкого бронювання
    const handleQuickBook = (pastBooking) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split('T')[0]);
        setStartTime(pastBooking.start_time.slice(0, 5));
        setHours(pastBooking.duration_hours);

        setSelectedRoom(pastBooking.seat_label.includes('(') ? pastBooking.seat_label.split('(')[1].replace(')', '').trim() : '');
        setSelectedSeat({
            id: pastBooking.seat_id,
            label: pastBooking.seat_label.split('(')[0].trim(),
            type: 'desk',
            basePrice: pastBooking.total_price / pastBooking.duration_hours // Приблизно
        });
        setBookingMode('seat');
    };

    const handleConfirmBooking = async () => {
        if (!user) { toast.warning("Будь ласка, увійдіть в акаунт."); navigate('/login'); return; }
        try {
            const userId = user.user_id || user.id;
            const extrasLabels = selectedExtras.map(extId => EXTRA_SERVICES.find(e => e.id === extId).label);
            const seatLabelRaw = selectedSeat ? (selectedSeat.label || selectedSeat.type) : selectedCategory.title;
            const finalSeatLabel = (selectedRoom && !seatLabelRaw.includes('Кімната')) ? `${seatLabelRaw} (${selectedRoom})` : seatLabelRaw;

            const bookingData = {
                user_id: userId,
                seat_id: selectedSeat ? selectedSeat.id : selectedCategory.id,
                seat_label: finalSeatLabel,
                booking_date: date, start_time: startTime, duration_hours: hours,
                total_price: totalAmount, extras: extrasLabels, extra_chairs: extraChairs
            };
            await axios.post('/api/bookings', bookingData);
            toast.success(`Бронювання успішне!`);
            navigate('/user-page');
        } catch (error) { toast.error(error.response?.data?.error || "Помилка бронювання."); }
    };

    const basePrice = selectedSeat ? (selectedSeat.basePrice || SPACE_TYPES.find(t => t.id === selectedSeat.type)?.basePrice || 50) : selectedCategory.basePrice;
    const extrasTotal = selectedExtras.reduce((sum, extId) => sum + EXTRA_SERVICES.find(e => e.id === extId).price, 0);
    const totalAmount = (basePrice * hours) + extrasTotal;

    return (
        <div className="min-h-screen bg-[var(--day-pink)] dark:bg-[var(--night-dark-purple)] font-sans flex flex-col">
            {/* Обов'язково додай onClick на логотип всередині MainPageHeader! */}

            <MainPageHeader
                user={user} setIsOpen={setIsOpen} setUser={setUser} isOpen={isOpen} navigate={navigate}
                isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} handleLogout={handleLogout}
                handleResetToHome={handleResetToHome}
            />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Показуємо плашку тільки на початковому екрані */}
                {!selectedSeat && bookingMode === null && user && (
                    <QuickBookingBanner user={user} onQuickBook={handleQuickBook} />
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* ЛІВА КОЛОНКА */}
                    <div className="flex-1">
                        {!selectedSeat ? (
                            <>
                                {bookingMode === null && <ModeSelector setBookingMode={setBookingMode} />}

                                {bookingMode === 'room' && <RoomSelector onSelectRoom={handleRoomSelect} onBack={() => setBookingMode(null)} />}

                                {bookingMode === 'seat' && (
                                    <div className="animate-in fade-in slide-in-from-right-4">
                                        <button onClick={() => setBookingMode(null)} className="text-sm font-bold text-gray-500 hover:text-purple-600 mb-4 flex items-center gap-2">
                                            <FiArrowLeft /> Назад до вибору
                                        </button>
                                        <span className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-2 block">Крок 1 з 3</span>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Оберіть тип місця</h1>
                                        <p className="text-gray-500 mb-8">Оберіть тип простору, а потім знайдіть ідеальне місце на карті.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {SPACE_TYPES.map(type => (
                                                <ServiceCard
                                                    key={type.id} type={type}
                                                    isSelected={selectedCategory.id === type.id}
                                                    onClick={() => setSelectedCategory(type)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <BookingConfigurator
                                date={date} setDate={setDate} startTime={startTime} setStartTime={setStartTime}
                                hours={hours} setHours={setHours} extraChairs={extraChairs} setExtraChairs={setExtraChairs}
                                selectedExtras={selectedExtras} toggleExtra={toggleExtra} EXTRA_SERVICES={EXTRA_SERVICES}
                                selectedSeat={selectedSeat}
                            />
                        )}
                    </div>

                    {/* ПРАВА КОЛОНКА */}
                    {bookingMode !== null && (
                        <div className="lg:w-96 animate-in slide-in-from-right-8 fade-in">
                            <OrderSummary
                                selectedSeat={selectedSeat} selectedCategory={selectedCategory} selectedRoom={selectedRoom}
                                date={date} hours={hours} basePrice={basePrice} totalAmount={totalAmount}
                                selectedExtras={selectedExtras} EXTRA_SERVICES={EXTRA_SERVICES}
                                handleGoToMap={handleGoToMap} handleConfirmBooking={handleConfirmBooking} handleCancelSeat={handleResetToHome}
                            />
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default MainPage;