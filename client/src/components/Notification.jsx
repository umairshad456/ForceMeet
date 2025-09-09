import { useEffect, useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
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
import axiosInstance from '../apis/axiosInstance';
import { toast } from 'react-toastify';

const HostRequestNotification = () => {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isResponding, setIsResponding] = useState(false);
  const call = useCall();

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    if (!userId || !call?.id) return;


    // pending host requests
    const checkForRequests = async () => {
      try {
        const response = await axiosInstance.get(`/api/notifications/pending-host-requests?userId=${userId}&callId=${call.id}&time=${Date.now()}`);
        if (response.data !== null) {
          setNotification(response.data);
          setOpen(true);
        }
      } catch (error) {
        console.error('Error checking for host requests:', error);
      }
    };

    // Check immediately
    checkForRequests();

    // Then check every 5 seconds
    const interval = setInterval(checkForRequests, 5000);
    return () => clearInterval(interval);
  }, [userId, call?.id, notification]);

  // handle response cancel or accept
  const handleResponse = async (accepted) => {

    console.log("accepted", accepted)

    if (!notification) return;
    setIsResponding(true);

    try {
      const response = await axiosInstance.post('/api/notifications/respond-host-request', {
        notificationId: notification._id,
        response: accepted,
        userId,
        callId: call?.id,
      });

      if (accepted) {
        toast.success("Host Role Accepted. You now have host controls.");
      } else {
        toast.error(response?.data?.message || "Host Role Declined.");
      }

    } catch (error) {
      console.log(error)
      console.log(error?.response?.data?.message)
    } finally {
      setIsResponding(false);
      setOpen(false);
      setNotification(null);
    }
  };

  if (!notification) return null;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isResponding && setOpen(isOpen)}>
      <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-500">Host Role Request</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            The meeting host has requested to make you a co-host. Accepting will give you
            additional meeting controls.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-5">
          <AlertDialogCancel
            onClick={() => handleResponse(false)}
            disabled={isResponding}
            className="bg-red-700 text-white border-none hover:bg-red-600 cursor-pointer"
          >
            Decline
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleResponse(true)}
            disabled={isResponding}
            className="bg-blue-600 hover:bg-blue-500 cursor-pointer"
          >
            {isResponding ? 'Processing...' : 'Accept'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default HostRequestNotification