import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import UserPage from './pages/UserPage.jsx';
import AdminEditor from './pages/AdminRoomEditor.jsx'
import RoomMapClient from './pages/RoomMapClient.jsx';
import AdminPage from './pages/AdminPage.jsx';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div className="font-sans text-gray-900 antialiased">
      {/* контейнер на рівні всього додатку */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/user-page" element={<UserPage />} />
          <Route path="/book-map" element={<RoomMapClient />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/editor/:roomName" element={<AdminEditor />} />
          <Route path="/" element={<MainPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;