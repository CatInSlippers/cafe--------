import Left from "./Left"
import Right from "./Right"

function Box({ text, subtext, type }) {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-md flex flex-col md:flex-row max-w-4xl overflow-hidden relative z-10">
            <Left
                text={text}
                subtext={subtext}
            />
            <Right
                type={type} />
        </div>
    )
};

export default Box;