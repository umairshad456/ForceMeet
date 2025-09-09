import { ReactNode, useEffect, useState } from 'react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import useTokenProviderById from '../hooks/useTokenProviderById';
import useAuthStore from '../store/useAuthStore';
import { v4 as uuidv4 } from 'uuid';


const apiKey = import.meta.env.VITE_STREAM_API_KEY;

const StreamVideoProvider = ({ children }) => {
    const { user } = useAuthStore()
    const [videoClient, setVideoClient] = useState(null)

    const userId = user?.id || localStorage.getItem('userId');
    const email = user?.email || localStorage.getItem('email');

    if (!userId || !email) {
        const dummyId = uuidv4();
        const emailEmail = `${dummyId}@guest.fairforse`;
        localStorage.setItem('email', emailEmail)
        localStorage.setItem('userId', dummyId);
        window.location.reload();
        return
    }

    const { token, loading: tokenLoading, error } = useTokenProviderById(userId);


    useEffect(() => {
        if (!apiKey) {
            console.error('Stream API key is missing');
            return;
        }

        if (!token || !userId) return;

        const client = new StreamVideoClient({
            apiKey,
            user: {
                id: userId,
                name: email,
                image: '/icons/person.png',
            },
            token,
        });

        setVideoClient(client);

        return () => {
            client.disconnectUser();
            setVideoClient(null);
        };
    }, [token, userId, email]);

    return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
