
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

// NOTE: This interface represents the React Form State (Frontend).
// The actual API Payload converts arrays (like services) to comma-separated strings 
// to ensure they fit into single Spreadsheet cells.
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
  
  // Frontend uses Arrays for multi-select checkboxes
  services: string[]; 
  otherServices: string[]; 
  
  timeline: string;
  notes: string;
  contactMethods: string[];
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

// NOTE: Simplified Interface - Removed 'otherServices' and 'attachments'
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
  
  // Frontend uses Arrays for checkboxes
  services: string[]; 
  
  timeline: string;
  notes: string;
  contactMethods: string[];
}

export interface HistoryEntry {
    timestamp: string;
    unitInfo: string;
    services: string; 
    photos: string[]; 
}

export type UserRole = 'site_manager' | 'regional_manager' | 'executive' | 'internal_admin';

export interface UserSession {
  company: Company;
  role: UserRole;
  allowedPropertyIds: string[]; 
  profile?: UserProfile;
}
  
  attachments?: {
    name: string;
    type: string;
    data: string; // Base64 string
  }[];
}

export interface HistoryEntry {
    timestamp: string;
    unitInfo: string;
    services: string; // Backend returns this as a string "Service A, Service B"
    photos: string[]; // Backend returns array of URL strings
}

export type UserRole = 'site_manager' | 'regional_manager' | 'executive' | 'internal_admin';

export interface UserSession {
  company: Company;
  role: UserRole;
  allowedPropertyIds: string[]; // If empty, user has access to ALL properties (Executive)
  profile?: UserProfile;
}
