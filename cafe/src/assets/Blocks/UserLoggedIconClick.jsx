import { BiUser, BiLogOut } from "react-icons/bi";
import { IoSettingsOutline } from "react-icons/io5";
import { ListItem } from "./ListItem";
import UserIcon from "./UserIcon";

function UserLoggedIconClick({user, setIsOpen, isOpen, navigate, setIsSettingsOpen, handleLogout}) {
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
                    <ul className="absolute right-0 top-12 bg-white dark:bg-black- rounded-lg shadow-lg border border-gray-200 w-48 py-2 z-50 dark:border-gary-700">
                        <ListItem
                            onClick={() => navigate("/user-page")}
                            style="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 flex items-center justify-between"
                            text="Профіль"
                            icon={<BiUser />} />
                        <ListItem
                            onClick={() => {
                                setIsSettingsOpen(true);
                                setIsOpen(false);
                            }}
                            style="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 flex items-center justify-between"
                            text="Налаштування"
                            icon={<IoSettingsOutline />} />
                        <ListItem
                            onClick={handleLogout}
                            style="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 border-t border-gray-100 flex items-center justify-between"
                            text="Вийти"
                            icon={<BiLogOut />} />
                    </ul>
                </nav>
            )}
        </div>)
}


export default UserLoggedIconClick;