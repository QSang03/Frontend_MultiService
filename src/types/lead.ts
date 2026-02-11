export interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  value: string;
  email: string;
  phone: string;
  lastContact: string;
  source: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

export type NewLead = Omit<Lead, 'id'> & { id?: string };
