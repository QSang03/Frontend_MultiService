'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Box, 
  Zap, 
  RotateCcw, 
  History, 
  AlertTriangle, 
  RefreshCw,
  Plus,
  ChevronRight,
  X
} from 'lucide-react';

// --- Types ---
type ItemType = 'CONSUMABLE' | 'ASSET';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
  status: 'GOOD' | 'LOW' | 'OUT_OF_STOCK';
}

interface RequestItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
  isUrgent: boolean;
  items: string;
  date: string;
}

interface ReturnItem {
  id: string;
  status: 'RESOLVED' | 'PENDING';
  item: string;
  date: string;
}

// --- Mock Data ---
const INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: '1',
    name: 'Cat6 Ethernet Cable (3m)',
    sku: 'CBL-CAT6-3M',
    type: 'CONSUMABLE',
    quantity: 15,
    unit: 'pcs',
    minStock: 5,
    maxStock: 50,
    status: 'GOOD'
  },
  {
    id: '2',
    name: 'RJ45 Connectors (Pack)',
    sku: 'CON-RJ45-100',
    type: 'CONSUMABLE',
    quantity: 2,
    unit: 'pack',
    minStock: 5,
    maxStock: 20,
    status: 'LOW'
  },
  {
    id: '3',
    name: 'SSD 500GB Samsung Evo',
    sku: 'SSD-SAM-500',
    type: 'ASSET',
    quantity: 1,
    unit: 'pcs',
    minStock: 3,
    maxStock: 10,
    status: 'LOW'
  },
  {
    id: '4',
    name: 'Canon Toner 325',
    sku: 'TNR-CAN-325',
    type: 'CONSUMABLE',
    quantity: 0,
    unit: 'cartridge',
    minStock: 2,
    maxStock: 10,
    status: 'OUT_OF_STOCK'
  },
  {
    id: '5',
    name: 'Thermal Paste MX-4',
    sku: 'CHM-THM-PST',
    type: 'CONSUMABLE',
    quantity: 4,
    unit: 'tube',
    minStock: 2,
    maxStock: 20,
    status: 'GOOD'
  },
  {
    id: '6',
    name: 'DDR4 RAM 8GB Kingston',
    sku: 'RAM-KNG-8GB',
    type: 'ASSET',
    quantity: 3,
    unit: 'pcs',
    minStock: 5,
    maxStock: 15,
    status: 'GOOD'
  },
  {
    id: '7',
    name: 'Logitech Wireless Mouse',
    sku: 'ACC-MSE-LOG',
    type: 'ASSET',
    quantity: 8,
    unit: 'pcs',
    minStock: 5,
    maxStock: 30,
    status: 'GOOD'
  },
  {
    id: '8',
    name: 'HDMI Cable (1.5m)',
    sku: 'CBL-HDMI-15',
    type: 'CONSUMABLE',
    quantity: 12,
    unit: 'pcs',
    minStock: 5,
    maxStock: 50,
    status: 'GOOD'
  }
];

const REQUEST_HISTORY: RequestItem[] = [
  {
    id: 'REQ-2025-882',
    status: 'PENDING',
    isUrgent: true,
    items: '2x SSD 500GB Samsung, 5x Thermal Paste',
    date: '2 hours ago'
  },
  {
    id: 'REQ-2025-870',
    status: 'APPROVED',
    isUrgent: false,
    items: '100m Cat6 Cable Box',
    date: 'Yesterday'
  },
  {
    id: 'REQ-2025-865',
    status: 'COMPLETED',
    isUrgent: false,
    items: 'Logitech Mouse, HDMI Cables',
    date: '3 days ago'
  }
];

const RETURN_HISTORY: ReturnItem[] = [
  {
    id: 'RMA-2024-091',
    status: 'RESOLVED',
    item: 'Mainboard H61 Gigabyte - No POST',
    date: 'Returned on 20 Dec 2024'
  }
];

// --- Component ---
// --- Modal Components (declared outside render to satisfy lint rules) ---
type RequestStockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
};

export const RequestStockModal = ({ isOpen, onClose, items }: RequestStockModalProps) => {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div 
        className={`relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-all duration-300 delay-75 ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Request Stock</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Select Item</label>
            <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none">
              <option value="">-- Choose Item --</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Quantity</label>
            <input 
              type="number" 
              defaultValue={1}
              min={1}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Notes / Urgency</label>
            <textarea 
              rows={3}
              placeholder="e.g., Needed for Ticket #123 tomorrow..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

type CreateRMAModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateRMAModal = ({ isOpen, onClose }: CreateRMAModalProps) => {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div 
        className={`relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transition-all duration-300 delay-75 ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Create RMA Ticket</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-6">
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-xs text-orange-800 leading-snug">
              Ensure the faulty item has a valid Serial Number and is physically in your possession.
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Product Name / Model</label>
            <input 
              type="text" 
              placeholder="e.g. RAM 8GB Kingston"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Serial Number</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Scan or type SN..."
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <button className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                Scan
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Fault Description</label>
            <textarea 
              rows={3}
              placeholder="Describe the defect..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Evidence Photo</label>
            <div className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-all cursor-pointer">
              <Box className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">Tap to take photo of damage</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
          >
            Submit RMA
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MyInventoryPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'RESTOCK' | 'RETURNS'>('ALL');
  const [items] = useState<InventoryItem[]>(INVENTORY_ITEMS);

  // Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRmaModalOpen, setIsRmaModalOpen] = useState(false);

  // Helper styles
  const getTypeBadgeStyle = (type: ItemType) => {
    return type === 'CONSUMABLE' 
      ? 'bg-blue-50 text-blue-600' 
      : 'bg-purple-50 text-purple-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GOOD': return 'bg-green-500';
      case 'LOW': return 'bg-red-500';
      case 'OUT_OF_STOCK': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getRequestStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'APPROVED': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateProgress = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };



  // --- Render Functions ---

  const renderAllItems = () => (
    <>
      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search items by name, SKU, or category..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* INVENTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group relative flex flex-col"
          >
            {/* Header: Icon & Type Badge */}
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                item.type === 'CONSUMABLE' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
              }`}>
                {item.type === 'CONSUMABLE' ? <Box className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${getTypeBadgeStyle(item.type)}`}>
                {item.type}
              </span>
            </div>

            {/* Content: Title & SKU */}
            <div className="mb-6 flex-1">
              <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">{item.name}</h3>
              <p className="text-xs text-gray-400 font-mono tracking-wide">{item.sku}</p>
            </div>

            {/* Footer: Quantity & Status */}
            <div className="mt-auto">
               <div className="flex justify-between items-end mb-2">
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Quantity</p>
                    <div className="flex items-baseline gap-1">
                       <span className={`text-xl font-bold ${item.status === 'OUT_OF_STOCK' ? 'text-red-500' : 'text-gray-900'}`}>
                          {item.quantity}
                       </span>
                       <span className="text-xs text-gray-500 font-medium">{item.unit}</span>
                    </div>
                 </div>
                 {/* Reorder Badge */}
                 {(item.status === 'LOW' || item.status === 'OUT_OF_STOCK') && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100 animate-pulse">
                       <AlertTriangle className="w-3 h-3" />
                       Reorder
                    </span>
                 )}
               </div>

               {/* Progress Bar */}
               <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getStatusColor(item.status)}`}
                    style={{ width: `${calculateProgress(item.quantity, item.maxStock)}%` }}
                  />
               </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderRestock = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Actions */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* ACTION CARD */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Request Consumables</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Running low on supplies? Create a request to restock items from the central warehouse.
          </p>
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>

        {/* TOP REQUESTED ITEMS */}
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 mb-4 text-blue-800">
            <Zap className="w-4 h-4" />
            <h4 className="font-bold text-sm">Top Requested Items</h4>
          </div>
          <ul className="space-y-3">
            {['Cat6 Ethernet Cable', 'RJ45 Connectors', 'Thermal Paste'].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT COLUMN: History */}
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Request History</h3>
          <button className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">View All</button>
        </div>

        <div className="space-y-3">
          {REQUEST_HISTORY.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-gray-900">{req.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getRequestStatusStyle(req.status)}`}>
                      {req.status}
                    </span>
                    {req.isUrgent && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-100">
                        <AlertTriangle className="w-3 h-3" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{req.items}</p>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 min-w-[140px]">
                  <span className="text-xs text-gray-400 font-medium">{req.date}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReturns = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Actions */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Process Returns (RMA)</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Found a faulty component? Initiate a Return Merchandise Authorization to send it back to the warehouse.
          </p>
          <button 
            onClick={() => setIsRmaModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-amber-600/20"
          >
            <Plus className="w-5 h-5" />
            Start RMA
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: History */}
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Return History</h3>
        </div>

        <div className="space-y-3">
          {RETURN_HISTORY.map((rma) => (
            <div key={rma.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-gray-900">{rma.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700">
                      {rma.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{rma.item}</p>
                  <p className="text-xs text-gray-400">{rma.date}</p>
                </div>
                
                <div className="flex items-center justify-end">
                   <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                     <RefreshCw className="w-4 h-4" />
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>
            <p className="text-gray-500 mt-1">Manage your personal stock and requests</p>
          </div>
          
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ALL' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Box className="w-4 h-4" />
              All Items
            </button>
            <button 
              onClick={() => setActiveTab('RESTOCK')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'RESTOCK' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Restock
            </button>
            <button 
              onClick={() => setActiveTab('RETURNS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'RETURNS' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <History className="w-4 h-4" />
              Returns
            </button>
          </div>
        </div>

        {/* STATS CARDS - Persistent across tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Items Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Items</p>
                <h2 className="text-3xl font-bold text-gray-900">8</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Box className="w-5 h-5" />
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[60%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>

          {/* Assets Value Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Assets Value</p>
                <h2 className="text-3xl font-bold text-gray-900 flex items-baseline gap-1">
                  3 <span className="text-sm font-medium text-gray-500">items</span>
                </h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-purple-500 w-[40%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            </div>
          </div>

          {/* Low Stock Alert Card */}
          <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Low Stock Alert</p>
                <h2 className="text-3xl font-bold text-red-900 flex items-baseline gap-1">
                  3 <span className="text-sm font-medium text-red-500">items</span>
                </h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="h-1 w-full bg-red-200 rounded-full overflow-hidden">
               <div className="h-full bg-red-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            </div>
          </div>
        </div>

        {/* DYNAMIC CONTENT */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'ALL' && renderAllItems()}
          {activeTab === 'RESTOCK' && renderRestock()}
          {activeTab === 'RETURNS' && renderReturns()}
        </div>
      </div>
      
      {/* MODALS */}
      <RequestStockModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} items={items} />
      <CreateRMAModal isOpen={isRmaModalOpen} onClose={() => setIsRmaModalOpen(false)} />
    </div>
  );
}
