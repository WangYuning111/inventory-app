/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Manage Page - Add, Update, Delete Inventory Items
 */
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonInput, IonSelect, IonSelectOption, IonButton, IonIcon, IonButtons,
  IonSegment, IonSegmentButton, IonTextarea, IonNote, IonText, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, ToastController, AlertController,
  LoadingController, IonSpinner, IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline, helpCircleOutline, addOutline, saveOutline, trashOutline,
  warningOutline, checkmarkCircleOutline, closeCircleOutline, searchOutline,
  arrowBackOutline, refreshOutline, arrowForwardOutline
} from 'ionicons/icons';
import { InventoryService } from '../../services/inventory.service';
import { HelpService } from '../../services/help.service';
import { LoggerService } from '../../services/logger.service';
import { I18nService } from '../../services/i18n.service';
import {
  InventoryItem, CreateInventoryItemDTO, UpdateInventoryItemDTO,
  Category, StockStatus, CATEGORY_OPTIONS, STOCK_STATUS_OPTIONS,
  validateCreateItemDTO, validateUpdateItemDTO
} from '../../models/inventory.model';
import { formatCurrency } from '../../utils';
import { SkeletonListComponent, EmptyStateComponent } from '../../components/shared-ui';

type ActionTab = 'add' | 'update' | 'delete';

interface FieldError {
  field: string;
  message: string;
}

@Component({
  selector: 'app-manage',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon name="create-outline" style="margin-right: 8px"></ion-icon>
          {{ t('nav.manage') }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp()" aria-label="Help">
            <ion-icon name="help-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-bottom">
      <!-- Action Selector -->
      <ion-segment [(ngModel)]="currentAction" (ionChange)="onActionChange()" class="action-segment">
        <ion-segment-button value="add">
          <ion-icon name="add-outline" size="small"></ion-icon>
          <ion-label>{{ t('app.add') }}</ion-label>
        </ion-segment-button>
        <ion-segment-button value="update">
          <ion-icon name="save-outline" size="small"></ion-icon>
          <ion-label>{{ t('app.update') }}</ion-label>
        </ion-segment-button>
        <ion-segment-button value="delete">
          <ion-icon name="trash-outline" size="small" color="danger"></ion-icon>
          <ion-label>{{ t('app.delete') }}</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Add Item Form -->
      <div *ngIf="currentAction === 'add'" class="form-container animate-in">
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="add-outline" color="primary"></ion-icon>
              {{ t('inventory.addNewItem') }}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="full">
              <ion-item>
                <ion-label position="stacked">{{ t('inventory.itemName') }} <ion-text color="danger">*</ion-text></ion-label>
                <ion-input [(ngModel)]="addForm.itemName" [placeholder]="t('inventory.itemNamePlaceholder')"
                  maxlength="100" [attr.aria-label]="t('inventory.itemName')"></ion-input>
                <ion-note slot="error" *ngIf="hasFieldError('add', 'itemName')" color="danger">
                  {{ getFieldError('add', 'itemName') }}
                </ion-note>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.category') }} <ion-text color="danger">*</ion-text></ion-label>
                <ion-select [(ngModel)]="addForm.category" interface="action-sheet" [attr.aria-label]="t('inventory.category')">
                  <ion-select-option *ngFor="let cat of categoryOptions" [value]="cat.value">
                    {{ cat.label }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.quantity') }} <ion-text color="danger">*</ion-text></ion-label>
                <ion-input [(ngModel)]="addForm.quantity" type="number" min="0" [placeholder]="t('inventory.quantityPlaceholder')"
                  [attr.aria-label]="t('inventory.quantity')"></ion-input>
                <ion-note slot="error" *ngIf="hasFieldError('add', 'quantity')" color="danger">
                  {{ getFieldError('add', 'quantity') }}
                </ion-note>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.price') }} (USD) <ion-text color="danger">*</ion-text></ion-label>
                <ion-input [(ngModel)]="addForm.price" type="number" min="0" [placeholder]="t('inventory.pricePlaceholder')"
                  [attr.aria-label]="t('inventory.price')"></ion-input>
                <ion-note slot="error" *ngIf="hasFieldError('add', 'price')" color="danger">
                  {{ getFieldError('add', 'price') }}
                </ion-note>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.supplierName') }} <ion-text color="danger">*</ion-text></ion-label>
                <ion-input [(ngModel)]="addForm.supplierName" [placeholder]="t('inventory.supplierNamePlaceholder')"
                  maxlength="100" [attr.aria-label]="t('inventory.supplierName')"></ion-input>
                <ion-note slot="error" *ngIf="hasFieldError('add', 'supplierName')" color="danger">
                  {{ getFieldError('add', 'supplierName') }}
                </ion-note>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.stockStatus') }} <ion-text color="danger">*</ion-text></ion-label>
                <ion-select [(ngModel)]="addForm.stockStatus" interface="action-sheet" [attr.aria-label]="t('inventory.stockStatus')">
                  <ion-select-option *ngFor="let status of stockStatusOptions" [value]="status.value">
                    {{ status.label }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.featured') }}</ion-label>
                <ion-select [(ngModel)]="addForm.featuredItem" interface="action-sheet" [attr.aria-label]="t('inventory.featured')">
                  <ion-select-option [value]="0">{{ t('app.no') }}</ion-select-option>
                  <ion-select-option [value]="1">{{ t('app.yes') }}</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.notes') }} ({{ t('inventory.optional') }})</ion-label>
                <ion-textarea [(ngModel)]="addForm.notes" [placeholder]="t('inventory.notesPlaceholder')"
                  rows="3" maxlength="500" [attr.aria-label]="t('inventory.notes')"></ion-textarea>
                <ion-note slot="helper">{{ addForm.notes?.length || 0 }}/500</ion-note>
              </ion-item>
            </ion-list>

            <ion-button expand="block" color="primary" (click)="addItem()"
              [disabled]="isProcessing" class="submit-button">
              <ion-icon *ngIf="!isProcessing" name="add-outline" slot="start"></ion-icon>
              <ion-spinner *ngIf="isProcessing" slot="start" name="crescent"></ion-spinner>
              {{ isProcessing ? t('app.loading') : t('inventory.addItem') }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Update Item Form -->
      <div *ngIf="currentAction === 'update'" class="form-container animate-in">
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="save-outline" color="secondary"></ion-icon>
              {{ t('inventory.updateItemTitle') }}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <!-- Search Existing Item -->
            <ion-searchbar 
              [(ngModel)]="updateSearchKeyword" 
              [placeholder]="t('inventory.searchItemPlaceholder')"
              (ionInput)="onUpdateSearch($event)"
              class="search-bar"
            ></ion-searchbar>

            <!-- Search Results -->
            <div *ngIf="updateSearchKeyword.trim() && searchResults.length > 0" class="search-results">
              <ion-list lines="full">
                <ion-item 
                  *ngFor="let item of searchResults" 
                  (click)="selectItemForUpdate(item)"
                  class="search-result-item"
                >
                  <ion-label>
                    <h3>{{ item.itemName }}</h3>
                    <p>{{ t('inventory.category') }}: {{ item.category }} | {{ t('inventory.price') }}: &#36;{{ item.price.toFixed(2) }}</p>
                  </ion-label>
                  <ion-icon name="arrow-forward-outline" slot="end" color="secondary"></ion-icon>
                </ion-item>
              </ion-list>
            </div>

            <ion-note *ngIf="updateSearchKeyword.trim() && searchResults.length === 0" color="warning" class="ion-padding">
              {{ t('errors.notFound') }}
            </ion-note>

            <ion-note *ngIf="updateItemFound" color="success" class="ion-padding">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              {{ t('inventory.selectedItem') }}: "{{ updateTargetName }}"
            </ion-note>

            <ion-list lines="full" *ngIf="updateItemFound">
              <ion-item>
                <ion-label position="stacked">{{ t('inventory.itemName') }}</ion-label>
                <ion-input [(ngModel)]="updateForm.itemName" [placeholder]="t('inventory.itemNamePlaceholder')"
                  maxlength="100" [attr.aria-label]="t('inventory.itemName')"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.category') }}</ion-label>
                <ion-select [(ngModel)]="updateForm.category" interface="action-sheet" [attr.aria-label]="t('inventory.category')">
                  <ion-select-option *ngFor="let cat of categoryOptions" [value]="cat.value">
                    {{ cat.label }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.quantity') }}</ion-label>
                <ion-input [(ngModel)]="updateForm.quantity" type="number" min="0"
                  [attr.aria-label]="t('inventory.quantity')"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.price') }} (USD)</ion-label>
                <ion-input [(ngModel)]="updateForm.price" type="number" min="0"
                  [attr.aria-label]="t('inventory.price')"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.supplierName') }}</ion-label>
                <ion-input [(ngModel)]="updateForm.supplierName" maxlength="100"
                  [attr.aria-label]="t('inventory.supplierName')"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.stockStatus') }}</ion-label>
                <ion-select [(ngModel)]="updateForm.stockStatus" interface="action-sheet" [attr.aria-label]="t('inventory.stockStatus')">
                  <ion-select-option *ngFor="let status of stockStatusOptions" [value]="status.value">
                    {{ status.label }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.featured') }}</ion-label>
                <ion-select [(ngModel)]="updateForm.featuredItem" interface="action-sheet" [attr.aria-label]="t('inventory.featured')">
                  <ion-select-option [value]="0">{{ t('app.no') }}</ion-select-option>
                  <ion-select-option [value]="1">{{ t('app.yes') }}</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">{{ t('inventory.notes') }}</ion-label>
                <ion-textarea [(ngModel)]="updateForm.notes" rows="3" maxlength="500"
                  [attr.aria-label]="t('inventory.notes')"></ion-textarea>
              </ion-item>
            </ion-list>

            <ion-button expand="block" color="secondary" (click)="updateItem()"
              [disabled]="isProcessing || !updateItemFound" class="submit-button">
              <ion-icon *ngIf="!isProcessing" name="save-outline" slot="start"></ion-icon>
              <ion-spinner *ngIf="isProcessing" slot="start" name="crescent"></ion-spinner>
              {{ isProcessing ? t('app.loading') : t('inventory.updateItem') }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Delete Item Form -->
      <div *ngIf="currentAction === 'delete'" class="form-container animate-in">
        <ion-card color="danger" class="delete-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="trash-outline"></ion-icon>
              {{ t('inventory.deleteItemTitle') }}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <!-- Search for item to delete -->
            <ion-searchbar 
              [(ngModel)]="deleteSearchKeyword" 
              [placeholder]="t('inventory.searchItemPlaceholder')"
              (ionInput)="onDeleteSearch($event)"
              class="search-bar"
            ></ion-searchbar>

            <!-- Search Results -->
            <div *ngIf="deleteSearchKeyword.trim() && deleteSearchResults.length > 0" class="search-results">
              <ion-list lines="full">
                <ion-item 
                  *ngFor="let item of deleteSearchResults" 
                  (click)="selectItemForDelete(item)"
                  class="search-result-item"
                >
                  <ion-label>
                    <h3>{{ item.itemName }}</h3>
                    <p>{{ t('inventory.category') }}: {{ item.category }}</p>
                  </ion-label>
                  <ion-icon name="arrow-forward-outline" slot="end" color="danger"></ion-icon>
                </ion-item>
              </ion-list>
            </div>

            <ion-note *ngIf="deleteSearchKeyword.trim() && deleteSearchResults.length === 0" color="warning" class="ion-padding">
              {{ t('errors.notFound') }}
            </ion-note>

            <ion-note *ngIf="deleteName && !isDeleteProtected" color="success" class="ion-padding">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              {{ t('inventory.selectedItem') }}: "{{ deleteName }}"
            </ion-note>

            <ion-note *ngIf="isDeleteProtected" color="danger" class="ion-padding">
              <ion-icon name="warning-outline"></ion-icon>
              {{ t('inventory.cannotDeleteProtected') }}
            </ion-note>

            <ion-note color="warning" class="warning-note">
              <ion-icon name="warning-outline"></ion-icon>
              <strong>{{ t('app.warning') }}:</strong> {{ t('inventory.deleteWarning') }}
            </ion-note>

            <ion-button expand="block" color="danger" (click)="confirmDelete()"
              [disabled]="isProcessing || !deleteName.trim() || isDeleteProtected" class="submit-button">
              <ion-icon *ngIf="!isProcessing" name="trash-outline" slot="start"></ion-icon>
              <ion-spinner *ngIf="isProcessing" slot="start" name="crescent"></ion-spinner>
              {{ isProcessing ? t('app.loading') : t('inventory.deleteItem') }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton,
    IonIcon, IonButtons, IonSegment, IonSegmentButton, IonTextarea, IonNote,
    IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner,
    IonSearchbar,
    SkeletonListComponent, EmptyStateComponent
  ]
})
export class ManagePage implements OnInit {
  currentAction: ActionTab = 'add';
  isProcessing = false;
  isLoadingItem = false;
  updateItemFound = false;
  isDeleteProtected = false;

  categoryOptions = CATEGORY_OPTIONS;
  stockStatusOptions = STOCK_STATUS_OPTIONS;

  addForm: CreateInventoryItemDTO = this.getDefaultAddForm();
  updateTargetName = '';
  updateForm: UpdateInventoryItemDTO = this.getDefaultUpdateForm();
  deleteName = '';
  
  // Search related
  updateSearchKeyword = '';
  deleteSearchKeyword = '';
  searchResults: InventoryItem[] = [];
  deleteSearchResults: InventoryItem[] = [];

  private addErrors: FieldError[] = [];
  private updateErrors: FieldError[] = [];

  constructor(
    private inventoryService: InventoryService,
    private helpService: HelpService,
    private logger: LoggerService,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private i18n: I18nService
  ) {
    addIcons({
      'create-outline': createOutline, 'help-circle-outline': helpCircleOutline,
      'add-outline': addOutline, 'save-outline': saveOutline, 'trash-outline': trashOutline,
      'warning-outline': warningOutline, 'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline, 'search-outline': searchOutline,
      'arrow-back-outline': arrowBackOutline, 'refresh-outline': refreshOutline
    });
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  ngOnInit(): void {
    this.resetAll();
  }

  onActionChange(): void {
    this.resetAll();
  }

  async addItem(): Promise<void> {
    this.addErrors = [];
    const validation = validateCreateItemDTO(this.addForm, (key: string) => this.t(key));
    if (!validation.valid) {
      this.addErrors = validation.errors.map(e => this.mapErrorToField(e, 'add'));
      this.showToast(validation.errors[0], 'warning');
      return;
    }

    this.isProcessing = true;
    const loading = await this.loadingController.create({ message: this.t('app.loading') });
    await loading.present();

    this.inventoryService.createItem(this.addForm).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isProcessing = false;
        this.showToast(`${this.t('inventory.itemName')}: "${this.addForm.itemName}" ${this.t('inventory.itemSaved')}`, 'success');
        this.addForm = this.getDefaultAddForm();
        this.addErrors = [];
      },
      error: async (err) => {
        await loading.dismiss();
        this.isProcessing = false;
        this.showToast(err.message || this.t('errors.unknownError'), 'danger');
        this.logger.error('ManagePage', 'Add item failed', err);
      }
    });
  }

  loadItemForUpdate(): void {
    if (!this.updateTargetName.trim()) return;
    this.isLoadingItem = true;
    this.updateItemFound = false;

    this.inventoryService.getItemByName(this.updateTargetName.trim()).subscribe({
      next: (item) => {
        this.isLoadingItem = false;
        this.updateItemFound = true;
        this.updateForm = {
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
          supplierName: item.supplierName,
          stockStatus: item.stockStatus,
          featuredItem: item.featuredItem,
          notes: item.notes || ''
        };
        this.showToast(this.t('inventory.itemSaved'), 'success');
      },
      error: (err) => {
        this.isLoadingItem = false;
        this.updateItemFound = false;
        this.showToast(err.message || this.t('errors.notFound'), 'warning');
      }
    });
  }

  onUpdateSearch(event: any): void {
    const keyword = event.detail.value;
    if (!keyword.trim()) {
      this.searchResults = [];
      return;
    }

    this.inventoryService.searchItems(keyword).subscribe({
      next: (items) => {
        this.searchResults = items;
      },
      error: () => {
        this.searchResults = [];
      }
    });
  }

  selectItemForUpdate(item: InventoryItem): void {
    this.updateTargetName = item.itemName;
    this.updateSearchKeyword = '';
    this.searchResults = [];
    this.updateItemFound = true;
    this.updateForm = {
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      supplierName: item.supplierName,
      stockStatus: item.stockStatus,
      featuredItem: item.featuredItem,
      notes: item.notes || ''
    };
    this.showToast(`${this.t('inventory.selectedItem')}: "${item.itemName}"`, 'success');
  }

  onDeleteSearch(event: any): void {
    const keyword = event.detail.value;
    if (!keyword.trim()) {
      this.deleteSearchResults = [];
      return;
    }

    this.inventoryService.searchItems(keyword).subscribe({
      next: (items) => {
        // Show all items in search results, but mark mock items as protected
        this.deleteSearchResults = items;
      },
      error: () => {
        this.deleteSearchResults = [];
      }
    });
  }

  selectItemForDelete(item: InventoryItem): void {
    this.deleteName = item.itemName;
    this.deleteSearchKeyword = '';
    this.deleteSearchResults = [];
    this.isDeleteProtected = false;
  }

  async updateItem(): Promise<void> {
    if (!this.updateTargetName.trim()) {
      this.showToast(this.t('inventory.validationError'), 'warning');
      return;
    }
    if (!this.updateItemFound) {
      this.showToast(this.t('errors.notFound'), 'warning');
      return;
    }

    this.isProcessing = true;
    const loading = await this.loadingController.create({ message: this.t('app.loading') });
    await loading.present();

    this.inventoryService.updateItem(this.updateTargetName.trim(), this.updateForm).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isProcessing = false;
        this.showToast(`${this.t('inventory.itemName')}: "${this.updateTargetName}" ${this.t('inventory.itemSaved')}`, 'success');
        this.resetAll();
      },
      error: async (err) => {
        await loading.dismiss();
        this.isProcessing = false;
        this.showToast(err.message || this.t('errors.unknownError'), 'danger');
      }
    });
  }

  async confirmDelete(): Promise<void> {
    if (!this.deleteName.trim()) {
      this.showToast(this.t('inventory.validationError'), 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: this.t('inventory.deleteConfirm'),
      message: `${this.t('inventory.deleteItem')}: "${this.deleteName}"? ${this.t('inventory.deleteWarning')}`,
      buttons: [
        { text: this.t('app.cancel'), role: 'cancel' },
        { text: this.t('app.delete'), role: 'destructive', handler: () => this.doDelete() }
      ]
    });
    await alert.present();
  }

  private async doDelete(): Promise<void> {
    this.isProcessing = true;
    const loading = await this.loadingController.create({ message: this.t('app.loading') });
    await loading.present();

    this.inventoryService.deleteItem(this.deleteName.trim()).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isProcessing = false;
        this.showToast(`${this.t('inventory.itemName')}: "${this.deleteName}" ${this.t('inventory.itemDeleted')}`, 'success');
        this.deleteName = '';
      },
      error: async (err) => {
        await loading.dismiss();
        this.isProcessing = false;
        this.showToast(err.message || this.t('errors.unknownError'), 'danger');
      }
    });
  }

  hasFieldError(form: 'add' | 'update', field: string): boolean {
    const errors = form === 'add' ? this.addErrors : this.updateErrors;
    return errors.some(e => e.field === field);
  }

  getFieldError(form: 'add' | 'update', field: string): string {
    const errors = form === 'add' ? this.addErrors : this.updateErrors;
    return errors.find(e => e.field === field)?.message || '';
  }

  showHelp(): void {
    this.helpService.showHelp('manage');
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, position: 'bottom', color });
    await toast.present();
  }

  private resetAll(): void {
    this.addForm = this.getDefaultAddForm();
    this.updateTargetName = '';
    this.updateForm = this.getDefaultUpdateForm();
    this.updateItemFound = false;
    this.isLoadingItem = false;
    this.deleteName = '';
    this.isDeleteProtected = false;
    // Reset search fields
    this.updateSearchKeyword = '';
    this.deleteSearchKeyword = '';
    this.searchResults = [];
    this.deleteSearchResults = [];
    this.addErrors = [];
    this.updateErrors = [];
  }

  private getDefaultAddForm(): CreateInventoryItemDTO {
    return {
      itemName: '', category: Category.ELECTRONICS, quantity: 0, price: 0,
      supplierName: '', stockStatus: StockStatus.IN_STOCK, featuredItem: 0, notes: ''
    };
  }

  private getDefaultUpdateForm(): UpdateInventoryItemDTO {
    return {
      itemName: '', category: Category.ELECTRONICS, quantity: 0, price: 0,
      supplierName: '', stockStatus: StockStatus.IN_STOCK, featuredItem: 0, notes: ''
    };
  }

  private mapErrorToField(error: string, form: 'add' | 'update'): FieldError {
    const lower = error.toLowerCase();
    if (lower.includes('item name')) return { field: 'itemName', message: error };
    if (lower.includes('supplier')) return { field: 'supplierName', message: error };
    if (lower.includes('quantity')) return { field: 'quantity', message: error };
    if (lower.includes('price')) return { field: 'price', message: error };
    if (lower.includes('notes')) return { field: 'notes', message: error };
    return { field: 'general', message: error };
  }
}
