/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Home Page - Inventory List with Status Filtering
 */
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonRefresher, IonRefresherContent, IonButtons, IonButton,
  IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSegment,
  IonSegmentButton, IonFab, IonFabButton, IonNote, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cubeOutline, helpCircleOutline, refreshOutline, star, businessOutline,
  pricetagOutline, layersOutline, cloudOfflineOutline, saveOutline,
  addOutline, filterOutline, trendingUpOutline, trendingDownOutline,
  warningOutline, checkmarkCircleOutline
} from 'ionicons/icons';
import { Subject, takeUntil, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HelpService } from '../../services/help.service';
import { NetworkService } from '../../services/network.service';
import { LoggerService } from '../../services/logger.service';
import { InventoryItem, StockStatus, Category, InventoryStats } from '../../models/inventory.model';
import { InventoryService } from '../../services/inventory.service';
import { I18nService } from '../../services/i18n.service';
import { SkeletonListComponent, EmptyStateComponent, ErrorStateComponent } from '../../components/shared-ui';
import { formatCurrency, formatNumber } from '../../utils';

type FilterTab = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'featured';

interface ViewState {
  items: InventoryItem[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  isOnline: boolean;
  filter: FilterTab;
  stats: InventoryStats;
}

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon name="cube-outline" style="margin-right: 8px"></ion-icon>
          {{ t('nav.home') }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp()" aria-label="Help">
            <ion-icon name="help-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Filter Tabs -->
      <ion-toolbar color="light" *ngIf="!vm.hasError">
        <ion-segment [(ngModel)]="filterTab" (ionChange)="onFilterChange($event)" scrollable>
          <ion-segment-button value="all">
            <ion-icon name="filter-outline" size="small"></ion-icon>
            <ion-label>{{ t('app.all') }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="in-stock">
            <ion-icon name="checkmark-circle-outline" size="small" color="success"></ion-icon>
            <ion-label>{{ t('stock.in_stock') }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="low-stock">
            <ion-icon name="warning-outline" size="small" color="warning"></ion-icon>
            <ion-label>{{ t('stock.low_stock') }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="out-of-stock">
            <ion-icon name="trending-down-outline" size="small" color="danger"></ion-icon>
            <ion-label>{{ t('stock.out_of_stock') }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="featured">
            <ion-icon name="star" size="small" color="warning"></ion-icon>
            <ion-label>{{ t('nav.featured') }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Offline Notice -->
      <ion-note *ngIf="!vm.isOnline && !vm.hasError" class="offline-banner" color="warning">
        <ion-icon name="cloud-offline-outline"></ion-icon>
        {{ t('inventory.offlineNotice') }}
      </ion-note>

      <!-- Local Data Notice -->
      <ion-note *ngIf="vm.isOnline && !vm.hasError" class="data-banner" color="primary">
        <ion-icon name="save-outline"></ion-icon>
        {{ t('inventory.localDataNotice') }}
      </ion-note>

      <ion-refresher slot="fixed" (ionRefresh)="refreshItems($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <app-skeleton-list *ngIf="vm.isLoading && !vm.hasError" [count]="6"></app-skeleton-list>

      <!-- Error State -->
      <app-error-state
        *ngIf="vm.hasError && !vm.isLoading"
        [message]="vm.errorMessage"
        (retryClick)="loadItems(true)">
      </app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!vm.isLoading && !vm.hasError && filteredItems.length === 0"
        icon="cube-outline"
        [title]="t('inventory.noItems')"
        [message]="emptyMessage">
      </app-empty-state>

      <!-- Stats Overview -->
      <ion-card *ngIf="!vm.isLoading && !vm.hasError && vm.items.length > 0" class="stats-card">
        <ion-card-content>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ formatNumber(vm.stats.totalItems) }}</div>
              <div class="stat-label">{{ t('inventory.totalItems') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatCurrency(vm.stats.totalValue) }}</div>
              <div class="stat-label">{{ t('inventory.totalValue') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" [class.text-success]="vm.stats.inStockCount > 0">
                {{ formatNumber(vm.stats.inStockCount) }}
              </div>
              <div class="stat-label">{{ t('stock.in_stock') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" [class.text-danger]="vm.stats.outOfStockCount > 0">
                {{ formatNumber(vm.stats.outOfStockCount) }}
              </div>
              <div class="stat-label">{{ t('stock.out_of_stock') }}</div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Inventory List -->
      <ion-list *ngIf="!vm.isLoading && !vm.hasError && filteredItems.length > 0" class="inventory-list">
        <ion-item
          *ngFor="let item of filteredItems; trackBy: trackByItemId"
          class="inventory-item"
          [class.in-stock]="item.stockStatus === stockStatus.IN_STOCK"
          [class.low-stock]="item.stockStatus === stockStatus.LOW_STOCK"
          [class.out-of-stock]="item.stockStatus === stockStatus.OUT_OF_STOCK"
          [class.popular]="item.featuredItem === 1"
          [attr.aria-label]="item.itemName + ', ' + item.stockStatus">

          <ion-label class="ion-text-wrap">
            <h2 class="item-name">
              {{ item.itemName }}
              <ion-icon *ngIf="item.featuredItem === 1" name="star" color="warning" class="featured-icon"></ion-icon>
            </h2>
            <p class="item-meta">
              <span class="meta-tag"><ion-icon name="layers-outline" size="small"></ion-icon> {{ item.category }}</span>
              <span class="meta-tag"><ion-icon name="business-outline" size="small"></ion-icon> {{ item.supplierName }}</span>
            </p>
            <p class="item-price">
              <span class="price-tag">{{ formatCurrency(item.price) }}</span>
              <span class="qty-tag">{{ t('inventory.quantity') }}: {{ formatNumber(item.quantity) }}</span>
            </p>
            <p *ngIf="item.notes" class="item-notes">{{ item.notes }}</p>
          </ion-label>

          <ion-badge slot="end" [color]="getStatusColor(item.stockStatus)" class="status-badge">
            {{ item.stockStatus }}
          </ion-badge>
        </ion-item>
      </ion-list>
    </ion-content>

    <!-- Quick Add FAB -->
    <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="fab-padding">
      <ion-fab-button routerLink="/tabs/manage" color="primary" [attr.aria-label]="t('inventory.addItem')">
        <ion-icon name="add-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonBadge, IonIcon, IonRefresher, IonRefresherContent, IonButtons,
    IonButton, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonSegment, IonSegmentButton, IonFab, IonFabButton, IonNote,
    SkeletonListComponent, EmptyStateComponent, ErrorStateComponent
  ]
})
export class HomePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  vm: ViewState = {
    items: [], isLoading: true, hasError: false, errorMessage: '',
    isOnline: true, filter: 'all', stats: this.getDefaultStats()
  };

  filterTab: FilterTab = 'all';
  stockStatus = StockStatus;
  category = Category;
  formatCurrency = formatCurrency;
  formatNumber = formatNumber;

  filteredItems: InventoryItem[] = [];

  constructor(
    private inventoryService: InventoryService,
    private helpService: HelpService,
    private networkService: NetworkService,
    private logger: LoggerService,
    private toastController: ToastController,
    private i18n: I18nService
  ) {
    addIcons({
      'cube-outline': cubeOutline, 'help-circle-outline': helpCircleOutline,
      'refresh-outline': refreshOutline, 'star': star, 'business-outline': businessOutline,
      'pricetag-outline': pricetagOutline, 'layers-outline': layersOutline,
      'cloud-offline-outline': cloudOfflineOutline, 'save-outline': saveOutline,
      'add-outline': addOutline, 'filter-outline': filterOutline,
      'trending-up-outline': trendingUpOutline, 'trending-down-outline': trendingDownOutline,
      'warning-outline': warningOutline, 'checkmark-circle-outline': checkmarkCircleOutline
    });
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  ngOnInit(): void {
    // Initial load, use cache
    this.loadItems(false);
    this.networkService.getNetworkStatus().pipe(takeUntil(this.destroy$)).subscribe(online => {
      this.vm = { ...this.vm, isOnline: online };
    });
  }

  ionViewWillEnter(): void {
    // Refresh only when cache is expired
    if (this.inventoryService.shouldRefresh()) {
      this.logger.debug('HomePage', 'Cache expired, refreshing data');
      this.loadItems(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItems(forceRefresh = false): void {
    this.vm = { ...this.vm, isLoading: true, hasError: false };
    this.logger.info('HomePage', 'Loading items', { forceRefresh });

    this.inventoryService.getAllItems(forceRefresh).pipe(takeUntil(this.destroy$)).subscribe({
      next: (items: InventoryItem[]) => {
        this.vm = { ...this.vm, items, isLoading: false };
        this.applyFilter();
      },
      error: (err: any) => {
        this.vm = { ...this.vm, isLoading: false, hasError: true, errorMessage: err.message || this.t('errors.unknownError') };
        this.logger.error('HomePage', 'Failed to load items', err);
      }
    });

    this.inventoryService.stats$.pipe(takeUntil(this.destroy$)).subscribe((stats: InventoryStats) => {
      this.vm = { ...this.vm, stats };
    });
  }

  refreshItems(event: any): void {
    this.inventoryService.getAllItems(true).pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        this.vm = { ...this.vm, items };
        this.applyFilter();
        event.target.complete();
      },
      error: (err) => {
        event.target.complete();
        this.showToast(err.message, 'danger');
      }
    });
  }

  onFilterChange(event: any): void {
    this.filterTab = event.detail.value as FilterTab;
    this.applyFilter();
  }

  private applyFilter(): void {
    const items = this.vm.items;
    switch (this.filterTab) {
      case 'in-stock':
        this.filteredItems = items.filter(i => i.stockStatus === StockStatus.IN_STOCK);
        break;
      case 'low-stock':
        this.filteredItems = items.filter(i => i.stockStatus === StockStatus.LOW_STOCK);
        break;
      case 'out-of-stock':
        this.filteredItems = items.filter(i => i.stockStatus === StockStatus.OUT_OF_STOCK);
        break;
      case 'featured':
        this.filteredItems = items.filter(i => i.featuredItem === 1);
        break;
      default:
        this.filteredItems = items;
    }
    this.vm = { ...this.vm, filter: this.filterTab };
  }

  get emptyMessage(): string {
    switch (this.filterTab) {
      case 'in-stock': return this.t('inventory.noInStock');
      case 'low-stock': return this.t('inventory.noLowStock');
      case 'out-of-stock': return this.t('inventory.noOutOfStock');
      case 'featured': return this.t('inventory.noFeatured');
      default: return this.t('inventory.emptyInventory');
    }
  }

  getStatusColor(status: StockStatus): string {
    switch (status) {
      case StockStatus.IN_STOCK: return 'success';
      case StockStatus.LOW_STOCK: return 'warning';
      case StockStatus.OUT_OF_STOCK: return 'danger';
      default: return 'medium';
    }
  }

  trackByItemId(index: number, item: InventoryItem): number {
    return item.itemID;
  }

  showHelp(): void {
    this.helpService.showHelp('home');
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'bottom', color });
    await toast.present();
  }

  private getDefaultStats(): InventoryStats {
    return {
      totalItems: 0, totalValue: 0, featuredCount: 0,
      inStockCount: 0, lowStockCount: 0, outOfStockCount: 0,
      averagePrice: 0, categoryDistribution: {}
    };
  }
}
