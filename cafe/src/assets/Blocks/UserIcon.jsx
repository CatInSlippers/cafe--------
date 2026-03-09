import { BiUser } from "react-icons/bi";

function UserIcon({ h, w, image }) {
    // Перевіряємо, чи є картинка і чи це відносний шлях. Якщо так - додаємо адресу сервера
    const imgUrl = image && image.startsWith('/uploads')
        ? `http://localhost:3005${image}`
        : image;

    if (imgUrl) {
        return <img src={imgUrl} alt="User Icon" className={`w-${w} h-${h} rounded-full object-cover border border-purple-200`} />;
    } else {
        return (
            <div className={`w-${w} h-${h} bg-purple-100 text-purple-700 rounded-full flex items-center justify-center border border-purple-200`}>
                <BiUser size={w === 24 ? 48 : 20} />
            </div>
        );
    }
}

export default UserIcon;