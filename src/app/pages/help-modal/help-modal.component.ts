/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Help Modal Component - Displays contextual help information
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, helpCircleOutline } from 'ionicons/icons';
import { getHelpContent } from '../../models/inventory.model';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-help-modal',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon name="help-circle-outline" style="margin-right: 8px;"></ion-icon>
          {{ helpData.title }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-item *ngFor="let item of helpData?.content; let i = index">
          <ion-label class="ion-text-wrap">
            <strong>{{ i + 1 }}.</strong> {{ item }}
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class HelpModalComponent {
  @Input() pageId: string = '';

  constructor(
    private modalController: ModalController,
    private i18n: I18nService
  ) {
    addIcons({
      'close-outline': closeOutline,
      'help-circle-outline': helpCircleOutline
    });
  }

  get helpData() {
    return getHelpContent((key: string) => this.i18n.t(key))[this.pageId];
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}
