import { Injectable } from '@angular/core';
import { CartItem } from '../common/cart-item';
import { BehaviorSubject, Subject } from 'rxjs';
import { BlockLike, forEachChild } from 'typescript';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cartItems: CartItem[] = [];
  totalPrice: Subject<number> = new BehaviorSubject<number>(0);
  totalQuantity: Subject<number> = new BehaviorSubject<number>(0);

  storage: Storage = localStorage; // or sessionStorage

  constructor() {
    //read data from storage
    let data = JSON.parse(this.storage.getItem('cartItems')!);

    if(data != null){
      this.cartItems = data;
    }

    //compute totals
    this.computeCartTotal();
   }

  addToCart(currentCartItem: CartItem) {
    let isExistInCart: boolean = false;
    let existingCartItem: CartItem = null!;

    if (this.cartItems.length > 0) {

      existingCartItem = this.cartItems.find(item => item.id === currentCartItem.id)!;

      isExistInCart = (existingCartItem != undefined);

    }
    if (isExistInCart) {
      existingCartItem.quantity++;
    } else {
      this.cartItems.push(currentCartItem);
    }

    this.computeCartTotal();
  }

  computeCartTotal() {

    let totalPrice: number = 0;
    let totalQuantity: number = 0;

    for (let currentCartItem of this.cartItems) {
      totalPrice += currentCartItem.unitPrice * currentCartItem.quantity;
      totalQuantity += currentCartItem.quantity;
    }

    this.totalPrice.next(totalPrice);
    this.totalQuantity.next(totalQuantity);

    this.persistCartItems();

  }

  decrementQuantity(cartItem: CartItem) {
    cartItem.quantity--;

    if (cartItem.quantity === 0) {
      this.remove(cartItem);
    } else {
      this.computeCartTotal();
    }
  }

  remove(cartItem: CartItem) {
    const index = this.cartItems.findIndex(i => i.id === cartItem.id);

    if (index > -1) {
      this.cartItems.splice(index, 1);

      this.computeCartTotal();
    }

  }

  persistCartItems(){
    this.storage.setItem('cartItems',JSON.stringify(this.cartItems));
  }
}
