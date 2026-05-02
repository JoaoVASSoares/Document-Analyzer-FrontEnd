import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { AuthenticationService } from "../../services/authentication.service";

@Component({
  selector: "app-sidebar",
  imports: [RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent {
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigate(["/login"]);
  }
}
