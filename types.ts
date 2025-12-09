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