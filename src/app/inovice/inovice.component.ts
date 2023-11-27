import { ChangeDetectionStrategy, Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { iBestellung } from '../model/iBestellung';
import { OrdersService } from '../orders/orders.service';
import { forkJoin, tap } from 'rxjs';
import { ErrorService } from '../error/error.service';
import { CompanyService } from '../admin/company/company.service';
import { iCompany } from '../model/iCompany';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { OfferStatusEnum } from '../model/ebay/iEbayOffer';




@Component({
  selector: 'app-inovice',
  templateUrl: './inovice.component.html',
  styleUrls: ['./inovice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIconModule, CommonModule, MatTableModule, MatFormFieldModule, MatProgressSpinnerModule, MatButtonModule]
})
export class InoviceComponent {

  itemid = this.data.id ? this.data.id : 0;
  currentItem: iBestellung = {} as iBestellung;
  company: iCompany = {} as iCompany;
  columns: string[] = [ 'name','varia','rabat', 'stpreis', 'mwst', 'preis', 'brutto'];
  item$ = forkJoin([this.orderService.getBestellungById(this.itemid), this.companyService.getAllCompanies()]).pipe(tap(([best, comp]) => {
    this.currentItem = best;
    //ebay order have no id
    if(!this.currentItem.id) {
      this.currentItem = this.data;
      //i need to set id to get the right invoice
      this.currentItem.id = this.data.varsandnr as any;
    }


    this.company = comp;
    this.isPromotion();
  }));


    constructor(@Inject(MAT_DIALOG_DATA) public data: iBestellung, private readonly dialoRef: MatDialogRef<InoviceComponent>, private orderService: OrdersService,
    public errorService: ErrorService, private companyService: CompanyService, @Inject(PLATFORM_ID) private readonly platformId: any){}

  private isPromotion() {
    let isPromoted = false;
    for (let i = 0; i < this.currentItem.produkte.length; i++) {
      if (this.currentItem.produkte[i].produkt[0].promocje
        && this.currentItem.produkte[i].produkt[0].promocje.length > 0
         && this.currentItem.produkte[i].produkt[0].promocje[0].id)
          isPromoted = true;
    }
    if (!isPromoted && this.company.isKleinUnternehmen) {
      this.columns = [ 'name','varia','menge' ,'stpreis', 'brutto'];
    } else if ( !isPromoted && !this.company.isKleinUnternehmen) {
      this.columns = [ 'name','varia','menge' , 'stpreis', 'mwst', 'preis', 'brutto'];
    } else if (isPromoted && this.company.isKleinUnternehmen ) {
     this.columns = [ 'name','varia','menge' ,'rabat', 'stpreis',  'brutto'];
    } else {
      this.columns = [ 'name','varia','menge' ,'rabat', 'stpreis', 'mwst', 'preis', 'brutto'];
    }

  }
    getTaxProStuck(index: number) {
      return this.currentItem.produkte[index].verkauf_steuer;
    }
    getTax() {
      let taxx = 0;
      for (let i = 0; i < this.currentItem.produkte.length; i++ ) {
        taxx += this.getTaxProStuck(i) * this.currentItem.produkte[i].menge;
      }
      return taxx;
    }
    getNetto(index: number): number {
      return Number(this.currentItem.produkte[index].verkauf_price) * this.currentItem.produkte[index].menge;
    }
    getBrutto(index: number) {

      return ((Number(this.currentItem.produkte[index].verkauf_price) + Number(this.currentItem.produkte[index].verkauf_steuer))  * this.currentItem.produkte[index].menge);
    }

    getTotalNetto(): number {
      let netto = 0;
      for (let i = 0; i < this.currentItem.produkte.length; i++) {
        netto += this.getNetto(i);
      }
      return netto;
    }
    getTotalBrutto(): number {
      if(this.data.produkte[0].produkt[0].promocje)
        return Number((this.getTotalNetto() + Number(this.getTax()) + Number(this.getTotalRabat())));

      return Number((this.getTotalNetto() + Number(this.getTax())));
    }
    getRabat(index: number) : number {
      if(this.data.produkte[index].rabatt)
        return this.data.produkte[index].rabatt *this.data.produkte[index].menge;

      return Number(this.currentItem.produkte[index].verkauf_rabat) * this.currentItem.produkte[index].menge;
    }
    getTotalRabat() {
      let rabat = 0;
      for (let i = 0; i < this.currentItem.produkte.length; i++) {
        rabat += this.getRabat(i);
      }
      return rabat;
    }
    getPriceWithShipping() {
      return (Number(this.currentItem.versandprice) + this.getTotalBrutto());
    }
    getVariations(index: number) {
      let variation = '';
      for (let i = 0; i < this.currentItem.produkte.length; i++) {
        variation = this.currentItem.produkte[index].color;
      }
      return variation;
    }
    close() {
      this.dialoRef.close();
    }
    savePdf() {


      const item = document.getElementById('invoice');
      if(item) {

        const htmlWidth = item.clientWidth *3;
        const htmlHeight = item.clientHeight *3;

       const leftMargin = 40;

         const pdfWidth = htmlWidth + (leftMargin *2);
         const pdfHeigh = (htmlWidth * 1.5) + (leftMargin *2);
         let pdf = new jsPDF('p', 'pt', [pdfWidth, pdfHeigh]);


        html2canvas(item, { allowTaint: true, scale: 3 }).then(canvas => {

            let imgHight = Math.floor(canvas.width  * ( pdfHeigh / pdfWidth));

            const totalPages = Math.ceil(canvas.height / imgHight);


            const newCanvas = document.createElement('canvas');

            newCanvas.width = canvas.width ;
            newCanvas.height = imgHight;
            const ctx = newCanvas.getContext('2d');

            let imgStart = 0;

            for (let i = 1; i <= totalPages; i++) {
             if (i > 1)
              pdf.addPage();

              if(ctx !== null) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0,0,canvas.width, imgHight);

                ctx.drawImage(canvas, 0,imgStart,canvas.width ,imgHight, 0,0,pdfWidth  - 10 * leftMargin, pdfHeigh  - 14* leftMargin);

                pdf.addImage(newCanvas.toDataURL('image/jpeg', 1.0), 'PNG', leftMargin *5, leftMargin*5 , pdfWidth, pdfHeigh,'', 'FAST');
                pdf.setFont("arial");
                pdf.setFontSize(46);
                pdf.text('Page ' + i + ' of ' + totalPages, leftMargin*4, pdfHeigh - leftMargin *4);
                pdf.text('www.fischfang-profi.de', leftMargin* 45, pdfHeigh - leftMargin *4);

              }
              imgStart += imgHight;
           //  pdf.addImage(imageData, 'PNG', leftMargin, - (pdfHeigh * i) + leftMargin , canvasImageWidth, canvasImageHeight,'', 'MEDIUM');
            }

              pdf.output('pdfobjectnewwindow');

        })
      }

    }

}
