import { BiUser } from "react-icons/bi";
function UserIcon({ h, w, image }) {
    if (image) {
        return <img src={image} alt="User Icon" className={`w-${w} h-${h} rounded-full object-cover border border-purple-200`} />;
    } else {
        return <div className={`w-${w} h-${h} bg-purple-100 text-purple-700 rounded-full flex items-center justify-center border border-purple-200`}>
            <BiUser />
        </div>;
    }
}

export default UserIcon;
