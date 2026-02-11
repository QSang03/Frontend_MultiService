'use client';

import React, { useState } from 'react';
import { Activity, Shield, Settings, Download, MapPin, AlertCircle, CheckCircle, Clock, MessageSquare, Mail, Bell } from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid SSR issues
const MapView = dynamic(() => import('@/components/system/MapView'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 animate-pulse rounded-lg"></div>,
});

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'audit' | 'config'>('monitor');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Mock field technicians data
  const technicians = [
    { id: 'T1', name: 'Tech A', lat: 10.7769, lng: 106.7009, status: 'available', color: 'blue' },
    { id: 'T2', name: 'Tech B', lat: 10.7825, lng: 106.6995, status: 'critical', color: 'red' },
    { id: 'T3', name: 'Tech C', lat: 10.7723, lng: 106.7112, status: 'available', color: 'green' },
  ];

  // Mock pending dispatch
  const pendingDispatch = [
    { id: 1, ticket: '#T-9925', location: 'Server Room - District 1', priority: 'CRITICAL', priorityColor: 'bg-red-100 text-red-700' },
    { id: 2, ticket: '#T-9926', location: 'Printer Jam - Office B', priority: 'HIGH', priorityColor: 'bg-orange-100 text-orange-700' },
  ];

  // Mock infrastructure health
  const infraHealth = [
    { id: 1, name: 'API Gateway', status: 'Operational', statusColor: 'text-green-600', latency: '45ms' },
    { id: 2, name: 'PostgreSQL', status: 'Operational', statusColor: 'text-green-600', latency: '12ms' },
    { id: 3, name: 'Redis Cache', status: 'Operational', statusColor: 'text-green-600', latency: '3ms' },
    { id: 4, name: 'Temporal', status: 'Processing', statusColor: 'text-yellow-600', latency: '240 w/m' },
  ];

  // Mock audit logs
  const auditLogs = [
    {
      id: 1,
      type: 'PRICE_UPDATE',
      description: 'Service #22 base_price changed',
      before: ': 200,000',
      after: ': 250,000',
      actor: 'admin@gxs.com',
      timestamp: 'LOG-00012',
      time: '4 min ago',
    },
    {
      id: 2,
      type: 'ROLE_GRANT',
      description: 'User #442 granted SCOPE_FINANCE_READ',
      before: ': null',
      after: ': ALLOW',
      actor: 'admin@gxs.com',
      timestamp: 'LOG-00013',
      time: '8 min ago',
    },
    {
      id: 3,
      type: 'TENANT_CREATE',
      description: 'New Tenant Org: LogisticsGlobal',
      before: ': null',
      after: ': {id: "t-1", plan: "starter"}',
      actor: 'system',
      timestamp: 'LOG-00018',
      time: '1 week ago',
    },
  ];

  // Mock notification channels
  const notificationChannels = [
    { id: 1, name: 'Twilio (SMS)', icon: MessageSquare, usage: '3,500', quota: '5,000', status: 'Connected', statusColor: 'bg-green-100 text-green-700' },
    { id: 2, name: 'SendGrid (Email)', icon: Mail, usage: '8,500', quota: '20,000', status: 'Connected', statusColor: 'bg-green-100 text-green-700' },
    { id: 3, name: 'Firebase (Push)', icon: Bell, usage: '~500', quota: '100,000', status: 'Connected', statusColor: 'bg-green-100 text-green-700' },
  ];

  // Mock SLA rules
  const slaRules = [
    { id: 1, name: 'Pending Customer', label: 'STOP CLOCK', days: 3 },
    { id: 2, name: 'Pending Vendor', label: 'STOP CLOCK', days: 15 },
    { id: 3, name: 'Scheduled', label: 'STOP CLOCK', days: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader 
        title="System Settings"
        icon={<Settings className="w-6 h-6" />}
      />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">System Settings & Dashboard</h1>
            <p className="text-gray-600">Live monitoring, Audit Logs, and Global configurations.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" />
            Export System Report
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'monitor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-5 h-5" />
            Live Monitor & Dispatch
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            Immutable Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            Global Config
          </button>
        </div>

        {/* Live Monitor & Dispatch Tab */}
        {activeTab === 'monitor' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left 2/3 - Map */}
            <div className="col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Field Operations Map</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                      🗺️ Heatmap
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                      📡 Dispatch Mode (Lasso)
                    </button>
                  </div>
                </div>
                <div style={{ height: '500px' }} className="rounded-lg overflow-hidden">
                  <MapView technicians={technicians} />
                </div>
              </div>
            </div>

            {/* Right 1/3 - Pending Dispatch & Infra Health */}
            <div className="col-span-1 space-y-6">
              {/* Pending Dispatch */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Dispatch</h2>
                <div className="space-y-3">
                  {pendingDispatch.map((item) => (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-red-600">{item.ticket}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${item.priorityColor}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{item.location}</p>
                      {item.priority === 'CRITICAL' ? (
                        <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                          Auto-Assign Nearest (3km)
                        </button>
                      ) : (
                        <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Manual Assign
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Infra Health */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Infra Health</h2>
                <div className="space-y-3">
                  {infraHealth.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className={`text-sm font-semibold ${item.statusColor}`}>
                          {item.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{item.latency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Immutable Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Immutable Audit Logs (CDC Enabled)</h2>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700">Integrity Check Passed</p>
                  <p className="text-sm text-gray-600">Last verification: 2 mins ago. Hash chain intact</p>
                </div>
                <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  🔍 Verify Chain
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                          {log.timestamp}
                        </span>
                        <span className="font-semibold text-gray-900">{log.type}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded p-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">BEFORE</p>
                      <p className="text-sm font-mono text-red-600">{log.before}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">AFTER</p>
                      <p className="text-sm font-mono text-green-600">{log.after}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3 text-right">
                    Performed by: {log.actor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* System Maintenance Control */}
            <div className="bg-white rounded-lg border-2 border-red-200 p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">System Maintenance Control</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Activate &apos;Maintenance Mode&apos; to block user access during upgrades. Whitelisted IPs can still access.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded font-semibold ${maintenanceMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {maintenanceMode ? 'Maintenance Active' : 'System Operational'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={maintenanceMode} 
                          onChange={(e) => setMaintenanceMode(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Notification Switchboard */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Switchboard</h2>

                <div className="space-y-4">
                  {notificationChannels.map((channel) => (
                    <div key={channel.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <channel.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                          <p className="text-sm text-gray-600">{channel.usage} / {channel.quota} sent today</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${channel.statusColor}`}>
                          {channel.status}
                        </span>
                      </div>
                      <button className="w-full px-3 py-1.5 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition-colors">
                        Config Retry
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs font-semibold text-gray-700 mb-2">ROUTING RULES</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-white border rounded">Critical → SMS + Push</span>
                    <span className="px-2 py-1 bg-white border rounded">Info → Email</span>
                  </div>
                </div>
              </div>

              {/* SLA & Temporal Rules */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">SLA & Temporal Rules</h2>

                <div className="space-y-3 mb-6">
                  {slaRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                        <p className="text-sm text-gray-600">
                          Action: <span className="font-medium">Pause Timer</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-yellow-600 text-white text-sm font-semibold rounded">
                          {rule.label}
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          {rule.days === 0 ? 'DAYS TO AUTO-CLOSE' : `${rule.days} DAYS TO AUTO-CLOSE`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-900">
                      Temporal Workflow actively monitoring 1,240 tickets
                    </p>
                  </div>
                  <p className="text-xs text-blue-700">
                    Auto-escalation, SLA breach alerts, and scheduled actions running in background
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
