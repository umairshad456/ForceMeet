import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../apis/axiosInstance';
import { toast } from 'react-toastify';


const PendingRequestsPanel = ({ reload }) => {
  const call = useCall();
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const intervalRef = useRef(null);

  const fetchPendingRequests = async () => {
    try {
      const response = await axiosInstance.get(`/api/notifications/pending-participant-requests?callId=${call.id}`);
      const data = response.data;

      setPendingParticipants((prev) => {
        // only update if data actually changed (avoid flicker)
        const prevIds = prev.map((p) => p.userId).sort().join(',');
        const newIds = data.participants.map((p) => p.userId).sort().join(',');
        if (prevIds === newIds) return prev;
        return data.participants;
      });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      console.error('Error fetching pending requests:', error?.response?.data?.message);
    }
  };

  // Fetch once when panel opens
  useEffect(() => {
    if (showPanel) fetchPendingRequests();
  }, [showPanel]);

  // Background timer (poll every 10s)
  useEffect(() => {
    if (!call) return;

    intervalRef.current = setInterval(() => {
      fetchPendingRequests();
    }, 5000); // 10s

    return () => clearInterval(intervalRef.current);
  }, [call]);

  const handleRequestAction = async (participantId, action) => {
    if (!call || isLoading) return;

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/api/notifications/handle-participant-requests', {
        callId: call.id,
        participantId, action
      });
      if (response.status === 200) {
        toast.success(response.data.message)
        fetchPendingRequests()
        reload()
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      console.error(`Error ${action}ing request:`, error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingParticipants.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2"
      >
        <span>Pending Requests ({pendingParticipants.length})</span>
      </button>
      {showPanel && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-800 rounded-lg shadow-lg z-50 p-4">
          <h3 className="text-lg font-semibold mb-3">Pending Join Requests</h3>
          <div className="max-h-72 overflow-y-auto">
            {pendingParticipants.map((participant) => (
              <div key={participant._id} className="mb-3 p-2 bg-gray-700 rounded">
                <p className="font-medium">{participant.name}</p>
                <p className="text-sm text-gray-400">{participant.email}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleRequestAction(participant._id, 'accept')}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequestAction(participant._id, 'reject')}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequestsPanel;