import { ChangeDetectorRef, Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { PrimeNGModule } from "../../components/primeNG.module";
import { LoginPayload } from "../../interfaces/login.interface";
import { AuthenticationService } from "../../services/authentication.service";

@Component({
  selector: "app-login",
  imports: [PrimeNGModule, ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
})
export class LoginComponent {
  private readonly authenticationService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isSubmitting = signal(false);
  errorMessage = "";

  loginForm = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage = "";

    this.authenticationService
      .login(this.loginForm.getRawValue() as LoginPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(["/dashboard"]);
        },
        error: () => {
          this.errorMessage = "Error ao fazer login.";
        },
      });
  }

  navigateToRegister(): void {
    this.router.navigate(["/register"]);
  }
}
