import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { environment } from "../../environments/environment";
import { UserRegisterPayload, UserRegisterResponse } from "../interfaces/user.interface";

@Injectable({ providedIn: "root" })
export class UserService {
  private readonly http = inject(HttpClient);

  createUser(payload: UserRegisterPayload): Observable<UserRegisterResponse> {
    return this.http.post<UserRegisterResponse>(`${environment.baseUrl}/users`, payload).pipe(
      catchError((error) => {
        return throwError(() => new Error(error.error.message));
      }),
    );
  }
}
