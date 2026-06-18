/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Inventory Model with Validation & Type Guards
 */

/** Category enumeration */
export enum Category {
  ELECTRONICS = 'Electronics',
  FURNITURE = 'Furniture',
  CLOTHING = 'Clothing',
  TOOLS = 'Tools',
  MISC = 'Miscellaneous',
}

/** Stock status enumeration */
export enum StockStatus {
  IN_STOCK = 'In Stock',
  LOW_STOCK = 'Low Stock',
  OUT_OF_STOCK = 'Out of Stock',
}

/** Inventory item interface */
export interface InventoryItem {
  itemID: number;
  itemName: string;
  category: Category;
  quantity: number;
  price: number;
  supplierName: string;
  stockStatus: StockStatus;
  featuredItem: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** DTO for creating */
export interface CreateInventoryItemDTO {
  itemName: string;
  category: Category;
  quantity: number;
  price: number;
  supplierName: string;
  stockStatus: StockStatus;
  featuredItem: number;
  notes?: string;
}

/** DTO for updating */
export interface UpdateInventoryItemDTO {
  itemName: string;
  category: Category;
  quantity: number;
  price: number;
  supplierName: string;
  stockStatus: StockStatus;
  featuredItem: number;
  notes?: string;
}

/** Validation result type */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Category options */
export const CATEGORY_OPTIONS = [
  { value: Category.ELECTRONICS, label: 'Electronics', icon: 'desktop-outline' },
  { value: Category.FURNITURE, label: 'Furniture', icon: 'bed-outline' },
  { value: Category.CLOTHING, label: 'Clothing', icon: 'shirt-outline' },
  { value: Category.TOOLS, label: 'Tools', icon: 'hammer-outline' },
  { value: Category.MISC, label: 'Miscellaneous', icon: 'cube-outline' },
];

/** Stock status options */
export const STOCK_STATUS_OPTIONS = [
  { value: StockStatus.IN_STOCK, label: 'In Stock', color: 'success' },
  { value: StockStatus.LOW_STOCK, label: 'Low Stock', color: 'warning' },
  { value: StockStatus.OUT_OF_STOCK, label: 'Out of Stock', color: 'danger' },
];

/** Inventory statistics */
export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  featuredCount: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  averagePrice: number;
  categoryDistribution: Record<string, number>;
}

// ======================== TYPE GUARDS ========================

/** Type guard for InventoryItem */
export function isInventoryItem(obj: any): obj is InventoryItem {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.itemID === 'number' &&
    typeof obj.itemName === 'string' &&
    typeof obj.quantity === 'number' &&
    typeof obj.price === 'number' &&
    typeof obj.supplierName === 'string' &&
    typeof obj.featuredItem === 'number' &&
    Object.values(Category).includes(obj.category) &&
    Object.values(StockStatus).includes(obj.stockStatus)
  );
}

/** Type guard for array of items */
export function isInventoryItemArray(arr: any[]): arr is InventoryItem[] {
  return Array.isArray(arr) && arr.every(isInventoryItem);
}

// ======================== VALIDATORS ========================

/** Validate item name */
export function validateItemName(name: string, t?: (key: string) => string): string | null {
  const _t = t || ((k: string) => k);
  const trimmed = name?.trim();
  if (!trimmed) return _t('validation.itemNameRequired');
  if (trimmed.length < 2) return _t('validation.itemNameMinLength');
  if (trimmed.length > 100) return _t('validation.itemNameMaxLength');
  if (!/^[\w\s\-'.()]+$/.test(trimmed)) {
    return _t('validation.itemNameInvalid');
  }
  return null;
}

/** Validate supplier name */
export function validateSupplierName(name: string, t?: (key: string) => string): string | null {
  const _t = t || ((k: string) => k);
  const trimmed = name?.trim();
  if (!trimmed) return _t('validation.supplierRequired');
  if (trimmed.length < 2) return _t('validation.supplierMinLength');
  if (trimmed.length > 100) return _t('validation.supplierMaxLength');
  return null;
}

/** Validate quantity */
export function validateQuantity(qty: number, t?: (key: string) => string): string | null {
  const _t = t || ((k: string) => k);
  if (qty === null || qty === undefined || isNaN(qty)) {
    return _t('validation.quantityRequired');
  }
  if (!Number.isInteger(qty)) return _t('validation.quantityInteger');
  if (qty < 0) return _t('validation.quantityNegative');
  if (qty > 999999) return _t('validation.quantityMax');
  return null;
}

/** Validate price */
export function validatePrice(price: number, t?: (key: string) => string): string | null {
  const _t = t || ((k: string) => k);
  if (price === null || price === undefined || isNaN(price)) {
    return _t('validation.priceRequired');
  }
  if (price < 0) return _t('validation.priceNegative');
  if (price > 99999999) return _t('validation.priceMax');
  return null;
}

/** Validate notes */
export function validateNotes(notes?: string, t?: (key: string) => string): string | null {
  const _t = t || ((k: string) => k);
  if (notes && notes.length > 500) return _t('validation.notesMaxLength');
  return null;
}

/** Full validation for create DTO */
export function validateCreateItemDTO(dto: CreateInventoryItemDTO, t?: (key: string) => string): ValidationResult {
  const _t = t || ((k: string) => k);
  const errors: string[] = [];

  const nameError = validateItemName(dto.itemName, t);
  if (nameError) errors.push(nameError);

  const supplierError = validateSupplierName(dto.supplierName, t);
  if (supplierError) errors.push(supplierError);

  const qtyError = validateQuantity(dto.quantity, t);
  if (qtyError) errors.push(qtyError);

  const priceError = validatePrice(dto.price, t);
  if (priceError) errors.push(priceError);

  const notesError = validateNotes(dto.notes, t);
  if (notesError) errors.push(notesError);

  if (!Object.values(Category).includes(dto.category)) {
    errors.push(_t('validation.invalidCategory'));
  }
  if (!Object.values(StockStatus).includes(dto.stockStatus)) {
    errors.push(_t('validation.invalidStockStatus'));
  }

  return { valid: errors.length === 0, errors };
}

/** Full validation for update DTO */
export function validateUpdateItemDTO(dto: UpdateInventoryItemDTO, t?: (key: string) => string): ValidationResult {
  return validateCreateItemDTO(dto, t);
}

// ======================== HELPERS ========================

/** Calculate inventory stats from items */
export function calculateStats(items: InventoryItem[]): InventoryStats {
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const featuredCount = items.filter((i) => i.featuredItem === 1).length;
  const inStockCount = items.filter((i) => i.stockStatus === StockStatus.IN_STOCK).length;
  const lowStockCount = items.filter((i) => i.stockStatus === StockStatus.LOW_STOCK).length;
  const outOfStockCount = items.filter((i) => i.stockStatus === StockStatus.OUT_OF_STOCK).length;
  const averagePrice = totalItems > 0
    ? Math.round(items.reduce((sum, i) => sum + i.price, 0) / totalItems)
    : 0;

  const categoryDistribution = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalItems,
    totalValue,
    featuredCount,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    averagePrice,
    categoryDistribution,
  };
}

/** Sanitize item data from server */
export function sanitizeItem(raw: any): InventoryItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const item: InventoryItem = {
    itemID: Number(raw.itemID) || Date.now(),
    itemName: String(raw.itemName || '').trim(),
    category: Object.values(Category).includes(raw.category)
      ? raw.category
      : Category.MISC,
    quantity: Math.max(0, Math.floor(Number(raw.quantity) || 0)),
    price: Math.max(0, Number(raw.price) || 0),
    supplierName: String(raw.supplierName || '').trim(),
    stockStatus: Object.values(StockStatus).includes(raw.stockStatus)
      ? raw.stockStatus
      : StockStatus.IN_STOCK,
    featuredItem: raw.featuredItem === 1 ? 1 : 0,
    notes: raw.notes ? String(raw.notes).trim() : undefined,
  };

  if (!item.itemName) return null;
  return item;
}

/** Sanitize array of items */
export function sanitizeItems(rawItems: any[]): InventoryItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map(sanitizeItem).filter((item): item is InventoryItem => item !== null);
}

/** Help content factory - supports i18n via optional translate function */
export function getHelpContent(t?: (key: string) => string): Record<string, { title: string; content: string[] }> {
  const _t = t || ((k: string) => k);
  return {
    home: {
      title: _t('help.inventoryListTitle'),
      content: [
        _t('help.inventoryList1'),
        _t('help.inventoryList2'),
        _t('help.inventoryList3'),
        _t('help.inventoryList4'),
      ],
    },
    search: {
      title: _t('help.searchTitle'),
      content: [
        _t('help.search1'),
        _t('help.search2'),
        _t('help.search3'),
      ],
    },
    manage: {
      title: _t('help.manageTitle'),
      content: [
        _t('help.manage1'),
        _t('help.manage2'),
        _t('help.manage3'),
        _t('help.manage4'),
      ],
    },
    featured: {
      title: _t('help.featuredTitle'),
      content: [
        _t('help.featured1'),
        _t('help.featured2'),
      ],
    },
    privacy: {
      title: _t('help.privacyTitle'),
      content: [
        _t('help.privacy1'),
        _t('help.privacy2'),
        _t('help.privacy3'),
      ],
    },
  };
}

/** @deprecated Use getHelpContent(t) for i18n support */
export const HELP_CONTENT = getHelpContent();
