import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthenticationService } from "../services/authentication.service";

/** Pedidos que não devem levar JWT (login público e registo). */
function isPublicAuthRequest(req: { url: string; method: string }): boolean {
  const url = req.url.toLowerCase();
  if (url.includes("/authentication/login")) {
    return true;
  }
  if (req.method !== "POST") {
    return false;
  }
  let pathname = url;
  try {
    pathname = new URL(req.url).pathname.toLowerCase();
  } catch {}
  const base = pathname.replace(/\/+$/, "");
  return base.endsWith("/users");
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicAuthRequest(req)) {
    return next(req);
  }

  const auth = inject(AuthenticationService);
  const token = auth.getToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
