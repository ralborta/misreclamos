import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ConversationMessage {
  from: string; // 'CUSTOMER' | 'BOT' | 'HUMAN'
  text: string;
  createdAt: Date;
}

const EVENT_PLACEHOLDER = /^_event_(document|image|video|audio)__/i;
const ARCHIVO_ADJUNTO = /^\[Archivo adjunto\]$/i;

/** Excluye mensajes que no son contenido resumible (placeholders, "[Archivo adjunto]", vacíos). */
function filterRealMessages(messages: ConversationMessage[]): ConversationMessage[] {
  return messages.filter((m) => {
    const t = (m.text || '').trim();
    if (!t) return false;
    if (EVENT_PLACEHOLDER.test(t)) return false;
    if (ARCHIVO_ADJUNTO.test(t)) return false;
    return true;
  });
}

function isSummaryValid(summary: string): boolean {
  const s = summary.trim();
  if (!s || s.length < 10) return false;
  if (EVENT_PLACEHOLDER.test(s)) return false;
  if (ARCHIVO_ADJUNTO.test(s)) return false;
  return true;
}

/**
 * Genera un resumen con visión jurídica: puntos importantes de la interacción, claro y conciso.
 */
export async function summarizeConversation(
  messages: ConversationMessage[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurada');
  }

  const filtered = filterRealMessages(messages);
  if (filtered.length === 0) {
    return 'Sin contenido para resumir (solo adjuntos o mensajes de sistema).';
  }

  const conversationText = filtered
    .map((msg) => `[${msg.from}]: ${msg.text}`)
    .join('\n');

  const prompt = `Sos un abogado que está leyendo una conversación entre un cliente y un bot de una plataforma de reclamos legales.

IMPORTANTE: Tu tarea es INTERPRETAR y SINTETIZAR, NO copiar ni citar lo que dijo el cliente.

Escribí 2 a 4 oraciones en prosa que expliquen:
1. Cuál es la situación legal del cliente (despido, accidente, trabajo en negro, deuda, etc.)
2. Los hechos y datos más relevantes (fechas, montos, partes involucradas, tipo de relación laboral, etc.)
3. Qué tipo de reclamo o acción legal correspondería, si se puede inferir.

Reglas estrictas:
- NO copies frases del cliente. INTERPRETÁ y reformulá con lenguaje profesional.
- NO menciones el bot, los términos ni los mensajes automáticos.
- Si faltan datos importantes, acláralos al final (ej: "Falta información sobre...").
- Si hay poco contenido útil, describí brevemente lo que se sabe y señalá qué falta.

Conversación:
${conversationText}

Resumen interpretado (prosa profesional, 2-4 oraciones, NO citar diálogo):`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Sos un abogado experto. Tu tarea es SINTETIZAR e INTERPRETAR conversaciones de reclamos legales en 2-4 oraciones profesionales. NUNCA copiás ni citás lo que dijo el cliente. Siempre reformulás con lenguaje jurídico claro. Destacás hechos, datos, tipo de reclamo y lo que falta saber.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 280,
    });

    const summary = response.choices[0]?.message?.content?.trim() || '';
    if (isSummaryValid(summary)) {
      console.log('[OpenAI] Resumen generado:', summary.slice(0, 80) + '...');
      return summary;
    }
    return fallbackSummary(filtered);
  } catch (error: any) {
    console.error('[OpenAI] Error al resumir:', error.message);
    return fallbackSummary(filtered);
  }
}

/** Fallback sin API: mensaje genérico, nunca citar el diálogo. */
function fallbackSummary(messages: ConversationMessage[]): string {
  const hasClientContent = messages.some((m) => {
    if (m.from !== 'CUSTOMER') return false;
    const t = (m.text || '').trim();
    return (
      t.length >= 10 &&
      !EVENT_PLACEHOLDER.test(t) &&
      !ARCHIVO_ADJUNTO.test(t) &&
      !/^(sí|si|no|acepto|aceptamos|ok|okey)$/i.test(t)
    );
  });

  if (!hasClientContent) {
    return 'El cliente inició contacto pero aún no aportó detalles del caso. Pendiente de seguimiento.';
  }
  return 'Resumen pendiente de generación. Hacé clic en "Regenerar" para obtener el análisis del caso.';
}

/**
 * Genera una conclusión de cómo se resolvió el caso
 */
export async function generateResolution(
  messages: ConversationMessage[],
  wasResolvedByAI: boolean
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return wasResolvedByAI
      ? 'Resuelto automáticamente por IA'
      : 'Escalado a soporte humano';
  }

  if (messages.length === 0) {
    return 'Sin resolución registrada';
  }

  const conversationText = messages
    .map((msg) => `[${msg.from}]: ${msg.text}`)
    .join('\n');

  const prompt = `Resume cómo se resolvió este caso de soporte en 1-2 líneas:

Conversación:
${conversationText}

${wasResolvedByAI ? 'El caso fue resuelto automáticamente por IA.' : 'El caso fue escalado a un agente humano.'}

Conclusión:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente que genera conclusiones claras de casos de soporte.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const resolution = response.choices[0]?.message?.content?.trim() || 'Sin resolución';
    console.log('[OpenAI] Resolución generada:', resolution);
    return resolution;
  } catch (error: any) {
    console.error('[OpenAI] Error al generar resolución:', error.message);
    return wasResolvedByAI
      ? 'Resuelto automáticamente por IA'
      : 'Escalado a soporte humano';
  }
}

/** Valores válidos de tipo de caso (debe coincidir con ticketTypeConfig en lib/tickets) */
export const LEGAL_TYPE_OPTIONS = [
  'Accidente de tránsito',
  'Trabajo',
  'Accidente de trabajo',
  'Sucesiones',
  'Amparo de salud',
  'Reclamos comerciales',
  'Sin caso',
] as const;

/**
 * Clasifica la conversación en uno de los tipos de caso legales.
 * Devuelve exactamente uno de LEGAL_TYPE_OPTIONS o null si no se puede determinar.
 */
export async function classifyLegalType(
  messages: ConversationMessage[]
): Promise<typeof LEGAL_TYPE_OPTIONS[number] | null> {
  if (!process.env.OPENAI_API_KEY || messages.length === 0) {
    return null;
  }

  const conversationText = messages
    .map((msg) => `[${msg.from}]: ${msg.text}`)
    .join('\n');

  const optionsList = LEGAL_TYPE_OPTIONS.join('\n- ');

  const prompt = `Eres un asistente jurídico. Clasifica esta conversación de un bufete legal en UNO SOLO de los siguientes tipos. Responde ÚNICAMENTE con la frase exacta de la lista, sin puntos ni explicación.
Usa "Sin caso" cuando sea consulta general, error, spam, número equivocado o no corresponda a un caso legal.

Tipos permitidos:
- ${optionsList}

Conversación:
${conversationText}

Tipo de caso (respuesta exacta de la lista):`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Clasificas conversaciones legales en una categoría. Respondes solo con la categoría exacta de la lista dada.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 50,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const normalized = raw.replace(/^[-.]\s*/, '').trim();
    const found = LEGAL_TYPE_OPTIONS.find((opt) => opt === normalized || normalized.includes(opt));
    if (found) {
      console.log('[OpenAI] Tipo de caso clasificado:', found);
      return found;
    }
    console.log('[OpenAI] Clasificación sin match:', raw);
    return null;
  } catch (error: any) {
    console.error('[OpenAI] Error al clasificar tipo:', error.message);
    return null;
  }
}

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

const PRIORITY_OPTIONS: TicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

/**
 * Infiere la prioridad del caso a partir de la conversación (urgencia, impacto, etc.).
 */
export async function inferPriorityFromConversation(
  messages: ConversationMessage[]
): Promise<TicketPriority | null> {
  if (!process.env.OPENAI_API_KEY || messages.length === 0) {
    return null;
  }

  const conversationText = messages
    .map((msg) => `[${msg.from}]: ${msg.text}`)
    .join('\n');

  const prompt = `Eres un asistente jurídico. Determina la prioridad de este caso según la urgencia y el contenido. Responde SOLO una de estas palabras: LOW, NORMAL, HIGH, URGENT.

Criterios:
- URGENT: amenazas, plazos legales inminentes, despidos sin pago, situaciones críticas.
- HIGH: despidos, accidentes, impagos, temas que requieren atención pronto.
- NORMAL: consultas estándar, trámites sin urgencia.
- LOW: consultas informativas, temas que pueden esperar.

Conversación:
${conversationText}

Prioridad (solo una palabra: LOW, NORMAL, HIGH o URGENT):`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Clasificas prioridad de casos legales. Respondes solo: LOW, NORMAL, HIGH o URGENT.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 20,
    });

    const raw = (response.choices[0]?.message?.content?.trim() || '').toUpperCase();
    const found = PRIORITY_OPTIONS.find((p) => raw === p || raw.startsWith(p));
    if (found) {
      console.log('[OpenAI] Prioridad inferida:', found);
      return found;
    }
    return null;
  } catch (error: any) {
    console.error('[OpenAI] Error al inferir prioridad:', error.message);
    return null;
  }
}
