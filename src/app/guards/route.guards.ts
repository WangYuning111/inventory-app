/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Route Guards
 */

import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { I18nService } from '../services/i18n.service';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component.canDeactivate) {
    return component.canDeactivate();
  }
  return true;
};

export const networkGuard: CanActivateFn = () => {
  const isOnline = navigator.onLine;
  if (!isOnline) {
    // Allow offline access but show warning
    console.warn('App accessed in offline mode');
  }
  return true;
};

export const confirmLeaveGuard: CanDeactivateFn<unknown> = async () => {
  const alertCtrl = inject(AlertController);
  const i18n = inject(I18nService);
  const alert = await alertCtrl.create({
    header: i18n.t('app.leavePage'),
    message: i18n.t('app.unsavedChanges'),
    buttons: [
      { text: i18n.t('app.stay'), role: 'cancel' },
      { text: i18n.t('app.leave'), role: 'confirm' }
    ]
  });
  await alert.present();
  const result = await alert.onDidDismiss();
  return result.role === 'confirm';
};
