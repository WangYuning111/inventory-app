/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Featured Page - Featured Inventory Items Collection
 */
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonButtons, IonButton, IonSpinner, IonRefresher,
  IonRefresherContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonFab, IonFabButton, ToastController, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  starOutline, helpCircleOutline, star, businessOutline, pricetagOutline,
  layersOutline, trophyOutline, addOutline, giftOutline, trendingUpOutline
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { InventoryService } from '../../services/inventory.service';
import { HelpService } from '../../services/help.service';
import { LoggerService } from '../../services/logger.service';
import { I18nService } from '../../services/i18n.service';
import { InventoryItem, StockStatus, InventoryStats } from '../../models/inventory.model';
import { SkeletonListComponent, EmptyStateComponent, ErrorStateComponent } from '../../components/shared-ui';
import { formatCurrency, formatNumber } from '../../utils';

@Component({
  selector: 'app-featured',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon name="star-outline" style="margin-right: 8px"></ion-icon>
          {{ t('nav.featured') }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp()" aria-label="Help">
            <ion-icon name="help-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refreshItems($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <app-skeleton-list *ngIf="isLoading && !hasError" [count]="4"></app-skeleton-list>

      <!-- Error State -->
      <app-error-state
        *ngIf="hasError && !isLoading"
        [message]="errorMessage"
        (retryClick)="loadItems(true)">
      </app-error-state>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && !hasError && items.length === 0"
        icon="star-outline"
        [title]="t('inventory.noItems')"
        [message]="t('inventory.noFeaturedItems')">
      </app-empty-state>

      <!-- Featured Hero Card -->
      <ion-card *ngIf="!isLoading && !hasError && items.length > 0" class="featured-hero">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="trophy-outline" color="warning"></ion-icon>
            {{ t('inventory.featuredCollection') }}
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-value">{{ items.length }}</div>
              <div class="hero-label">{{ t('inventory.featuredItems') }}</div>
            </div>
            <div class="hero-stat">
              <div class="hero-value">{{ formatCurrency(totalValue) }}</div>
              <div class="hero-label">{{ t('inventory.totalValue') }}</div>
            </div>
            <div class="hero-stat">
              <div class="hero-value">{{ formatCurrency(averagePrice) }}</div>
              <div class="hero-label">{{ t('inventory.averagePrice') }}</div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Featured Items List -->
      <ion-list *ngIf="!isLoading && !hasError && items.length > 0" class="inventory-list">
        <ion-item
          *ngFor="let item of items; trackBy: trackByItemId"
          class="inventory-item popular"
          [class.in-stock]="item.stockStatus === stockStatus.IN_STOCK"
          [class.low-stock]="item.stockStatus === stockStatus.LOW_STOCK"
          [class.out-of-stock]="item.stockStatus === stockStatus.OUT_OF_STOCK">

          <ion-icon name="star" slot="start" color="warning" class="featured-star"></ion-icon>

          <ion-label class="ion-text-wrap">
            <h2 class="item-name">{{ item.itemName }}</h2>
            <p class="item-meta">
              <span><ion-icon name="layers-outline" size="small"></ion-icon> {{ item.category }}</span>
              <span><ion-icon name="business-outline" size="small"></ion-icon> {{ item.supplierName }}</span>
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

    <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="fab-padding">
      <ion-fab-button routerLink="/tabs/manage" color="warning" [attr.aria-label]="t('inventory.addItem')">
        <ion-icon name="add-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonBadge, IonIcon, IonButtons, IonButton, IonSpinner, IonRefresher,
    IonRefresherContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonFab, IonFabButton, IonNote,
    SkeletonListComponent, EmptyStateComponent, ErrorStateComponent
  ]
})
export class FeaturedPage implements OnInit, OnDestroy {
  items: InventoryItem[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';
  stockStatus = StockStatus;

  totalValue = 0;
  averagePrice = 0;

  formatCurrency = formatCurrency;
  formatNumber = formatNumber;

  private destroy$ = new Subject<void>();

  constructor(
    private inventoryService: InventoryService,
    private helpService: HelpService,
    private logger: LoggerService,
    private toastController: ToastController,
    private i18n: I18nService
  ) {
    addIcons({
      'star-outline': starOutline, 'help-circle-outline': helpCircleOutline,
      'star': star, 'business-outline': businessOutline, 'pricetag-outline': pricetagOutline,
      'layers-outline': layersOutline, 'trophy-outline': trophyOutline,
      'add-outline': addOutline, 'gift-outline': giftOutline, 'trending-up-outline': trendingUpOutline
    });
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  ngOnInit(): void {
    this.loadItems();
  }

  ionViewWillEnter(): void {
    this.loadItems(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItems(forceRefresh = false): void {
    this.isLoading = true;
    this.hasError = false;

    this.inventoryService.getFeaturedItems().pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        this.items = items;
        this.totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        this.averagePrice = items.length > 0
          ? Math.round(items.reduce((sum, item) => sum + item.price, 0) / items.length)
          : 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err.message || this.t('errors.unknownError');
        this.logger.error('FeaturedPage', 'Load failed', err);
      }
    });
  }

  refreshItems(event: any): void {
    this.inventoryService.getFeaturedItems().pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        this.items = items;
        this.totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        this.averagePrice = items.length > 0
          ? Math.round(items.reduce((sum, item) => sum + item.price, 0) / items.length)
          : 0;
        event.target.complete();
      },
      error: (err) => {
        event.target.complete();
        this.showToast(err.message, 'danger');
      }
    });
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
    this.helpService.showHelp('featured');
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'bottom', color });
    await toast.present();
  }
}
