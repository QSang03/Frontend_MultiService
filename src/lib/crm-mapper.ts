type UnknownRecord = Record<string, unknown>;

export type SalesLeadDto = {
  id: string;
  orgId?: string;
  name: string;
  company: string;
  title: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  value: string;
  email: string;
  phone: string;
  lastContact: string;
  source: string;
  priority: 'low' | 'medium' | 'high';
  identityType: 'customer' | 'guest' | 'new';
  verificationState: 'unverified' | 'otp_sent' | 'verified' | 'converted';
};

export function mapUserProfileToSalesLead(user: unknown, verificationState?: SalesLeadDto['verificationState']): SalesLeadDto {
  const profile = (user ?? {}) as UnknownRecord;
  const organization = ((profile.organization ?? {}) as UnknownRecord);
  const fullName = String(profile.fullName ?? profile.full_name ?? '').trim();
  const isGuest = Boolean(profile.isGuest ?? profile.is_guest ?? false);
  const organizationId = String(
    profile.organizationId ??
    profile.organization_id ??
    organization.id ??
    organization.organizationId ??
    ''
  ).trim();

  return {
    id: String(profile.id ?? ''),
    orgId: organizationId || undefined,
    name: fullName || 'Unknown User',
    company: String(organization.name ?? 'Individual'),
    title: isGuest ? 'Guest Prospect' : 'Customer',
    status: isGuest ? 'contacted' : 'qualified',
    value: '$0',
    email: String(profile.email ?? ''),
    phone: String(profile.phone ?? ''),
    lastContact: 'Just now',
    source: 'Backend CRM',
    priority: 'medium',
    identityType: isGuest ? 'guest' : 'customer',
    verificationState: verificationState ?? (isGuest ? 'unverified' : 'converted'),
  };
}
