'use client';

import React, { useEffect, useState } from 'react';
import { X, Package, AlertCircle, RefreshCw } from 'lucide-react';
import internalApiClient from '@/lib/api/internal-client';

type CostingMethod = 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_ID';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateItemData) => Promise<void>;
}

type CategoryOption = {
  id: string;
  name: string;
};

export interface CreateItemData {
  skuCode: string;
  name: string;
  categoryId?: string;
  description?: string;
  minStockLevel: number;
  costingMethod: CostingMethod;
  metadata?: string;
}

export default function AddItemModal({ isOpen, onClose, onSubmit }: AddItemModalProps) {
  const [formData, setFormData] = useState<CreateItemData>({
    skuCode: '',
    name: '',
    categoryId: '',
    description: '',
    minStockLevel: 10,
    costingMethod: 'FIFO',
    metadata: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setCategoryError(null);
      try {
        const resp = await internalApiClient.get('/api/admin/catalog/categories', {
          params: { page_size: 100 },
        });
        const list = (resp.data.categories ?? []) as Array<{ id: string; name: string }>;
        setCategories(list.map((c) => ({ id: c.id, name: c.name })));
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategoryError('Unable to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMetadataError(null);

    if (!formData.skuCode.trim() || !formData.name.trim()) {
      setError('SKU Code and Name are required');
      return;
    }

    let normalizedMetadata: string | undefined = undefined;
    if (formData.metadata?.trim()) {
      try {
        JSON.parse(formData.metadata);
        normalizedMetadata = formData.metadata;
      } catch {
        setMetadataError('Metadata must be valid JSON');
        return;
      }
    }

    const payload: CreateItemData = {
      ...formData,
      categoryId: formData.categoryId?.trim() ? formData.categoryId : undefined,
      metadata: normalizedMetadata,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      // Reset form
      setFormData({
        skuCode: '',
        name: '',
        categoryId: '',
        description: '',
        minStockLevel: 10,
        costingMethod: 'FIFO',
        metadata: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add New Item</h2>
              <p className="text-sm text-gray-500">Create a new inventory item</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* SKU Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.skuCode}
                onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                placeholder="e.g., HW-RAM-8GB"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., RAM DDR4 8GB Kingston"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Metadata JSON */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metadata (JSON)
            </label>
            <textarea
              value={formData.metadata}
              onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              placeholder='{"key":"value"}'
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {metadataError && (
              <p className="text-xs text-red-600 mt-1">{metadataError}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="relative">
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoadingCategories}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {isLoadingCategories && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              )}
            </div>
            {categoryError && (
              <p className="text-xs text-red-600 mt-1">{categoryError}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Min Stock Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stock Level
              </label>
              <input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
            </div>

            {/* Costing Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costing Method
              </label>
              <select
                value={formData.costingMethod}
                onChange={(e) => setFormData({ ...formData, costingMethod: e.target.value as CostingMethod })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FIFO">FIFO (First In First Out)</option>
                <option value="WEIGHTED_AVERAGE">Weighted Average</option>
                <option value="SPECIFIC_ID">Specific Identification</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Create Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
