import { useEffect, useState } from 'react';

export const useGetCalls = () => {
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    const loadCalls = async () => {
      if (!userId) {
        console.error('No userId found in localStorage');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/meetings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch meetings');
        }

        const meetings = await response.json();
        setCalls(meetings);
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [userId]);

  const now = new Date();

  const endedCalls = calls.filter((meeting) => {
    return new Date(meeting.date) < now;
  });

  const upcomingCalls = calls.filter((meeting) => {
    return new Date(meeting.date) >= now;
  });

  return {
    endedCalls,
    upcomingCalls,
    callRecordings: [], // Not implemented yet, as recordings aren't stored in MongoDB
    isLoading,
  };
};