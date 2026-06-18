/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Root App Component
 */

import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { InventoryService } from './services/inventory.service';
import { LoggerService } from './services/logger.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent implements OnInit {
  constructor(
    private inventoryService: InventoryService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    // Preload inventory data on app startup
    this.logger.info('AppComponent', 'Preloading inventory data');
    this.inventoryService.getAllItems(false).subscribe({
      next: (items) => {
        this.logger.info('AppComponent', 'Preloaded inventory data', { count: items.length });
      },
      error: (err) => {
        this.logger.warn('AppComponent', 'Failed to preload inventory data', { error: err.message });
      }
    });
  }
}
