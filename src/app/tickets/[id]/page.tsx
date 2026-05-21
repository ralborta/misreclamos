import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ticketAccessibleByUser } from "@/lib/ticket-scope";
import { markTicketRead } from "@/lib/ticket-read";

export const dynamic = "force-dynamic";
import { statusLabels, fromLabels } from "@/lib/tickets";
type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
import { MessageComposer } from "@/components/tickets/MessageComposer";
import { StatusActions } from "@/components/tickets/StatusActions";
import { ConversationSummary } from "@/components/tickets/ConversationSummary";
import { AssignAgentDropdown } from "@/components/tickets/AssignAgentDropdown";
import { MessageAttachments } from "@/components/tickets/MessageAttachments";
import { TicketLiveRefresh } from "@/components/tickets/TicketLiveRefresh";
import { LegalTypeDropdown } from "@/components/tickets/LegalTypeDropdown";
import { AcceptCaseButton } from "@/components/tickets/AcceptCaseButton";
import { CopyButton } from "@/components/tickets/CopyButton";
import { TicketQuickActions } from "@/components/tickets/TicketQuickActions";

export default async function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const canSee = await ticketAccessibleByUser(session.user!, id);
  if (!canSee) {
    notFound();
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedTo: true,
      messages: { 
        orderBy: { createdAt: "asc" },
        take: 1000, // Asegurar que se carguen todos los mensajes
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  await markTicketRead(session.user!, ticket.id);

  // Obtener lista de agentes para el dropdown
  const agentes = await prisma.agentUser.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const conversation = ticket.messages || [];

  // Debug: verificar que los mensajes se carguen
  console.log(`[TicketDetail] Ticket ${ticket.code}: ${conversation.length} mensajes cargados`);

  const contactName = ticket.contactName || ticket.customer?.name || "Sin nombre";
  const phone = ticket.customer?.phone ? formatPhone(ticket.customer.phone) : "—";
  const isAdminUser = session.user!.role === "ADMIN";

  return (
    <div className="min-h-screen p-3 sm:p-6 bg-slate-50/50">
      <TicketLiveRefresh />
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Volver a tickets
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Ticket</span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">#{ticket.code}</h1>
              <CopyButton value={ticket.code} title="Copiar ID del ticket" />
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusPillClass(ticket.status as TicketStatus)}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(ticket.status as TicketStatus)}`} />
                {statusLabels[ticket.status as TicketStatus]}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-800">{contactName}</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                <CaseTypeIcon legalType={ticket.legalType} />
                {ticket.legalType || "Sin caso"}
              </span>
              {ticket.customer?.phone ? (
                <a
                  href={`https://wa.me/${ticket.customer.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366]/10 px-2 py-0.5 text-xs font-medium text-[#128C7E] hover:bg-[#25D366]/20 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                  {phone}
                </a>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <AcceptCaseButton ticketId={ticket.id} currentStatus={ticket.status as TicketStatus} />
            <StatusActions ticketId={ticket.id} currentStatus={ticket.status as TicketStatus} variant="header" />
            <AssignAgentDropdown
              ticketId={ticket.id}
              currentAgentId={ticket.assignedToUserId}
              agentes={agentes}
              variant="header"
              canReassign={isAdminUser}
            />
            <a
              href="#conversacion"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2196F3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1976D2] transition-colors"
            >
              Responder
            </a>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div id="conversacion" className="lg:col-span-2 flex flex-col min-h-0">
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 flex flex-col flex-1 min-h-0 max-h-[70vh]">
              <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                <div className="text-sm font-semibold text-slate-800">Conversación</div>
                <div className="text-xs text-slate-400">
                  {conversation.length} {conversation.length === 1 ? "mensaje" : "mensajes"}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 space-y-4">
                {conversation.length === 0 ? (
                  <div className="text-sm text-slate-500 py-6">Sin mensajes aún.</div>
                ) : (
                  (() => {
                    const nodes: React.ReactNode[] = [];
                    let lastDayKey = "";
                    conversation.forEach((msg: any) => {
                      const createdAt = msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt);
                      const dayKey = createdAt.toDateString();
                      if (dayKey !== lastDayKey) {
                        lastDayKey = dayKey;
                        nodes.push(
                          <div key={`day-${dayKey}`} className="flex items-center justify-center py-1">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                              {formatDayLabel(createdAt)}
                            </span>
                          </div>
                        );
                      }
                      const fromLabel =
                        msg.from === "BOT"
                          ? "MisReclamos"
                          : msg.from === "HUMAN"
                            ? "Abogado"
                            : msg.from === "CUSTOMER"
                              ? "Cliente"
                              : fromLabels[msg.from as "CUSTOMER" | "BOT" | "HUMAN"] || msg.from;
                      const isBot = msg.from === "BOT";
                      const isAgent = msg.from === "HUMAN";
                      const isInternalNote = msg.direction === "INTERNAL_NOTE";
                      const bubbleBg = isInternalNote
                        ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                        : isBot
                          ? "bg-emerald-100 text-emerald-900"
                          : isAgent
                            ? "bg-blue-100 text-blue-900"
                            : "bg-slate-100 text-slate-800";
                      const avatarBg = isBot ? "" : isAgent ? "bg-blue-200 text-blue-800" : "bg-slate-300 text-slate-700";
                      const timeStr = createdAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                      const fullDate = createdAt.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
                      const atts = msg.attachments as { url: string; type: string; name: string }[] | null | undefined;
                      const hideTextForVoice =
                        Array.isArray(atts) &&
                        atts.length === 1 &&
                        atts[0]?.type === "audio" &&
                        (msg.text === "[Mensaje de voz]" || msg.text === "[Archivo adjunto]");
                      nodes.push(
                        <div key={msg.id} className="flex gap-3">
                          <div
                            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden ${
                              isBot ? "bg-slate-100 ring-1 ring-slate-200/90" : avatarBg
                            }`}
                          >
                            {isBot ? (
                              // eslint-disable-next-line @next/next/no-img-element -- avatar estático en /public
                              <img
                                src="/bot-avatar.png"
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : isAgent ? (
                              <span className="inline-flex items-center justify-center text-blue-800" title="Abogado">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 10.5V15c0 1.8 3.1 3.5 7 3.5s7-1.7 7-3.5v-4.5" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 9v7" />
                                </svg>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center text-slate-700" title="Cliente">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
                                  <circle cx="9" cy="7" r="4" strokeWidth={2} />
                                </svg>
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-800">{fromLabel}</span>
                              {isInternalNote && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                  Nota interna
                                </span>
                              )}
                              <span className="text-xs text-slate-400" title={fullDate}>
                                {timeStr}
                              </span>
                            </div>
                            <div
                              className={`mt-1 max-w-2xl rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${bubbleBg}`}
                              title={fullDate}
                            >
                              {hideTextForVoice ? (
                                <MessageAttachments attachments={atts!} layout="bubble" />
                              ) : (
                                <>{msg.text || "[Sin texto]"}</>
                              )}
                            </div>
                            {msg.attachments && !hideTextForVoice && (
                              <div className="mt-1">
                                <MessageAttachments attachments={msg.attachments as any} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                    return nodes;
                  })()
                )}
              </div>
              <div className="shrink-0 border-t border-slate-100 p-4">
                <MessageComposer
                  ticketId={ticket.id}
                  customerId={ticket.customer?.id}
                  botPaused={!!ticket.customer?.botPausedAt}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-800">Datos del cliente</div>
                {ticket.customer?.phone ? (
                  <CopyButton value={ticket.customer.phone} title="Copiar teléfono" />
                ) : null}
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Nombre</span>
                  <span className="font-medium text-slate-700 text-right truncate">{ticket.customer?.name || "No especificado"}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Teléfono</span>
                  {ticket.customer?.phone ? (
                    <a
                      href={`https://wa.me/${ticket.customer.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 px-2.5 py-1 text-sm font-medium text-[#128C7E] hover:bg-[#25D366]/20 transition-colors"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                      </svg>
                      {phone}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Creado</span>
                  <span className="font-medium text-slate-700">
                    {new Date(ticket.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Última actividad</span>
                  <span className="font-medium text-slate-700">
                    {new Date(ticket.lastMessageAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <LegalTypeDropdown ticketId={ticket.id} currentLegalType={ticket.legalType} />
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <AssignAgentDropdown
                ticketId={ticket.id}
                currentAgentId={ticket.assignedToUserId}
                agentes={agentes}
                canReassign={isAdminUser}
              />
            </div>
            <ConversationSummary ticketId={ticket.id} initialSummary={ticket.aiSummary} />
            <TicketQuickActions ticketId={ticket.id} ticketCode={ticket.code} />
          </div>
        </div>
      </div>
    </div>
  );
}

function statusPillClass(status: TicketStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case "WAITING_CUSTOMER":
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

function statusDotClass(status: TicketStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-500";
    case "IN_PROGRESS":
      return "bg-amber-500";
    case "WAITING_CUSTOMER":
      return "bg-emerald-500";
    case "RESOLVED":
      return "bg-emerald-400";
    case "CLOSED":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
  }
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (isSameDay(date, today)) return "Hoy";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Ayer";
  return date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
}

function formatPhone(phone: string): string {
  const n = phone.replace(/\D/g, "");
  if (n.length >= 10) return `+${n.slice(0, 2)} ${n.slice(2, 4)} ${n.slice(4, 7)}-${n.slice(7)}`;
  return phone;
}

function CaseTypeIcon({ legalType }: { legalType: string | null }) {
  if (!legalType) return null;
  const t = legalType.toLowerCase();
  if (t.includes("tránsito") || t.includes("transito")) {
    return (
      <span className="inline-flex text-orange-500" title={legalType}>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex text-slate-500">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    </span>
  );
}
