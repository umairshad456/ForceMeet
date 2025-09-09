import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ Request interceptor
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );


// ✅ Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // if (error.response?.status === 401) {
        //     console.warn("Unauthorized! Redirecting to login...");
        //     localStorage.removeItem("token");
        //     localStorage.removeItem("userId");
        //     localStorage.removeItem("email");
        //     window.location.href = "/login"; 
        // }
        return Promise.reject(error);
    }
);

export default axiosInstance;
