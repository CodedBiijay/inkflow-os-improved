export type ClientStatus = 'Lead' | 'Booked' | 'Flagged';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  depositPaid: boolean;
  totalSpent: number;
  notes: string;
  savedDesigns: string[];
}

export interface ProjectStage {
  id: string;
  title: string;
  count: number;
}
