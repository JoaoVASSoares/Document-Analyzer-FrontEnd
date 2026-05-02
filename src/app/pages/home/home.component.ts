import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";

@Component({
  selector: "app-home",
  imports: [SidebarComponent, RouterOutlet],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {}
