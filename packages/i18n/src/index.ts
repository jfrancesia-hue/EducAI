import esAR from "../messages/es-AR.json";
import es419 from "../messages/es-419.json";
import ptBR from "../messages/pt-BR.json";
import enUS from "../messages/en-US.json";
import qu from "../messages/qu.json";
import gn from "../messages/gn.json";

export const defaultLocale = "es-AR";

export const messages = {
  "es-AR": esAR,
  "es-419": es419,
  "pt-BR": ptBR,
  "en-US": enUS,
  qu,
  gn,
} as const;

export type SupportedLocale = keyof typeof messages;

