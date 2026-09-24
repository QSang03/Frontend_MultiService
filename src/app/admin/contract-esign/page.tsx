'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Plus, FileCode, CalendarClock } from 'lucide-react';
import Button from '@/components/ui/Button';
import ContractsList from '@/components/contract/ContractsList';
import TemplatesList from '@/components/contract/TemplatesList';
import RecurringSchedules from '@/components/contract/RecurringSchedules';
import CreateContractModal from '@/components/contract/CreateContractModal';
import ContractDetailModal from '@/components/contract/ContractDetailModal';
import CancelContractModal from '@/components/contract/CancelContractModal';
import { useContracts } from '@/hooks/useContracts';
import type { Contract, ContractTemplate } from '@/types/contract';

export default function ContractPage() {
  const [activeTab, setActiveTab] = useState<'contracts' | 'templates' | 'schedules'>('contracts');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const {
    cancelContract,
    sendForSignature,
    activateContract,
    approveRenewal,
    listTemplates,
  } = useContracts();

  // Load templates for create modal
  const handleOpenCreateModal = useCallback(async () => {
    const result = await listTemplates();
    setTemplates(result);
    setShowCreateModal(true);
  }, [listTemplates]);

  // Trigger refresh after contract creation
  const handleContractCreated = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // View contract detail
  const handleViewContract = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  }, []);

  // Open cancel modal
  const handleOpenCancelModal = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailModal(false);
    setShowCancelModal(true);
  }, []);

  // Cancel contract
  const handleCancelContract = useCallback(async (contractId: string, reason: string) => {
    setModalLoading(true);
    try {
      const result = await cancelContract(contractId, reason);
      if (result) {
        setShowCancelModal(false);
        setSelectedContract(null);
        setRefreshKey(prev => prev + 1); // Refresh list
      }
    } finally {
      setModalLoading(false);
    }
  }, [cancelContract]);

  // Send for signature
  const handleSendForSignature = useCallback(async (contract: Contract) => {
    setModalLoading(true);
    try {
      const result = await sendForSignature(contract.id);
      if (result?.signingUrl) {
        window.open(result.signingUrl, '_blank');
      }
      setRefreshKey(prev => prev + 1); // Refresh list
    } finally {
      setModalLoading(false);
    }
  }, [sendForSignature]);

  // Activate contract
  const handleActivateContract = useCallback(async (contract: Contract) => {
    setModalLoading(true);
    try {
      await activateContract(contract.id);
      setShowDetailModal(false);
      setRefreshKey(prev => prev + 1); // Refresh list
    } finally {
      setModalLoading(false);
    }
  }, [activateContract]);

  // Renew contract  
  const handleRenewContract = useCallback(async (contract: Contract, newEndDate: string) => {
    setModalLoading(true);
    try {
      await approveRenewal(contract.id, newEndDate);
      setShowDetailModal(false);
      setRefreshKey(prev => prev + 1); // Refresh list
    } finally {
      setModalLoading(false);
    }
  }, [approveRenewal]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract & E-Signature</h1>
          <p className="text-gray-500 mt-1">
            Manage lifecycle, digital signing, and automated recurring tickets.
          </p>
        </div>
        <Button leftIcon={<Plus className="w-5 h-5" />} onClick={handleOpenCreateModal}>
          New Contract
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'contracts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          All Contracts
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'schedules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          Recurring Schedules
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'contracts' && (
          <ContractsList 
            key={refreshKey}
            onViewContract={handleViewContract}
            onSignContract={handleSendForSignature}
            onRenewContract={(contract) => {
              setSelectedContract(contract);
              setShowDetailModal(true);
            }}
          />
        )}
        {activeTab === 'templates' && <TemplatesList />}
        {activeTab === 'schedules' && <RecurringSchedules />}
      </div>

      {/* Create Contract Modal */}
      <CreateContractModal
        open={showCreateModal}
        templates={templates}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleContractCreated}
      />

      {/* Contract Detail Modal */}
      <ContractDetailModal
        open={showDetailModal}
        contract={selectedContract}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedContract(null);
        }}
        onSendForSignature={handleSendForSignature}
        onActivate={handleActivateContract}
        onCancel={async (contract) => {
          handleOpenCancelModal(contract);
        }}
        onRenew={handleRenewContract}
        isLoading={modalLoading}
      />

      {/* Cancel Contract Modal */}
      <CancelContractModal
        open={showCancelModal}
        contractId={selectedContract?.id || ''}
        contractTitle={selectedContract?.title}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedContract(null);
        }}
        onConfirm={handleCancelContract}
        isLoading={modalLoading}
      />
    </div>
  );
}
