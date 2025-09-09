import { useState, useEffect } from 'react';
import axiosInstance from '../apis/axiosInstance';

const useTokenProviderById = (userId) => {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const fetchToken = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axiosInstance.get(`/api/meetings/video/token/${userId}`);
                setToken(response.data.token);
            } catch (err) {
                setError(err);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        fetchToken();
    }, [userId]);

    return { token, loading, error };
};

export default useTokenProviderById;