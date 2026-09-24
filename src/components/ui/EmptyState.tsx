"use client";

import React from "react";
import { Inbox, Search, FileText, Bell, MessageSquare, Users, Package, ClipboardList } from "lucide-react";

const ICONS = {
  inbox: Inbox,
  search: Search,
  file: FileText,
  bell: Bell,
  chat: MessageSquare,
  users: Users,
  package: Package,
  list: ClipboardList,
} as const;

type Props = {
  icon?: keyof typeof ICONS;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

export default function EmptyState({
  icon = "inbox",
  title = "Không có dữ liệu",
  description = "Chưa có dữ liệu nào để hiển thị.",
  action,
}: Props) {
  const Icon = ICONS[icon];
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
