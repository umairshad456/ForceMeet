import { useGetCalls } from '../hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import Loader from './Loader';
import { useNavigate } from 'react-router-dom';

const CallList = (type) => {

  const navigate = useNavigate()
  const { endedCalls, upcomingCalls, callRecordings, isLoading } = useGetCalls();

  const getCalls = () => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'upcoming':
        return upcomingCalls;
      case 'recordings':
        return callRecordings;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'No Previous Calls';
      case 'upcoming':
        return 'No Upcoming Calls';
      case 'recordings':
        return 'No Recordings';
      default:
        return '';
    }
  };

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting) => (
          <MeetingCard
            key={meeting._id}
            icon={
              type === 'ended'
                ? '/icons/previous.svg'
                : type === 'upcoming'
                  ? '/icons/upcoming.svg'
                  : '/icons/recordings.svg'
            }
            title={meeting.title || 'No Description'}
            date={new Date(meeting.date).toISOString()} // Pass as ISO string
            createdAt={new Date(meeting.createdAt).toISOString()} // Pass createdAt
            isPreviousMeeting={type === 'ended'}
            link={meeting.meetingLink}
            buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
            buttonText={type === 'recordings' ? 'Play' : 'Start'}
            handleClick={() => navigate(`/${meeting.callId}`)}
          />
        ))
      ) : (
        <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;