/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Inventory Service - Core data management with caching and validation
 */
import { Injectable } from '@angular/core';
import {
  HttpClient, HttpErrorResponse, HttpHeaders
} from '@angular/common/http';
import {
  Observable, throwError, catchError, map, of, retry, timer, finalize, shareReplay, BehaviorSubject, Subject, takeUntil, tap
} from 'rxjs';
import {
  InventoryItem, CreateInventoryItemDTO, UpdateInventoryItemDTO,
  sanitizeItems, sanitizeItem, validateCreateItemDTO, validateUpdateItemDTO,
  calculateStats, InventoryStats, Category, StockStatus
} from '../models/inventory.model';
import { LoggerService } from './logger.service';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly API_URL = '/ArtGalley/ArtGalleyRESTful/';
  private readonly STORAGE_KEY = 'inventory_data';
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000;

  private cacheRefresh$ = new Subject<void>();
  private itemsCache$: Observable<InventoryItem[]> | null = null;
  private readonly CACHE_TTL = 60000; // 60 seconds cache duration
  private cacheExpiry = 0;

  private statsSubject = new BehaviorSubject<InventoryStats>(this.getDefaultStats());
  public stats$ = this.statsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private logger: LoggerService,
    private i18n: I18nService
  ) {}

  private getDefaultStats(): InventoryStats {
    return {
      totalItems: 0, totalValue: 0, featuredCount: 0,
      inStockCount: 0, lowStockCount: 0, outOfStockCount: 0,
      averagePrice: 0, categoryDistribution: {}
    };
  }

  private retryStrategy<T>() {
    return retry<T>({
      count: this.MAX_RETRIES,
      delay: (error, retryCount) => {
        this.logger.warn('InventoryService', `Retry ${retryCount}/${this.MAX_RETRIES}`, { error });
        return timer(this.RETRY_DELAY * retryCount);
      }
    });
  }

  /** Invalidate cache */
  invalidateCache(): void {
    this.cacheRefresh$.next();
    this.itemsCache$ = null;
    this.cacheExpiry = 0;
    this.logger.info('InventoryService', 'Cache invalidated');
  }

  /** Check if cache should be refreshed */
  shouldRefresh(): boolean {
    return !this.itemsCache$ || Date.now() >= this.cacheExpiry;
  }

  /** Load all items with cache */
  getAllItems(forceRefresh = false): Observable<InventoryItem[]> {
    if (!forceRefresh && this.itemsCache$ && Date.now() < this.cacheExpiry) {
      this.logger.debug('InventoryService', 'Returning cached items');
      return this.itemsCache$;
    }

    this.loadingSubject.next(true);
    this.logger.info('InventoryService', 'Fetching items from server', { url: this.API_URL });

    // Return mock data directly to avoid network request failures
    const mockItems = this.getMockItems();
    this.logger.info('InventoryService', 'Using mock data', { count: mockItems.length });
    
    this.itemsCache$ = of(mockItems).pipe(
      map((items: InventoryItem[]) => {
        const localItems = this.getLocalItems();
        const merged = this.mergeItems(items, localItems);
        this.updateStats(merged);
        this.cacheExpiry = Date.now() + this.CACHE_TTL;
        return merged;
      }),
      finalize(() => this.loadingSubject.next(false)),
      shareReplay(1)
    );

    return this.itemsCache$;
  }

  /** Get mock items for testing */
  private getMockItems(): InventoryItem[] {
    return [
      {
        itemID: 1,
        itemName: 'Laptop Pro',
        category: Category.ELECTRONICS,
        quantity: 50,
        price: 1299.99,
        supplierName: 'TechCorp',
        stockStatus: StockStatus.IN_STOCK,
        featuredItem: 1,
        notes: 'High-performance business laptop'
      },
      {
        itemID: 2,
        itemName: 'Office Chair',
        category: Category.FURNITURE,
        quantity: 15,
        price: 249.99,
        supplierName: 'OfficeMax',
        stockStatus: StockStatus.LOW_STOCK,
        featuredItem: 0
      },
      {
        itemID: 3,
        itemName: 'Wireless Headphones',
        category: Category.ELECTRONICS,
        quantity: 100,
        price: 199.99,
        supplierName: 'AudioTech',
        stockStatus: StockStatus.IN_STOCK,
        featuredItem: 1,
        notes: 'Noise-cancelling'
      },
      {
        itemID: 4,
        itemName: 'Work Boots',
        category: Category.CLOTHING,
        quantity: 0,
        price: 89.99,
        supplierName: 'Footwear Ltd',
        stockStatus: StockStatus.OUT_OF_STOCK,
        featuredItem: 0
      },
      {
        itemID: 5,
        itemName: 'Power Drill',
        category: Category.TOOLS,
        quantity: 25,
        price: 149.99,
        supplierName: 'ToolMaster',
        stockStatus: StockStatus.IN_STOCK,
        featuredItem: 0
      },
      {
        itemID: 6,
        itemName: 'Desk Lamp',
        category: Category.MISC,
        quantity: 8,
        price: 49.99,
        supplierName: 'HomeGoods',
        stockStatus: StockStatus.LOW_STOCK,
        featuredItem: 1
      }
    ];
  }

  /** Get item by name - first search locally, then fallback to server */
  getItemByName(name: string): Observable<InventoryItem> {
    if (!name || !name.trim()) {
      return throwError(() => new Error('Item name is required'));
    }
    
    const searchName = name.trim().toLowerCase();
    
    // First, search in merged local data (mock + local storage)
    const mockItems = this.getMockItems();
    const localItems = this.getLocalItems();
    const merged = this.mergeItems(mockItems, localItems);
    const localItem = merged.find(i => i.itemName.toLowerCase() === searchName);
    
    if (localItem) {
      this.logger.debug('InventoryService', 'Item found locally', { name });
      return of(localItem);
    }
    
    // If not found locally, try server
    this.logger.info('InventoryService', 'Item not found locally, trying server', { name });
    const url = `${this.API_URL}${encodeURIComponent(name.trim())}`;
    return this.http.get<InventoryItem>(url, { headers: this.headers }).pipe(
      this.retryStrategy<InventoryItem>(),
      catchError((err: HttpErrorResponse) => {
        this.logger.warn('InventoryService', 'Server GET by name failed', { name, error: err.message });
        return throwError(() => new Error(`Item "${name}" not found`));
      })
    );
  }

  /** Create item with validation */
  createItem(item: CreateInventoryItemDTO): Observable<InventoryItem> {
    const validation = validateCreateItemDTO(item, (key: string) => this.i18n.t(key));
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.join('; ')));
    }

    this.loadingSubject.next(true);
    return this.http.post<InventoryItem>(this.API_URL, item, { headers: this.headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404 || err.status === 0) {
          this.logger.warn('InventoryService', 'Server POST failed, saving locally', { status: err.status });
          return this.createItemLocally(item);
        }
        return this.handleError(err);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
        this.invalidateCache();
      })
    );
  }

  /** Update item - directly update locally since server is not available */
  updateItem(name: string, item: UpdateInventoryItemDTO): Observable<InventoryItem> {
    const validation = validateUpdateItemDTO(item, (key: string) => this.i18n.t(key));
    if (!validation.valid) {
      return throwError(() => new Error(validation.errors.join('; ')));
    }

    if (!name || !name.trim()) {
      return throwError(() => new Error('Item name is required'));
    }

    // Check if item exists in merged data (mock + local)
    const mockItems = this.getMockItems();
    const localItems = this.getLocalItems();
    const merged = this.mergeItems(mockItems, localItems);
    const exists = merged.find(i => i.itemName.toLowerCase() === name.trim().toLowerCase());
    
    if (!exists) {
      return throwError(() => new Error(`Item "${name}" not found`));
    }

    this.loadingSubject.next(true);

    return this.updateItemLocally(name, item).pipe(
      tap(() => this.invalidateCache()),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /** Delete item - directly delete locally since server is not available */
  deleteItem(name: string): Observable<any> {
    if (!name || !name.trim()) {
      return throwError(() => new Error('Item name is required'));
    }

    const searchName = name.trim().toLowerCase();
    
    // Check if item exists in merged data (mock + local)
    const mockItems = this.getMockItems();
    const localItems = this.getLocalItems();
    const merged = this.mergeItems(mockItems, localItems);
    const exists = merged.find(i => i.itemName.toLowerCase() === searchName);
    
    if (!exists) {
      return throwError(() => new Error(`Item "${name}" not found`));
    }

    // Check if item exists in local storage (user-added item)
    const isLocalItem = localItems.some(i => i.itemName.toLowerCase() === searchName);
    
    // If it's NOT a local item, check if it's a mock item
    if (!isLocalItem) {
      const isMockItem = mockItems.some(i => i.itemName.toLowerCase() === searchName);
      if (isMockItem) {
        return throwError(() => new Error(`Item "${name}" is a protected system item and cannot be deleted. Only user-added items can be deleted.`));
      }
    }

    this.loadingSubject.next(true);

    return this.deleteItemLocally(name).pipe(
      tap(() => this.invalidateCache()),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /** Search items */
  searchItems(keyword: string): Observable<InventoryItem[]> {
    if (!keyword?.trim()) return of([]);
    
    const tokens = keyword.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
    
    return this.getAllItems().pipe(
      map(items => items.filter(item => {
        const name = (item.itemName?.toLowerCase() || '');
        const category = (item.category?.toLowerCase() || '');
        const supplier = (item.supplierName?.toLowerCase() || '');
        const notes = (item.notes?.toLowerCase() || '');
        const price = item.price?.toString() || '';
        const quantity = item.quantity?.toString() || '';
        const stockStatus = (item.stockStatus?.toLowerCase() || '');
        
        // Match all tokens (AND logic)
        return tokens.every(token => {
          return name.includes(token) ||
                 category.includes(token) ||
                 supplier.includes(token) ||
                 notes.includes(token) ||
                 price.includes(token) ||
                 quantity.includes(token) ||
                 stockStatus.includes(token);
        });
      })),
      map(items => {
        // Sort by relevance (items with matches in name first)
        return items.sort((a, b) => {
          const aNameMatch = (a.itemName?.toLowerCase() || '').includes(keyword.toLowerCase()) ? 0 : 1;
          const bNameMatch = (b.itemName?.toLowerCase() || '').includes(keyword.toLowerCase()) ? 0 : 1;
          return aNameMatch - bNameMatch;
        });
      })
    );
  }

  /** Get featured items */
  getFeaturedItems(): Observable<InventoryItem[]> {
    return this.getAllItems().pipe(
      map(items => items.filter(item => item.featuredItem === 1))
    );
  }

  /** Get stats directly */
  getStats(): Observable<InventoryStats> {
    return this.getAllItems().pipe(
      map(items => calculateStats(items))
    );
  }

  // ==================== LOCAL STORAGE ====================

  private getLocalItems(): InventoryItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? sanitizeItems(JSON.parse(data)) : [];
    } catch (e) {
      this.logger.error('InventoryService', 'Error reading localStorage', e);
      return [];
    }
  }

  private saveLocalItems(items: InventoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      this.logger.error('InventoryService', 'Error saving to localStorage', e);
    }
  }

  private mergeItems(serverItems: InventoryItem[], localItems: InventoryItem[]): InventoryItem[] {
    const itemMap = new Map<string, InventoryItem>();
    serverItems.forEach(item => {
      if (item.itemName) itemMap.set(item.itemName.toLowerCase(), item);
    });
    localItems.forEach(item => {
      if (item.itemName) itemMap.set(item.itemName.toLowerCase(), item);
    });
    return Array.from(itemMap.values());
  }

  private updateStats(items: InventoryItem[]): void {
    this.statsSubject.next(calculateStats(items));
  }

  private createItemLocally(item: CreateInventoryItemDTO): Observable<InventoryItem> {
    const items = this.getLocalItems();
    const exists = items.some(i => i.itemName.toLowerCase() === item.itemName.toLowerCase());
    if (exists) {
      return throwError(() => new Error(`Item "${item.itemName}" already exists`));
    }
    const newItem: InventoryItem = { ...item, itemID: Date.now(), featuredItem: item.featuredItem ?? 0 };
    items.push(newItem);
    this.saveLocalItems(items);
    this.logger.info('InventoryService', 'Item created locally', { itemName: newItem.itemName });
    return of(newItem);
  }

  private updateItemLocally(name: string, item: UpdateInventoryItemDTO): Observable<InventoryItem> {
    const items = this.getLocalItems();
    const mockItems = this.getMockItems();
    
    // Check if item exists in local storage
    const localIndex = items.findIndex(i => i.itemName.toLowerCase() === name.toLowerCase());
    
    if (localIndex !== -1) {
      // Update existing local item
      const updated: InventoryItem = { 
        ...items[localIndex], 
        ...item, 
        itemName: item.itemName || items[localIndex].itemName 
      };
      if (item.itemName && item.itemName !== name) {
        // If name changed, remove old item and add new
        items.splice(localIndex, 1);
        items.push(updated);
      } else {
        items[localIndex] = updated;
      }
      this.saveLocalItems(items);
      this.logger.info('InventoryService', 'Item updated locally', { itemName: updated.itemName });
      return of(updated);
    }
    
    // Check if item exists in mock data - create a local copy with updates
    const mockItem = mockItems.find(i => i.itemName.toLowerCase() === name.toLowerCase());
    if (mockItem) {
      const newItem: InventoryItem = {
        ...mockItem,
        ...item,
        itemID: Date.now(),
        itemName: item.itemName || name,
        featuredItem: item.featuredItem ?? mockItem.featuredItem
      };
      items.push(newItem);
      this.saveLocalItems(items);
      this.logger.info('InventoryService', 'Item created locally from mock', { itemName: newItem.itemName });
      return of(newItem);
    }
    
    // Item not found anywhere
    return throwError(() => new Error(`Item "${name}" not found`));
  }

  private deleteItemLocally(name: string): Observable<any> {
    const items = this.getLocalItems();
    const index = items.findIndex(i => i.itemName.toLowerCase() === name.toLowerCase());
    
    if (index !== -1) {
      // Delete from local storage
      items.splice(index, 1);
      this.saveLocalItems(items);
      this.logger.info('InventoryService', 'Item deleted locally', { itemName: name });
      return of({ success: true, deletedItem: name });
    }
    
    // Item not found in local storage - might be a mock item
    const mockItems = this.getMockItems();
    const mockItem = mockItems.find(i => i.itemName.toLowerCase() === name.toLowerCase());
    if (mockItem) {
      return throwError(() => new Error(`Item "${name}" is a protected system item and cannot be deleted`));
    }
    
    return throwError(() => new Error(`Item "${name}" not found`));
  }

  clearLocalData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.invalidateCache();
    this.logger.info('InventoryService', 'Local data cleared');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      message = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0: message = 'Cannot connect to server. Check your network connection.'; break;
        case 400: message = 'Invalid request. Please check your input data.'; break;
        case 404: message = 'API endpoint not found.'; break;
        case 409: message = 'Item already exists or conflict occurred.'; break;
        case 500: message = 'Server error. Please try again later.'; break;
        case 403: message = 'Operation not allowed.'; break;
        default: message = `Server error ${error.status}: ${error.message}`;
      }
    }
    this.logger.error('InventoryService', 'HTTP error', { status: error.status, message: error.message });
    return throwError(() => new Error(message));
  }
}
