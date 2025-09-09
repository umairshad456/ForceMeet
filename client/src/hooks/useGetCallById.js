import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

export const useGetCallById = (id) => {
    const [call, setCall] = useState(null);
    const [isCallLoading, setIsCallLoading] = useState(true);
    const client = useStreamVideoClient();

    useEffect(() => {
        if (!client) return;

        const loadCall = async () => {
            try {
                const { calls } = await client.queryCalls({
                    filter_conditions: { id },
                });

                if (calls.length > 0) {
                    setCall(calls[0]);
                }
            } catch (error) {
                console.error("Error fetching call:", error);
            } finally {
                setIsCallLoading(false);
            }
        };

        loadCall();
    }, [client, id]);

    return { call, isCallLoading };
};
