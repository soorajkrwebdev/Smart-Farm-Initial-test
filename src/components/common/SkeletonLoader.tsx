import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs animate-pulse space-y-4">
          <div className="w-full h-44 bg-gray-200 rounded-xl" />
          <div className="space-y-2">
            <div className="w-3/4 h-4 bg-gray-200 rounded" />
            <div className="w-1/2 h-3 bg-gray-100 rounded" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="w-1/3 h-5 bg-gray-200 rounded" />
            <div className="w-1/4 h-8 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};
