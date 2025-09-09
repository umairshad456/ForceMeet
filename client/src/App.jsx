import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import "./index.css";
import 'react-datepicker/dist/react-datepicker.css'

// pages
import ProtectedRoute from './components/ProtectedRoutes';
import Layout from './pages/Layout';
import Home from './pages/home/Home';
import Signin from './pages/auth/Signin';
import Signup from './pages/auth/Signup';
import PersonalRoom from './pages/home/PersonalRoom';
import Previous from './pages/home/Previous';
import Recordings from './pages/home/Recordings';
import Upcoming from './pages/home/Upcoming';
import Meeting from './pages/meeting/Meeting';
import MeetingCalendar from './pages/home/MeetingCalendar';
import ThankYouPage from './pages/ThankYouPage'
// auth store
import useAuthStore from './store/useAuthStore';

const App = () => {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/meeting/:id" element={<Meeting />} />
        <Route path="/thank-you" element={<ThankYouPage />} />

        {/*layout with protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/personal-room" element={<PersonalRoom />} />
            <Route path="/previous" element={<Previous />} />
            <Route path="/recordings" element={<Recordings />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/calendar" element={<MeetingCalendar />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;

