"use client";

import React from 'react';
import Button from './Button';
import Input from './Input';

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  inputLabel?: string;
  inputValue?: string;
  onInputChange?: (v: string) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
};

export default function ConfirmModal({
  open,
  title = 'Xác nhận',
  description,
  inputLabel,
  inputValue,
  onInputChange,
  confirmLabel = 'OK',
  cancelLabel = 'Hủy',
  onConfirm,
  onClose,
  isLoading = false,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
          {inputLabel && (
            <div className="mb-3">
              <Input
                label={inputLabel}
                name="confirm_input"
                value={inputValue || ''}
                onChange={(e) => onInputChange?.(e.target.value)}
                placeholder=""
              />
            </div>
          )}
        </div>
        <div className="p-4 flex justify-end gap-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{cancelLabel}</Button>
          <Button variant="danger" onClick={() => onConfirm()} isLoading={isLoading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
