import { useCall } from '@stream-io/video-react-sdk';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const EndCallButton = () => {
  const call = useCall();
  const navigate = useNavigate()

  return (
    <button
      onClick={async () => {
        if (call) {
          await call.endCall();
        } else {
          console.error('Call object is undefined');
        }
        navigate('/thank-you');
      }}
      className='bg-red-500 rounded-lg cursor-pointer px-2 py-1.5'
      title='End call for everyone'
    >
      End Call
    </button>
  );
};

export default EndCallButton;