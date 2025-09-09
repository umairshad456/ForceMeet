import { useEffect, useState } from 'react';
import MeetingSetup from '../../components/MeetingSetup';
import MeetingRoom from '../../components/MeetingRoom';
import { StreamCall, StreamTheme, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function MeetingPage() {
  const { id } = useParams();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const client = useStreamVideoClient();

  // Mark as client-side after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !client) return;

    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('User Id not found.');
      return;
    }

    const initializeCall = async () => {
      try {

        const callInstance = client.call('default', id);
        await callInstance.get();
        setCall(callInstance);
      } catch (err) {
        console.error('Error initializing call:', err);
        setError('Failed to initialize call');
      }
    };

    initializeCall();

    // if (id !== 'new') {
    //   const fetchMeeting = async () => {
    //   };
    //   fetchMeeting();
    // initializeCall();
    // }
  }, [id, client, isClient]);



  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }


  return (
    <main className="h-screen w-full bg-gray-500">
      {call ? (
        <StreamCall call={call}>
          <StreamTheme>
            {!isSetupComplete ? (
              <MeetingSetup setIsSetupComplete={setIsSetupComplete} isSetupComplete={isSetupComplete} />
            ) : (
              <MeetingRoom />
            )}
          </StreamTheme>
        </StreamCall>
      ) : (
        <div className="flex items-center justify-center h-full">
          Loading meeting setup...
        </div>
      )}
    </main>
  );
}
