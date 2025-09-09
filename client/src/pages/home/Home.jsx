import React, { useState, useEffect } from 'react';
import MeetingTypeList from '../../components/MeetingTypeList';

const Home = () => {
  const [currentTime, setCurrentTime] = useState(new Date());


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer); 
  }, []);

  const time = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const date = currentTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div className="h-[300px] w-full rounded-[20px] bg-hero bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <div className="glassmorphism max-w-[270px] text-center p-4 rounded-lg">
            <h2 className="text-base font-normal">
              Upcoming meeting at 12:30
            </h2>
            <div className="flex flex-col gap-2 mt-2">
              <h1 className="text-2xl font-extrabold lg:text-4xl">
                {time}
              </h1>
              <p className="text-base font-medium text-sky-100 lg:text-lg">
                {date}
              </p>
            </div>
          </div>
        </div>
      </div>
      <MeetingTypeList />
    </section>
  );
};

export default Home; 