export interface CreateInventoryInput {
  companyId: string;
  sku: string;
  partNumber: string;
  manufacturer: string;
  title: string;
  description: string;
  quantity: number;
  unitCondition: string;
  location: string;
}

export interface InventoryRecord {
  id: string;
  company_id: string;
  sku: string;
  part_number: string;
  manufacturer: string;
  title: string;
  description: string;
  quantity: number;
  unit_condition: string;
  location: string;
  created_at: string;
  updated_at: string;
}

