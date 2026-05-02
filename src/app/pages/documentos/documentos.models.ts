export type DocStatus = "pronto" | "processando" | "falhou";

export type DocTipo = "PDF" | "DOCX" | "DOC" | "TXT";

export interface DocumentItem {
  id: string;
  nome: string;
  tipo: DocTipo;
  tamanhoBytes: number;
  status: DocStatus;
  modificado: Date;
  enviadoPor: string;
  pdfUrl?: string;
  resumoExecutivo?: string;
  transcricao?: string;
  historico?: string;
}
