import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ThankYouPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const meetingInfo = location.state?.meetingInfo;
  const [secondsLeft, setSecondsLeft] = useState(10);


  // countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // navigation effect when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0) {
      navigate('/', { replace: true });
    }
  }, [secondsLeft, navigate]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleJoinNewMeeting = () => {
    navigate('/new-meeting');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-lg w-full">
        <h1 className="text-4xl font-bold mb-4 text-green-400">Thank You for Participating!</h1>
        <p className="text-lg mb-6">
          We appreciate your time and contribution to the meeting.
        </p>

        {meetingInfo && (
          <div className="mb-6 p-4 bg-gray-700 rounded-md text-left">
            <h2 className="text-xl font-semibold mb-2">Meeting Summary</h2>
            <p><strong>Title:</strong> {meetingInfo.title || 'N/A'}</p>
            <p><strong>Description:</strong> {meetingInfo.description || 'N/A'}</p>
            <p><strong>Date:</strong> {meetingInfo.date ? new Date(meetingInfo.date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Duration:</strong> {meetingInfo.duration || 'N/A'}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoHome}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-lg font-semibold transition-colors duration-200"
          >
            Go to Home
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-8">
          You will be redirected automatically in <span className="font-bold">{secondsLeft}</span> seconds.
        </p>
      </div>
    </div>
  );
};

export default ThankYouPage;