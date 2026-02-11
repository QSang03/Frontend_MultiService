'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface QuickQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickQuoteModal({ isOpen, onClose }: QuickQuoteModalProps) {
  const [prospectName, setProspectName] = useState('');
  const [service, setService] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle quote submission
    console.log({ prospectName, service, price });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Quick Quote Builder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Prospect Name */}
          <div>
            <label htmlFor="prospectName" className="block text-sm font-medium text-gray-700 mb-2">
              Prospect Name
            </label>
            <input
              id="prospectName"
              type="text"
              placeholder="e.g. Mr. Smith"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Service Interest */}
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
              Service Interest
            </label>
            <select
              id="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              required
            >
              <option value="">Select Service...</option>
              <option value="maintenance">Server Maintenance</option>
              <option value="cloud">Cloud Migration</option>
              <option value="setup">Office Setup</option>
              <option value="support">IT Support</option>
              <option value="hardware">Hardware Upgrade</option>
            </select>
          </div>

          {/* Estimated Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Price
            </label>
            <input
              id="price"
              type="number"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Send Quote Now
          </button>
        </form>
      </div>
    </div>
  );
}
