import { ChangeDetectionStrategy, Component, Inject, OnInit, Optional, signal } from '@angular/core';
import { ProductService } from '../product/product.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { iProduct } from 'src/app/model/iProduct';
import { iColor } from 'src/app/model/iColor';
import { LiferantsService } from '../liferants/liferants.service';
import { KategorieService } from '../kategories/kategorie.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { iLieferant } from 'src/app/model/iLieferant';
import { iKategorie } from 'src/app/model/iKategorie';
import { HelperService } from 'src/app/helper/helper.service';
import { ErrorService } from 'src/app/error/error.service';
import { Observable, combineLatest, map, shareReplay, startWith, tap } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { iAktion } from 'src/app/model/iAktion';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { iDelete } from 'src/app/model/iDelete';

@Component({
  selector: 'app-add-edit-product',
  templateUrl: './add-edit-product.component.html',
  styleUrls: ['./add-edit-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class AddEditProductComponent implements OnInit {


  productForm: FormGroup;
  currentImage!: Blob;
  photoFile!: File;
  images: string[] = [];
  color: iColor[] = [];
  actionsSig = signal<iAktion[]>([]);
  liferantSignal = toSignal<iLieferant[], iLieferant[]>(this.liferantService.liferants$, { initialValue: [] });
  kategorySignal = toSignal<iKategorie[], iKategorie[]>(this.katService.kategorie$, { initialValue: []});
  act$ = new Observable().pipe(shareReplay(1));
  create$ = new Observable().pipe(shareReplay(1));
  getFoto$ = new Observable();
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly dialogRef: MatDialogRef<AddEditProductComponent>,
    private readonly prodService: ProductService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: iProduct,
    private readonly liferantService: LiferantsService,
    private readonly katService: KategorieService,
    public readonly helperService: HelperService,
    public readonly err: ErrorService,
    private readonly sanitizer: DomSanitizer,
    private readonly dpipe: DatePipe,
    private readonly snackBar: MatSnackBar
  ) {
    this.productForm = this.formBuilder.group({
      id: [this.data ? this.data.id : null],
      name: [this.data ? this.data.name : '', Validators.required],
      preis: [this.data ? this.data.preis : '', Validators.required],
      artid: [this.data ? this.data.artid : '', Validators.required],
      beschreibung: [this.data ? this.data.beschreibung : '', Validators.required],
      foto: [this.data ? this.data.foto[0] : this.images],
      thumbnail: [this.data ? this.data.thumbnail : ''],
      lieferant: [this.data ? this.data.lieferant : {} as iLieferant, Validators.required],
      lagerorte: [this.data ? this.data.lagerorte : []],
      bestellungen: [this.data ? this.data.bestellungen : []],
      datumHinzugefuegt: [this.data ? this.data.datumHinzugefuegt : Date.now()],
      kategorie: [this.data ? this.data.kategorie : [], Validators.required],
      verfgbarkeit: [this.data ? this.data.verfgbarkeit : false],
      mindestmenge: [this.data ? this.data.mindestmenge : '', Validators.required],
      currentmenge: [{ value: this.data ? this.data.mindestmenge : 0, disabled: true }],
      product_sup_id: [this.data ? this.data.product_sup_id: ''],
      verkaufteAnzahl: [{ value:  this.data ? this.data.verkaufteAnzahl : 0,  disabled: true } ],
      wareneingang: [this.data ? this.data.wareneingang : []],
      warenausgang: [this.data ? this.data.warenausgang : []],
      mehrwehrsteuer: [this.data ? this.data.mehrwehrsteuer : '', Validators.required],
      promocje: [this.data ? this.data.promocje : []],
      reservation: [this.data ? this.data.reservation : []],
      bewertung: [this.data ? this.data.bewertung : []]
    });
  }
  ngOnInit(): void {
    if(this.data && this.data.id) {

      this.create$ = this.prodService.getProductById(this.data.id).pipe(map((res) => {
        this.data.preis = Number(res.preis)
        this.images = JSON.parse( res.foto);
        this.color = JSON.parse(res.color);
        this.productForm.patchValue(res);

        if(this.images.length > 0)
        this.getImage(this.images[0])
        return res;
       }));

    }
  }
async getData() {

}

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
        this.photoFile = event.target.files[0];
    }
  }

  uploadPhoto() {
    if(!this.data)
      return;
    if (this.photoFile) {
    if(this.data.id)
     this.act$ = this.prodService.uploadPhoto(this.photoFile, this.data.id).pipe(tap((act) => {
      if(act) {
        const tmp = act as unknown as { imageid: string };
        this.images.push(tmp.imageid);
        this.productForm.get('foto')?.patchValue(this.images);
        this.getImage(tmp.imageid);
        this.snackBar.open('Du musst das Produkt speichern oder die Bilder werden nicht gespeichert mit Produkt...', '', { duration: 2000})
      }
      return act;
     }))
    }
  }
  cancelUpload() {
    if(this.images.length > 0)
    this.getImage(this.images[this.images.length -1]);


    this.prodService.resetFotoUpload();
    }

  saveProduct() {
    if (this.productForm.valid) {
      const product: iProduct = {} as iProduct;
      Object.assign(product, this.productForm.value)
      product.foto = JSON.stringify(this.images);
      product.color = JSON.stringify(this.color);
      product.verkaufteAnzahl = this.data ?  this.data.verkaufteAnzahl : 0;
      product.preis = Number(this.productForm.get('preis')?.getRawValue());
      product.currentmenge = this.data.currentmenge;

      const curDate =  this.dpipe.transform(this.productForm.get('datumHinzugefuegt')?.getRawValue(), 'yyyy-MM-dd');

      if(curDate)
        product.datumHinzugefuegt = curDate;
      if(this.data)
        product.id = this.data.id;


      if (!product.id) {
      this.create$ = this.prodService.createProduct(product).pipe(tap((res) => {
        if(res.id) {
          this.snackBar.open('Das Produkt wurde hinzugefügt', '', {duration: 1500 });
          this.dialogRef.close();
          return res;
        }

        this.snackBar.open('Etwas ist falschgelaufen, Produkt wurde nicht hinzugefügt', '', {duration: 3000 });
        return res;
      }));
      } else {
        product.verfgbarkeit = this.productForm.get('verfgbarkeit')?.getRawValue() == 1 ? true : false;
      this.create$ = this.prodService.updateProduct(product.id, product).pipe(tap((res) => {
        if(res && res.id && isFinite(res.id)) {
          this.snackBar.open('Die Änderungen wurden gespeichert', '', {duration: 1500 });
          return res;
        }

        this.snackBar.open('Etwas ist scheifgelaufen, die änderungen wurden nicht gespeichert', '', {duration: 3000 });
        return res;
      }));
      }
    }
  }

  cancel() {
    this.dialogRef.close();
  }
  addColor(){
    const color: iColor = {
      id: this.color.length  > 9 ? 'farbe ' + (this.color.length +1) : 'farbe 0' + (this.color.length +1),
      menge: 0
    };
    this.color.push(color);
  }
  removeColor(){
    if(this.color.length > 0)
      this.color.splice(this.color.length -1, 1);
  }
  getImage(id: string) {

    this.getFoto$ = this.prodService.getImage(id).pipe(tap((res) => {
     this.currentImage = res;
    }));
  }
  getSafeImageData() {
    if (this.currentImage) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(this.currentImage));
    }
    return '';
  }
  getSelected(o1: any, o2: any) {
    if(!o1 || !o2) return false;
    return (o1.id == o2.id);
  }
  deleteImage(id: string) {
    if(this.data && this.data.id !== undefined) {
      const item: iDelete =  { produktid: this.data.id, fileid: id};
      this.act$ = this.prodService.deleteImage(item).pipe(tap((res) => {
        if(res === 1) {
          const index = this.images.findIndex((tmp) => tmp === item.fileid);
          this.images.splice(index, 1);
          this.productForm.get('foto')?.patchValue(this.images);
        }
      }))
    }


  }
}
