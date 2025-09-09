import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../apis/axiosInstance'
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Signin = () => {
    const { loginUser } = useAuthStore()
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.post("/api/auth/signin", { email, password });
            const { user, token, message } = response.data;
            
            if (user && token) {
                await loginUser(user, token)
                localStorage.setItem("userId", user._id);
                localStorage.setItem("username", user.username);
                localStorage.setItem("token", token);
                localStorage.setItem("email", user.email);
                toast.success(message)
                navigate("/");
            }
        } catch (err) {
            console.log(err)
            // toast.error(err.response.data.message)
            console.error("Signin client error:", err.response.data.message);
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-center">Sign In</h2>
                <form onSubmit={handleSubmit}>
                    <InputField
                        label="Email"
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <InputField
                        label="Password"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Sign In
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Don’t have an account?{' '}
                    <a href="/signup" className="text-blue-600 hover:underline">
                        Sign Up
                    </a>
                </p>
            </div>
        </div>
    );
}

export default Signin

const InputField = ({ label, id, type, value, onChange, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const inputType = isPasswordType && showPassword ? 'text' : type;

    return (
        <div className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative mt-1">
                <input
                    type={inputType}
                    id={id}
                    value={value}
                    onChange={onChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...props}
                />
                {isPasswordType && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                )}
            </div>
        </div>
    );
};
