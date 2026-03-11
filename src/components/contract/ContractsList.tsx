'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  PenTool, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useContracts } from '@/hooks/useContracts';
import { ContractStatus, contractStatusToString } from '@/types/contract';
import type { Contract } from '@/types/contract';

const StatusBadge = ({ status }: { status: ContractStatus | string }) => {
  const statusStr = typeof status === 'number' ? contractStatusToString(status) : status;
  
  const styles: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    'Pending Signature': 'bg-blue-100 text-blue-700',
    Expired: 'bg-orange-100 text-orange-700',
    Draft: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
    Renewed: 'bg-purple-100 text-purple-700',
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[statusStr] || 'bg-gray-100 text-gray-700'}`}>
      {statusStr}
    </span>
  );
};

interface ContractsListProps {
  onViewContract?: (contract: Contract) => void;
  onSignContract?: (contract: Contract) => void;
  onRenewContract?: (contract: Contract) => void;
}

export default function ContractsList({ 
  onViewContract,
  onSignContract,
  onRenewContract,
}: ContractsListProps) {
  const { 
    contracts, 
    loading, 
    error, 
    totalCount,
    listContracts,
    sendForSignature,
    approveRenewal,
  } = useContracts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Load contracts on mount
  useEffect(() => {
    listContracts();
  }, [listContracts]);

  // Calculate stats from contracts data
  const stats = useMemo(() => {
    const activeCount = contracts.filter(c => c.status === ContractStatus.ACTIVE).length;
    const pendingCount = contracts.filter(c => c.status === ContractStatus.PENDING_SIGNATURE).length;
    
    // Count contracts expiring within 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = contracts.filter(c => {
      const endDate = new Date(c.endDate);
      return c.status === ContractStatus.ACTIVE && endDate <= thirtyDaysFromNow && endDate >= now;
    }).length;
    
    const totalValue = contracts.reduce((sum, c) => sum + (c.totalValue || 0), 0);
    const formattedValue = totalValue >= 1000000 
      ? `${(totalValue / 1000000).toFixed(0)}M` 
      : totalValue >= 1000 
        ? `${(totalValue / 1000).toFixed(0)}K`
        : String(totalValue);

    return [
      { label: 'Active Contracts', value: String(activeCount), icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100' },
      { label: 'Pending Signature', value: String(pendingCount), icon: PenTool, color: 'text-blue-600', bg: 'bg-blue-100' },
      { label: 'Expiring Soon', value: String(expiringSoonCount), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
      { label: 'Total Value', value: formattedValue, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];
  }, [contracts]);

  // Filter contracts based on search and status
  const filteredContracts = useMemo(() => {
    let filtered = contracts;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.id.toLowerCase().includes(term) ||
        c.customerId?.toLowerCase().includes(term) ||
        c.customerName?.toLowerCase().includes(term) ||
        c.customerEmail?.toLowerCase().includes(term) ||
        c.customerPhone?.toLowerCase().includes(term) ||
        c.title?.toLowerCase().includes(term) ||
        c.templateName?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== null) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    return filtered;
  }, [contracts, searchTerm, statusFilter]);

  const handleSendForSignature = async (contract: Contract) => {
    await sendForSignature(contract.id);
  };

  const handleRenewal = async (contract: Contract) => {
    // Calculate new end date (1 year from current end date)
    const currentEndDate = new Date(contract.endDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    
    if (onRenewContract) {
      onRenewContract(contract);
    } else {
      await approveRenewal(contract.id, newEndDate.toISOString().split('T')[0]);
    }
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading contracts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading contracts</p>
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => listContracts()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="animate-contract-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filter & Search */}
      <Card className="animate-contract-fade-up" style={{ animationDelay: '120ms' }}>
        <CardBody className="p-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search contracts..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  Filter Status
                  {statusFilter !== null && (
                    <span className="ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs">
                      1
                    </span>
                  )}
                </Button>
                
                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${statusFilter === null ? 'bg-blue-50 text-blue-600' : ''}`}
                        onClick={() => { setStatusFilter(null); setShowFilterMenu(false); }}
                      >
                        All Statuses
                      </button>
                      {[
                        { value: ContractStatus.ACTIVE, label: 'Active' },
                        { value: ContractStatus.PENDING_SIGNATURE, label: 'Pending Signature' },
                        { value: ContractStatus.EXPIRED, label: 'Expired' },
                        { value: ContractStatus.DRAFT, label: 'Draft' },
                        { value: ContractStatus.CANCELLED, label: 'Cancelled' },
                      ].map(option => (
                        <button
                          key={option.value}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${statusFilter === option.value ? 'bg-blue-50 text-blue-600' : ''}`}
                          onClick={() => { setStatusFilter(option.value); setShowFilterMenu(false); }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3">Contract ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Template</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || statusFilter !== null 
                        ? 'No contracts match your filters'
                        : 'No contracts found'}
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract, index) => {
                    const statusStr = contractStatusToString(contract.status as ContractStatus);
                    return (
                      <tr key={contract.id} className="hover:bg-gray-50/50 animate-contract-fade-up" style={{ animationDelay: `${180 + index * 35}ms` }}>
                        <td className="px-6 py-4 font-medium">
                          <div className="text-blue-600 font-bold">{contract.id}</div>
                          <div className="text-xs text-gray-400">Ref: {contract.quotationId}</div>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          <div className="group/customer relative inline-block max-w-[220px] cursor-help">
                            <div className="truncate text-gray-800">
                              {contract.customerName || contract.customerId || '-'}
                            </div>
                            <div className="pointer-events-none absolute left-0 top-full mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-20 opacity-0 invisible translate-y-1 transition-all duration-150 ease-out group-hover/customer:opacity-100 group-hover/customer:visible group-hover/customer:translate-y-0">
                              <div className="text-xs font-semibold text-gray-900 truncate">
                                {contract.customerName || 'Unknown Customer'}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">ID: {contract.customerId || '-'}</div>
                              <div className="mt-2 space-y-1.5 text-[11px] text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="truncate">{contract.customerEmail || 'Chua co email'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="truncate">{contract.customerPhone || 'Chua co so dien thoai'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 truncate max-w-xs" title={contract.templateName || contract.title}>
                          {contract.templateName || contract.title}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex flex-col text-xs space-y-1">
                            <span className="font-medium">{contract.startDate}</span>
                            <span className="text-gray-400 text-[10px] pl-2">to</span>
                            <span className="font-medium">{contract.endDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={contract.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {contract.status === ContractStatus.DRAFT && (
                              <button 
                                className="p-1 hover:bg-gray-100 rounded text-purple-600 transition-colors" 
                                title="Lấy chữ ký"
                                onClick={() => onSignContract ? onSignContract(contract) : handleSendForSignature(contract)}
                              >
                                <PenTool className="w-4 h-4" />
                              </button>
                            )}
                            {contract.status === ContractStatus.EXPIRED && (
                              <button 
                                className="p-1 hover:bg-gray-100 rounded text-green-600 transition-colors" 
                                title="Renew"
                                onClick={() => handleRenewal(contract)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors" 
                              title="View"
                              onClick={() => onViewContract?.(contract)}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {totalCount > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
              Showing {filteredContracts.length} of {totalCount} contracts
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
