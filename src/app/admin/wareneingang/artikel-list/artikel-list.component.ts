import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { WareneingangService } from '../wareneingang.service';
import { combineLatest, map, of, switchMap, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { iProduct } from 'src/app/model/iProduct';
import { iWarenEingang } from 'src/app/model/iWarenEingang';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddEditProductToBuchungComponent } from '../add-edit-product-to-buchung/add-edit-product-to-buchung.component';
import { iWareneingangProduct } from 'src/app/model/iWareneingangProduct';

@Component({
  selector: 'app-artikel-list',
  templateUrl: './artikel-list.component.html',
  styleUrls: ['./artikel-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtikelListComponent {

  items: iProduct[] = [];
  displayedColumns: string[] = ['prodid','artid', 'name', 'add'];

  products$ = combineLatest([of(this.items), toObservable(this.wEingService.lieferantIdSig)]).pipe(
    switchMap(([items, lifid]) => this.wEingService.getProduktsForWarenEingang(lifid)),
    map((res) => {
      console.log(res)
      return res;
    })
  )
  constructor(private wEingService: WareneingangService, private dialog: MatDialog) {}

  addProduct(product: iProduct) {

    const item: iWareneingangProduct = {
      wareneingang: null,
      produkt: product,
      menge: 0,
      preis: 0,
      mwst: 0,
      mengeEingelagert: 0,
      color: ''
    };
    const conf: MatDialogConfig = new MatDialogConfig();
      conf.width = '80%';
      conf.height = '80%';
      conf.data = item;

      this.dialog.open(AddEditProductToBuchungComponent, conf);
    }
}
