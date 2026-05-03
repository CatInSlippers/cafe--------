import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import UserPage from './pages/UserPage.jsx';
import AdminEditor from './pages/AdminRoomEditor.jsx'
import RoomMapClient from './pages/RoomMapClient.jsx'; // Створимо цей файл нижче



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/user-page" element={<UserPage />} />
        <Route path="/book-map" element={<RoomMapClient />} />
        <Route
          path="/admin/editor"
          element={
              <AdminEditor />
          }
        />
        <Route path="/" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;