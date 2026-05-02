import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { PrimeNGModule } from './components/primeNG.module';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, PrimeNGModule, ConfirmDialog, Toast],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
