import { DatePipe } from "@angular/common";
import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { ConfirmationService, MessageService } from "primeng/api";
import { MarkdownPipe } from "../../../pipes/markdown.pipe";
import { DocumentsService } from "../../../services/documents.service";
import { DocumentItem } from "../documentos.models";

@Component({
  selector: "app-documento-detalhe",
  imports: [DatePipe, RouterLink, ButtonModule, TagModule, Tabs, TabList, Tab, TabPanels, TabPanel, MarkdownPipe],
  templateUrl: "./documento-detalhe.component.html",
  styleUrl: "./documento-detalhe.component.scss",
})
export class DocumentoDetalheComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly documentsApi = inject(DocumentsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  protected readonly anoAtual = new Date().getFullYear();

  protected readonly documento = signal<DocumentItem | null>(null);
  protected readonly aba = signal<string | number>("pdf");
  private readonly pdfBlobObjectUrl = signal<string | null>(null);

  protected readonly safePdfUrl = computed((): SafeResourceUrl | null => {
    const url = this.pdfBlobObjectUrl()?.trim();
    if (!url) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  protected onTabChange(value: string | number | undefined): void {
    if (value !== undefined) {
      this.aba.set(value);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      void this.router.navigate(["/documentos"]);
      return;
    }
    this.documentsApi
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => {
          this.documento.set(doc);
          this.revokePdfUrl();
          if (doc.tipo === "PDF") {
            this.documentsApi
              .getContentBlob(id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (blob) => {
                  const previewBlob = doc.tipo === "PDF" ? new Blob([blob], { type: "application/pdf" }) : blob;
                  const objectUrl = URL.createObjectURL(previewBlob);
                  this.pdfBlobObjectUrl.set(objectUrl);
                },
                error: () => {
                  this.pdfBlobObjectUrl.set(null);
                },
              });
          }
        },
        error: () => {
          void this.router.navigate(["/documentos"]);
        },
      });
  }

  ngOnDestroy(): void {
    this.revokePdfUrl();
  }

  private revokePdfUrl(): void {
    const u = this.pdfBlobObjectUrl();
    if (u) {
      URL.revokeObjectURL(u);
    }
    this.pdfBlobObjectUrl.set(null);
  }

  protected severityLabel(status: DocumentItem["status"]): "success" | "warn" | "danger" | "secondary" {
    switch (status) {
      case "pronto":
        return "success";
      case "processando":
        return "warn";
      case "falhou":
        return "danger";
      default:
        return "secondary";
    }
  }

  protected statusText(status: DocumentItem["status"]): string {
    switch (status) {
      case "pronto":
        return "Processado";
      case "processando":
        return "Processando";
      case "falhou":
        return "Falhou";
      default:
        return status;
    }
  }

  protected formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected excluir(): void {
    const doc = this.documento();
    if (!doc) {
      return;
    }
    this.confirmation.confirm({
      header: "Excluir documento",
      message: `Excluir permanentemente «${doc.nome}»? Esta ação não pode ser desfeita.`,
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Excluir",
      rejectLabel: "Cancelar",
      acceptButtonStyleClass: "p-button-danger",
      rejectButtonStyleClass: "p-button-text",
      acceptIcon: "pi pi-trash",
      rejectIcon: "none",
      accept: () => {
        this.documentsApi.delete(doc.id).subscribe({
          next: () => {
            this.messages.add({
              severity: "success",
              summary: "Documento excluído",
              detail: `«${doc.nome}» foi removido.`,
            });
            void this.router.navigate(["/documentos"]);
          },
          error: () => {
            this.messages.add({
              severity: "error",
              summary: "Não foi possível excluir",
              detail: "Tente novamente ou verifique a conexão com a API.",
            });
          },
        });
      },
    });
  }

  protected baixar(): void {
    const doc = this.documento();
    if (!doc) {
      return;
    }
    this.documentsApi.getContentBlob(doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = globalThis.document.createElement("a");
        a.href = url;
        a.download = doc.nome;
        a.rel = "noopener";
        globalThis.document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.messages.add({
          severity: "error",
          summary: "Download indisponível",
          detail: "Não foi possível baixar o arquivo. Tente novamente.",
        });
      },
    });
  }
}
