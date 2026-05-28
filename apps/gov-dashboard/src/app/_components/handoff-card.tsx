import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@educai/ui";

export type HandoffRecord = {
  id: string;
  conversationId: string | null;
  createdAt: string;
  status: string;
  source: string | null;
  reason: string | null;
  studentId: string | null;
  studentProfileId: string | null;
  familyId: string | null;
  whatsappPhone: string | null;
  inboundMessage: string | null;
  outboundMessage: string | null;
  requestedAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
};

interface HandoffCardProps {
  handoff: HandoffRecord;
  onClose: (formData: FormData) => Promise<void>;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function HandoffCard({ handoff, onClose }: HandoffCardProps) {
  return (
    <Card className="gov-card">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">
              {handoff.source === "academic" ? "Consulta académica" : "Consulta institucional"}
            </CardTitle>
            <CardDescription>
              {formatDate(handoff.requestedAt ?? handoff.createdAt)} -{" "}
              {handoff.reason ?? "sin motivo informado"}
            </CardDescription>
          </div>
          <Badge variant="outline">{handoff.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <p>
            <span className="font-medium text-foreground">Alumno:</span>{" "}
            {handoff.studentId ?? "sin studentId"}
          </p>
          <p>
            <span className="font-medium text-foreground">Familia:</span>{" "}
            {handoff.familyId ?? "sin familyId"}
          </p>
          <p>
            <span className="font-medium text-foreground">Perfil:</span>{" "}
            {handoff.studentProfileId ?? "sin profileId"}
          </p>
          <p>
            <span className="font-medium text-foreground">WhatsApp:</span>{" "}
            {handoff.whatsappPhone ?? "sin telefono"}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mensaje entrante
            </p>
            <p className="text-sm text-foreground">
              {handoff.inboundMessage ?? "Sin mensaje entrante"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Respuesta del agente
            </p>
            <p className="text-sm text-foreground">
              {handoff.outboundMessage ?? "Sin respuesta registrada"}
            </p>
          </div>
        </div>

        <form action={onClose} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input type="hidden" name="handoffId" value={handoff.id} />
          <textarea
            name="resolutionNote"
            rows={3}
            aria-label="Nota opcional de resolucion o seguimiento"
            placeholder="Nota opcional de resolucion o seguimiento"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
          />
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background outline-none transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
          >
            Cerrar handoff
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
