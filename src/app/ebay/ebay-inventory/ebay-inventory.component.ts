import { ChangeDetectionStrategy, Component, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EbayInventoryService } from './ebay-inventory.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { iEbayInventory } from 'src/app/model/ebay/iEbayInventory';
import { MatTabsModule } from '@angular/material/tabs';
import { ImportEbayListingsComponent } from './import-ebay-listings/import-ebay-listings.component';
import { Observable, combineLatest, map } from 'rxjs';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-ebay-inventory',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatTableModule, MatButtonModule, FormsModule, MatTabsModule, ImportEbayListingsComponent, MatFormFieldModule, MatCheckboxModule],
  templateUrl: './ebay-inventory.component.html',
  styleUrls: ['./ebay-inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EbayInventoryComponent {
  itemsProSite = 100;
  currentSite = 0;
  zeigtNurEinProGroupSig = signal(true);
  itemsSig$: Observable<iEbayInventory> = this.inventorySer.getCurrentInventory(this.itemsProSite, this.currentSite, this.zeigtNurEinProGroupSig());

  columns = ['sku', 'title']

  constructor(private readonly inventorySer: EbayInventoryService) {}
  update(val: any) {
    this.itemsProSite = val;
    this.itemsSig$ = this.inventorySer.getCurrentInventory(this.itemsProSite, this.currentSite, this.zeigtNurEinProGroupSig());
  }
  goNext() {
    this.currentSite += this.itemsProSite;
    this.itemsSig$ = this.inventorySer.getCurrentInventory(this.itemsProSite, this.currentSite, this.zeigtNurEinProGroupSig());
  }
  goBack() {
    this.currentSite -= this.itemsProSite;
    this.itemsSig$ = this.inventorySer.getCurrentInventory(this.itemsProSite, this.currentSite, this.zeigtNurEinProGroupSig());
  }
  showAllProduktsInGroup() {
    if(this.zeigtNurEinProGroupSig() === true) {
      this.zeigtNurEinProGroupSig.set(false);
    } else {
      this.zeigtNurEinProGroupSig.set(true);
    }
    this.itemsSig$ = this.inventorySer.getCurrentInventory(this.itemsProSite, this.currentSite, this.zeigtNurEinProGroupSig());
  }
}
