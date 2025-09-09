import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  return (
    <>
      <nav className="flex justify-between items-center z-50 w-full bg-gray-700 px-6 py-2 lg:px-10 sticky top-0">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/icons/logo.svg"
            width={50}
            height={50}
            alt="logo"
            className="max-sm:size-10"
          />
          <p className="text-[26px] font-extrabold text-white max-sm:hidden">
            FAIR FORSE MEETING
          </p>
        </Link>

        <div className='flex-shrink-0'>
          {/* Render nothing while loading to prevent flashes */}
          {isLoading ? (
            <div className="w-[170px] h-10"></div> // Placeholder to maintain space
          ) : (
            !isAuthenticated ? (
              <>
                <Link to="/signin">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mr-2">
                    SignIn
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                    SignUp
                  </button>
                </Link>
              </>
            ) : (
              // profile dropdown
              <ProfileDropdown user={user} />
            )
          )}
        </div>
      </nav>

    </>
  );
};

export default Navbar;