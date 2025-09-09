import React, { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';
import {
  CallControls,
  CallingState,
  CallParticipantsList,
  CallStatsButton,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { LayoutList, MessageSquare, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import EndCallButton from './EndCallButton';
import Loader from './Loader';
import PendingRequestsPanel from './PendingRequestsPanel';
import ParticipantsList from '../components/ParticipantsList';
import HostRequestNotification from './Notification';
import axiosInstance from '../apis/axiosInstance';
import CallChatWidget from './CallChatWidget';

const endcall = 'http://localhost:5173/thank-you';

//==================================================================================================================
const MeetingRoom = () => {
  const [layout, setLayout] = useState('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const { searchParams } = useParams();
  const { useCallCallingState, useCallCustomData, useIsCallRecordingInProgress } = useCallStateHooks();
  const call = useCall();
  const callingState = useCallCallingState();
  const customData = useCallCustomData();
  // const isPersonalRoom = !!searchParams('personal');
  const isPersonalRoom = false;
  const [showChat, setShowChat] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const audioRef = useRef(null);
  const [notification, setNotification] = useState(null);

  const [userRole, setUserRole] = useState('participant');
  const [userPermissions, setUserPermissions] = useState({
    canManageParticipants: false,
    canEndCall: false,
    canViewStats: false,
    canModifyHosts: false
  });

  // for reloading
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => {
    setReloadKey(prev => prev + 1);
  };

  // get user id and email from localstorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : null;

  // ====================================== Add this useEffect to your MeetingRoom component ======================================
  useEffect(() => {
    const handleRoleChange = (event) => {
      if (event.key === 'userRole' && event.newValue) {
        setUserRole(event.newValue);
        // You might want to refetch permissions here
      }
    };

    window.addEventListener('storage', handleRoleChange);
    return () => window.removeEventListener('storage', handleRoleChange);
  }, []);


  // ====================================== Update the syncUserRole function to store role in localStorage ======================================
  useEffect(() => {
    const syncUserRole = async () => {
      if (!userId || !call?.id) return;

      try {
        const response = await axiosInstance.get(`/api/meetings/getUserRolesandPermission/${call.id}/${userId}?time=${Date.now()}`);
        console.log('Sync user role response:', response);
        if (response.status === 200) {
          if (response.data.role !== userRole) setUserRole(response.data.role);
          if (JSON.stringify(response.data.permissions) !== JSON.stringify(userPermissions)) {
            setUserPermissions(response.data.permissions);
          }
          setMeetingId(response?.data?.dbData?.meetingId)
        }
      } catch (error) {
        console.error('Error syncing user role:', error);
        console.error('Error syncing user role:', error.response.data.message);
      }
    };

    syncUserRole();
    const interval = setInterval(syncUserRole, 10000);
    return () => clearInterval(interval);
  }, [userId, call?.id, userRole, userPermissions]);



  // ====================================== calling States ======================================
  if (callingState !== CallingState.JOINED) {
    if (callingState === CallingState.RECONNECTING) {
      return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Reconnecting to the meeting...
      </div>;
    }
    return <Loader />;
  }

  // ====================================== call layout ======================================
  const CallLayout = () => {
    switch (layout) {
      case 'grid': return <PaginatedGridLayout />;
      case 'speaker-right': return <SpeakerLayout participantsBarPosition="left" />;
      default: return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-gray-900 text-white">

      {/* ====================================== User info badge ====================================== */}
      {userEmail && (
        <div className="absolute top-4 left-1/2 z-50 rounded-md bg-gray-800 px-4 py-2 text-sm text-white shadow-md">
          {userEmail}
          {userRole === 'host' && <span className="text-blue-400"> (host)</span> || "User"}
          {userRole === 'cohost' && <span className="text-green-400"> (co-host)</span> || "User"}
        </div>
      )}

      {/* Main video layout */}
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="flex w-full max-w-[1200px] items-center justify-center">
          <CallLayout />
        </div>

        {/* ====================================== Participants panel ====================================== */}
        {showParticipants && (
          <div className="absolute right-0 z-50 top-4 h-[calc(100vh-96px)] p-5  bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out">
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        )}

        {/* Chat panel */}
        {showChat && (
          <div className="absolute right-0 top-4 h-[calc(100vh-96px)] w-[360px] bg-gray-800 shadow-lg p-5 z-40 transition-transform duration-300 ease-in-out">
            {call && (
              <CallChatWidget
                call={call}
              />
            )}
          </div>
        )}
      </div>

      {/* ============================ Host Request Notifications ============================ */}
      <HostRequestNotification />

      {/* Bottom controls bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 bg-gray-800 p-4 shadow-lg">
        {/* Basic controls for everyone */}
        <div className="flex items-center gap-2">
          <CallControls onLeave={() => window.location.href = endcall} />
        </div>

        {/* ====================================== Host and co-host controls ====================================== */}
        {userPermissions.canManageParticipants && <PendingRequestsPanel reload={reload} />}
        {userPermissions.canViewStats && <CallStatsButton />}
        {userPermissions.canManageParticipants && !isPersonalRoom && <ParticipantsList meetingId={meetingId} reloadKey={reloadKey} />}
        {userPermissions.canEndCall && !isPersonalRoom && <EndCallButton />}

        {/* ====================================== Participants toggle ====================================== */}
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className={clsx(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
            showParticipants ? 'bg-blue-600' : 'bg-gray-700',
            'hover:bg-blue-500 transition-colors'
          )}
        >
          <Users size={20} />
          <span>Participants</span>
        </button>

        {/* ====================================== chat toggle ====================================== */}

        <button
          onClick={() => setShowChat(!showChat)}
          className={clsx('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium', showChat ? 'bg-blue-600' : 'bg-gray-700', 'hover:bg-blue-500 transition-colors')}
        >
          <MessageSquare size={20} />
          <span>Chat</span>
        </button>

        {/* ====================================== Layout selection ====================================== */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors">
            <LayoutList size={20} />
            <span>Layout</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-gray-600 bg-gray-700 text-gray-600">
            {(['grid', 'speaker-left', 'speaker-right']).map((item, index) => (
              <React.Fragment key={index}>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-600"
                  onClick={() => setLayout(item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </DropdownMenuItem>
                {index < 2 && <DropdownMenuSeparator className="bg-gray-600" />}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
};

export default MeetingRoom;
