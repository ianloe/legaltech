export interface User {
  id: string;
  name: string;
  role: string;
  color: string;
  allowedBUs?: string[]; // Empty means all
}

export interface PlaybookClause {
  id: string;
  title: string;
  description: string;
  preferredLanguage: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface Contract {
  id: string;
  title: string;
  content: string;
  lastModifiedBy: string;
  status: 'In Queue' | 'Draft' | 'Review' | 'Live' | 'Expired';
  expiryDate?: string;
  value?: string;
  businessUnit?: string;
  department?: string;
  legalRep?: string;
  category?: string;
}

export interface Version {
  id: string;
  contractId: string;
  content: string;
  timestamp: string;
  author: string;
  label?: string;
}

export const USERS: User[] = [
  { id: '1', name: 'Ian Loe', role: 'General Counsel', color: '#3b82f6' },
  { id: '2', name: 'Sarah Chen', role: 'Legal Operations', color: '#10b981' },
  { id: '3', name: 'Marcus Bell', role: 'Contract Manager', color: '#f59e0b' },
  { id: '4', name: 'Elena Rodriguez', role: 'Senior Associate', color: '#8b5cf6' },
  { id: '5', name: 'David Kim', role: 'Compliance Officer', color: '#ec4899' },
];

export const INITIAL_PLAYBOOK: PlaybookClause[] = [
  {
    id: 'p1',
    title: 'Limitation of Liability',
    description: 'Standard cap at 12 months fees.',
    preferredLanguage: 'In no event shall either party\'s total liability exceed the total amount paid or payable to Vendor in the 12 months preceding the claim.',
    riskLevel: 'Medium',
  },
  {
    id: 'p2',
    title: 'Governing Law',
    description: 'Preferred jurisdiction is Singapore.',
    preferredLanguage: 'This Agreement shall be governed by and construed in accordance with the laws of the Republic of Singapore.',
    riskLevel: 'Low',
  },
  {
    id: 'p3',
    title: 'Termination for Convenience',
    description: '30-day notice period.',
    preferredLanguage: 'Either party may terminate this Agreement for any reason upon thirty (30) days prior written notice to the other party.',
    riskLevel: 'Low',
  },
  {
    id: 'p4',
    title: 'Data Protection',
    description: 'Standard GDPR/PDPA compliance language.',
    preferredLanguage: 'Vendor shall process Personal Data only for the purposes of providing the Services and in accordance with applicable Data Protection Laws.',
    riskLevel: 'High',
  },
  {
    id: 'p5',
    title: 'Intellectual Property',
    description: 'Customer retains ownership of all deliverables.',
    preferredLanguage: 'All Deliverables and Intellectual Property Rights therein shall be owned exclusively by the Customer.',
    riskLevel: 'High',
  },
  {
    id: 'p6',
    title: 'Confidentiality',
    description: 'Standard 3-year survival period.',
    preferredLanguage: 'The obligations of confidentiality shall survive for a period of three (3) years from the date of termination.',
    riskLevel: 'Medium',
  },
];
