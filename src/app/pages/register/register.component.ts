import { ChangeDetectorRef, Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { PrimeNGModule } from "../../components/primeNG.module";
import { MatchControlDirective } from "../../directives/match-control.directive";
import { UserRegisterPayload } from "../../interfaces/user.interface";
import { UserService } from "../../services/User.service";

@Component({
  selector: "app-register",
  imports: [PrimeNGModule, ReactiveFormsModule, MatchControlDirective],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.scss",
})
export class RegisterComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isSubmitting = signal(false);
  errorMessage = "";

  registerForm = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    confirmPassword: ["", [Validators.required]],
    fullName: ["", [Validators.required]],
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.registerForm.markAllAsDirty();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage = "";

    this.userService
      .createUser(this.registerForm.getRawValue() as UserRegisterPayload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(["/login"]);
        },
        error: () => {
          this.errorMessage = "Error ao criar usuário.";
        },
      });
  }

  navigateToLogin(): void {
    void this.router.navigate(["/login"]);
  }
}
