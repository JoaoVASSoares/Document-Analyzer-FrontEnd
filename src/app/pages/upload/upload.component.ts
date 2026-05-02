import { HttpEventType } from "@angular/common/http";
import { Component, ElementRef, inject, OnDestroy, signal, viewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ProgressBarModule } from "primeng/progressbar";
import { DocumentsService } from "../../services/documents.service";

/** Alinhado ao limite da API (StorageFileService). */
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT_EXT = new Set(["pdf", "doc", "docx"]);

export type UploadRowStatus = "aguardando" | "enviando" | "concluido" | "erro";

export interface UploadRow {
  id: string;
  file: File;
  progress: number;
  status: UploadRowStatus;
  errorMessage?: string;
}

@Component({
  selector: "app-upload",
  imports: [ButtonModule, CardModule, BadgeModule, ProgressBarModule],
  templateUrl: "./upload.component.html",
  styleUrl: "./upload.component.scss",
})
export class UploadComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly documentsApi = inject(DocumentsService);

  private uploadSub: Subscription | null = null;

  protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>("fileInput");

  protected readonly dragActive = signal(false);
  protected readonly alertMessage = signal<string | null>(null);
  protected readonly row = signal<UploadRow | null>(null);
  protected readonly lastUploadedId = signal<string | null>(null);

  protected pickFiles(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list?.length) {
      return;
    }
    this.ingestFileList(list);
    input.value = "";
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive.set(false);
    const files = event.dataTransfer?.files;
    if (!files?.length) {
      return;
    }
    this.ingestFileList(files);
  }

  protected clearQueue(): void {
    this.cancelUpload();
    this.row.set(null);
    this.alertMessage.set(null);
    this.lastUploadedId.set(null);
  }

  protected sendToAnalysis(): void {
    const current = this.row();
    if (!current || current.status !== "concluido") {
      this.alertMessage.set("Conclua o upload do arquivo antes de enviar para análise.");
      return;
    }
    const id = this.lastUploadedId();
    if (id) {
      void this.router.navigate(["/documentos", id]);
      return;
    }
    void this.router.navigate(["/documentos"]);
  }

  protected goDocumentos(): void {
    void this.router.navigate(["/documentos"]);
  }

  ngOnDestroy(): void {
    this.cancelUpload();
  }

  private cancelUpload(): void {
    if (this.uploadSub) {
      this.uploadSub.unsubscribe();
      this.uploadSub = null;
    }
  }

  private ingestFileList(list: FileList): void {
    this.alertMessage.set(null);

    if (list.length > 1) {
      this.alertMessage.set("Envie apenas um arquivo por vez. Selecione ou arraste um único arquivo.");
      return;
    }

    const file = list.item(0);
    if (!file) {
      return;
    }

    if (file.size > MAX_BYTES) {
      this.alertMessage.set("O arquivo excede o limite de 10 MB.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPT_EXT.has(ext)) {
      this.alertMessage.set("Formato não suportado pela API. Use PDF, DOC ou DOCX.");
      return;
    }

    this.cancelUpload();

    const next: UploadRow = {
      id: `${Date.now()}-${file.name}`,
      file,
      progress: 0,
      status: "aguardando",
    };

    this.row.set(next);
    this.lastUploadedId.set(null);
    this.startUpload(file);
  }

  private startUpload(file: File): void {
    this.row.update((r) =>
      r
        ? {
            ...r,
            status: "enviando",
            progress: 0,
            errorMessage: undefined,
          }
        : r,
    );

    this.uploadSub = this.documentsApi.upload(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const pct = Math.round((100 * event.loaded) / event.total);
          this.row.update((r) => (r ? { ...r, progress: pct } : r));
        }
        if (event.type === HttpEventType.Response && event.body) {
          this.lastUploadedId.set(event.body.id);
          this.row.update((r) => (r ? { ...r, progress: 100, status: "concluido" } : r));
        }
      },
      error: (err: unknown) => {
        this.row.update((r) =>
          r
            ? {
                ...r,
                status: "erro",
                errorMessage: DocumentsService.mapHttpError(err),
              }
            : r,
        );
      },
    });
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
