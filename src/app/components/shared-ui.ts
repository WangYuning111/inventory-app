/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Shared UI Components - Reusable UI elements
 */
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonSkeletonText, IonList, IonItem, IonLabel, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, alertCircleOutline } from 'ionicons/icons';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-skeleton-list',
  template: `
    <ion-list>
      <ion-item *ngFor="let _ of skeletonArray">
        <ion-label>
          <h2><ion-skeleton-text [animated]="animated" style="width: 60%"></ion-skeleton-text></h2>
          <p><ion-skeleton-text [animated]="animated" style="width: 40%"></ion-skeleton-text></p>
          <p><ion-skeleton-text [animated]="animated" style="width: 30%"></ion-skeleton-text></p>
        </ion-label>
      </ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [CommonModule, IonSkeletonText, IonList, IonItem, IonLabel]
})
export class SkeletonListComponent {
  @Input() count = 5;
  @Input() animated = true;
  get skeletonArray() { return new Array(this.count); }
}

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state-container">
      <ion-icon [name]="icon" class="empty-icon" color="medium"></ion-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <ion-button *ngIf="actionLabel" (click)="actionClick.emit()" fill="clear" color="primary">
        {{ actionLabel }}
      </ion-button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon]
})
export class EmptyStateComponent {
  @Input() icon = 'cube-outline';
  @Input() title = 'No Data';
  @Input() message = 'There is nothing to show here.';
  @Input() actionLabel?: string;
  @Output() actionClick = new EventEmitter<void>();
}

@Component({
  selector: 'app-error-state',
  template: `
    <div class="error-state-container">
      <ion-icon name="alert-circle-outline" class="error-icon" color="danger"></ion-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <ion-button (click)="retryClick.emit()" fill="outline" color="primary">
        <ion-icon name="refresh-outline" slot="start"></ion-icon>
        {{ i18n.t('app.tryAgain') }}
      </ion-button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon]
})
export class ErrorStateComponent {
  @Input() title = 'Error';
  @Input() message = 'Unable to load data. Please try again.';
  @Output() retryClick = new EventEmitter<void>();
  i18n = inject(I18nService);

  constructor() {
    addIcons({ 'refresh-outline': refreshOutline, 'alert-circle-outline': alertCircleOutline });
  }
}
