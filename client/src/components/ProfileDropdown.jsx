import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import axiosInstance from '../apis/axiosInstance';
import { toast } from "react-toastify";

const ProfileDropdown = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

    const navigate = useNavigate();
    const client = useStreamVideoClient();

    const handleLogout = async () => {
        try {
            // Disconnect Stream.io client
            if (client) {
                await client.disconnectUser();
                console.log('Stream client disconnected');
            }

            // Clear HTTP-only cookie
            const response = await axiosInstance.post('/api/auth/logout');
            if (response.status === 200) {
                localStorage.clear()
                toast.success(response.data.message);
                navigate('/signin');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            setIsDropdownOpen(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-800  focus:outline-none"
            >
                {/* Profile Image */}
                <img
                    src={user?.image || "/icons/person.png"}
                    alt="profile"
                    className="w-8 h-8 rounded-full object-cover border"
                />
                {/* User email / name */}
                <span className="hidden md:inline text-white text-sm">
                    {user?.email}
                </span>
                {/* Chevron Icon */}
                <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-blue-500 text-white rounded-md shadow-lg py-1 z-10">
                    <Link
                        // to="/profile"
                        className="cursor-pointer gap-2 px-4 py-2"
                        onClick={() => setIsDropdownOpen(false)}
                    >
                        My Profile
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
