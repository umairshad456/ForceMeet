import { useState, useEffect } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '../components/ui/alert-dialog';
import { toast } from 'react-toastify';
import axiosInstance from '../apis/axiosInstance';


export default function ParticipantsList({ reloadKey, meetingId }) {

  const call = useCall();
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [canModifyHosts, setCanModifyHosts] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);


  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  // ======================================= fetch permissions ========================================
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!userId || !call?.id) return;
      try {
        const response = await axiosInstance.get(`/api/meetings/getUserRolesandPermission/${call.id}/${userId}?time=${Date.now()}`);
        // console.log('get user role response:', response);
        const data = response.data;
        setCanModifyHosts(data.permissions?.canModifyHosts || false);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };
    fetchPermissions();
  }, [userId, call?.id]);


  //=============================== fetch participants =======================================
  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/api/meetings/fetchParticipants?callId=${call?.id}&time=${Date.now()}`);
      // console.log('Fetch participants response:', response);
      setParticipants(response.data.participants || []);
    } catch (error) {
      toast.error(error?.response?.data?.message)
      console.log(error)
      console.log(error?.response?.data?.message)
    } finally {
      setIsLoading(false);
    }
  };

  // =============================== send host request =====================================
  const sendHostRequest = async () => {
    if (!selectedParticipant || !userId || !call?.id || !meetingId) return;
    setIsSendingRequest(true);
    try {
      const response = await axiosInstance.post('/api/notifications/send-host-request', {
        callId: call.id,
        meetingId,
        targetUserId: selectedParticipant.userId,
        requesterId: userId,
      });

      if (response.status === 200) {
        toast.success(response.data.message)
        setParticipants(prev => prev.map(p =>
          p.userId === selectedParticipant.userId
            ? { ...p, pendingHostRequest: true }
            : p
        ));
      }
    } catch (error) {
      console.log(error)
      console.log(error?.response?.data?.message)
    } finally {
      setIsSendingRequest(false);
      setShowDialog(false);
    }
  };


  useEffect(() => {
    fetchParticipants();
  }, [call, reloadKey, showPanel]);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowPanel(!showPanel);
          if (!showPanel) fetchParticipants();
        }}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm transition"
      >
        <Users className="h-4 w-4" />
        <span>Manage Participants ({participants.length})</span>
      </button>

      {showPanel && (
        <div className="absolute bottom-12 right-0 z-50 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Participants</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-white"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {participants.map((p) => (
                <div key={p.userId} className="flex justify-between items-center p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.email}</p>
                    <div className="flex gap-2 mt-1">
                      {p.isHost && (
                        <span className={`text-xs ${p.userId === userId ? 'text-blue-400' : 'text-green-400'
                          }`}>
                          {p.userId === userId ? 'You' : p.userId === call?.state.createdBy?.id ? 'Main Host' : 'Co-Host'}
                        </span>
                      )}
                      {p.pendingHostRequest && (
                        <span className="text-xs text-yellow-400">Pending Request</span>
                      )}
                    </div>
                  </div>
                  {canModifyHosts && userId !== p.userId && !p.isHost && !p.pendingHostRequest && (
                    <button
                      onClick={() => {
                        setSelectedParticipant(p);
                        setShowDialog(true);
                      }}
                      className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap"
                      disabled={isLoading}
                    >
                      Make Host
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-700">Send Host Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {`Send a host request to ${selectedParticipant?.name}? They will need to accept before becoming a co-host.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel
              className="bg-gray-700 border-none hover:bg-gray-600 text-white"
              disabled={isSendingRequest}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={sendHostRequest}
              className="bg-blue-600 hover:bg-blue-500"
              disabled={isSendingRequest}
            >
              {isSendingRequest ? 'Sending...' : 'Send Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}