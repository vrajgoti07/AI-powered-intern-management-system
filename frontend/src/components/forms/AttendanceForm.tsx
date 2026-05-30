import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { attendanceSchema, AttendanceFormData } from '../../schemas/validation';

export const AttendanceForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema) as any,
    defaultValues: {
      status: 'PRESENT',
    }
  });

  const status = useWatch({ control, name: 'status' });
  const requiresTimes = status === 'PRESENT' || status === 'LATE' || status === 'HALF_DAY';

  const onSubmit = async (data: any) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded shadow-md">
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          {...register('date')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          {...register('status')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        >
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="LATE">Late</option>
          <option value="HALF_DAY">Half Day</option>
        </select>
        {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
      </div>

      {requiresTimes && (
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Check In</label>
            <input
              type="time"
              {...register('checkIn')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
            {errors.checkIn && <p className="mt-1 text-sm text-red-600">{errors.checkIn.message}</p>}
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Check Out</label>
            <input
              type="time"
              {...register('checkOut')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
            {errors.checkOut && <p className="mt-1 text-sm text-red-600">{errors.checkOut.message}</p>}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
      </button>
    </form>
  );
};
