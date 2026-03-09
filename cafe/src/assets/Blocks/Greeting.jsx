export function Greeting(user) {
    return <span className="text-sm font-medium text-gray-700 dark:text-white hidden sm:block">Привіт, {user.user.name}</span>;
}
