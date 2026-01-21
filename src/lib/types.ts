// Tipos compartidos que pueden usarse en cliente y servidor
export type MessageDirection = "INBOUND" | "OUTBOUND" | "INTERNAL_NOTE";
export type MessageFrom = "CUSTOMER" | "BOT" | "HUMAN";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketCategory = "LABORAL" | "CIVIL" | "COMERCIAL" | "PENAL" | "FAMILIA" | "ADMINISTRATIVO" | "TRIBUTARIO" | "PREVISIONAL" | "OTRO";
export type TicketChannel = "WHATSAPP" | "EMAIL" | "WEB";
