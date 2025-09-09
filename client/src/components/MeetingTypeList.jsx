import { useState } from 'react';
import HomeCard from './HomeCard';
import MeetingModal from './MeetingModel';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../apis/axiosInstance';
import useAuthStore from '../store/useAuthStore'


const MeetingTypeList = () => {

  const { user } = useAuthStore();
  const userId = user._id;

  // const userId = localStorage.getItem('userId');

  const navigate = useNavigate();
  const [values, setValues] = useState({
    dateTime: new Date(),
    description: '',
    link: '',
  });

  const [callDetails, setCallDetails] = useState(null);
  const [meetingState, setMeetingState] = useState(null);

  const client = useStreamVideoClient();

  // useEffect(() => {
  //   if (!user) {
  //     fetchUser()
  //   }
  // }, [user])

  // Handle modal close and reset state
  const handleCloseModal = () => {
    setMeetingState(null);
    setCallDetails(null);
    setValues({ dateTime: new Date(), description: '', link: '' });
  };

  // Handle setting meeting state
  const handleSetMeetingState = (state) => {
    setMeetingState(state);
    setCallDetails(null);
  };

  //  ================================== send invites ===============================
  const sendInvites = async (
    selectedParticipants,
    externalEmails,
    meetingLink,
    title,
    date,
    time
  ) => {
    try {

      let emails = [...externalEmails];

      // Send invites to selected participants by fetch them by id from participants model
      if (selectedParticipants.length > 0) {
        const participantEmails = selectedParticipants.map((p) => p.email);
        emails = [...externalEmails, ...participantEmails]; // merge both
      }

      const inviteRes = await axiosInstance.post('/api/meetings/sendInvite', {
        emails,
        meetingLink,
        title,
        date,
        time,
      });
    } catch (error) {
      console.log("Error sending mails", error)
      console.log(error.response.data.message)
      toast.error('Error: Failed to send invites');
    }
  };

  // ================================== create instant meeting ===============================
  const createInstantMeeting = async (selectedParticipants, externalEmails) => {

    if (!client || !userId) {
      toast.error('Error: User Id is not Found');
      // navigate('/signin');
      return;
    }

    try {
      let callId = uuidv4();
      const checkResponse = await axiosInstance.get(`/api/meetings/getMeetingByCallId/${callId}`);
      if (checkResponse.statusText === "OK") {
        callId = uuidv4();
      }

      const call = client.call('default', callId);

      const date = new Date().toISOString();
      const title = values.description || 'Instant Meeting';
      const meetingType = 'Instant Meeting';

      await call.getOrCreate({
        data: {
          starts_at: date,
          custom: {
            description: title,
            creatorId: userId,
            meetingType,
            requiresJoinRequest: true,
          },
          members: [{ user_id: userId, role: 'host' }],

        },
      });


      setCallDetails(call);

      const meetingLink = `${import.meta.env.VITE_BASEURL}/meeting/${callId}`;

      const requestBody = {
        callId,
        title,
        date,
        creatorId: userId,
        meetingLink,
        meetingType,
        selectedParticipants,
        externalEmails,
      };

      const response = await axiosInstance.post('/api/meetings/createMeeting', requestBody);
      if (response.status === 201) {
        toast.success(response.data.message);
      }

      // Send invites to selected participants and external emails
      if (selectedParticipants.length > 0 || externalEmails.length > 0) {
        await sendInvites(
          selectedParticipants,
          externalEmails,
          meetingLink,
          title,
          new Date().toISOString().split('T')[0],
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        toast.success('Invites sent to participants');
      }

      setMeetingState('isInstantMeeting');
    } catch (error) {
      console.error('Error creating instant meeting:', error);
    }
  };

  //  ================================== create scheduled meeting ===============================
  const createScheduleMeeting = async (selectedParticipants, externalEmails) => {
    if (!client || !userId) {
      toast.error('Error: Please sign in to create a meeting');
      return;
    }

    try {
      let callId = uuidv4();
      const checkResponse = await axiosInstance.get(`/api/meetings/getMeetingByCallId/${callId}`);
      if (checkResponse.statusText === "OK") {
        callId = uuidv4();
      }

      const call = client.call('default', callId);

      const date = values.dateTime.toISOString();
      const title = values.description || 'Scheduled Meeting';
      const meetingType = 'Scheduled Meeting';

      await call.getOrCreate({
        data: {
          starts_at: date,
          custom: {
            description: title,
            creatorId: userId,
            meetingType,
            requiresJoinRequest: true,
          },
          members: [{ user_id: userId, role: 'host' }],
        },
      });

      setCallDetails(call);

      const meetingLink = `${import.meta.env.VITE_BASEURL}/meeting/${callId}`;

      const requestBody = {
        callId,
        title,
        date,
        creatorId: userId,
        meetingLink,
        meetingType,
        selectedParticipants,
        externalEmails,
      };

      const response = await axiosInstance.post('/api/meetings/createMeeting', requestBody);
      if (response.status === 201) {
        toast.success('Meeting created successfully');
      }

      // Send invites to selected participants and external emails
      if (selectedParticipants.length > 0 || externalEmails.length > 0) {
        await sendInvites(
          selectedParticipants,
          externalEmails,
          meetingLink,
          title,
          values.dateTime.toISOString().split('T')[0],
          values.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        toast.success('Invites sent to participants');
      }

      setMeetingState('isScheduleMeeting');
    } catch (error) {
      console.error('Error creating scheduled meeting:', error);
    }
  };

  //  ================================== join meeting ===============================
  const handleJoinMeeting = () => {
    if (!values.link) {
      toast.error('Please enter a meeting link');
      return;
    }

    const url = values.link.trim();
    const callId = url.split('/').filter(Boolean).pop();

    if (callId && callId !== 'undefined' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(callId)) {
      navigate(`/meeting/${callId}?request=true`);
    } else {
      toast.error('Invalid meeting link. Please provide a valid meeting URL.');
    }
  };

  const meetingLink = callDetails
    ? `${import.meta.env.VITE_BASEURL}/meeting/${callDetails.id}`
    : '';

  const meetingDate = values.dateTime.toISOString().split('T')[0];
  const meetingTime = values.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="Instant Meeting"
        description="Start an Instant Meeting"
        handleClick={() => handleSetMeetingState('isInstantMeeting')}
        className="bg-amber-600"
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan Your Meeting"
        handleClick={() => handleSetMeetingState('isScheduleMeeting')}
        className="bg-blue-500"
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Check out your recordings"
        handleClick={() => navigate('/recordings')}
        className="bg-purple-500"
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="Via Invitation Link"
        handleClick={() => handleSetMeetingState('isJoinMeeting')}
        className="bg-yellow-500"
      />


      {/*  ============================= Instant Meeting Modal ====================================*/}
      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={handleCloseModal}
        title={callDetails ? 'Instant Meeting Created' : 'Start an Instant Meeting'}
        className="text-center"
        buttonText={callDetails ? 'Join Meeting' : 'Start Meeting'}
        handleClick={callDetails ? () => navigate(`/meeting/${callDetails.id}`) : createInstantMeeting}
        meetingDate={new Date().toISOString().split('T')[0]}
        meetingTime={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        meetingLink={meetingLink}
        callDetails={callDetails}
      >
        {callDetails ? (
          <div className="flex flex-col gap-3">
            <p className="text-gray-300">
              Meeting Link: <a href={meetingLink} className="text-blue-400 underline">{meetingLink}</a>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(meetingLink);
                toast.success('Success: Link copied to clipboard');
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 cursor-pointer"
            >
              Copy Meeting Link
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22px] text-gray-200">Add a Description</label>
            <Textarea
              className="rounded-md border-gray-600 bg-gray-700 p-2 text-white focus:border-blue-500 focus:outline-none"
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              value={values.description}
            />
          </div>
        )}
      </MeetingModal>

      {/* ==================================== Scheduled Meeting Modal ==================================== */}
      <MeetingModal
        isOpen={meetingState === 'isScheduleMeeting'}
        onClose={handleCloseModal}
        title={callDetails ? 'Meeting Created' : 'Schedule Meeting'}
        className="text-center"
        buttonText={callDetails ? 'Join Meeting' : 'Schedule Meeting'}
        handleClick={callDetails ? () => navigate(`/${callDetails.id}`) : createScheduleMeeting}
        meetingDate={meetingDate}
        meetingTime={meetingTime}
        meetingLink={meetingLink}
        callDetails={callDetails}
      >
        {callDetails ? (
          <div className="flex flex-col gap-3">
            <p className="text-gray-300">
              Meeting Link: <a href={meetingLink} className="text-blue-400 underline">{meetingLink}</a>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(meetingLink);
                alert('Success: Link copied to clipboard');
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 cursor-pointer"
            >
              Copy Meeting Link
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              <label className="text-base font-normal leading-[22px] text-gray-200">Add a Description</label>
              <Textarea
                className="rounded-md border-gray-600 bg-gray-700 p-2 text-white focus:border-blue-500 focus:outline-none"
                onChange={(e) => setValues({ ...values, description: e.target.value })}
                value={values.description}
              />
            </div>
            <div className="flex w-full flex-col gap-2.5 mt-5">
              <label className="text-base font-normal leading-[22px] text-gray-200">Select Date & Time</label>
              <ReactDatePicker
                selected={values.dateTime}
                onChange={(date) => setValues({ ...values, dateTime: date || new Date() })}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full rounded-md border-gray-600 bg-gray-700 p-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </>
        )}
      </MeetingModal>

      {/* ==================================== Join Meeting Modal ==================================== */}
      <MeetingModal
        isOpen={meetingState === 'isJoinMeeting'}
        onClose={handleCloseModal}
        title="Join a Meeting"
        className="text-center"
        buttonText="Request to Join"
        handleClick={handleJoinMeeting}
      >
        <div className="flex flex-col gap-2.5">
          <label className="text-base font-normal leading-[22px] text-gray-200">Meeting Link</label>
          <input
            type="text"
            className="w-full rounded-md border-gray-600 bg-gray-700 p-2 text-white focus:border-blue-500 focus:outline-none"
            placeholder="Enter meeting link (e.g., https://example.com/<callId>)"
            onChange={(e) => setValues({ ...values, link: e.target.value })}
            value={values.link}
          />
        </div>
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
