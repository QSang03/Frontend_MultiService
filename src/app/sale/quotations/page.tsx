'use client';

import { useState } from 'react';
import { FileText, Plus, Send, Clock, AlertCircle, X } from 'lucide-react';

interface Quote {
  id: string;
  customer: string;
  status: 'sent' | 'draft' | 'approval';
  dealType: 'long-term' | 'one-deal';
  totalValue: string;
  netProfit: string;
  createdDate: string;
  services: string[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  price: string;
  defaultItems: { name: string; price: number }[];
}

const mockQuotes: Quote[] = [
  {
    id: 'Q-2024-001',
    customer: 'TechSolutions Ltd',
    status: 'sent',
    dealType: 'long-term',
    totalValue: '50.000.000 ₫',
    netProfit: '12.000.000 ₫',
    createdDate: '2024-01-15',
    services: ['Maintenance 12 months', 'Server Upgrade'],
  },
  {
    id: 'Q-2024-002',
    customer: 'Nguyen Van A',
    status: 'draft',
    dealType: 'one-deal',
    totalValue: '1.500.000 ₫',
    netProfit: '500.000 ₫',
    createdDate: '2024-01-20',
    services: ['Laptop Repair', 'RAM 8GB'],
  },
  {
    id: 'Q-2024-004',
    customer: 'Big Corp Inc',
    status: 'approval',
    dealType: 'long-term',
    totalValue: '200.000.000 ₫',
    netProfit: '40.000.000 ₫',
    createdDate: '2024-02-05',
    services: ['Full Office IT Setup', 'Cloud Migration'],
  },
];

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Standard Maintenance',
    description: 'Basic server & network monitoring',
    price: '5,000,000 / mo',
    defaultItems: [
        { name: 'Server Maintenance (Monthly)', price: 5000000 }
    ]
  },
  {
    id: '2',
    name: 'Office Setup Pack',
    description: 'Cabling, router config for <20 users',
    price: '20,000,000',
    defaultItems: [
        { name: 'Cabling Infrastructure', price: 15000000 },
        { name: 'Router Configuration', price: 5000000 }
    ]
  },
  {
    id: '3',
    name: 'Cloud Migration',
    description: 'Move on-prem to AWS/Azure',
    price: '15,000,000',
    defaultItems: [
        { name: 'Cloud Assessment', price: 5000000 },
        { name: 'Migration Service', price: 10000000 }
    ]
  },
  {
    id: '4',
    name: 'PC Refresh',
    description: 'Bulk hardware upgrade',
    price: 'Call for Quote',
    defaultItems: []
  },
];

export default function SaleQuotationsPage() {
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [quoteItems, setQuoteItems] = useState<{ name: string; price: number }[]>([
      { name: 'Server Maintenance (Monthly)', price: 5000000 },
      { name: 'On-site Support (5h)', price: 2500000 }
  ]);
  const [discount, setDiscount] = useState(0);

  const handleTemplateSelect = (template: Template) => {
    setQuoteItems(template.defaultItems);
    setShowTemplates(false);
    setShowCreateModal(true);
  };

  const calculateTotal = () => {
    const subtotal = quoteItems.reduce((acc, item) => acc + item.price, 0);
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const getStatusBadge = (status: Quote['status']) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Sent
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case 'approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3" />
            Approval
          </span>
        );
    }
  };

  const getDealTypeBadge = (type: Quote['dealType']) => {
    return type === 'long-term' ? (
      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">Long-term</span>
    ) : (
      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">One-deal</span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes & Contracts</h1>
          <p className="text-gray-500 mt-1">
            Create quotes, track e-signatures, and manage special discount approvals.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Quote
          </button>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {mockQuotes.map((quote) => (
          <div
            key={quote.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{quote.id}</h3>
                    {getStatusBadge(quote.status)}
                    {getDealTypeBadge(quote.dealType)}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{quote.customer}</p>
                  <p className="text-xs text-gray-500 mt-1">Created: {quote.createdDate}</p>
                  <div className="flex gap-2 mt-2">
                    {quote.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{quote.totalValue}</p>
                <p className="text-sm text-green-600 mt-1">Est. Net Profit: {quote.netProfit}</p>
                {quote.status === 'approval' && (
                  <p className="text-xs text-orange-600 mt-2">Includes 15% Discount</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Details
                  </button>
                  {quote.status === 'draft' ? (
                    <button className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                      <Send className="w-3 h-3" />
                      Send via E-Sign
                    </button>
                  ) : quote.status === 'approval' ? (
                    <button className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded font-medium">
                      Waiting Approval
                    </button>
                  ) : (
                    <button className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                      <Send className="w-3 h-3" />
                      Send via E-Sign
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowTemplates(false)}
        >
          {/* Detailed mockTemplates closer to Screenshot 1 if needed, but current data seems fine.
              The screenshot 1 has "Standard Maintenance", "Office Setup Pack", "Cloud Migration", "PC Refresh".
              My mock data has these.
              Prices:
              - 5,000,000 / mo
              - 20,000,000
              - 15,000,000
              - Call for Quote
              My mock data has these.
          */}
          <div 
            className="bg-white rounded-lg shadow-2xl border border-gray-100 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Select a Template</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {mockTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="text-left p-6 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group h-full flex flex-col items-start"
                  >
                    <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors mb-4">
                        <FileText className="w-6 h-6 text-gray-500 group-hover:text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 flex-1">{template.description}</p>
                    <p className="text-blue-600 font-semibold">{template.price}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Quote Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl border border-gray-100 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create New Quote</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                <select className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option>Select a client...</option>
                  <option>TechSolutions Ltd</option>
                  <option>Nguyen Van A</option>
                  <option>Big Corp Inc</option>
                </select>
              </div>

              {/* Engagement Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engagement Model
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="model" className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked />
                    <span className="text-sm text-gray-900">One-deal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="model" className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                    <span className="text-sm text-gray-900">Long-term</span>
                  </label>
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
                <div className="space-y-2">
                  {quoteItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-sm text-gray-900">{item.name}</span>
                        <span className="font-medium text-gray-900">{item.price.toLocaleString()} ₫</span>
                    </div>
                  ))}
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2">
                    <Plus className="w-4 h-4" /> Add Service Item
                  </button>
                </div>
              </div>

              {/* Discount and Total */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Discounts &gt; 10% require approval.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                  <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-right font-bold text-gray-900">
                    {calculateTotal().toLocaleString()} ₫
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 pt-2 border-t-0 bg-white">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                // "Cancel" button style in Screenshot 2 looks standard white/border
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
