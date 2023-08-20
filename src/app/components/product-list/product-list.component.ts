import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartItem } from 'src/app/common/cart-item';
import { Product } from 'src/app/common/product';
import { CartService } from 'src/app/services/cart.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list-grid.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {


  products: Product[] = [];
  currentCategoryId: number = 1;
  previousCategoryId: number = 1;
  searchMode: boolean = false;

  //pagination props
  pageNumber: number = 1;
  pageSize: number = 8;
  total: number = 0;

  prevKeyword: string = "";

  constructor(private productService: ProductService,
              private cartService: CartService,
              private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.listProducts();
    });
  }

  listProducts() {
    this.searchMode = this.route.snapshot.paramMap.has('keyword');

    if (this.searchMode) {
      this.handleSearchProducts();
    } else {
      this.handleListProducts();
    }


  }

  handleSearchProducts() {
    const theKeyword: string = this.route.snapshot.paramMap.get('keyword')!;

    //if currentKeyword != prevKeyword => set pageNumber 1
    if (this.prevKeyword != theKeyword) {
      this.pageNumber = 1;
    }

    this.prevKeyword = theKeyword;

    //Search for the products using keyword
    this.productService.searchProductListPaginate(this.pageNumber - 1,
      this.pageSize,
      theKeyword).subscribe(this.processResult());
  }

  handleListProducts() {
    //check if 'id' parameter is available
    const hastCategoryId: boolean = this.route.snapshot.paramMap.has('id');
    if (hastCategoryId) {
      //get the ''id'' param string . convert string to a number using the + symbol
      this.currentCategoryId = + this.route.snapshot.paramMap.get('id')!;
    } else {
      //not category id available ... default to category id 1
      this.currentCategoryId = 1;
    }


    //
    // check if we have a diffrent category than previous
    // note : angular will reuse a component if it is currently being viewed
    //

    //if we have a different category id than previous 
    //then set the pageNumber back to 1

    if (this.previousCategoryId != this.currentCategoryId) {
      this.pageNumber = 1;
    }

    this.previousCategoryId = this.currentCategoryId;
    console.log(`current = ${this.currentCategoryId}`, `pagenumber = ${this.pageNumber}`);


    //get the products for the given category id
    this.productService.getProductListPaginate(this.pageNumber - 1,
      this.pageSize,
      this.currentCategoryId).subscribe({
        next: (data) => {
          this.products = data._embedded.products;
          this.pageNumber = data.page.number + 1;
          this.pageSize = data.page.size;
          this.total = data.page.totalElements;
        },
        error: (e) => console.log(e)
      }

      )
  }
  
  addToCart(product : Product){
    const theCartItem = new CartItem(product);
    debugger;
    this.cartService.addToCart(theCartItem);
    
    
  }













  //#region Helpers


  updatePageSize(selectedPageSize: string) {
    this.pageSize = + selectedPageSize;
    this.pageNumber = 1;
    this.listProducts();
  }

  processResult() {
    return (data: any) => {
      this.products = data._embedded.products;
      this.pageNumber = data.page.number + 1;
      this.pageSize = data.page.size;
      this.total = data.page.totalElements;
    };
  }
  //#endregion



  //#region Old Methods 

  /*handleSearchProductsOldVersionInRxJS() {
    const theKeyword: string = this.route.snapshot.paramMap.get('keyword')!;

    //Search for the products using keyword
    this.productService.searchProducts(theKeyword).subscribe(
      data => {
        this.products = data;
      },
      error => console.log('Error : ',error.message)
    );
  }*/

  //#endregion

}
