import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ErrorService } from 'src/app/error/error.service';
import { iBestellung } from 'src/app/model/iBestellung';
import { OrdersService } from 'src/app/orders/orders.service';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { InoviceComponent } from 'src/app/inovice/inovice.component';
import { HelperService } from 'src/app/helper/helper.service';
import { CommonModule } from '@angular/common';
import { OrderSelectorComponent } from './order-selector/order-selector.component';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RefundService } from 'src/app/ebay/refund/refund.service';
import { RefundComponent } from 'src/app/ebay/refund/refund.component';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, OrderSelectorComponent, MatTableModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule]
})
export class OrderComponent implements OnDestroy{

  ordersSig = this.oderService.ordersSig;

  columns: string[] = ['id', 'status','vert', 'bestDate', 'bestellStatus','rausDate', 'versandnr', 'versArt', 'inovice', 'refund'];
  constructor(private readonly oderService: OrdersService, public error: ErrorService, private readonly dialog: MatDialog, private helperService: HelperService,
  private readonly refundService: RefundService) {}
  ngOnDestroy(): void {
    this.helperService.artikelProSiteSig.set(0);
  }

  openDetailts(item: iBestellung) {
    const conf: MatDialogConfig = new MatDialogConfig();
    conf.width = '80%';
    conf.minHeight = '80%';
    conf.data = item;
    this.dialog.open(OrderDetailsComponent, conf);
  }
  openInovice(item: iBestellung) {
    const conf: MatDialogConfig = new MatDialogConfig();
    conf.height = '100%';
    conf.width = '100%';
    conf.data = item;
    this.dialog.open(InoviceComponent, conf);
  }
  refund(order: iBestellung) {
    const conf : MatDialogConfig = new MatDialogConfig();
    conf.width = '100%';
    conf.height = '100%';
    conf.data = order;

    this.dialog.open(RefundComponent, conf);
    }
}
