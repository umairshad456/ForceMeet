import { create } from 'zustand';
import axiosInstance from '../apis/axiosInstance';

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    userId: null,
    isAuthenticated: false,
    isLoading: true,


    loginUser: (userData, userToken) => {
        set({
            user: userData,
            token: userToken,
            userId: userData?._id,
            isAuthenticated: !!userData,
            isLoading: false,
        });
    },

    logout: () => {
        set({
            user: null,
            token: null,
            userId: null,
            isAuthenticated: false,
            isLoading: false,
        });
    },

    fetchUser: async () => {
        try {
            const response = await axiosInstance.get('/api/auth/profile');
            if (response.status === 200) {
                const { user, token } = response.data;
                get().loginUser(user, token);
            }
        } catch (error) {
            get().logout();
        }
    },
}));

export default useAuthStore;
