import { HttpClient, HttpEvent, HttpEventType } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../../environments/environment";
import type { DocStatus, DocTipo, DocumentItem } from "../pages/documentos/documentos.models";

export interface RDocumentResponseDto {
  id: string;
  originalFileName: string;
  savedFileName: string;
  sizeInMb: number;
  extension: string;
  path: string;
  status: string;
  summary: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function mapApiStatus(status: string): DocStatus {
  switch (status) {
    case "COMPLETED":
      return "pronto";
    case "FAILED":
      return "falhou";
    default:
      return "processando";
  }
}

function mapExtension(ext: string): DocTipo {
  const u = ext.toUpperCase();
  if (u === "PDF" || u === "DOCX" || u === "DOC" || u === "TXT") {
    return u as DocTipo;
  }
  return "PDF";
}

export function mapDocumentDtoToItem(dto: RDocumentResponseDto): DocumentItem {
  const tamanhoBytes = Math.round(dto.sizeInMb * 1024 * 1024);
  const modStr = dto.updatedAt ?? dto.createdAt;
  const modificado = modStr ? new Date(modStr) : new Date();

  let resumoExecutivo = dto.summary?.trim() || undefined;
  if (dto.status === "FAILED" && dto.errorMessage?.trim()) {
    const err = `Erro: ${dto.errorMessage.trim()}`;
    resumoExecutivo = resumoExecutivo ? `${resumoExecutivo}\n\n${err}` : err;
  }

  return {
    id: dto.id,
    nome: dto.originalFileName,
    tipo: mapExtension(dto.extension),
    tamanhoBytes,
    status: mapApiStatus(dto.status),
    modificado,
    enviadoPor: "—",
    resumoExecutivo,
    historico: undefined,
  };
}

@Injectable({ providedIn: "root" })
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/documents`;

  list(): Observable<DocumentItem[]> {
    return this.http.get<RDocumentResponseDto[]>(this.base).pipe(map((rows) => rows.map(mapDocumentDtoToItem)));
  }

  getById(id: string): Observable<DocumentItem> {
    return this.http.get<RDocumentResponseDto>(`${this.base}/${id}`).pipe(map(mapDocumentDtoToItem));
  }

  delete(id: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.base}/${id}`, {});
  }

  upload(file: File): Observable<HttpEvent<RDocumentResponseDto>> {
    const form = new FormData();
    form.append("file", file, file.name);
    return this.http.post<RDocumentResponseDto>(`${this.base}/upload`, form, {
      reportProgress: true,
      observe: "events",
    });
  }

  getContentBlob(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/content`, {
      responseType: "blob",
    });
  }

  static uploadProgress(event: HttpEvent<RDocumentResponseDto>): number | null {
    if (event.type === HttpEventType.UploadProgress && event.total) {
      return Math.round((100 * event.loaded) / event.total);
    }
    return null;
  }

  static uploadResponseBody(event: HttpEvent<RDocumentResponseDto>): RDocumentResponseDto | null {
    if (event.type === HttpEventType.Response && event.body) {
      return event.body;
    }
    return null;
  }

  static mapHttpError(err: unknown): string {
    if (err && typeof err === "object" && "error" in err) {
      const e = err as { error?: unknown };
      if (typeof e.error === "string") {
        return e.error;
      }
      if (e.error && typeof e.error === "object" && "message" in e.error) {
        const m = (e.error as { message?: string }).message;
        if (typeof m === "string") {
          return m;
        }
      }
    }
    return "Falha na comunicação com o servidor.";
  }
}
