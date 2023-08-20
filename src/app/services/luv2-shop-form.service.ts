import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Country } from '../common/country';
import { State } from '../common/state';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Luv2ShopFormService {

  private countriesUrl = 'https://localhost:8443/api/countries';
  private statesUrl = 'https://localhost:8443/api/states';

  constructor(private httpClient:HttpClient) { }

  getCreditCardMonths(startMonth:number) : Observable<number[]>{
    let data: number[] = [];

    for(let theMonht = startMonth; theMonht<= 12; theMonht++){
      data.push(theMonht);
    }
    
    return of(data);
  }

  getCreditCardYears() : Observable<number[]>{
    let data: number[] = [];

    const startYear: number = new Date().getFullYear();
    const endYear: number = startYear + 10;

    for(let theYear = startYear; theYear<= endYear; theYear++){
      data.push(theYear);
    }

    return of(data);
  }

  getCountries() : Observable<Country[]> {
    return this.httpClient.get<GetResponseCountries>(this.countriesUrl)
    .pipe(
      map(response => response._embedded.countries)
    );
  }

  getStates(selectedCountryCode:string) : Observable<State[]> {

    const searchStatesUrl = `${this.statesUrl}/search/findByCountryCode?code=${selectedCountryCode}`;

    return this.httpClient.get<GetResponseStates>(searchStatesUrl)
    .pipe(
      map(response => response._embedded.states)
    );
  }
  
} //CLASS

interface GetResponseCountries{
  _embedded: {
    countries: Country[];
  }
}

interface GetResponseStates{
  _embedded: {
    states: Country[];
  }
}