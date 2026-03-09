import Box from "../assets/BiggerFish/Box";
function RegisterPage() {
    return (
        <main className='min-h-screen bg-gradient-to-b dark:from-[var(--night-dark-blue)] dark:to-[var(--night-dark-purple)] from-[var(--day-pink)] to-[var(--day-purple)] font-sans'>
            <div className="flex justify-between items-baseline">
                <p className="text-white text-2xl font-bold pl-4 pt-4 underline mb-4">
                    <a href="/" className="hover:underline">На головну сторінку</a>
                </p>
                <p className="text-white opacity-90 pr-4 pt-4 font-semibold">Реєстрація</p>
            </div>
            <div className='w-full flex justify-center items-center p-4 pt-0 relative overflow-hidden'>
                <Box
                    text="Приєднуйтеся аби завжди займати улюблене місце!"
                    type="register"
                />
            </div>
        </main>
    )
}

export default RegisterPage;