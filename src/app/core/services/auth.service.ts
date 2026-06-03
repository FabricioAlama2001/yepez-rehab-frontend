import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../../models/login-response.model';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenKey = 'token';
  private readonly userKey = 'user';

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response) => {
        const token = response.access_token ?? response.accessToken ?? response.token;

        if (token) {
          localStorage.setItem(this.tokenKey, token);
        }

        if (response.user) {
          localStorage.setItem(this.userKey, JSON.stringify(response.user));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    const rawUser = localStorage.getItem(this.userKey);
    return rawUser ? JSON.parse(rawUser) as User : null;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'ADMIN';
  }
}
