import { Pipe, PipeTransform, inject } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import DOMPurify from "dompurify";
import { marked } from "marked";

let markedOptionsApplied = false;

@Pipe({
  name: "markdown",
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!markedOptionsApplied) {
      marked.setOptions({ gfm: true, breaks: true, async: false });
      markedOptionsApplied = true;
    }

    const md = value?.trim();
    if (!md) {
      return this.sanitizer.bypassSecurityTrustHtml(
        '<p class="det-resumo-empty">Sem resumo disponível.</p>',
      );
    }

    let html: string;
    try {
      const out = marked.parse(md);
      html = typeof out === "string" ? out : "";
    } catch {
      html = `<p>${DOMPurify.sanitize(md)}</p>`;
    }

    const clean = DOMPurify.sanitize(html);
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
