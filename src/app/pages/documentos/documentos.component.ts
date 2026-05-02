import { DatePipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ConfirmationService, MessageService } from "primeng/api";
import { DocumentsService } from "../../services/documents.service";
import type { DocStatus, DocTipo, DocumentItem } from "./documentos.models";

@Component({
  selector: "app-documentos",
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: "./documentos.component.html",
  styleUrl: "./documentos.component.scss",
})
export class DocumentosComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly documentsApi = inject(DocumentsService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  /** Flex: o PrimeNG reparte altura entre corpo (scroll) e paginador dentro do `.doc-table-wrap`. */
  protected readonly tableScrollHeight = "flex";

  protected readonly anoAtual = new Date().getFullYear();

  protected readonly documentos = signal<DocumentItem[]>([]);
  protected readonly loadError = signal<string | null>(null);

  protected readonly busca = signal("");
  protected readonly filtroStatus = signal<string>("todos");
  protected readonly filtroTipo = signal<string>("todos");
  protected readonly filtroPeriodo = signal<string>("todos");

  protected readonly opcoesStatus = [
    { label: "Todos", value: "todos" },
    { label: "Pronto", value: "pronto" },
    { label: "Processando", value: "processando" },
    { label: "Falhou", value: "falhou" },
  ];

  protected readonly opcoesTipo = [
    { label: "Todos", value: "todos" },
    { label: "PDF", value: "PDF" },
    { label: "DOC", value: "DOC" },
    { label: "DOCX", value: "DOCX" },
    { label: "TXT", value: "TXT" },
  ];

  protected readonly opcoesPeriodo = [
    { label: "Todos", value: "todos" },
    { label: "Últimos 7 dias", value: "7" },
    { label: "Últimos 30 dias", value: "30" },
    { label: "Últimos 90 dias", value: "90" },
  ];

  protected readonly filtrados = computed(() => {
    const q = this.busca().trim().toLowerCase();
    const st = this.filtroStatus();
    const tp = this.filtroTipo();
    const per = this.filtroPeriodo();
    const now = Date.now();

    return this.documentos().filter((d) => {
      if (q && !d.nome.toLowerCase().includes(q)) {
        return false;
      }
      if (st !== "todos" && d.status !== st) {
        return false;
      }
      if (tp !== "todos" && d.tipo !== tp) {
        return false;
      }
      if (per !== "todos") {
        const dias = Number(per);
        const limite = now - dias * 24 * 60 * 60 * 1000;
        if (d.modificado.getTime() < limite) {
          return false;
        }
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.refreshList();
  }

  private refreshList(): void {
    this.loadError.set(null);
    this.documentsApi.list().subscribe({
      next: (items) => {
        this.documentos.set(items);
      },
      error: () => {
        this.loadError.set("Não foi possível carregar os documentos. Verifique se está autenticado e se a API está no ar.");
      },
    });
  }

  protected severityStatus(status: DocStatus): "success" | "warn" | "danger" | "secondary" {
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

  protected labelStatus(status: DocStatus): string {
    switch (status) {
      case "pronto":
        return "Pronto";
      case "processando":
        return "Processando";
      case "falhou":
        return "Falhou";
      default:
        return status;
    }
  }

  protected iconeTipo(tipo: DocTipo): string {
    switch (tipo) {
      case "PDF":
        return "pi pi-file-pdf";
      case "DOCX":
      case "DOC":
        return "pi pi-file-word";
      default:
        return "pi pi-file";
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

  protected visualizar(doc: DocumentItem): void {
    void this.router.navigate(["/documentos", doc.id]);
  }

  protected excluir(doc: DocumentItem): void {
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
            this.documentos.update((lista) => lista.filter((d) => d.id !== doc.id));
            this.messages.add({
              severity: "success",
              summary: "Documento excluído",
              detail: `«${doc.nome}» foi removido.`,
            });
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

  protected novoUpload(): void {
    void this.router.navigate(["/upload"]);
  }
}
