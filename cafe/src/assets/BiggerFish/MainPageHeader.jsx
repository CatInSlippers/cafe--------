import {Logo} from "../Blocks/Logo";
import {SearchBar} from "../Blocks/SearchBar";
import {Greeting} from "../Blocks/Greeting";
import UserLoggedIconClick from "../Blocks/UserLoggedIconClick";
function MainPageHeader(user, setIsOpen, isOpen, navigate, setIsSettingsOpen, handleLogout) {
    return <header className="bg-white dark:bg-black shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Logo />
            <SearchBar
                placeholder="Пошук послуги або місця..." />
            {user
                ?
                <div className="flex items-center gap-3">
                    <Greeting />
                    <UserLoggedIconClick
                        user={user}
                        setIsOpen={setIsOpen}
                        isOpen={isOpen}
                        navigate={navigate}
                        setIsSettingsOpen={setIsSettingsOpen}
                        handleLogout={handleLogout} />
                </div>
                :
                <button onClick={() => navigate('/login')} className="text-sm font-bold text-[var(--day-purple)] dark:text-[var(--night-dark-blue)] hover:underline">Увійти</button>}
        </div>
    </header>;
}

export default MainPageHeader;