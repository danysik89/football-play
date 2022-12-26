import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginRequestInterface } from '../types/auth.model';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthService {
  constructor(private http: HttpClient) {}

  login(user: LoginRequestInterface) {
    return this.http.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`, user)
  }
}
