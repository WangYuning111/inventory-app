/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Data Export Service
 * Supports CSV and JSON export with proper formatting
 */

import { Injectable } from '@angular/core';
import { InventoryItem, StockStatus, Category } from '../models/inventory.model';
import { I18nService } from './i18n.service';

export interface ExportOptions {
  format: 'csv' | 'json';
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: 'iso' | 'local';
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private i18n: I18nService) {}

  export(items: InventoryItem[], options: ExportOptions): void {
    if (options.format === 'csv') {
      this.exportCSV(items, options);
    } else {
      this.exportJSON(items, options);
    }
  }

  private exportCSV(items: InventoryItem[], options: ExportOptions): void {
    const t = (k: string) => this.i18n.t(k);
    const headers = [
      t('inventory.id'), t('inventory.name'), t('inventory.category'),
      t('inventory.quantity'), t('inventory.price'), t('inventory.stockStatus'),
      t('inventory.featured'), t('inventory.description'), t('inventory.created'), t('inventory.updated')
    ];
    const rows = items.map(item => [
      item.itemID,
      this.escapeCSV(item.itemName),
      item.category,
      item.quantity,
      item.price.toFixed(2),
      item.stockStatus,
      item.featuredItem ? t('app.yes') : t('app.no'),
      this.escapeCSV(item.notes || ''),
      this.formatDate(item.createdAt, options.dateFormat),
      this.formatDate(item.updatedAt, options.dateFormat)
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadFile(csv, `${options.filename || 'inventory'}.csv`, 'text/csv;charset=utf-8;');
  }

  private exportJSON(items: InventoryItem[], options: ExportOptions): void {
    const t = (k: string) => this.i18n.t(k);
    const data = {
      exportedAt: new Date().toISOString(),
      totalItems: items.length,
      totalValue: items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      items: items.map(item => ({
        ...item,
        createdAt: this.formatDate(item.createdAt, options.dateFormat),
        updatedAt: this.formatDate(item.updatedAt, options.dateFormat)
      }))
    };
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, `${options.filename || 'inventory'}.json`, 'application/json');
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatDate(date: string | Date | undefined, format?: 'iso' | 'local'): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    if (format === 'local') {
      return d.toLocaleString('en-US');
    }
    return d.toISOString();
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateReport(items: InventoryItem[]): string {
    const t = (k: string) => this.i18n.t(k);
    const totalItems = items.length;
    const totalValue = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const avgPrice = totalItems > 0 ? totalValue / totalItems : 0;
    const inStock = items.filter(i => i.stockStatus === StockStatus.IN_STOCK).length;
    const lowStock = items.filter(i => i.stockStatus === StockStatus.LOW_STOCK).length;
    const outOfStock = items.filter(i => i.stockStatus === StockStatus.OUT_OF_STOCK).length;
    const featured = items.filter(i => i.featuredItem === 1).length;

    const categoryBreakdown = Object.values(Category).map(cat => {
      const catItems = items.filter(i => i.category === cat);
      const catValue = catItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return `  ${cat}: ${catItems.length} ${t('inventory.items')}, ${t('inventory.value')}: $${catValue.toFixed(2)}`;
    }).join('\n');

    return `${t('app.title')}
${t('inventory.generated')}: ${new Date().toLocaleString('en-US')}

${t('inventory.summary')}:
  ${t('inventory.totalItems')}: ${totalItems}
  ${t('inventory.totalValue')}: $${totalValue.toFixed(2)}
  ${t('inventory.averagePrice')}: $${avgPrice.toFixed(2)}
  ${t('inventory.featuredItems')}: ${featured}

${t('inventory.stockStatus')}:
  ${t('stock.in_stock')}: ${inStock}
  ${t('stock.low_stock')}: ${lowStock}
  ${t('stock.out_of_stock')}: ${outOfStock}

${t('inventory.categoryBreakdown')}:
${categoryBreakdown}
`;
  }
}