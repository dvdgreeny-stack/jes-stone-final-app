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
  otherService: string;
  timeline: string;
  notes: string;
  contactMethods: string[];
}

export type UserRole = 'site_manager' | 'regional_manager' | 'executive';

export interface UserSession {
  company: Company;
  role: UserRole;
  allowedPropertyIds: string[]; // If empty, user has access to ALL properties (Executive)
}