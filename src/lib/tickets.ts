type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
type TicketCategory = "LABORAL" | "CIVIL" | "COMERCIAL" | "PENAL" | "FAMILIA" | "ADMINISTRATIVO" | "TRIBUTARIO" | "PREVISIONAL" | "OTRO";
type TicketChannel = "WHATSAPP" | "EMAIL" | "WEB";
type MessageDirection = "INBOUND" | "OUTBOUND" | "INTERNAL_NOTE";
type MessageFrom = "CUSTOMER" | "BOT" | "HUMAN";

export function generateTicketCode(date = new Date()) {
  const year = date.getFullYear();
  const stamp = `${date.getMonth() + 1}`.padStart(2, "0") + `${date.getDate()}`.padStart(2, "0");
  const suffix = Math.random().toString().slice(2, 8);
  return `RCL-${year}-${stamp}-${suffix}`;
}

export const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En Progreso",
  WAITING_CUSTOMER: "Esperando Cliente",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const categoryLabels: Record<TicketCategory, string> = {
  LABORAL: "Laboral",
  CIVIL: "Civil",
  COMERCIAL: "Comercial",
  PENAL: "Penal",
  FAMILIA: "Familia",
  ADMINISTRATIVO: "Administrativo",
  TRIBUTARIO: "Tributario",
  PREVISIONAL: "Previsional",
  OTRO: "Otro",
};

export const channelLabels: Record<TicketChannel, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  WEB: "Web",
};

export const directionLabels: Record<MessageDirection, string> = {
  INBOUND: "Cliente",
  OUTBOUND: "Bot/Agente",
  INTERNAL_NOTE: "Nota Interna",
};

export const fromLabels: Record<MessageFrom, string> = {
  CUSTOMER: "Cliente",
  BOT: "Bot",
  HUMAN: "Agente",
};

/** Tipos de caso para filtrar en el sidebar (campo legalType del ticket) */
export const ticketTypeConfig = [
  { slug: "accidente-transito", label: "Accidente de tránsito", legalType: "Accidente de tránsito" },
  { slug: "trabajo", label: "Trabajo", legalType: "Trabajo" },
  { slug: "accidente-de-trabajo", label: "Accidente de trabajo", legalType: "Accidente de trabajo" },
  { slug: "sucesiones", label: "Sucesiones", legalType: "Sucesiones" },
  { slug: "amparo-de-salud", label: "Amparo de salud", legalType: "Amparo de salud" },
  { slug: "reclamos-comerciales", label: "Reclamos comerciales", legalType: "Reclamos comerciales" },
] as const;
