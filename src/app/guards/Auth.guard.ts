import { inject } from "@angular/core";
import { CanActivateFn, GuardResult, MaybeAsync, Router } from "@angular/router";
import { AuthenticationService } from "../services/Authentication.service";

export const authGuard = (): CanActivateFn => {
  return (): MaybeAsync<GuardResult> => {
    console.log("authGuard");

    const authService = inject(AuthenticationService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
      console.log("isAuthenticated");
      return true;
    }

    return router.createUrlTree(["/login"]);
  };
};
