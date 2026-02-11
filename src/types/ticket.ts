// Ticket Types for TicketService

export enum TicketStatus {
  TICKET_STATUS_UNSPECIFIED = 0,
  TICKET_STATUS_DRAFT = 1,
  TICKET_STATUS_PENDING_APPROVAL = 2,
  TICKET_STATUS_OPEN = 3,
  TICKET_STATUS_QUOTING = 4,
  TICKET_STATUS_AGREED = 5,
  TICKET_STATUS_ASSIGNED = 6,
  TICKET_STATUS_IN_PROGRESS = 7,
  TICKET_STATUS_PENDING_EXTERNAL = 8,
  TICKET_STATUS_RESOLVED = 9,
  TICKET_STATUS_CLOSED = 10,
  TICKET_STATUS_REJECTED = 11,
  TICKET_STATUS_CANCELLED = 12,
}

export const TicketStatusLabels: Record<TicketStatus, string> = {
  [TicketStatus.TICKET_STATUS_UNSPECIFIED]: 'Unspecified',
  [TicketStatus.TICKET_STATUS_DRAFT]: 'Draft',
  [TicketStatus.TICKET_STATUS_PENDING_APPROVAL]: 'Pending Approval',
  [TicketStatus.TICKET_STATUS_OPEN]: 'Open',
  [TicketStatus.TICKET_STATUS_QUOTING]: 'Quoting',
  [TicketStatus.TICKET_STATUS_AGREED]: 'Agreed',
  [TicketStatus.TICKET_STATUS_ASSIGNED]: 'Assigned',
  [TicketStatus.TICKET_STATUS_IN_PROGRESS]: 'In Progress',
  [TicketStatus.TICKET_STATUS_PENDING_EXTERNAL]: 'Pending External',
  [TicketStatus.TICKET_STATUS_RESOLVED]: 'Resolved',
  [TicketStatus.TICKET_STATUS_CLOSED]: 'Closed',
  [TicketStatus.TICKET_STATUS_REJECTED]: 'Rejected',
  [TicketStatus.TICKET_STATUS_CANCELLED]: 'Cancelled',
};

export const TicketStatusColors: Record<TicketStatus, { bg: string; text: string }> = {
  [TicketStatus.TICKET_STATUS_UNSPECIFIED]: { bg: 'bg-gray-100', text: 'text-gray-600' },
  [TicketStatus.TICKET_STATUS_DRAFT]: { bg: 'bg-gray-100', text: 'text-gray-600' },
  [TicketStatus.TICKET_STATUS_PENDING_APPROVAL]: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  [TicketStatus.TICKET_STATUS_OPEN]: { bg: 'bg-blue-100', text: 'text-blue-700' },
  [TicketStatus.TICKET_STATUS_QUOTING]: { bg: 'bg-purple-100', text: 'text-purple-700' },
  [TicketStatus.TICKET_STATUS_AGREED]: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  [TicketStatus.TICKET_STATUS_ASSIGNED]: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  [TicketStatus.TICKET_STATUS_IN_PROGRESS]: { bg: 'bg-orange-100', text: 'text-orange-700' },
  [TicketStatus.TICKET_STATUS_PENDING_EXTERNAL]: { bg: 'bg-pink-100', text: 'text-pink-700' },
  [TicketStatus.TICKET_STATUS_RESOLVED]: { bg: 'bg-green-100', text: 'text-green-700' },
  [TicketStatus.TICKET_STATUS_CLOSED]: { bg: 'bg-gray-200', text: 'text-gray-700' },
  [TicketStatus.TICKET_STATUS_REJECTED]: { bg: 'bg-red-100', text: 'text-red-700' },
  [TicketStatus.TICKET_STATUS_CANCELLED]: { bg: 'bg-red-50', text: 'text-red-600' },
};

export interface Ticket {
  id: string;
  orgId: string;
  creatorId: string;
  departmentId?: string;
  categoryId: string;
  serviceId?: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: string;
  assignedTechId?: string;
  assignedSaleId?: string;
  attributes: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  targetResponseAt?: string;
  targetResolutionAt?: string;
  slaHours: number;
}

export interface TicketQuotation {
  id: string;
  ticketId: string;
  creatorId: string;
  totalAmount: string;
  taxAmount: string;
  currency: string;
  note: string;
  isAccepted: boolean;
  items: string;
  createdAt?: string;
}

// Request/Response types
export interface CreateTicketRequest {
  categoryId: string;
  serviceId?: string;
  title: string;
  description: string;
  priority: string;
  attributes: string;
}

export interface UpdateTicketStatusRequest {
  ticketId: string;
  status: TicketStatus;
}

export interface AssignTicketRequest {
  ticketId: string;
  techId?: string;
  saleId?: string;
}

export interface SubmitQuotationRequest {
  ticketId: string;
  totalAmount: string;
  taxAmount: string;
  currency: string;
  note: string;
  items: string;
}

export interface AcceptQuotationRequest {
  quotationId: string;
}

export interface RejectQuotationRequest {
  quotationId: string;
  reason: string;
}

export interface ApproveTicketRequest {
  ticketId: string;
}

export interface RejectTicketRequest {
  ticketId: string;
  reason: string;
}

export interface ListTicketsRequest {
  orgId?: string;
  creatorId?: string;
  status?: TicketStatus;
  pageSize: number;
  pageToken: string;
}

export interface ListTicketsResponse {
  tickets: Ticket[];
  nextPageToken: string;
}

// Priority types
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

export const TicketPriorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  critical: { label: 'CRITICAL', color: 'bg-red-500 text-white' },
  high: { label: 'HIGH', color: 'bg-orange-500 text-white' },
  medium: { label: 'MEDIUM', color: 'bg-blue-500 text-white' },
  low: { label: 'LOW', color: 'bg-gray-400 text-white' },
};
