/**
 * Inventory Management System
 * Internationalization (i18n) Service
 * Developer: Yuning Wang
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'en';

interface Translations {
  [key: string]: string | Translations;
}

const EN: Translations = {
  app: {
    title: 'Inventory Management',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    close: 'Close',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    add: 'Add',
    update: 'Update',
    manage: 'Manage',
    start: 'Start',
    results: 'Results',
    items: 'items',
    value: 'Value',
    summary: 'Summary',
    generated: 'Generated',
    categoryBreakdown: 'Category Breakdown',
    leavePage: 'Leave Page?',
    unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?',
    stay: 'Stay',
    tryAgain: 'Try Again'
  },
  validation: {
    itemNameRequired: 'Item name is required',
    itemNameMinLength: 'Item name must be at least 2 characters',
    itemNameMaxLength: 'Item name must not exceed 100 characters',
    itemNameInvalid: 'Item name contains invalid characters',
    supplierRequired: 'Supplier name is required',
    supplierMinLength: 'Supplier name must be at least 2 characters',
    supplierMaxLength: 'Supplier name must not exceed 100 characters',
    quantityRequired: 'Quantity is required',
    quantityInteger: 'Quantity must be a whole number',
    quantityNegative: 'Quantity cannot be negative',
    quantityMax: 'Quantity exceeds maximum limit',
    priceRequired: 'Price is required',
    priceNegative: 'Price cannot be negative',
    priceMax: 'Price exceeds maximum limit',
    notesMaxLength: 'Notes must not exceed 500 characters',
    invalidCategory: 'Invalid category selected',
    invalidStockStatus: 'Invalid stock status selected'
  },
  help: {
    inventoryListTitle: 'Inventory List',
    inventoryList1: 'View all inventory items with real-time stock status.',
    inventoryList2: 'Pull down to refresh data.',
    inventoryList3: 'Items are color-coded by stock status.',
    inventoryList4: 'Featured items show a star badge.',
    searchTitle: 'Search Inventory',
    search1: 'Type in the search bar to find items by name.',
    search2: 'Search is case-insensitive.',
    search3: 'Clear the search to see all items.',
    manageTitle: 'Manage Items',
    manage1: 'Add New: fill all required fields and tap Add.',
    manage2: 'Update: enter the existing item name, modify fields, then tap Update.',
    manage3: 'Delete: enter the item name and confirm deletion.',
    manage4: 'Items named "Laptop" are protected from deletion.',
    featuredTitle: 'Featured Items',
    featured1: 'Shows all items marked as featured.',
    featured2: 'Set Featured to "Yes" when adding or updating.',
    privacyTitle: 'Privacy & Security',
    privacy1: 'Data is stored locally in your browser.',
    privacy2: 'No personal information is collected.',
    privacy3: 'HTTPS is used for all server communication.'
  },
  nav: {
    home: 'Inventory',
    manage: 'Manage',
    search: 'Search',
    featured: 'Featured',
    privacy: 'Privacy'
  },
  inventory: {
    id: 'ID',
    totalItems: 'Total Items',
    totalValue: 'Total Value',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    featuredItems: 'Featured Items',
    averagePrice: 'Average Price',
    stockStatus: 'Stock Status',
    category: 'Category',
    quantity: 'Quantity',
    price: 'Price',
    name: 'Name',
    description: 'Description',
    created: 'Created',
    updated: 'Updated',
    noItems: 'No items found',
    addItem: 'Add Item',
    updateItem: 'Update Item',
    deleteItem: 'Delete Item',
    deleteConfirm: 'Are you sure you want to delete this item?',
    itemSaved: 'Item saved successfully',
    itemDeleted: 'Item deleted successfully',
    validationError: 'Please check your input and try again',
    itemName: 'Item Name',
    supplierName: 'Supplier Name',
    notes: 'Notes',
    featured: 'Featured',
    addNewItem: 'Add New Item',
    updateItemTitle: 'Update Item',
    deleteItemTitle: 'Delete Item',
    currentItemName: 'Current Item Name',
    newItemName: 'New Item Name',
    itemNamePlaceholder: 'Enter item name',
    supplierNamePlaceholder: 'Enter supplier name',
    quantityPlaceholder: 'Enter quantity',
    pricePlaceholder: '0.00',
    notesPlaceholder: 'Additional notes...',
    searchPlaceholder: 'Search by item name...',
    searchItemPlaceholder: 'Search for an item...',
    selectedItem: 'Selected Item',
    cannotDeleteProtected: 'This item is a protected system item and cannot be deleted.',
    required: 'Required',
    optional: 'Optional',
    protectedItem: 'Items named "Laptop" cannot be deleted',
    deleteWarning: 'This action cannot be undone.',
    offlineNotice: 'You are offline. Showing local data.',
    localDataNotice: 'Data saved locally in your browser',
    emptyInventory: 'The inventory is currently empty. Add your first item!',
    noInStock: 'No items are currently in stock.',
    noLowStock: 'No items have low stock.',
    noOutOfStock: 'No items are out of stock.',
    noFeatured: 'No items are marked as featured.',
    startSearching: 'Enter an item name to search the inventory.',
    noSearchResults: 'No items match your search.',
    noFeaturedItems: 'Mark items as featured when adding or updating them to see them here.',
    featuredCollection: 'Featured Collection',
    dataProtection: 'Data Protection',
    technologyStack: 'Technology Stack',
    important: 'Important',
    localStorageWarning: 'Local storage data is cleared if you clear browser data. Export important data regularly.'
  },
  categories: {
    electronics: 'Electronics',
    furniture: 'Furniture',
    clothing: 'Clothing',
    food: 'Food',
    books: 'Books',
    other: 'Other',
    tools: 'Tools',
    misc: 'Miscellaneous'
  },
  stock: {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock'
  },
  errors: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    notFound: 'Item not found.',
    validationFailed: 'Validation failed. Please check your input.',
    unknownError: 'An unexpected error occurred.',
    unauthorized: 'Session expired. Please log in again.',
    forbidden: 'You do not have permission to perform this action.',
    conflict: 'Conflict detected. The data may have been modified by another user.'
  }
};

const TRANSLATIONS: Record<Language, Translations> = { en: EN };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private currentLang = new BehaviorSubject<Language>('en');
  currentLang$ = this.currentLang.asObservable();

  private detectLanguage(): Language {
    // Always use English
    return 'en';
  }

  setLanguage(lang: Language): void {
    // Only English is supported
    this.currentLang.next('en');
  }

  getLanguage(): Language {
    return 'en';
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: unknown = TRANSLATIONS[this.currentLang.value];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // fallback to key
      }
    }
    return typeof value === 'string' ? value : key;
  }

  translate(key: string): Observable<string> {
    return new Observable(subscriber => {
      const emit = () => subscriber.next(this.t(key));
      emit();
      const sub = this.currentLang$.subscribe(() => emit());
      return () => sub.unsubscribe();
    });
  }
}
