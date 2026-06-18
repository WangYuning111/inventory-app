/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Help Service - Manages help modal presentation
 */

import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { HelpModalComponent } from '../pages/help-modal/help-modal.component';

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  constructor(private modalController: ModalController) {}

  /**
   * Show help modal for a specific page
   * @param pageId - The page identifier (home, search, manage, featured, privacy)
   */
  async showHelp(pageId: string): Promise<void> {
    const modal = await this.modalController.create({
      component: HelpModalComponent,
      componentProps: {
        pageId: pageId
      },
      cssClass: 'help-modal'
    });
    
    await modal.present();
  }
}
