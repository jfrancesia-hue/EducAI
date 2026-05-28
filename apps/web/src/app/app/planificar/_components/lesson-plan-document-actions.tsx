"use client";

import { Download, FileText, Lock, Printer } from "lucide-react";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function LessonPlanDocumentActions({
  documentId,
  enabled,
  title,
}: {
  documentId: string;
  enabled: boolean;
  title: string;
}) {
  const fileName = slugify(title || "guia-educai") || "guia-educai";

  function downloadWord() {
    const documentNode = document.getElementById(documentId);
    if (!documentNode) {
      return;
    }

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1f2a24; line-height: 1.5; }
    h1, h2, h3 { color: #075f53; }
    section, article, div { break-inside: avoid; }
    .educai-no-export { display: none !important; }
  </style>
</head>
<body>${documentNode.innerHTML}</body>
</html>`;
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName}.doc`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (!enabled) {
    return (
      <div className="educai-no-print rounded-lg border border-[#d5e1dc] bg-white p-4 shadow-whisper">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff8d7] text-[#876100]">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Exportar PDF y Word</p>
            <p className="mt-1 text-sm text-[#5b6962]">Disponible en planes pagos de EducAI.</p>
          </div>
          <a
            href="/precios"
            className="inline-flex min-h-10 items-center rounded-lg bg-[#075f53] px-4 text-sm font-bold text-white transition hover:bg-[#087968]"
          >
            Ver planes
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #${documentId}, #${documentId} * {
            visibility: visible !important;
          }

          #${documentId} {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .educai-no-print,
          .educai-no-export {
            display: none !important;
          }
        }
      `}</style>

      <div className="educai-no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d5e1dc] bg-white p-3 shadow-whisper">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7fbf7] text-[#087968]">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold">Guía lista para entregar</p>
            <p className="text-sm text-[#5b6962]">Exportación incluida en tu plan.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cbdad4] bg-white px-4 text-sm font-bold text-[#33423c] transition hover:border-[#18b6a4]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            PDF
          </button>
          <button
            type="button"
            onClick={downloadWord}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#075f53] px-4 text-sm font-bold text-white transition hover:bg-[#087968]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Word
          </button>
        </div>
      </div>
    </>
  );
}
