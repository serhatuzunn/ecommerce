import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { Product } from '../common/product';
import { ProductCategory } from '../common/product-category';
import { catchError } from 'rxjs/operators';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  //private baseURL = 'https://localhost:8443/api/products';
  private baseURL = environment.anexShopApiUrl + '/products';
  private categoryUrl =  environment.anexShopApiUrl +'/product-category';

  constructor(private httpClient: HttpClient) { }

  public searchProducts(theKeyword: string): Observable<Product[]> {
    //need to build URL based on keyword
    const searchURL = `${this.baseURL}/search/findByNameContaining?name=${theKeyword}`;
    return this.getProducts(searchURL);
  }

  public searchProductListPaginate(page: number,
                                   pageSize: number,
                                   keyword: string): Observable<GetResponseProduct> {

    //need to build URL based on keyword , page and pageSize
    const searchURL = `${this.baseURL}/search/findByNameContaining?name=${keyword}`
      + `&page=${page}&size=${pageSize}`;

    return this.httpClient.get<GetResponseProduct>(searchURL);
  }

  public getProductListPaginate(page: number,
                                pageSize: number,
                                theCategoryId: number): Observable<GetResponseProduct> {

    //need to build URL based on category id , page and pageSize
    const searchURL = `${this.baseURL}/search/findByCategoryId?id=${theCategoryId}`
      + `&page=${page}&size=${pageSize}`;

    return this.httpClient.get<GetResponseProduct>(searchURL);
  }

  public getProductList(theCategoryId: number): Observable<Product[]> {
    //need to build URL based on category id
    const searchURL = `${this.baseURL}/search/findByCategoryId?id=${theCategoryId}`;
    return this.getProducts(searchURL);
  }

  public getProductCategories(): Observable<ProductCategory[]> {
    return this.httpClient.get<GetResponseProductCategory>(this.categoryUrl).pipe(
      map(response => response._embedded.productCategory)
    );
  }

  public getProducts(URL: string): Observable<Product[]> {
    return this.httpClient.get<GetResponseProduct>(URL).pipe(
      map(response => response._embedded.products)
    )
  }
  public getProduct(theProductId: number): Observable<Product> {
    const productUrl = `${this.baseURL}/${theProductId}`;
    return this.httpClient.get<Product>(productUrl);
  }
}

interface GetResponseProduct {
  _embedded: {
    products: Product[];
  },
  page: {
    size: number,
    totalElements: number,
    totalPages: number,
    number: number
  }
}

interface GetResponseProductCategory {
  _embedded: {
    productCategory: ProductCategory[];
  }
}
