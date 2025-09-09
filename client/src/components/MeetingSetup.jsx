import { DeviceSettings, useCall, VideoPreview, useCallStateHooks } from '@stream-io/video-react-sdk';
import React, { useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../apis/axiosInstance';
import { BiLoaderAlt } from "react-icons/bi";

const MeetingSetup = ({ setIsSetupComplete, isSetupComplete }) => {

  const token = localStorage.getItem("token")

  const [isMicCamToggledOn, setIsMicCamToggledOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinRequest, setJoinRequest] = useState({
    name: '',
    email: ''
  });
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);
  const [submissionStatusMessage, setSubmissionStatusMessage] = useState(''); // For user feedback
  const [isCheckingUser, setIsCheckingUser] = useState(false); // Loading state for user check
  const [loading, setLoading] = useState(false);

  const call = useCall();
  const { useCallCustomData } = useCallStateHooks();
  const customData = useCallCustomData();

  // const customData = {
  //   "requiresJoinRequest": true,
  //   "creatorId": "68b14e03dac43ad9f47dff04",
  //   "description": "Instant Meeting",
  //   "meetingType": "Instant Meeting"
  // }

  const navigate = useNavigate();

  const [userId, setUserIdState] = useState(null);
  const [userEmail, setUserEmailState] = useState(null);
  const [userName, setUserNameState] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserIdState(localStorage.getItem('userId'));
      setUserEmailState(localStorage.getItem('email'));
      setUserNameState(localStorage.getItem('username'));
    }
  }, []); // Run once on mount


  // isHost check
  const isHost = useMemo(() => {
    if (!userId || !customData?.creatorId) return false;
    return customData.creatorId === userId;
  }, [customData, userId]);


  // ========================== setup media and call settings ================================

  useEffect(() => {
    if (!call) {
      console.warn('Call object is not initialized yet');
      return;
    }
    // Show join form if user is the not login user at all
    if (!token) {
      setShowJoinForm(true);
      return;
    } else {
      setShowJoinForm(false); // Ensure form is hidden if user details are present
    }

    const setupMedia = async () => {
      try {
        if (isMicCamToggledOn) { // If toggled ON, it means user WANTS to disable
          await call.camera.disable();
          await call.microphone.disable();
          setIsCameraReady(false);
        } else { // If toggled OFF, it means user WANTS to enable
          // console.log("calllll", call)
          await call.camera.enable();
          await call.microphone.enable();
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error('Error setting up media devices:', err);
        setIsCameraReady(false);
      }
    };

    setupMedia();
  }, [isMicCamToggledOn, call, token]);



  // ================== Join Request Handling ==================
  const handleJoinRequestSubmit = async (e) => {
    e.preventDefault();
    setIsCheckingUser(true);
    setSubmissionStatusMessage('');

    try {
      // 1. Check if participant already exists
      const checkResponse = await axiosInstance.post('/api/meetings/checkParticipantStatus', {
        callId: call.id,
        email: joinRequest.email
      });
      const participantData = checkResponse.data;

      // if participant exists update localstorage values with orignal one
      if (participantData.exists) {
        localStorage.setItem('userId', participantData.userId);
        localStorage.setItem('email', participantData.email);
        localStorage.setItem('username', participantData.name);

        // Always generate a new token for the session
        const existingUserToken = `token_existing_${uuidv4().replace(/-/g, '')}`;
        localStorage.setItem('token', existingUserToken);

        setUserIdState(participantData.userId);
        setUserEmailState(participantData.email);
        setUserNameState(participantData.name);

        //  ================================================= if status is approve =================================================
        if (participantData.status === 'approved') {
          setShowJoinForm(false);
          setIsRequestSubmitted(false);

          // Attempt to join the call immediately
          if (isMicCamToggledOn) {
            await call?.camera.enable();
            await call?.microphone.enable();
            setIsCameraReady(true);
            setIsMicCamToggledOn(false);
          } else if (!isCameraReady) {
            await call?.camera.enable();
            await call?.microphone.enable();
            setIsCameraReady(true);
          }

          await call?.join();
          setIsSetupComplete(true);
          return;

          // ================================ if participant status is pending =======================================
        } else if (participantData.status === 'pending') {
          setShowJoinForm(false);
          setIsRequestSubmitted(true); // Show "waiting for approval"
          setSubmissionStatusMessage('Your previous request is still pending. Waiting for host approval...');
          return;

        }
        else if (participantData.status === 'rejected') {

          await axiosInstance.post('/api/meetings/joinRequest', {
            callId: call.id,
            name: joinRequest.name,
            email: joinRequest.email,
            userId: participantData.userId,
            status: 'pending'
          });

          setIsRequestSubmitted(true);
          setShowJoinForm(false);
          setSubmissionStatusMessage('Your request has been resubmitted. Please wait for approval.');
          // setShowJoinForm(true);
          // setIsRequestSubmitted(false); // allow them to submit again
          // setSubmissionStatusMessage('Your previous request is rejected. submit New one...');
          return;

        }
        else {
          setSubmissionStatusMessage(`Your access to this meeting with email ${joinRequest.email} was previously ${participantData.status}. Please contact the host.`);
          setIsCheckingUser(false);
          return;
        }
      } else {
        // ==================== if participant  does not exists in the db and meeting, submit a new join request ======================
        const generatedUserId = `guest_${uuidv4()}`;
        const generatedToken = `token_new_${uuidv4().replace(/-/g, '')}`;

        localStorage.setItem('userId', generatedUserId);
        localStorage.setItem('email', joinRequest.email);
        localStorage.setItem('username', joinRequest.name);
        localStorage.setItem('token', generatedToken);

        setUserIdState(generatedUserId);
        setUserEmailState(joinRequest.email);
        setUserNameState(joinRequest.name);

        // ================= Send Join Request to user ======================================================
        const response = await axiosInstance.post('/api/meetings/joinRequest', {
          callId: call?.id,
          name: joinRequest.name,
          email: joinRequest.email,
          userId: generatedUserId,
          status: 'pending'
        });

        // console.log('Join request submission response:', response);

        setShowJoinForm(false);
        setIsRequestSubmitted(true);
        setSubmissionStatusMessage('Your join request has been submitted. Please wait for approval.');
      }
    } catch (error) {
      console.error('Error in join request process:', error);
      console.error('Error in join request process:', error.response.data.message);
      setSubmissionStatusMessage(`Error: ${error.message}. Please try again.`);
    } finally {
      setIsCheckingUser(false);
    }
  };


  // Polling for approval status if a request was submitted
  useEffect(() => {
    if (!call || !userId) return;
    let interval;

    const checkApprovalStatus = async () => {
      try {
        // console.log(`Polling for approval: callId=${call.id}, userId=${userId}`);

        const response = await axiosInstance.get(`/api/meetings/checkAprrovalStatus/${call.id}/${userId}`);
        const data = response.data;

        // ============ if approved ====================
        if (data.status === 'approved' && !isSetupComplete) {
          if (isMicCamToggledOn) {
            await call.camera.enable();
            await call.microphone.enable();
            setIsCameraReady(true);
            setIsMicCamToggledOn(false);
          }
          else if (!isCameraReady) {
            await call.camera.enable();
            await call.microphone.enable();
            setIsCameraReady(true);
          }
          // await call.join();
          // setIsSetupComplete(true);

          // stop polling once approved & joined
          clearInterval(interval);
          // ============ if pending ====================
        } else if (data.status === 'pending') {
          setIsRequestSubmitted(true);
          setSubmissionStatusMessage('Your request is pending. Waiting for approval...');

          // ============ if rejected ====================
        } else if (data.status === 'rejected') {
          setIsRequestSubmitted(false);
          setSubmissionStatusMessage('Your request was rejected by the host.');
          setShowJoinForm(true);
        }
        else {
          setShowJoinForm(true);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setShowJoinForm(true);
      }
    };

    checkApprovalStatus();
    interval = setInterval(checkApprovalStatus, 5000);
    return () => clearInterval(interval);
  }, [call, userId]);


  if (isCheckingUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
        <Loader message="Checking your details..." />
      </div>
    );
  }

  if (isRequestSubmitted) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
        <h1 className="text-2xl font-bold">Request Submitted</h1>
        <p className="text-lg">{submissionStatusMessage || "Your request to join the meeting has been submitted."}</p>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg">Waiting for host approval...</p>
        </div>
      </div>
    );
  }

  if (showJoinForm) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
        <h1 className="text-2xl font-bold">Request to Join Meeting</h1>
        {submissionStatusMessage && <p className="text-yellow-400 mb-3">{submissionStatusMessage}</p>}
        <form onSubmit={handleJoinRequestSubmit} className="flex flex-col gap-4 w-full max-w-md">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-lg">Your Name</label>
            <input
              type="text"
              id="name"
              value={joinRequest.name}
              onChange={(e) => setJoinRequest({ ...joinRequest, name: e.target.value })}
              className="rounded-md bg-gray-700 px-4 py-2 text-white"
              required
              disabled={isCheckingUser}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-lg">Your Email</label>
            <input
              type="email"
              id="email"
              value={joinRequest.email}
              onChange={(e) => setJoinRequest({ ...joinRequest, email: e.target.value })}
              className="rounded-md bg-gray-700 px-4 py-2 text-white"
              required
              disabled={isCheckingUser}
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-green-400 px-4 py-2.5 mt-4 disabled:bg-gray-500"
            disabled={isCheckingUser}
          >
            {isCheckingUser ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    );
  }

  // Default Meeting Setup UI for users who are not 'example@gmail.com' and not pending approval
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-2xl font-bold">Meeting Setup</h1>
      {userName && (
        <p className="text-lg">
          {userName} ({userEmail}) {isHost && <span className="text-green-400 font-semibold">(Host)</span>}
        </p>
      )}

      {isCameraReady && <VideoPreview />}
      {!isCameraReady && !isMicCamToggledOn && ( // Show message if camera/mic expected to be on but aren't
        <p className="text-yellow-400">Camera/Microphone are initializing or disabled. Please check permissions.</p>
      )}
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!isMicCamToggledOn} // Checked means Mic/Cam are ON
            onChange={() => setIsMicCamToggledOn((prev) => !prev)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span>{isMicCamToggledOn ? 'Enable Mic/Cam' : 'Mic/Cam Enabled'}</span>
        </label>
      </div>
      <DeviceSettings />
      <button
        className="rounded-md bg-blue-600 px-4 py-2.5 border cursor-pointer"
        onClick={async () => {
          try {
            setLoading(true)
            // if (isMicCamToggledOn) {
            //   await call.camera.enable();
            //   await call.microphone.enable();
            // }
            await call.join();
            setIsSetupComplete(true);
          } catch (error) {
            console.error('Error joining the call:', error);
          }
          finally {
            setLoading(false)
          }
        }}
      >
        {/* button text for loading and simple */}
        {loading ? (
          <>
            <span className='flex items-center justify-between gap-2'>
              Joining <BiLoaderAlt className='animate-spin' />
            </span>
          </>
        ) : (
          "Join Meeting"
        )}

      </button>
    </div>
  );
};


const Loader = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center gap-2 text-white">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-lg">{message}</p>
  </div>
);

export default MeetingSetup;