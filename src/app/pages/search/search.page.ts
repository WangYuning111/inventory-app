/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Search Page - Search Inventory Items
 */
import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList,
  IonItem, IonLabel, IonBadge, IonIcon, IonButtons, IonButton, IonSpinner,
  IonCard, IonCardContent, ToastController, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, helpCircleOutline, star, businessOutline, pricetagOutline,
  layersOutline, closeCircleOutline, optionsOutline
} from 'ionicons/icons';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { InventoryService } from '../../services/inventory.service';
import { HelpService } from '../../services/help.service';
import { LoggerService } from '../../services/logger.service';
import { I18nService } from '../../services/i18n.service';
import { InventoryItem, StockStatus } from '../../models/inventory.model';
import { SkeletonListComponent, EmptyStateComponent, ErrorStateComponent } from '../../components/shared-ui';
import { formatCurrency, formatNumber } from '../../utils';

@Component({
  selector: 'app-search',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon name="search-outline" style="margin-right: 8px"></ion-icon>
          {{ t('nav.search') }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp()" aria-label="Help">
            <ion-icon name="help-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Search Bar -->
      <div class="search-wrapper">
        <ion-searchbar
          [(ngModel)]="searchTerm"
          (ionInput)="onSearchInput($event)"
          [placeholder]="t('inventory.searchPlaceholder')"
          debounce="300"
          animated="true"
          show-clear-button="always"
          aria-label="Search inventory">
        </ion-searchbar>
        <ion-button *ngIf="searchTerm" fill="clear" size="small" (click)="clearSearch()" class="clear-btn">
          <ion-icon name="close-circle-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>

      <!-- Search Info -->
      <ion-note *ngIf="searchTerm && !isLoading && !hasError" class="results-count" color="medium">
        <ion-icon name="options-outline" size="small"></ion-icon>
        {{ results.length }} {{ t('app.results') }} "{{ searchTerm }}"
      </ion-note>

      <!-- Loading State -->
      <app-skeleton-list *ngIf="isLoading" [count]="4"></app-skeleton-list>

      <!-- Error State -->
      <app-error-state *ngIf="hasError && !isLoading" [message]="errorMessage" (retryClick)="retrySearch()"></app-error-state>

      <!-- Empty States -->
      <app-empty-state
        *ngIf="!isLoading && !hasError && !searchTerm.trim()"
        icon="search-outline"
        [title]="t('app.search')"
        [message]="t('inventory.startSearching')">
      </app-empty-state>

      <app-empty-state
        *ngIf="!isLoading && !hasError && searchTerm.trim() && results.length === 0"
        icon="close-circle-outline"
        [title]="t('inventory.noItems')"
        [message]="t('inventory.noSearchResults')">
      </app-empty-state>

      <!-- Search Results -->
      <ion-list *ngIf="!isLoading && !hasError && results.length > 0" class="inventory-list">
        <ion-item
          *ngFor="let item of results; trackBy: trackByItemId"
          class="inventory-item"
          [class.in-stock]="item.stockStatus === stockStatus.IN_STOCK"
          [class.low-stock]="item.stockStatus === stockStatus.LOW_STOCK"
          [class.out-of-stock]="item.stockStatus === stockStatus.OUT_OF_STOCK"
          [class.popular]="item.featuredItem === 1">

          <ion-label class="ion-text-wrap">
            <h2 class="item-name">
              {{ item.itemName }}
              <ion-icon *ngIf="item.featuredItem === 1" name="star" color="warning" class="featured-icon"></ion-icon>
            </h2>
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
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonSearchbar, IonList, IonItem, IonLabel, IonBadge, IonIcon, IonButtons,
    IonButton, IonSpinner, IonCard, IonCardContent, IonNote,
    SkeletonListComponent, EmptyStateComponent, ErrorStateComponent
  ]
})
export class SearchPage implements OnDestroy {
  searchTerm = '';
  results: InventoryItem[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  stockStatus = StockStatus;

  formatCurrency = formatCurrency;
  formatNumber = formatNumber;

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private inventoryService: InventoryService,
    private helpService: HelpService,
    private logger: LoggerService,
    private toastController: ToastController,
    private i18n: I18nService
  ) {
    addIcons({
      'search-outline': searchOutline, 'help-circle-outline': helpCircleOutline,
      'star': star, 'business-outline': businessOutline, 'pricetag-outline': pricetagOutline,
      'layers-outline': layersOutline, 'close-circle-outline': closeCircleOutline,
      'options-outline': optionsOutline
    });

    this.search$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term.trim()) {
          this.isLoading = false;
          this.hasError = false;
          this.results = [];
          return of([]);
        }
        this.isLoading = true;
        this.hasError = false;
        return this.inventoryService.searchItems(term.trim());
      })
    ).subscribe({
      next: (items) => {
        this.results = items;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err.message || this.t('errors.unknownError');
        this.logger.error('SearchPage', 'Search failed', err);
      }
    });
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  onSearchInput(event: any): void {
    this.searchTerm = event.target.value || '';
    this.search$.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.results = [];
    this.hasError = false;
    this.search$.next('');
  }

  retrySearch(): void {
    if (this.searchTerm.trim()) {
      this.search$.next(this.searchTerm);
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
    this.helpService.showHelp('search');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
