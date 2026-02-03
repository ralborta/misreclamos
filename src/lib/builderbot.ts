import axios from 'axios';

const BUILDERBOT_BASE_URL =
  process.env.BUILDERBOT_BASE_URL || 'https://app.builderbot.cloud';

export interface SendWhatsAppOptions {
  number: string; // número en formato internacional (ej: 5491112345678)
  message: string; // contenido del mensaje
  mediaUrl?: string; // opcional
  checkIfExists?: boolean; // default false
}

/**
 * Envía un mensaje de WhatsApp vía BuilderBot Cloud (API v2).
 */
export async function sendWhatsAppMessage(options: SendWhatsAppOptions) {
  const { number, message, mediaUrl, checkIfExists = false } = options;

  const BOT_ID = process.env.BUILDERBOT_BOT_ID || '';
  const API_KEY = process.env.BUILDERBOT_API_KEY || '';

  if (!BOT_ID || !API_KEY) {
    throw new Error(
      'BuilderBot no configurado: define BUILDERBOT_BOT_ID y BUILDERBOT_API_KEY'
    );
  }

  const url = `${BUILDERBOT_BASE_URL}/api/v2/${BOT_ID}/messages`;

  const body: Record<string, any> = {
    messages: {
      content: message,
    },
    number,
    checkIfExists,
  };

  if (mediaUrl) {
    body.messages.mediaUrl = mediaUrl;
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-builderbot': API_KEY,
  };

  console.log('[BuilderBot] Enviando mensaje:', {
    url,
    number,
    messageLength: message.length,
    hasMediaUrl: !!mediaUrl,
  });

  try {
    const response = await axios.post(url, body, { headers, timeout: 30000 });
    console.log('[BuilderBot] ✅ Mensaje enviado exitosamente');
    return response.data;
  } catch (error: any) {
    console.error('[BuilderBot] ❌ Error al enviar mensaje:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(
      `Error al enviar mensaje a BuilderBot: ${error.message}`
    );
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BLACKLIST_RETRIES = 3;
const BLACKLIST_DELAY_MS = 1500;
const BLACKLIST_SETTLE_MS = 800;

/**
 * Pausa o reactiva el bot para un número vía BuilderBot Cloud API v2.
 * POST /api/v2/{botId}/blacklist con { number, intent: "add" | "remove" }.
 * Reintenta hasta BLACKLIST_RETRIES veces y espera BLACKLIST_SETTLE_MS tras éxito.
 */
export async function setBuilderBotCloudBlacklist(
  number: string,
  intent: 'add' | 'remove'
): Promise<void> {
  const BOT_ID = process.env.BUILDERBOT_BOT_ID || '';
  const API_KEY = process.env.BUILDERBOT_API_KEY || '';
  if (!BOT_ID || !API_KEY) return;

  const normalizedNumber = String(number).replace(/\D/g, '');
  if (normalizedNumber.length < 9) return;

  const url = `${BUILDERBOT_BASE_URL.replace(/\/$/, '')}/api/v2/${BOT_ID}/blacklist`;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-builderbot': API_KEY,
  };
  const body = { number: normalizedNumber, intent };

  let lastError: any = null;
  for (let attempt = 1; attempt <= BLACKLIST_RETRIES; attempt++) {
    try {
      const response = await axios.post(url, body, { headers, timeout: 15000 });
      console.log('[BuilderBot] Cloud blacklist OK', intent, normalizedNumber, response.data);
      await sleep(BLACKLIST_SETTLE_MS);
      return;
    } catch (error: any) {
      lastError = error;
      const status = error.response?.status;
      const data = error.response?.data;
      console.error(`[BuilderBot] Cloud blacklist attempt ${attempt}/${BLACKLIST_RETRIES}`, intent, normalizedNumber, { status, data, message: error?.message });
      if (attempt < BLACKLIST_RETRIES) {
        await sleep(BLACKLIST_DELAY_MS);
      }
    }
  }
  console.error('[BuilderBot] Cloud blacklist falló tras reintentos', intent, normalizedNumber, lastError?.response?.data ?? lastError?.message);
}

/** URL del bot self-hosted que expone /v1/blacklist (opcional) */
const BUILDERBOT_BOT_URL = process.env.BUILDERBOT_BOT_URL || '';
const BUILDERBOT_DASHBOARD_TOKEN = process.env.BUILDERBOT_DASHBOARD_TOKEN || '';

/**
 * Pausa o reactiva el bot para un número en la blacklist del bot self-hosted.
 * Solo hace la llamada si BUILDERBOT_BOT_URL está definida.
 * No lanza: si falla, solo se registra en consola.
 */
export async function setBotBlacklist(
  number: string,
  intent: 'add' | 'remove'
): Promise<void> {
  if (!BUILDERBOT_BOT_URL) return;

  const normalizedNumber = String(number).replace(/\D/g, '');
  if (normalizedNumber.length < 9) return;

  const url = `${BUILDERBOT_BOT_URL.replace(/\/$/, '')}/v1/blacklist`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (BUILDERBOT_DASHBOARD_TOKEN) {
    headers['Authorization'] = `Bearer ${BUILDERBOT_DASHBOARD_TOKEN}`;
  }

  try {
    const response = await axios.post(
      url,
      { number: normalizedNumber, intent },
      { headers, timeout: 10000 }
    );
    console.log('[BuilderBot] Blacklist self-hosted', intent, normalizedNumber, response.data);
  } catch (error: any) {
    console.error('[BuilderBot] Error blacklist self-hosted', intent, error?.message);
  }
}
