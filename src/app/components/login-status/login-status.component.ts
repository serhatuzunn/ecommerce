import { Component, Inject, OnInit } from '@angular/core';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

@Component({
  selector: 'app-login-status',
  templateUrl: './login-status.component.html',
  styleUrls: ['./login-status.component.css']
})
export class LoginStatusComponent implements OnInit{

  isAuth: boolean = false;
  userFullName: string = '';

  storage: Storage = sessionStorage;


  constructor(private oktaAuthService: OktaAuthStateService,
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth){

  }

  ngOnInit(): void {
    // subscribe to authentication state changes
    this.oktaAuthService.authState$.subscribe(
      (result) => {
        this.isAuth = result.isAuthenticated!;
        this.getUserDetails();
      }
    );
  }
  getUserDetails() {
    if (this.isAuth) {
      // Fetch the logged in user details

      // user full name is exposed as a prop name
      this.oktaAuth.getUser().then(
        (result) => {
          this.userFullName = result.name as string;

          //retrieve the user's email from auth response
          const theEmail = result.email;

          //storage the email in browser storage
          this.storage.setItem('userEmail',JSON.stringify(theEmail));
        }
      );
    }
  }

  logout(){
    
    //terminates the session with okta and removes current tokens.

    this.oktaAuth.signOut();
  }

}
