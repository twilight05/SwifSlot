import { Link } from 'react-router-dom';
import type { Vendor } from '../store/useAppStore';

interface VendorCardProps {
  vendor: Vendor;
}

export const VendorCard = ({ vendor }: VendorCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-sky-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
          {getInitials(vendor.name)}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-zinc-700 text-lg">{vendor.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Africa/Lagos
            </span>
          </div>
        </div>
      </div>
      
      <Link 
        to={`/vendor/${vendor.id}`}
        className="inline-flex items-center justify-center w-full px-4 py-2 border border-sky-600 text-sky-600 rounded-md hover:bg-sky-50 transition-colors font-medium"
      >
        See availability
      </Link>
    </div>
  );
};
