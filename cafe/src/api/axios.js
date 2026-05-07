import axios from 'axios';

// Створюємо базовий екземпляр axios
const apiClient = axios.create({
    baseURL: 'http://localhost:3005'
});

// Додаємо "перехоплювач" (interceptor)
// Він автоматично додаватиме токен до КОЖНОГО запиту
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Беремо токен з пам'яті
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;