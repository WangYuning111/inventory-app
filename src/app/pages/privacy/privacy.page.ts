/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Privacy Page - Data Protection and Security Information
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonIcon,
  IonButtons, IonButton, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonList, IonItem, IonLabel, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldOutline, helpCircleOutline, lockClosedOutline, eyeOutline,
  serverOutline, keyOutline, warningOutline, checkmarkCircleOutline,
  fingerPrintOutline, globeOutline, documentTextOutline, codeSlashOutline
} from 'ionicons/icons';
import { HelpService } from '../../services/help.service';
import { LoggerService } from '../../services/logger.service';
import { I18nService } from '../../services/i18n.service';
import { Storage } from '../../utils';

interface SecurityItem {
  icon: string;
  color: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-privacy',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon name="shield-outline" style="margin-right: 8px"></ion-icon>
          {{ t('nav.privacy') }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp()" aria-label="Help">
            <ion-icon name="help-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-bottom">
      <!-- Header Card -->
      <ion-card class="privacy-hero">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="lock-closed-outline" color="primary"></ion-icon>
            {{ t('inventory.dataProtection') }}
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>
            This inventory management app is built with privacy and security as core principles.
            All data is handled securely with multiple layers of protection.
          </p>
        </ion-card-content>
      </ion-card>

      <!-- Security Measures -->
      <ion-card *ngFor="let item of securityItems" class="security-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon [name]="item.icon" [color]="item.color"></ion-icon>
            {{ item.title }}
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ item.description }}</p>
        </ion-card-content>
      </ion-card>

      <!-- Tech Stack -->
      <ion-card class="tech-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="code-slash-outline" color="tertiary"></ion-icon>
            {{ t('inventory.technologyStack') }}
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-icon name="globe-outline" slot="start" color="primary"></ion-icon>
              <ion-label class="ion-text-wrap">
                <strong>Frontend:</strong> Ionic 7 + Angular 17 + TypeScript
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="server-outline" slot="start" color="secondary"></ion-icon>
              <ion-label class="ion-text-wrap">
                <strong>Backend:</strong> RESTful API with HTTPS encryption
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="document-text-outline" slot="start" color="success"></ion-icon>
              <ion-label class="ion-text-wrap">
                <strong>Storage:</strong> Browser localStorage with fallback
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- User Warning -->
      <ion-note color="warning" class="privacy-warning">
        <ion-icon name="warning-outline"></ion-icon>
        <strong>{{ t('inventory.important') }}:</strong> {{ t('inventory.localStorageWarning') }}
      </ion-note>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon,
    IonButtons, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonNote
  ]
})
export class PrivacyPage {
  securityItems: SecurityItem[] = [
    {
      icon: 'checkmark-circle-outline',
      color: 'success',
      title: 'HTTPS Encryption',
      description: 'All data transmitted between the app and server is encrypted using industry-standard HTTPS protocol.'
    },
    {
      icon: 'checkmark-circle-outline',
      color: 'success',
      title: 'Input Validation',
      description: 'All user inputs are validated and sanitized to prevent injection attacks and ensure data integrity.'
    },
    {
      icon: 'checkmark-circle-outline',
      color: 'success',
      title: 'Error Handling',
      description: 'Secure error handling prevents exposure of sensitive system information to users.'
    },
    {
      icon: 'checkmark-circle-outline',
      color: 'success',
      title: 'Data Integrity',
      description: 'Server-side validation ensures only valid and authorized data modifications are processed.'
    },
    {
      icon: 'finger-print-outline',
      color: 'primary',
      title: 'Minimal Data Collection',
      description: 'We only collect inventory data necessary for the application functionality.'
    },
    {
      icon: 'finger-print-outline',
      color: 'primary',
      title: 'No Personal Information',
      description: 'This application does not collect or store any personal user information.'
    }
  ];

  constructor(
    private helpService: HelpService,
    private logger: LoggerService,
    private i18n: I18nService
  ) {
    addIcons({
      'shield-outline': shieldOutline, 'help-circle-outline': helpCircleOutline,
      'lock-closed-outline': lockClosedOutline, 'eye-outline': eyeOutline,
      'server-outline': serverOutline, 'key-outline': keyOutline,
      'warning-outline': warningOutline, 'checkmark-circle-outline': checkmarkCircleOutline,
      'finger-print-outline': fingerPrintOutline, 'globe-outline': globeOutline,
      'document-text-outline': documentTextOutline, 'code-slash-outline': codeSlashOutline
    });
  }

  t(key: string): string {
    return this.i18n.t(key);
  }

  showHelp(): void {
    this.helpService.showHelp('privacy');
  }
}
