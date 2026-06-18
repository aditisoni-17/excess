export interface CreateInventoryInput {
  sku: string;
  partNumber: string;
  manufacturer: string;
  title: string;
  description: string;
  dateCode: string;
  quantity: number;
  unitCondition: string;
  location: string;
}

export interface UpdateInventoryInput extends CreateInventoryInput {}

export interface InventoryUpsertBody {
  partNumber: string;
  manufacturer: string;
  dateCode: string;
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
  date_code: string;
  quantity: number;
  unit_condition: string;
  location: string;
  created_at: string;
  updated_at: string;
}
