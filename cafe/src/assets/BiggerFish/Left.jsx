export default function Left({ text, subtext }) {
    return (
        <div className="w-full md:w-5/12  bg-gradient-to-t dark:from-[var(--night-dark-blue)] dark:to-[var(--night-dark-purple)] from-[var(--day-pink)] to-[var(--day-purple)] p-8 md:p-12 flex flex-col justify-center relative md:rounded-l-[2.5rem]">
            <div className="mb-8 text-center md:text-left relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white dark:text-gray-300 leading-tight drop-shadow-md">{text}</h2>
                {subtext && <p className="text-white dark:text-gray-400 opacity-90">{subtext}</p>}
            </div>

            <div className="relative w-full h-64 md:h-auto md:flex-grow">
                <img
                    src="src/assets/images/Sally.png"
                    alt="Login Illustration"
                    className="object-contain w-full h-full absolute md:relative top-0 left-0 transform scale-110 md:scale-125 md:translate-x-10"
                />
            </div>
        </div>
    )
}
