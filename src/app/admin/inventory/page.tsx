'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Package, RotateCcw, Activity, Calculator, Search, Download, Truck, AlertTriangle, BarChart3, FileText, Plus, RefreshCw, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';
import AddItemModal, { type CreateItemData } from '@/components/AddItemModal';
import EditItemModal, { type UpdateItemData } from '@/components/EditItemModal';
import AdjustStockModal, { type AdjustStockData } from '@/components/AdjustStockModal';
import internalApiClient from '@/lib/api/internal-client';

// Types
type CostingMethod = 'COSTING_METHOD_UNSPECIFIED' | 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_ID';

interface InventoryItem {
  id: string;
  skuCode: string;
  name: string;
  categoryId?: string;
  description?: string;
  minStockLevel: number;
  costingMethod: CostingMethod;
  metadata?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Stock info (fetched separately)
  totalQuantity?: number;
  avgCost?: number;
}

interface StockStatus {
  totalQuantity: string;
  currentAvgCost: string;
  batches: Array<{
    id: string;
    itemId: string;
    batchNumber?: string;
    quantity: string;
    unitCost: string;
    createdAt?: string;
  }>;
}

// Helper to format currency
const formatCurrency = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return '0 đ';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 đ';
  return num.toLocaleString('vi-VN') + ' đ';
};

// Helper to format costing method
const formatCostingMethod = (method: CostingMethod): string => {
  switch (method) {
    case 'FIFO': return 'FIFO';
    case 'WEIGHTED_AVERAGE': return 'Weighted Avg';
    case 'SPECIFIC_ID': return 'Specific ID';
    default: return 'N/A';
  }
};

// Helper to get stock status
const getStockStatus = (quantity: number, minLevel: number): { label: string; color: string } => {
  if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
  if (quantity <= minLevel) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' };
  return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'rma' | 'lifecycle' | 'costing'>('stock');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalValue: 0,
    lowStockCount: 0,
    pendingInbound: 0,
  });

  // Fetch inventory items
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.get('/api/admin/inventory/items', {
        params: {
          pageSize: 100,
          isActive: true,
        },
      });
      
      const items = response.data.items || [];
      
      // Fetch stock status for each item
      const itemsWithStock = await Promise.all(
        items.map(async (item: InventoryItem) => {
          try {
            const stockResponse = await internalApiClient.get('/api/admin/inventory/stock', {
              params: { itemId: item.id },
            });
            const stockData = stockResponse.data as StockStatus;
            return {
              ...item,
              totalQuantity: parseInt(stockData.totalQuantity || '0', 10),
              avgCost: parseFloat(stockData.currentAvgCost || '0'),
            };
          } catch {
            return {
              ...item,
              totalQuantity: 0,
              avgCost: 0,
            };
          }
        })
      );
      
      setInventoryItems(itemsWithStock);
      
      // Calculate stats
      let totalValue = 0;
      let lowStockCount = 0;
      
      itemsWithStock.forEach((item: InventoryItem) => {
        const qty = item.totalQuantity || 0;
        const cost = item.avgCost || 0;
        totalValue += qty * cost;
        
        if (qty <= item.minStockLevel) {
          lowStockCount++;
        }
      });
      
      setStats({
        totalValue,
        lowStockCount,
        pendingInbound: 2, // Mock for now
      });
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('Failed to load inventory items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle create item
  const handleCreateItem = async (data: CreateItemData) => {
    const response = await internalApiClient.post('/api/admin/inventory/items', data);
    if (response.data.item) {
      await fetchItems(); // Refresh the list
    }
  };

  // Handle update item
  const handleUpdateItem = async (data: UpdateItemData) => {
    const response = await internalApiClient.put('/api/admin/inventory/items', data);
    if (response.data.item) {
      await fetchItems(); // Refresh the list
    }
  };

  // Handle adjust stock
  const handleAdjustStock = async (data: AdjustStockData) => {
    const response = await internalApiClient.post('/api/admin/inventory/stock', data);
    if (response.data.transaction) {
      await fetchItems(); // Refresh the list
    }
  };

  // Open adjust stock modal
  const openAdjustStockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAdjustStockModalOpen(true);
  };

  const openEditItemModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditItemModalOpen(true);
  };

  // Filter items by search query
  const filteredItems = inventoryItems.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.skuCode.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      (item.description?.toLowerCase().includes(query))
    );
  });

  // Mock RMA data
  const rmaItems = [
    { id: 1, rmaId: 'RMA-001', product: 'Switch Cisco 24P', serial: 'SN-5912', vendor: 'FPT Distro', slaTimer: '5 days', slaColor: 'text-green-600', stage: 'Sent to Vendor', stageColor: 'bg-blue-100 text-blue-700', action: 'Sent to Vendor' },
    { id: 2, rmaId: 'RMA-002', product: 'SSD Samsung 1TB', serial: 'SN-8821', vendor: 'Samsung VN', slaTimer: '12 days', slaColor: 'text-green-600', stage: 'Returning', stageColor: 'bg-purple-100 text-purple-700', action: 'Receive & Restock' },
    { id: 3, rmaId: 'RMA-003', product: 'RAM 16GB', serial: 'SN-7741', vendor: 'Kingston', slaTimer: '1 days', slaColor: 'text-red-600', stage: 'New', stageColor: 'bg-gray-100 text-gray-700', action: 'Ship to Vendor' },
  ];

  // Mock asset lifecycle data
  const assetLifecycle = {
    product: 'HP LaserJet Pro M404dn',
    serial: 'SN-2024-88992',
    status: 'Assigned',
    tco: '4.500.000 đ',
    nextMaint: '2026-02-20',
    events: [
      { id: 1, title: 'Inbound PO-001 (New)', date: '2024-07-10', actor: 'Warehouse Mgr', cost: '+4.000.000 đ' },
      { id: 2, title: 'Installed at Customer (TechCorp)', date: '2024-01-15', actor: 'Tech A', cost: '0' },
      { id: 3, title: 'Maintenance (Fuser Replaced)', date: '2024-08-20', actor: 'Tech B', cost: '+500.000 đ' },
      { id: 4, title: 'RMA Sent to Vendor (Power Failure)', date: '2024-12-05', actor: 'Admin', cost: '0' },
      { id: 5, title: 'RMA Received (Fixed)', date: '2024-12-20', actor: 'Warehouse Mgr', cost: '0' },
    ],
  };

  // Mock costing data
  const costSnapshots = [
    { id: 1, ticket: 'T-8812', sku: 'SKU-452', time: '2 hours ago', cost: '1.250.000 đ', method: 'FIFO' },
    { id: 2, ticket: 'T-8810', sku: 'SKU-981', time: '4 hours ago', cost: '450.000 đ', method: 'AVG' },
    { id: 3, ticket: 'T-8809', sku: 'SKU-200', time: 'Yesterday', cost: '2.100.000 đ', method: 'FIFO' },
  ];

  // RMA stage counts
  const rmaStages = [
    { stage: 'NEW', count: 2, color: 'bg-gray-50 text-gray-700' },
    { stage: 'SENT TO VENDOR', count: 5, color: 'bg-blue-50 text-blue-700' },
    { stage: 'PROCESSING', count: 12, color: 'bg-purple-50 text-purple-700' },
    { stage: 'RETURNING', count: 2, color: 'bg-indigo-50 text-indigo-700' },
    { stage: 'RESTOCKED', count: 2, color: 'bg-green-50 text-green-700' },
    { stage: 'REJECTED', count: 2, color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader 
        title="Inventory & RMA"
        icon={<Package className="w-6 h-6" />}
      />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory & Supply Chain</h1>
            <p className="text-gray-600">Manage SKUs, Global RMA flow, Asset Lifecycle, and Costing logic.</p>
          </div>
          {activeTab === 'stock' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                <Truck className="w-4 h-4" />
                Inbound PO
              </button>
            </div>
          )}
          {activeTab === 'rma' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <RotateCcw className="w-4 h-4" />
              Create RMA
            </button>
          )}
          {activeTab === 'lifecycle' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Activity className="w-4 h-4" />
              Track
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'stock'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="w-5 h-5" />
            Stock & Inbound
          </button>
          <button
            onClick={() => setActiveTab('rma')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'rma'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            RMA Pipeline
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'lifecycle'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-5 h-5" />
            Asset Lifecycle
          </button>
          <button
            onClick={() => setActiveTab('costing')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'costing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator className="w-5 h-5" />
            Costing Engine
          </button>
        </div>

        {/* Stock & Inbound Tab */}
        {activeTab === 'stock' && (
          <div>
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Total Inventory Value</p>
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-gray-500 mt-1">Across all warehouses</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Low Stock Alerts</p>
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.lowStockCount} SKUs</p>
                <p className="text-sm text-red-600 mt-1">↓ Action Needed</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Pending Inbound</p>
                  <Truck className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingInbound} POs</p>
                <p className="text-sm text-gray-500 mt-1">Expected this week</p>
              </div>
            </div>

            {/* Stock Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Stock Management</h2>
                <button
                  onClick={fetchItems}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search SKU, Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Warehouses</option>
                  <option value="hcm">HCM Warehouse</option>
                  <option value="hn">Hanoi Warehouse</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>

              {/* Error State */}
              {error && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Loading inventory...
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No items found</p>
                  <p className="text-sm">Add your first inventory item to get started</p>
                  <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              ) : (
                /* Inventory Table */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">SKU</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product Name</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Stock</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Costing</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Avg Cost</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const stockStatus = getStockStatus(item.totalQuantity || 0, item.minStockLevel);
                        return (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-700">{item.skuCode}</td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-900">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900">
                              {item.totalQuantity || 0}
                              <span className="text-xs text-gray-400 ml-1">(min: {item.minStockLevel})</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                {formatCostingMethod(item.costingMethod)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-gray-900">
                              {formatCurrency(item.avgCost)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openAdjustStockModal(item)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Inbound"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsAdjustStockModalOpen(true);
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Outbound"
                                >
                                  <TrendingDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RMA Pipeline Tab */}
        {activeTab === 'rma' && (
          <div>
            {/* RMA Stage Counts */}
            <div className="grid grid-cols-6 gap-4 mb-6">
              {rmaStages.map((stage, idx) => (
                <div key={idx} className={`rounded-lg border p-4 ${stage.color}`}>
                  <p className="text-3xl font-bold mb-1">{stage.count}</p>
                  <p className="text-xs font-medium uppercase">{stage.stage}</p>
                </div>
              ))}
            </div>

            {/* Vendor RMA Workflow */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Vendor RMA Workflow</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">RMA ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product / Serial</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vendor</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">SLA Timer</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Stage</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rmaItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="text-sm font-semibold text-blue-600">{item.rmaId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">{item.product}</div>
                          <div className="text-xs text-gray-500">{item.serial}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{item.vendor}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-sm font-semibold ${item.slaColor}`}>{item.slaTimer}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${item.stageColor}`}>
                            {item.stage}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {item.action === 'Receive & Restock' ? (
                            <button className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                              Receive & Restock
                            </button>
                          ) : (
                            <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors">
                              {item.action}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Asset Lifecycle Tab */}
        {activeTab === 'lifecycle' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Asset Lifecycle Tracking</h2>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Scan QR or Enter Serial Number..."
                  className="w-full pl-4 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Activity className="w-4 h-4" />
                  Track
                </button>
              </div>
            </div>

            {/* Asset Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{assetLifecycle.product}</h3>
                  <p className="text-sm text-gray-600">S/N: {assetLifecycle.serial}</p>
                </div>
                <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded">
                  {assetLifecycle.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">TCO (Total Cost of Ownership)</p>
                  <p className="text-lg font-bold text-red-600">{assetLifecycle.tco}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Next Maint</p>
                  <p className="text-lg font-bold text-gray-900">{assetLifecycle.nextMaint}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {assetLifecycle.events.map((event) => (
                  <div key={event.id} className="relative flex gap-6">
                    <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.date} • by {event.actor}</p>
                        </div>
                        <span className={`text-sm font-semibold ${event.cost.startsWith('+') ? 'text-red-600' : 'text-gray-600'}`}>
                          {event.cost}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Costing Engine Tab */}
        {activeTab === 'costing' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Left: FIFO Visualizer */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">FIFO Calculation Logic (Visualizer)</h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Scenario: Outbound 12 Units</h3>

                {/* Batch A */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Batch A</span>
                    <span className="text-sm text-gray-500">10 units @ 50k</span>
                  </div>
                  <div className="relative h-6 bg-green-100 rounded overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-green-800">10 units @ 50k</span>
                    </div>
                    <div className="h-full bg-green-400 rounded" style={{ width: '100%' }}></div>
                  </div>
                  <div className="flex items-center justify-end mt-1">
                    <span className="text-xs text-gray-500">USED</span>
                  </div>
                </div>

                {/* Batch B */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Batch B</span>
                    <span className="text-sm text-gray-500">3 remain @ 60k</span>
                  </div>
                  <div className="relative h-6 bg-blue-100 rounded overflow-hidden">
                    <div className="absolute inset-0 flex items-center pl-2">
                      <span className="text-xs font-medium text-blue-800">2 used</span>
                    </div>
                    <div className="h-full bg-blue-400 rounded" style={{ width: '40%' }}></div>
                  </div>
                  <div className="flex items-center justify-start mt-1">
                    <span className="text-xs text-gray-500">3 remain @ 60k</span>
                  </div>
                </div>

                {/* Calculation */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Total Cost Calculation:</p>
                  <p className="text-blue-600 font-mono text-sm">
                    (10 <span className="text-red-500">*</span> 50k) + (2 <span className="text-red-500">*</span> 60k) = <span className="font-bold">620,000 đ</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                *FIFO ensures oldest stock cost is recognized first, keeping Inventory Valuation current with market prices.
              </p>
            </div>

            {/* Right: Recent Cost Snapshots */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Cost Snapshots</h2>

              <div className="space-y-3">
                {costSnapshots.map((snapshot) => (
                  <div key={snapshot.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{snapshot.ticket}</h3>
                        <p className="text-sm text-gray-600">{snapshot.sku} • {snapshot.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{snapshot.cost}</p>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {snapshot.method}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Costing Methods Available</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>FIFO</strong>: First-In-First-Out (Default for Hardware)</li>
                      <li>• <strong>Weighted Average</strong>: Average cost of all batches</li>
                      <li>• <strong>Specific ID</strong>: For serialized assets (Auto-track)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSubmit={handleCreateItem}
      />

      <EditItemModal
        isOpen={isEditItemModalOpen}
        onClose={() => {
          setIsEditItemModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleUpdateItem}
        item={editingItem ? {
          id: editingItem.id,
          skuCode: editingItem.skuCode,
          name: editingItem.name,
          description: editingItem.description,
          minStockLevel: editingItem.minStockLevel,
          costingMethod: editingItem.costingMethod === 'WEIGHTED_AVERAGE'
            ? 'WEIGHTED_AVERAGE'
            : editingItem.costingMethod === 'SPECIFIC_ID'
              ? 'SPECIFIC_ID'
              : 'FIFO',
          metadata: editingItem.metadata,
        } : null}
      />
      
      <AdjustStockModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => {
          setIsAdjustStockModalOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleAdjustStock}
        item={selectedItem ? {
          id: selectedItem.id,
          skuCode: selectedItem.skuCode,
          name: selectedItem.name,
          currentStock: selectedItem.totalQuantity,
        } : null}
      />
    </div>
  );
}
