import React from 'react';
import clsx from 'clsx';

const MeetingCard = ({
  icon,
  title,
  date,
  createdAt,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
}) => {
  return (
    <section
      className={clsx(
        'flex min-h-[280px] w-full flex-col justify-between rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-6 shadow-lg transition-all hover:shadow-xl xl:max-w-[568px]'
      )}
    >
      <article className="flex flex-col gap-4">
        <img src={icon} alt="meeting icon" width={32} height={32} className="text-white" />
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-white line-clamp-1">{title}</h1>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-blue-100">
              <span className="font-semibold">Scheduled:</span>{' '}
              {new Date(date).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })}
            </p>
            <p className="text-xs font-normal text-blue-200">
              <span className="font-semibold">Created:</span>{' '}
              {new Date(createdAt).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </article>
      <article className="flex justify-end gap-3 mt-4">
        {!isPreviousMeeting && (
          <>
            <button
              onClick={handleClick}
              className="flex items-center gap-2 rounded-lg bg-blue-400 px-4 py-2 text-sm font-medium text-white hover:bg-blue-300 transition-colors"
            >
              {buttonIcon1 && (
                <img src={buttonIcon1} alt="feature" width={16} height={16} />
              )}
              {buttonText || 'Start'}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(link);
                alert('Link Copied');
              }}
              className="flex items-center gap-2 rounded-lg bg-gray-400 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-300 transition-colors"
            >
              <img src="/icons/copy.svg" alt="copy" width={16} height={16} />
              Copy Link
            </button>
          </>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;