import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    title: "Login",
    loadComponent: () => import("./pages/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "register",
    title: "Registro",
    loadComponent: () => import("./pages/register/register.component").then((m) => m.RegisterComponent),
  },
  {
    path: "",
    canActivate: [authGuard()],
    loadComponent: () => import("./pages/home/home.component").then((m) => m.HomeComponent),
    children: [
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
      {
        path: "dashboard",
        canActivate: [authGuard()],
        title: "Dashboard",
        loadComponent: () => import("./pages/dashboard/dashboard.component").then((m) => m.DashboardComponent),
      },
      {
        path: "upload",
        canActivate: [authGuard()],
        title: "Upload",
        loadComponent: () => import("./pages/upload/upload.component").then((m) => m.UploadComponent),
      },
      {
        path: "documentos/:id",
        canActivate: [authGuard()],
        title: "Documento",
        loadComponent: () => import("./pages/documentos/documento-detalhe/documento-detalhe.component").then((m) => m.DocumentoDetalheComponent),
      },
      {
        path: "documentos",
        canActivate: [authGuard()],
        title: "Documentos",
        loadComponent: () => import("./pages/documentos/documentos.component").then((m) => m.DocumentosComponent),
      },
    ],
  },
];
