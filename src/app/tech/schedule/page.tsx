'use client';

import { CalendarDays, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function TechSchedulePage() {
  const today = new Date();
  const currentMonth = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch trình</h1>
          <p className="text-gray-500 mt-1">Quản lý lịch làm việc và di chuyển</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-medium capitalize">{currentMonth}</span>
          <button className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {daysOfWeek.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells (placeholder) */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }, (_, i) => {
            const dayNum = i - 2; // offset for month start
            const isCurrentMonth = dayNum >= 0 && dayNum < 28;
            const isToday = dayNum === today.getDate() - 1;

            return (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r p-2 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-300' : ''
                } ${isToday ? 'bg-purple-50' : ''}`}
              >
                <span className={`text-sm ${isToday ? 'bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                  {isCurrentMonth ? dayNum + 1 : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-purple-600" />
          Lịch trình hôm nay
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Clock className="w-12 h-12 mb-3" />
          <p>Không có lịch trình trong hôm nay</p>
          <p className="text-xs mt-1">Các công việc được lên lịch sẽ hiển thị tại đây</p>
        </div>
      </div>
    </div>
  );
}
