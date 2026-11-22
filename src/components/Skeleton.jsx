import React from 'react';

// Базовий елемент шимера
export const ShimmerBox = ({ className = '' }) => (
  <div className={`animate-shimmer rounded-[10px] ${className}`} />
);

// Скелетон списку курсів (Dashboard)
export const CourseCardSkeleton = () => (
  <div className="bg-white p-6 rounded-[20px] border border-[#152A32]/10 shadow-soft flex flex-col space-y-4">
    <div className="flex items-center gap-2">
      <ShimmerBox className="w-20 h-5 rounded-full" />
    </div>
    <div className="space-y-2">
      <ShimmerBox className="w-3/4 h-6" />
      <ShimmerBox className="w-full h-4" />
      <ShimmerBox className="w-2/3 h-4" />
    </div>
    <div className="pt-2">
      <ShimmerBox className="w-full h-11 rounded-[12px]" />
    </div>
  </div>
);

// Скелетон лідерборду (Dashboard)
export const LeaderboardSkeleton = () => (
  <div className="bg-white rounded-[20px] border border-[#152A32]/10 shadow-soft p-4 space-y-3.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between py-2 border-b border-[#152A32]/5 last:border-none">
        <div className="flex items-center gap-3">
          <ShimmerBox className="w-7 h-7 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <ShimmerBox className="w-24 h-4" />
            <ShimmerBox className="w-16 h-3" />
          </div>
        </div>
        <ShimmerBox className="w-12 h-6 rounded-full" />
      </div>
    ))}
  </div>
);

// Скелетон сторінки тесту (QuizPage)
export const QuizPageSkeleton = () => (
  <div className="max-w-[720px] mx-auto px-4 mt-8 space-y-6">
    <div className="flex justify-center">
      <ShimmerBox className="w-48 h-5" />
    </div>
    {[1, 2, 3].map((card) => (
      <div key={card} className="bg-white p-6 rounded-[20px] border border-[#152A32]/10 shadow-soft space-y-5">
        <div className="flex items-start gap-3">
          <ShimmerBox className="w-8 h-8 rounded-[10px] shrink-0" />
          <div className="space-y-2 flex-1">
            <ShimmerBox className="w-full h-5" />
            <ShimmerBox className="w-3/4 h-5" />
          </div>
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((opt) => (
            <ShimmerBox key={opt} className="w-full h-12 rounded-[12px]" />
          ))}
        </div>
      </div>
    ))}
  </div>
);
