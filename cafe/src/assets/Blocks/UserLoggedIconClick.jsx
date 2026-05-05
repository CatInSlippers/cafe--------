import { BiUser, BiLogOut } from "react-icons/bi";
import { IoSettingsOutline } from "react-icons/io5";
import { ListItem } from "./ListItem";
import UserIcon from "./UserIcon";
import SettingsModal from "../BiggerFish/SettingsPage";

function UserLoggedIconClick({ setUser, user, setIsOpen, isOpen, navigate, isSettingsOpen, setIsSettingsOpen, handleLogout }) {
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm font-bold text-[var(--day-purple)] dark:text-[var(--night-dark-blue)] hover:underline focus:outline-none"
            >
                <UserIcon h={8} w={8} image={user?.avatar} />
            </button>

            {isOpen && (
                <nav className="text-sm font-bold text-[var(--day-purple)] dark:text-[var(--night-dark-blue)]">
                    <ul className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 w-48 py-2 z-50 dark:border-gray-700">
                        <ListItem
                            onClick={() => {
                                navigate("/user-page");
                                setIsOpen(false);
                            }}
                            style="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 flex items-center justify-between"
                            text="Профіль"
                            icon={<BiUser />}
                        />
                        <ListItem
                            onClick={() => {
                                setIsSettingsOpen(true); // Відкриваємо модалку
                                setIsOpen(false);        // Закриваємо маленьке випадаюче меню
                            }}
                            style="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 flex items-center justify-between transition-colors duration-200"
                            text="Налаштування"
                            icon={<IoSettingsOutline className="text-lg text-gray-500" />}
                        />
                        <ListItem
                            onClick={() => {
                                handleLogout();
                                window.location.reload();
                            }}
                            style="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 border-t border-gray-100 flex items-center justify-between"
                            text="Вийти"
                            icon={<BiLogOut />}
                        />
                    </ul>
                </nav>
            )}

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                user={user}
                setUser={setUser}
            />
        </div>
    );
}

export default UserLoggedIconClick;