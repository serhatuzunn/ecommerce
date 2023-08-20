import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Country } from 'src/app/common/country';
import { Customer } from 'src/app/common/customer';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { PaymentInfo } from 'src/app/common/payment-info';
import { Purchase } from 'src/app/common/purchase';
import { State } from 'src/app/common/state';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { Luv2ShopFormService } from 'src/app/services/luv2-shop-form.service';
import { CustomValidators } from 'src/app/validators/custom-validators';
import { environment } from 'src/environments/environment';
import { __values } from 'tslib';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  formGroup!: FormGroup;

  totalPrice: number = 0;
  totalQuantity: number = 0;


  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[] = [];
  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  storage: Storage = sessionStorage;


  //init stripe API
  stripe = Stripe(environment.stripePublishableKey);

  paymentInfo: PaymentInfo = new PaymentInfo();
  cardElement: any;
  displayError: any = "";


  isDisabled:boolean = false;

  constructor(private formBuilder: FormBuilder,
    private luv2ShopFormService: Luv2ShopFormService,
    private cartService: CartService,
    private checkOutService: CheckoutService,
    private router: Router) { }

  ngOnInit(): void {
    
    //setup stripe payment form
    this.setupStripePaymentForm();

    //read user mail from storage
    const customerEmail = JSON.parse(this.storage.getItem('userEmail')!);

    this.formGroup = this.formBuilder.group({

      customer: this.formBuilder.group({
        firstName: new FormControl('',
                          [Validators.required,
                          Validators.minLength(2),
                          CustomValidators.notOnlyWhiteSpace]),

          
        lastName: new FormControl('',[Validators.required,Validators.minLength(2),CustomValidators.notOnlyWhiteSpace]),
        email: new FormControl(customerEmail,[Validators.required,Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('',[Validators.required,Validators.minLength(2),CustomValidators.notOnlyWhiteSpace]),
        city: new FormControl('',[Validators.required,Validators.minLength(2),CustomValidators.notOnlyWhiteSpace]),
        state: new FormControl('',[Validators.required]),
        country: new FormControl('',[Validators.required]),
        zipCode: new FormControl('',[Validators.required,Validators.minLength(2),CustomValidators.notOnlyWhiteSpace])
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('',[Validators.required,Validators.minLength(2),CustomValidators.notOnlyWhiteSpace]),
        city: new FormControl('',[Validators.required,Validators.minLength(2),CustomValidators.notOnlyWhiteSpace]),
        state: new FormControl('',[Validators.required]),
        country: new FormControl('',[Validators.required]),
        zipCode: new FormControl('',[Validators.required,Validators.minLength(2),CustomValidators.notOnlyWhiteSpace])
      }),
     /* creditCard: this.formBuilder.group({
        cardType: new FormControl('',[Validators.required]),
        nameOnCard: new FormControl('',[Validators.required,Validators.minLength(2),CustomValidators.notOnlyWhiteSpace]),
        cardNumber: new FormControl('',[Validators.required,Validators.pattern('[0-9]{16}')]),
        securityCode: new FormControl('',[Validators.required,Validators.pattern('[0-9]{3}')]),
        expirationMonth: [''],
        expirationYear: ['']
      })*/

    });

    //
    //populate datepickers
    //
    const startMonth: number = new Date().getMonth() + 1;

    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe({
      next: (data) => {
        console.log(JSON.stringify(data));
        this.creditCardMonths = data;
      }
    });

    this.luv2ShopFormService.getCreditCardYears().subscribe({
      next: (data) => {
        console.log("Years", JSON.stringify(data));
        this.creditCardYears = data;
      }
    });

    //
    //Populate Countries
    //
    this.luv2ShopFormService.getCountries().subscribe({
      next: (data) => {
        this.countries = data;
      }
    });

    this.reviewCartDetails();

  }

  reviewCartDetails(){
    //subscribe to cartService.totalQuantity
    this.cartService.totalQuantity.subscribe({
      next:(data) => {
        this.totalQuantity = data;
      }
    });

    //subscribe to cartService.totalPrice
    this.cartService.totalPrice.subscribe({
      next:(data) => {
        this.totalPrice = data;
      }
    });
  }


  onSubmit() {
    
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    //set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    //get cart items
    const cartItems = this.cartService.cartItems;

    //create orderItems from cartItems
    let orderItems:OrderItem[] = cartItems.map(tempItem => new OrderItem(tempItem));


    //set up purchase
    let purchase = new Purchase();

    //populate purchase - customer
    purchase.customer = this.formGroup.controls['customer'].value;

    //populate shipping address
    purchase.shippingAddress = this.formGroup.controls['shippingAddress'].value;
    const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    //populate billing address
    purchase.billingAddress = this.formGroup.controls['billingAddress'].value;
    const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;


    //populate order and orderitems
    purchase.order = order;
    purchase.orderItems = orderItems;

    //compute payment info
    this.paymentInfo.amount = Math.round(this.totalPrice * 100);
    this.paymentInfo.currency = 'USD';
    this.paymentInfo.receiptEmail = purchase.customer.email;

    //call rest api via the checkoutservice
    /*
    this.checkOutService.placeOrder(purchase).subscribe({
      next:(response) => {
        alert(`Your order has been received\nOrder tracking number: ${response.orderTrackingNumber}`);

        //reset cart
        this.resetCart();
      },
      error:(err) => {
        alert(`There was an error: ${err.message}`);
      }
    });
    */

    // if valid form then
    // - create payment intent
    // - confirm card payment
    // - place order

    this.isDisabled = true;
    if (!this.formGroup.invalid && this.displayError.textContent === "") {
      this.checkOutService.createPaymentIntent(this.paymentInfo).subscribe({
        next:(response) => {
          this.stripe.confirmCardPayment(response.client_secret,
            {
              payment_method:{
                card:this.cardElement,
                billing_details: {
                  email:purchase.customer.email,
                  name : purchase.customer.firstName + " " + purchase.customer.lastName,
                  address: {
                    line1: purchase.billingAddress.street,
                    city : purchase.billingAddress.city,
                    state : purchase.billingAddress.state,
                    postal_code: purchase.billingAddress.zipCode,
                    country: this.billingAddressCountry?.value.code
                  }
                }
              }
            },
            {
              handleActions: false
            })
            .then((result:any) => {
            if (result.error) {
              alert(`Bir hata oluştu : ${result.error.message}`);
              this.isDisabled = false;
            } else {
              // call REST API via the checkoutService
              this.checkOutService.placeOrder(purchase).subscribe({
                next:(response:any) => {
                  alert(`Order Tracking number : ${response.orderTrackingNumber}`);
                  this.resetCart();
                  this.isDisabled=false;
                },
                error:(err:any) => {
                  alert(err.message);
                  this.isDisabled=false;
                }
              });
            }
          });
        }
      }
      );
    }else{
      this.formGroup.markAllAsTouched();
      return;
    }



  }

  copyShippingToBilling(event: any) {
    if (event.target.checked) {
      this.formGroup.controls['billingAddress']
        .setValue(this.formGroup.controls['shippingAddress'].value);

        this.billingAddressStates = this.shippingAddressStates;
    } else {
      this.formGroup.controls['billingAddress'].reset();

      this.billingAddressStates = [];
    }
  }

  handleMonthsAndYears() {
    const creditCardFormGroup = this.formGroup.get('creditCard');

    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(this.formGroup.controls['creditCard'].value.expirationYear);

    let startMonth: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    } else {
      startMonth = 1;
    }

    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe({
      next: (data) => {
        this.creditCardMonths = data;
      }
    })
  }

  getStates(formGroupName : string){
    const currentFormGroup = this.formGroup.get(formGroupName);

    const countryCode = currentFormGroup?.value.country.code;
    const countryName = currentFormGroup?.value.country.name;

    this.luv2ShopFormService.getStates(countryCode).subscribe({
      next : (data) => {
        if(formGroupName === 'shippingAddress'){
          this.shippingAddressStates = data;
        }else{
          this.billingAddressStates = data;
        }

        //Select first item by default
        currentFormGroup?.get('state')?.setValue(data.find(i => i.id === 182));
      }
    });
  }
  
  resetCart(){
    // reset card and form data => navigate 

    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems();

    this.formGroup.reset();

    this.router.navigateByUrl("/products");

  }

  setupStripePaymentForm(){
    // get a handle to stripe elements
    var  elements = this.stripe.elements();

    // create a card element
    this.cardElement = elements.create('card',{hidePostalCode:true});

    // add a instace of card UI component into the card-element div
    this.cardElement.mount('#card-element');

    // add event binding for the change event on the card element
    this.cardElement.on('change',(event:any) => {
      //error
      this.displayError = document.getElementById('card-errors');

      if (event.complete) {
        this.displayError.textContent = "";
      } else if (event.error) {
        this.displayError.textContent = event.error.message;
      }


    });



  }


  //
  // Validation Getters
  //
  get firstName(){ return this.formGroup.get('customer.firstName'); }
  get lastName(){ return this.formGroup.get('customer.lastName'); }
  get email(){ return this.formGroup.get('customer.email'); }

  get shippingAddressStreet(){ return this.formGroup.get('shippingAddress.street'); }
  get shippingAddressCity(){ return this.formGroup.get('shippingAddress.city'); }
  get shippingAddressState(){ return this.formGroup.get('shippingAddress.state'); }
  get shippingAddressCountry(){ return this.formGroup.get('shippingAddress.country'); }
  get shippingAddressZipcode(){ return this.formGroup.get('shippingAddress.zipCode'); }

  get billingAddressStreet(){ return this.formGroup.get('billingAddress.street'); }
  get billingAddressCity(){ return this.formGroup.get('billingAddress.city'); }
  get billingAddressState(){ return this.formGroup.get('billingAddress.state'); }
  get billingAddressCountry(){ return this.formGroup.get('billingAddress.country'); }
  get billingAddressZipcode(){ return this.formGroup.get('billingAddress.zipCode'); }

  get creditCardType(){ return this.formGroup.get('creditCard.cardType'); }
  get creditCardNameOnCard(){ return this.formGroup.get('creditCard.nameOnCard'); }
  get creditCardNumber(){ return this.formGroup.get('creditCard.cardNumber'); }
  get creditCardSecurityCode(){ return this.formGroup.get('creditCard.securityCode'); }
  
















}
