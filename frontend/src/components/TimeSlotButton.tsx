import type { TimeSlot } from '../store/useAppStore';

interface TimeSlotProps {
  slot: TimeSlot;
  isSelected: boolean;
  isAvailable: boolean;
  isBooking?: boolean;
  onClick: (slot: TimeSlot) => void;
}

export const TimeSlotButton = ({ slot, isSelected, isAvailable, isBooking = false, onClick }: TimeSlotProps) => {
  const handleClick = () => {
    if (isAvailable && !isSelected && !isBooking) {
      onClick(slot);
    }
  };

  if (isBooking && isSelected) {
    return (
      <button
        disabled
        className="px-4 py-3 rounded-md text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 cursor-not-allowed"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Booking...</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isAvailable || isBooking}
      className={`
        px-4 py-3 rounded-md text-sm font-medium transition-colors
        ${
          isSelected
            ? 'bg-sky-600 text-white ring-2 ring-sky-300 ring-offset-2'
            : isAvailable
            ? 'border border-gray-300 text-zinc-700 hover:border-sky-300 hover:bg-sky-50'
            : 'border-2 border-red-300 text-red-500 cursor-not-allowed bg-red-50 opacity-75'
        }
      `}
    >
      {isAvailable ? slot.lagos_time : `${slot.lagos_time} - Booked`}
    </button>
  );
};
