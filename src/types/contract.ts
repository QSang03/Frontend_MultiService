// Contract types based on proto definitions

export enum ContractStatus {
  CONTRACT_STATUS_UNSPECIFIED = 0,
  DRAFT = 1,
  PENDING_SIGNATURE = 2,
  ACTIVE = 3,
  EXPIRED = 4,
  CANCELLED = 5,
  RENEWED = 6,
}

export enum SignatureMethod {
  SIGNATURE_METHOD_UNSPECIFIED = 0,
  OTP = 1,
  DRAW = 2,
  UPLOAD = 3,
}

export interface LineItemInput {
  serviceId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

export interface LineItem {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface Contract {
  id: string;
  quotationId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orgId: string;
  title: string;
  templateId?: string;
  templateName?: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  status: ContractStatus;
  lineItems: LineItem[];
  signatureUrl?: string;
  pdfUrl?: string;
  revisedFileId?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'ONE-DEAL' | 'LONG-TERM';
  version: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringSchedule {
  id: string;
  contractId: string;
  cronExpression: string;
  categoryId: string;
  priority: string;
  descriptionTemplate: string;
  temporalWorkflowId: string;
  status: 'Running' | 'Paused' | 'Stopped';
  createdAt: string;
}

// Request/Response types
export interface CreateContractRequest {
  quotationId: string;
  title: string;
  startDate: string;
  endDate: string;
  templateId?: string;
  lineItems: LineItemInput[];
}

export interface ListContractsRequest {
  orgId?: string;
  customerId?: string;
  status?: ContractStatus;
  pageSize?: number;
  pageToken?: string;
}

export interface ListContractsResponse {
  contracts: Contract[];
  nextPageToken: string;
  totalCount: number;
}

export interface SendForSignatureResponse {
  contract: Contract;
  signingUrl: string;
}

export interface SignContractRequest {
  contractId: string;
  method: SignatureMethod;
  signatureData: string;
  otpCode: string;
}

export interface SignContractResponse {
  contract: Contract;
  pdfUrl: string;
}

export interface CreateRecurringScheduleRequest {
  contractId: string;
  cronExpression: string;
  categoryId: string;
  priority: string;
  descriptionTemplate: string;
}

export interface CreateRecurringScheduleResponse {
  scheduleId: string;
  temporalWorkflowId: string;
}

export interface ApproveRenewalRequest {
  contractId: string;
  newEndDate: string;
}

export interface UploadRevisedContractRequest {
  contractId: string;
  fileType: string;
  fileId: string;
}

export interface ContractTimelineEvent {
  action: string;
  actorId: string;
  createdAt?: string;
}

export interface GetContractTimelineResponse {
  events: ContractTimelineEvent[];
}

export interface ListTemplatesRequest {
  category?: string;
  activeOnly?: boolean;
}

// Helper functions
export function contractStatusToString(status: ContractStatus): string {
  switch (status) {
    case ContractStatus.DRAFT:
      return 'Draft';
    case ContractStatus.PENDING_SIGNATURE:
      return 'Pending Signature';
    case ContractStatus.ACTIVE:
      return 'Active';
    case ContractStatus.EXPIRED:
      return 'Expired';
    case ContractStatus.CANCELLED:
      return 'Cancelled';
    case ContractStatus.RENEWED:
      return 'Renewed';
    default:
      return 'Unknown';
  }
}

export function contractStatusFromString(status: string): ContractStatus {
  switch (status.toLowerCase()) {
    case 'draft':
      return ContractStatus.DRAFT;
    case 'pending signature':
    case 'pending_signature':
      return ContractStatus.PENDING_SIGNATURE;
    case 'active':
      return ContractStatus.ACTIVE;
    case 'expired':
      return ContractStatus.EXPIRED;
    case 'cancelled':
      return ContractStatus.CANCELLED;
    case 'renewed':
      return ContractStatus.RENEWED;
    default:
      return ContractStatus.CONTRACT_STATUS_UNSPECIFIED;
  }
}
