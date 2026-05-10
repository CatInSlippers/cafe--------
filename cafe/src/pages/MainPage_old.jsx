// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from 'react-router-dom';
// import MainPageHeader from "../assets/BiggerFish/MainPageHeader";
// import { FiCheckCircle, FiPhone, FiCircle, FiMapPin, FiCalendar, FiUser, FiUsers, FiCoffee, FiMonitor, FiBriefcase, FiClock } from "react-icons/fi";
// import axios from '../api/axios';
// import { Footer } from "../components/Footer/Footer";
// import { toast } from 'react-toastify';

// // 1. Словник типів місць (відповідає типам фігур на карті)
// const SPACE_TYPES = [
//     { id: 'desk', title: 'Робоче місце (Стіл)', icon: <FiUser className="text-2xl" />, description: 'Індивідуальне робоче місце. Доступ до розетки та швидкісного Wi-Fi.', basePrice: 50 },
//     { id: 'meeting_table', title: 'Переговорний стіл', icon: <FiUsers className="text-2xl" />, description: 'Простір для команди. Ідеально для мітів та колаборацій.', basePrice: 200 },
//     { id: 'round_table', title: 'Круглий стіл', icon: <FiCircle className="text-2xl" />, description: 'Стіл для обговорень та брейнштормів (до 4 осіб).', basePrice: 150 },
//     { id: 'sofa', title: 'Лаунж зона (Диван)', icon: <FiCoffee className="text-2xl" />, description: 'М\'яка зона для комфортної та розслабленої роботи.', basePrice: 80 },
// ];

// // 2. Додаткові послуги
// const EXTRA_SERVICES = [
//     { id: 'monitor', label: 'Додатковий монітор 27"', price: 50, icon: <FiMonitor /> },
//     { id: 'coffee', label: 'Безлімітна кава/чай', price: 100, icon: <FiCoffee /> },
//     { id: 'locker', label: 'Шафка для речей', price: 30, icon: <FiBriefcase /> }
// ];

// function MainPage() {
//     const navigate = useNavigate();
//     const location = useLocation();

//     // Стейт користувача
//     const [user, setUser] = useState(null);
//     const [isOpen, setIsOpen] = useState(false);
//     const [isSettingsOpen, setIsSettingsOpen] = useState(false);

//     // --- СТЕЙТИ БРОНЮВАННЯ ---
//     // Якщо ми повернулися з карти, тут буде об'єкт обраного місця
//     const [selectedSeat, setSelectedSeat] = useState(location.state?.selectedSeat || null);

//     // Вибір категорії
//     const [selectedCategory, setSelectedCategory] = useState(SPACE_TYPES[0]);

//     // Налаштування часу та послуг
//     const [date, setDate] = useState(location.state?.date || new Date().toISOString().split('T')[0]);
//     const [startTime, setStartTime] = useState(location.state?.startTime || '10:00');
//     const [hours, setHours] = useState(location.state?.hours || 1);
//     const [selectedExtras, setSelectedExtras] = useState([]);

//     const [selectedRoom, setSelectedRoom] = useState(location.state?.room || '');


//     useEffect(() => {
//         const loadUser = async () => {
//             const storedUserStr = localStorage.getItem('user');
//             if (storedUserStr) {
//                 const storedUser = JSON.parse(storedUserStr);
//                 setUser(storedUser);
//                 const userId = storedUser.user_id || storedUser.id;
//                 if (userId) {
//                     try {
//                         const response = await axios.get(`http://localhost:3005/api/user/${userId}`);
//                         const freshUserData = { ...storedUser, ...response.data };
//                         setUser(freshUserData);
//                         localStorage.setItem('user', JSON.stringify(freshUserData));
//                     } catch (error) { console.error("Помилка оновлення даних:", error); }
//                 }
//             }
//         };
//         loadUser();
//         window.addEventListener("userUpdated", loadUser);
//         return () => window.removeEventListener("userUpdated", loadUser);
//     }, []);

//     const handleLogout = () => {
//         localStorage.removeItem('user');
//         window.location.reload();
//     };

//     const toggleExtra = (id) => {
//         setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
//     };

//     const handleGoToMap = () => {
//         navigate('/book-map', { state: { category: selectedCategory.id } });
//     };

//     const handleCancelSeat = () => {
//         setSelectedSeat(null);
//         navigate('/', { replace: true, state: {} }); // Очищаємо стейт роутера
//     };

//     const handleConfirmBooking = async () => {
//         if (!user) {
//             toast.warning("Будь ласка, увійдіть в акаунт, щоб забронювати місце.");
//             navigate('/login');
//             return;
//         }

//         try {
//             const userId = user.user_id || user.id;

//             // Збираємо назви обраних додаткових послуг
//             const extrasLabels = selectedExtras.map(extId =>
//                 EXTRA_SERVICES.find(e => e.id === extId).label
//             );

//             const seatLabelRaw = selectedSeat ? (selectedSeat.label || selectedSeat.type) : selectedCategory.title;
//             const finalSeatLabel = selectedRoom ? `${seatLabelRaw} (${selectedRoom})` : seatLabelRaw;

//             const bookingData = {
//                 user_id: userId,
//                 seat_id: selectedSeat ? selectedSeat.id : selectedCategory.id,
//                 seat_label: finalSeatLabel,
//                 booking_date: date,
//                 start_time: startTime,
//                 duration_hours: hours,
//                 total_price: totalAmount,
//                 extras: extrasLabels
//             };

//             const response = await axios.post('http://localhost:3005/api/bookings', bookingData);

//             if (response.status === 201) {
//                 toast.success(`Бронювання успішне!`);
//                 navigate('/user-page');
//             }
//         } catch (error) {
//             console.error("Помилка при бронюванні:", error);

//             // Якщо сервер повернув нашу конкретну помилку (наприклад, про зайнятий стіл)
//             if (error.response && error.response.data && error.response.data.error) {
//                 toast.error(error.response.data.error);
//             } else {
//                 // Якщо сервер впав або немає зв'язку
//                 toast.error("Не вдалося створити бронювання. Спробуйте ще раз.");
//             }
//         }
//     };

//     // Розрахунки
//     const basePrice = selectedSeat
//         ? SPACE_TYPES.find(t => t.id === selectedSeat.type)?.basePrice || 50
//         : selectedCategory.basePrice;

//     const extrasTotal = selectedExtras.reduce((sum, extId) => sum + EXTRA_SERVICES.find(e => e.id === extId).price, 0);
//     const totalAmount = (basePrice * hours) + extrasTotal;

//     return (
//         <div className="min-h-screen bg-[var(--day-pink)] dark:bg-[var(--night-dark-purple)] font-sans flex flex-col">
//             <MainPageHeader
//                 user={user} setIsOpen={setIsOpen} setUser={setUser} isOpen={isOpen} navigate={navigate}
//                 isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} handleLogout={handleLogout}
//             />

//             <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//                 <div className="flex flex-col lg:flex-row gap-8">

//                     {/* ЛІВА КОЛОНКА: ДИНАМІЧНА (Залежить від того, чи обрано місце) */}
//                     <div className="flex-1">
//                         {!selectedSeat ? (
//                             /* КРОК 1: ВИБІР КАТЕГОРІЇ */
//                             <div className="animate-in fade-in slide-in-from-bottom-4">
//                                 <span className="text-sm font-bold text-purple-600 tracking-wider uppercase mb-2 block">Крок 1 з 3</span>
//                                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Що вам потрібно сьогодні?</h1>
//                                 <p className="text-gray-500 mb-8">Оберіть тип простору, а потім знайдіть ідеальне місце на карті.</p>

//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     {SPACE_TYPES.map(type => (
//                                         <div
//                                             key={type.id}
//                                             onClick={() => setSelectedCategory(type)}
//                                             className={`p-6 rounded-2xl cursor-pointer transition-all border-2 ${selectedCategory.id === type.id ? 'border-[var(--night-dark-blue)] bg-purple-50 shadow-md transform scale-[1.02]' : 'border-transparent bg-white shadow-sm hover:shadow-md'}`}
//                                         >
//                                             <div className="flex justify-between items-start mb-4">
//                                                 <div className={`p-3 rounded-xl ${selectedCategory.id === type.id ? 'bg-[var(--night-dark-blue)] text-white' : 'bg-gray-100 text-gray-600'}`}>
//                                                     {type.icon}
//                                                 </div>
//                                                 <div className={`text-2xl ${selectedCategory.id === type.id ? 'text-[var(--night-dark-blue)]' : 'text-gray-300'}`}>
//                                                     {selectedCategory.id === type.id ? <FiCheckCircle /> : <FiCircle />}
//                                                 </div>
//                                             </div>
//                                             <h3 className="font-bold text-lg text-gray-900 mb-1">{type.title}</h3>
//                                             <p className="text-sm text-gray-500 mb-4">{type.description}</p>
//                                             <div className="font-bold text-gray-900 bg-white inline-block px-3 py-1 rounded-full text-sm border">
//                                                 від {type.basePrice} ₴ / год
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         ) : (
//                             /* КРОК 3: НАЛАШТУВАННЯ ЧАСУ ТА ПОСЛУГ */
//                             <div className="animate-in fade-in slide-in-from-bottom-4">
//                                 <span className="text-sm font-bold text-green-600 tracking-wider uppercase mb-2 block">Крок 3 з 3</span>
//                                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Налаштуйте бронювання</h1>
//                                 <p className="text-gray-500 mb-8">Ви обрали <b className="text-gray-900">{selectedSeat.label || 'місце'}</b>. Вкажіть час та додаткові побажання.</p>

//                                 {/* Вибір дати та часу */}
//                                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
//                                     <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FiClock /> Коли вас чекати?</h3>
//                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-500 mb-1">Дата</label>
//                                             <input
//                                                 type="date"
//                                                 value={date}
//                                                 min={new Date().toISOString().split('T')[0]}
//                                                 onChange={(e) => setDate(e.target.value)}
//                                                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
//                                             />
//                                         </div>

//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-500 mb-1">Час початку</label>
//                                             <input
//                                                 type="time"
//                                                 value={startTime}
//                                                 onChange={(e) => setStartTime(e.target.value)}
//                                                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
//                                             />
//                                         </div>

//                                         <div>
//                                             <label className="block text-sm font-medium text-gray-500 mb-1">Кількість годин</label>
//                                             <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-1">
//                                                 <button onClick={() => setHours(Math.max(1, hours - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600">-</button>
//                                                 <span className="flex-1 text-center font-bold">{hours} год.</span>
//                                                 <button onClick={() => setHours(Math.min(12, hours + 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-600">+</button>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Додаткові послуги */}
//                                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
//                                     <h3 className="font-bold text-gray-900 mb-4">Додати до бронювання</h3>
//                                     <div className="space-y-3">
//                                         {EXTRA_SERVICES.map(extra => (
//                                             <label key={extra.id} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${selectedExtras.includes(extra.id) ? 'border-[var(--night-dark-blue)] bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
//                                                 <div className="flex items-center gap-3">
//                                                     <input
//                                                         type="checkbox"
//                                                         checked={selectedExtras.includes(extra.id)}
//                                                         onChange={() => toggleExtra(extra.id)}
//                                                         className="w-5 h-5 text-purple-600 rounded cursor-pointer"
//                                                     />
//                                                     <div className="flex items-center gap-2 text-gray-700 font-medium">
//                                                         <span className="text-gray-400">{extra.icon}</span> {extra.label}
//                                                     </div>
//                                                 </div>
//                                                 <span className="font-bold text-gray-900">+{extra.price} ₴</span>
//                                             </label>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     {/* ПРАВА КОЛОНКА: САЙДБАР З ПІДСУМКАМИ */}
//                     <div className="lg:w-96">
//                         <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
//                             <h2 className="text-xl font-bold text-gray-800 mb-6">Ваше бронювання</h2>

//                             {!selectedSeat ? (
//                                 /* САЙДБАР КРОКУ 1 */
//                                 <>
//                                     <div className="bg-gray-50 p-4 rounded-xl mb-6">
//                                         <div className="flex items-center gap-3 mb-2">
//                                             <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">{selectedCategory.icon}</div>
//                                             <h3 className="font-bold text-gray-900">{selectedCategory.title}</h3>
//                                         </div>
//                                         <p className="text-sm text-gray-500">{selectedCategory.description}</p>
//                                     </div>
//                                     <button
//                                         onClick={handleGoToMap}
//                                         className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors shadow-lg shadow-purple-200"
//                                     >
//                                         Обрати на карті ➔
//                                     </button>
//                                 </>
//                             ) : (
//                                 /* САЙДБАР КРОКУ 3 */
//                                 <>
//                                     <div className="mb-6 space-y-4">
//                                         <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
//                                             <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
//                                                 <div className="flex items-center gap-2 text-gray-600">
//                                                     <FiMapPin className="text-[var(--night-dark-blue)]" />
//                                                     <span>Обране місце</span>
//                                                 </div>
//                                                 <div className="text-right">
//                                                     <div className="font-bold text-gray-900">{selectedSeat.label || 'Робоче місце'}</div>
//                                                     {selectedRoom && <div className="text-xs text-gray-500">{selectedRoom.replace(/_/g, ' ')}</div>}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
//                                             <div className="flex items-center gap-2 text-gray-600">
//                                                 <FiCalendar className="text-[var(--night-dark-blue)]" /> Дата
//                                             </div>
//                                             <span className="font-bold text-gray-900">{new Date(date).toLocaleDateString('uk-UA')}</span>
//                                         </div>
//                                     </div>

//                                     <div className="border-t border-gray-100 pt-4 mb-6 space-y-2 text-sm text-gray-600">
//                                         <div className="flex justify-between">
//                                             <span>Оренда ({hours} год. × {basePrice} ₴)</span>
//                                             <span className="font-medium">{basePrice * hours} ₴</span>
//                                         </div>
//                                         {selectedExtras.map(extId => {
//                                             const ext = EXTRA_SERVICES.find(e => e.id === extId);
//                                             return (
//                                                 <div key={ext.id} className="flex justify-between text-gray-500">
//                                                     <span>{ext.label}</span>
//                                                     <span>{ext.price} ₴</span>
//                                                 </div>
//                                             )
//                                         })}
//                                     </div>

//                                     <div className="border-t border-gray-200 pt-4 mb-6">
//                                         <div className="flex justify-between text-xl font-black text-gray-900">
//                                             <span>Всього</span>
//                                             <span className="text-purple-600">{totalAmount} ₴</span>
//                                         </div>
//                                     </div>

//                                     <div className="space-y-3">
//                                         <button
//                                             onClick={handleConfirmBooking}
//                                             className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-200"
//                                         >
//                                             Оплатити та забронювати
//                                         </button>
//                                         <button
//                                             onClick={handleCancelSeat}
//                                             className="w-full py-3 bg-white text-gray-500 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
//                                         >
//                                             Змінити місце
//                                         </button>
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </main>
//             <Footer />
//         </div>

//     );

// }


// export default MainPage;