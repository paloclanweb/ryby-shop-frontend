import { Component } from '@angular/core';
import { ProductService } from './product.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { iProduct } from 'src/app/model/iProduct';
import { AddEditProductComponent } from '../add-edit-product/add-edit-product.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent {
  displayedColumns: string[] = ['prodid', 'name', 'preis', 'verfugbar', 'edit', 'delete'];
  productsSig = this.prodService.productsSig;
  del$ = new Observable();
  constructor( private readonly prodService: ProductService, private readonly dialog: MatDialog) {}

  addEditProduct(item?: iProduct) {
    const conf : MatDialogConfig = new MatDialogConfig();
    conf.width = '90%';
    conf.height = '100%'

    conf.data = item ? item: null;
    this.dialog.open(AddEditProductComponent, conf);
  }
  deleteProdukt(prod: iProduct) {
   const yes = window.confirm('Bist du sicher das du der Produkt '+ prod.name +' löschen willst ?');
   if (yes && prod.id) {
    this.del$ = this.prodService.deleteProduct(prod.id);
   }
  }
}
