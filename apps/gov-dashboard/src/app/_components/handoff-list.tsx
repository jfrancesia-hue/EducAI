import { Inbox } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@educai/ui";
import { EmptyState } from "./empty-state";
import { HandoffCard, type HandoffRecord } from "./handoff-card";
import { RevealOnScroll } from "./reveal-on-scroll";

interface HandoffListProps {
  handoffs: HandoffRecord[];
  onClose: (formData: FormData) => Promise<void>;
  loadError: string | null;
}

export type { HandoffRecord };

export function HandoffList({ handoffs, onClose, loadError }: HandoffListProps) {
  return (
    <section className="grid gap-4">
      {loadError ? (
        <Card>
          <CardHeader>
            <CardTitle>No se pudo cargar la cola</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {handoffs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sin handoffs pendientes"
          description="La cola esta vacia. Cuando el agente derive un caso, va a aparecer aca."
        />
      ) : (
        handoffs.map((handoff, index) => (
          <RevealOnScroll key={handoff.id} delay={index * 60}>
            <HandoffCard handoff={handoff} onClose={onClose} />
          </RevealOnScroll>
        ))
      )}
    </section>
  );
}
