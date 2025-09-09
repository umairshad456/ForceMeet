import React, { ReactNode, useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import clsx from 'clsx';
import Select from 'react-select';
import { toast } from 'react-toastify';
import axiosInstance from '../apis/axiosInstance';

const MeetingModal = ({
  isOpen,
  onClose,
  title,
  className,
  children,
  handleClick,
  buttonText,
  // img,
  // buttonIcon,
  meetingDate = 'TBD',
  meetingTime = 'TBD',
  meetingLink = 'https://your-app.com/meeting/123',
  callDetails,

}) => {

  const [participants, setParticipants] = useState([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [externalEmails, setExternalEmails] = useState([]);
  const [description, setDescription] = useState("");

  // Fetch participants from API
  useEffect(() => {
    if (isOpen) {
      const fetchParticipants = async () => {
        try {
          const response = await axiosInstance.get('/api/participants/fetchParticipants');
          // console.log('Fetched participants:', response.data);
          setParticipants(response.data);
        } catch (error) {
          console.log('Error fetching participants:', error);
        }
      };
      fetchParticipants();
    }
  }, [isOpen]);


  // find users and memoize them based on selected ids
  const selectedParticipants = useMemo(() => {
    return participants.filter((p) => selectedParticipantIds.includes(p._id));
  }, [participants, selectedParticipantIds]);


  // Handle adding external email
  const addExternalEmail = () => {
    if (!inviteEmail) {
      toast.error('Error: Please enter an email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('Error: Please enter a valid email');
      return;
    }

    const isExternalDuplicate = externalEmails.includes(inviteEmail);
    const isParticipantDuplicate = selectedParticipants.some((user) => user.email === inviteEmail);

    if (isExternalDuplicate || isParticipantDuplicate) {
      toast.error('Email already added');
      return;
    }

    setExternalEmails([...externalEmails, inviteEmail]);
    setInviteEmail('');
  };

  // Handle removing external email
  const removeExternalEmail = (email) => {
    setExternalEmails(externalEmails.filter((e) => e !== email));
  };

  // Options for react-select
  const participantOptions = participants.map((participant) => ({
    value: participant._id,
    label: `${participant.username} (${participant.email})`,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-full max-w-[520px] flex-col gap-6 border-none bg-gray-800 px-6 py-9 text-white rounded-lg shadow-lg">

        <DialogHeader className="flex flex-col items-center gap-3">
          <img src='/icons/logo.svg' className='size-10' />
          <DialogTitle className={clsx('text-2xl font-bold text-center', className)}>
            {title}
          </DialogTitle>
        </DialogHeader>

        {!callDetails && (
          <>
            {/* Participants Dropdown */}
            <div className="flex flex-col gap-2">
              <label htmlFor="participants" className="text-sm font-medium text-gray-200">
                Select Participants
              </label>
              <Select
                id="participants"
                isMulti
                options={participantOptions}
                value={participantOptions.filter((option) => selectedParticipantIds.includes(option.value))}
                onChange={(selected) => setSelectedParticipantIds(selected.map((option) => option.value))}
                className="text-black"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#1F2937',
                    borderColor: '#4B5563',
                    color: 'white',
                    padding: '2px',
                    borderRadius: '6px',
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#1F2937',
                    color: 'white',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#3B82F6' : '#1F2937',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#374151',
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#3B82F6',
                    color: 'white',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: 'white',
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#2563EB',
                    },
                  }),
                  input: (base) => ({
                    ...base,
                    color: 'white',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#9CA3AF',
                  }),
                }}
                placeholder="Select participants..."
              />
            </div>

            {/* External Invite */}
            <div className="flex flex-col gap-3">
              <label htmlFor="inviteEmail" className="text-base font-semibold text-gray-300">
                Invite External User
              </label>
              <div className="flex gap-3">
                <input
                  id="inviteEmail"
                  type="email"
                  placeholder="Enter email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-grow rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition duration-200"
                />
                <button
                  onClick={addExternalEmail}
                  className="flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-2 transition duration-200"
                >
                  Add
                </button>
              </div>
              {externalEmails.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Added Emails:</p>
                  <ul className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-700 p-2 rounded-lg">
                    {externalEmails.map((email) => (
                      <li
                        key={email}
                        className="flex items-center gap-2 rounded-full bg-gray-700 px-4 py-2 text-sm text-gray-100 shadow-md"
                      >
                        {email}
                        <button
                          onClick={() => removeExternalEmail(email)}
                          className="text-red-400 hover:text-red-600 transition-colors duration-200"
                          aria-label={`Remove ${email}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {children && <div className="text-gray-300">{children}</div>}

        {/* {img && (
          <div className="flex justify-center">
            <img src={img} alt={`${title} icon`} width={72} height={72} />
          </div>
        )} */}

        {handleClick && (
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 cursor-pointer"
            onClick={() => {
              handleClick(selectedParticipants, externalEmails)
              setSelectedParticipantIds([])
              setExternalEmails([])
            }}
          >
            {/* {buttonIcon && (
              <img src='/icons/logo.svg' alt={`${buttonText || 'Action'} icon`} />
             )}  */}
            {buttonText || 'Schedule Meeting'}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
