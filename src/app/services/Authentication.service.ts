import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginPayload, LoginResponse } from '../interfaces/login.interface';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.baseUrl}/authentication/login`, payload)
      .pipe(
        tap((response: LoginResponse) => {
          this.saveToken(response.accessToken, response.expiresIn);
        }),
        catchError((error) => {
          return throwError(() => new Error(error.error.message));
        }),
      );
  }

  saveToken(token: string, expiresIn: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('expiresIn', new Date(expiresIn).toISOString());
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getExpiresIn(): Date | null {
    const expiresIn = localStorage.getItem('expiresIn');
    return expiresIn ? new Date(expiresIn) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiresIn = this.getExpiresIn();
    return !!token && !!expiresIn && expiresIn > new Date();
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
