'use client';

import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';

const schedules = [
  {
    id: 'sch-1',
    contractId: 'CTR-2025-002',
    cron: '0 0 1 * *',
    template: 'Monthly Maintenance Visit - Zone B',
    status: 'Running',
  },
];

export default function RecurringSchedules() {
  return (
    <Card>
      <CardBody className="p-0">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Automated Ticket Schedules (Temporal Workflow)</h3>
          <p className="text-sm text-gray-500 mt-1">These schedules automatically generate tickets based on active contracts.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-3">Schedule ID</th>
                <th className="px-6 py-3">Contract</th>
                <th className="px-6 py-3">Cron Expression</th>
                <th className="px-6 py-3">Task Template</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-600">{schedule.id}</td>
                  <td className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer">
                    {schedule.contractId}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-gray-600 bg-gray-100 rounded px-2 py-1 text-xs">
                        {schedule.cron}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{schedule.template}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                      {schedule.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No active schedules found for your contracts.
            </div>
          )} 
        </div>
      </CardBody>
    </Card>
  );
}
