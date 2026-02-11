'use client';

import React, { useEffect } from 'react';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useContracts } from '@/hooks/useContracts';
import type { ContractTemplate } from '@/types/contract';

interface TemplatesListProps {
  onPreviewTemplate?: (template: ContractTemplate) => void;
  onUseTemplate?: (template: ContractTemplate) => void;
  onUploadTemplate?: () => void;
}

export default function TemplatesList({
  onPreviewTemplate,
  onUseTemplate,
  onUploadTemplate,
}: TemplatesListProps) {
  const { templates, loading, error, listTemplates } = useContracts();

  useEffect(() => {
    listTemplates();
  }, [listTemplates]);

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading templates</p>
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => listTemplates()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card key={template.id} className="relative hover:shadow-md transition-shadow">
          <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
            {template.version || 'v1'}
          </div>
          <CardBody className="p-6 flex flex-col h-full">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-6">
              {template.type || template.category || 'ONE-DEAL'}
            </p>

            <div className="mt-auto grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => onPreviewTemplate?.(template)}
              >
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => onUseTemplate?.(template)}
              >
                Use
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}

      {/* Upload New Template */}
      <button 
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors min-h-[200px]"
        onClick={onUploadTemplate}
      >
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
        </div>
        <span className="font-medium">Upload New Template</span>
      </button>
    </div>
  );
}
