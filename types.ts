
export interface Property {
  id: string;
  name: string;
  address: string;
}

export interface Company {
  id: string;
  name: string;
  properties: Property[];
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
}

export interface SurveyData {
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
  email: string;
  unitInfo: string;
  services: string[];
  otherServices: string[]; // Changed to array for multiple selections
  timeline: string;
  notes: string;
  contactMethods: string[];
  attachments?: {
    name: string;
    type: string;
    data: string; // Base64 string
  }[];
}

export interface HistoryEntry {
    timestamp: string;
    unitInfo: string;
    services: string;
    photos: string[]; // Array of URLs
}

export type UserRole = 'site_manager' | 'regional_manager' | 'executive' | 'internal_admin';

export interface UserSession {
  company: Company;
  role: UserRole;
  allowedPropertyIds: string[]; // If empty, user has access to ALL properties (Executive)
  profile?: UserProfile;
}