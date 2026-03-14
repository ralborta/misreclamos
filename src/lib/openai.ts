import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ConversationMessage {
  from: string; // 'CUSTOMER' | 'BOT' | 'HUMAN'
  text: string;
  createdAt: Date;
}

/**
 * Genera un resumen breve del CASO (reclamo), no un transcript.
 * Solo: tipo de caso, qué pasó, datos relevantes. Sin diálogo bot/cliente ni preguntas de términos.
 */
export async function summarizeConversation(
  messages: ConversationMessage[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurada');
  }

  if (messages.length === 0) {
    return 'Sin mensajes';
  }

  const conversationText = messages
    .map((msg) => `[${msg.from}]: ${msg.text}`)
    .join('\n');

  const prompt = `Esta es una conversación de un estudio jurídico / reclamos (MisReclamos). El cliente escribe, el bot hace preguntas (términos, datos, etc.).

Escribí un RESUMEN del CASO en 1 a 3 oraciones cortas. Incluí SOLO:
- De qué se trata el reclamo o consulta (ej: agresión del jefe, despido, accidente).
- Quién está involucrado si se menciona (ej: empleador, compañía de seguro).
- Algún dato clave si es relevante (fecha, lugar, monto).

NO incluyas en el resumen:
- Preguntas del bot (términos, privacidad, "¿Aceptás?", etc.).
- Respuestas cortas del cliente como "Sí", "No", "Acepto".
- Mensajes automáticos tipo "Hemos recibido tu mensaje" o códigos de reclamo.
- Diálogo literal; solo la esencia del caso.

Conversación:
${conversationText}

Resumen del caso (solo texto, 1-3 oraciones):`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Generas resúmenes de casos legales/reclamos. Escribes solo la esencia del reclamo en 1-3 oraciones. No incluyes diálogo, preguntas del bot ni respuestas Sí/No.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content?.trim() || '';
    if (summary && summary.length > 5) {
      console.log('[OpenAI] Resumen generado:', summary.slice(0, 80) + '...');
      return summary;
    }
    return fallbackSummary(messages);
  } catch (error: any) {
    console.error('[OpenAI] Error al resumir:', error.message);
    return fallbackSummary(messages);
  }
}

/** Fallback sin API: extrae el primer mensaje sustancial del cliente, sin unir todo con " | ". */
function fallbackSummary(messages: ConversationMessage[]): string {
  const fromClient = messages.filter((m) => m.from === 'CUSTOMER');
  for (const m of fromClient) {
    const t = (m.text || '').trim();
    if (t.length < 5) continue;
    if (/^(sí|si|no|acepto|aceptamos)$/i.test(t)) continue;
    if (/reclamo|recibido|términos|privacidad/i.test(t) && t.length < 80) continue;
    return t.length > 200 ? t.slice(0, 197) + '...' : t;
  }
  return 'Sin resumen disponible.';
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
