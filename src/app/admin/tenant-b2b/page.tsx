'use client';

import React, { useState } from 'react';
import { Building2, Users, Database, Shield, Lock, AlertCircle, CheckCircle, ArrowRight, Key, PlayCircle } from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';

export default function TenantB2BPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'onboarding' | 'security'>('directory');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('starter');

  // Mock tenant data
  const tenants = [
    {
      id: 1,
      name: 'TechCorp Industries',
      subdomain: 'techcorp.multiservice.io',
      plan: 'ENTERPRISE',
      planColor: 'bg-purple-100 text-purple-700',
      users: { current: 145, max: 200 },
      storage: { current: 450, max: 1000, unit: 'GB' },
      tickets: { current: 1200, max: 5000 },
    },
    {
      id: 2,
      name: 'Global Logistics LTD',
      subdomain: 'logistics.multiservice.io',
      plan: 'GROWTH',
      planColor: 'bg-blue-100 text-blue-700',
      users: { current: 42, max: 50 },
      storage: { current: 120, max: 500, unit: 'GB' },
      tickets: { current: 450, max: 2000 },
    },
  ];

  // Mock provisioning queue
  const provisioningQueue = [
    {
      id: 1,
      name: 'StartUp Hub',
      plan: 'Starter',
      step: 2,
      totalSteps: 4,
      progress: 50,
    },
  ];

  // Mock impersonation audit log
  const auditLog = [
    {
      id: 1,
      user: 'Admin System',
      tenant: 'Global Logistics LTD',
      reason: 'Debug SLA Workflow Error',
      status: 'ACTIVE',
      statusColor: 'bg-red-100 text-red-700',
      time: '10 mins ago',
    },
    {
      id: 2,
      user: 'Support Lead',
      tenant: 'TechCorp Industries',
      reason: 'Configuring SSO',
      status: 'ENDED',
      statusColor: 'bg-gray-100 text-gray-700',
      time: '2 hours ago',
    },
  ];

  const sqlPolicy = `-- POLICY: TENANT_ISOLATION
CREATE POLICY tenant_isolation ON all_tables
FOR ALL
TO ALL
USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader 
        title="Tenant B2B"
        icon={<Building2 className="w-6 h-6" />}
      />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Tenant Management (B2B)</h1>
            <p className="text-gray-600">Multi-tenancy orchestration, RLS isolation, and Subscription Quotas.</p>
          </div>
          {activeTab === 'onboarding' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Building2 className="w-4 h-4" />
              Start New Provisioning
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'directory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Directory & Quota
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'onboarding'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <PlayCircle className="w-5 h-5" />
            Onboarding Pipeline
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            Security & Isolation (RLS)
          </button>
        </div>

        {/* Directory & Quota Tab */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">
                        {tenant.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{tenant.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="text-gray-400">🌐</span>
                        {tenant.subdomain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded text-sm font-semibold ${tenant.planColor}`}>
                      {tenant.plan}
                    </span>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                      <Lock className="w-4 h-4" />
                      Support Access
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      •••
                    </button>
                  </div>
                </div>

                {/* Usage Metrics */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Users */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Users</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {tenant.users.current} / {tenant.users.max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(tenant.users.current / tenant.users.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Storage */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Storage</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {tenant.storage.current} / {tenant.storage.max} {tenant.storage.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(tenant.storage.current / tenant.storage.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tickets/Mo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Tickets/Mo</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {tenant.tickets.current} / {tenant.tickets.max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(tenant.tickets.current / tenant.tickets.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Onboarding Pipeline Tab */}
        {activeTab === 'onboarding' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left 2/3 - Onboarding Wizard */}
            <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Onboarding Wizard</h2>

              {/* Steps */}
              <div className="flex items-center justify-between mb-8">
                {[
                  { step: 1, label: 'Org Profile' },
                  { step: 2, label: 'Workspace' },
                  { step: 3, label: 'Admin User' },
                  { step: 4, label: 'Activation' },
                ].map((item, idx) => (
                  <React.Fragment key={item.step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                        onboardingStep === item.step
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : onboardingStep > item.step
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {onboardingStep > item.step ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <span className="text-lg font-bold">{item.step}</span>
                        )}
                      </div>
                      <p className={`text-sm font-medium ${
                        onboardingStep === item.step ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {item.label}
                      </p>
                    </div>
                    {idx < 3 && (
                      <div className={`flex-1 h-0.5 mx-4 mb-8 ${
                        onboardingStep > item.step ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Organization Profile */}
              {onboardingStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Organization Profile</h3>
                  <p className="text-sm text-gray-600 mb-6">Enter the legal entity details for billing and contracts.</p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Acme Inc"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tax ID / Business Reg
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 0102020405"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Subscription Plan
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {['starter', 'growth', 'enterprise'].map((plan) => (
                          <button
                            key={plan}
                            onClick={() => setSelectedPlan(plan)}
                            className={`px-4 py-3 border-2 rounded-lg font-semibold capitalize transition-all ${
                              selectedPlan === plan
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {plan}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                    <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                      ← Back
                    </button>
                    <button 
                      onClick={() => setOnboardingStep(2)}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Placeholder for other steps */}
              {onboardingStep > 1 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Step {onboardingStep} content...</p>
                  <div className="flex items-center justify-between mt-8">
                    <button 
                      onClick={() => setOnboardingStep(onboardingStep - 1)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      ← Back
                    </button>
                    {onboardingStep < 4 && (
                      <button 
                        onClick={() => setOnboardingStep(onboardingStep + 1)}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Next Step
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right 1/3 - Pending Provisioning */}
            <div className="col-span-1 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Provisioning</h2>

                {provisioningQueue.map((item) => (
                  <div key={item.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <span className="px-2 py-1 bg-orange-600 text-white text-xs font-semibold rounded">
                        Step {item.step}/{item.totalSteps}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Plan: {item.plan}</p>
                    <div className="w-full bg-orange-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <PlayCircle className="w-4 h-4" />
                      Resume Onboarding
                    </button>
                  </div>
                ))}
              </div>

              {/* Provisioning Token */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Provisioning Token</h3>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Use this token to authorize CLI provisioning or API-based onboarding
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 font-mono text-xs text-blue-800 break-all">
                  st_live_provision_P8J84...==82
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security & Isolation Tab */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Left - PostgreSQL RLS Policy */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">PostgreSQL Policy Enforcement Status</h2>
              </div>
              <span className="inline-block px-3 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded mb-6">
                ACTIVE & ENFORCED
              </span>

              <div className="bg-[#1e1e1e] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400 uppercase font-semibold">
                    -- POLICY: TENANT_ISOLATION
                  </span>
                </div>
                <pre className="text-sm font-mono text-gray-300">
                  <code dangerouslySetInnerHTML={{ __html: sqlPolicy
                    .replace(/CREATE POLICY/g, '<span style="color: #569cd6">CREATE POLICY</span>')
                    .replace(/tenant_isolation/g, '<span style="color: #4ec9b0">tenant_isolation</span>')
                    .replace(/ON/g, '<span style="color: #569cd6">ON</span>')
                    .replace(/FOR ALL/g, '<span style="color: #569cd6">FOR ALL</span>')
                    .replace(/TO ALL/g, '<span style="color: #569cd6">TO ALL</span>')
                    .replace(/USING/g, '<span style="color: #569cd6">USING</span>')
                    .replace(/all_tables/g, '<span style="color: #4ec9b0">all_tables</span>')
                    .replace(/tenant_id/g, '<span style="color: #9cdcfe">tenant_id</span>')
                    .replace(/current_setting/g, '<span style="color: #dcdcaa">current_setting</span>')
                    .replace(/'app.current_tenant_id'/g, '<span style="color: #ce9178">\'app.current_tenant_id\'</span>')
                    .replace(/::uuid/g, '<span style="color: #4ec9b0">::uuid</span>')
                  }} />
                </pre>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Leak Proof</span>
                <span className="mx-2 text-gray-300">•</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Context Injected</span>
              </div>

              <button className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Run Isolation Simulation Test
              </button>
            </div>

            {/* Right - Impersonation Audit Log */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Impersonation Audit Log</h2>

              <div className="space-y-3">
                {auditLog.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{log.user}</h3>
                          <p className="text-sm text-gray-600">Accessed {log.tenant}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${log.statusColor}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2 mb-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {log.reason}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{log.time}</p>
                  </div>
                ))}
              </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Security Notice</h4>
                    <p className="text-sm text-yellow-800">
                      All impersonation sessions are logged and require MFA approval. Sessions auto-expire after 30 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
