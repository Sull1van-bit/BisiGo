import type { IncomingMessage, ServerResponse } from 'node:http';

const DEFAULT_ROBOFLOW_URL = 'https://serverless.roboflow.com/gerakan-bisindo/4';
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;

export interface EnvLike {
  ROBOFLOW_API_KEY?: string;
  ROBOFLOW_API_URL?: string;
}

export interface DetectInput {
  imageBase64: string;
  confidence?: number;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function stripDataUrlPrefix(raw: string): string {
  return raw.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/i, '').replace(/\s+/g, '');
}

export function buildRoboflowUrl(baseUrl?: string, confidence?: number): string {
  const url = new URL((baseUrl || DEFAULT_ROBOFLOW_URL).trim());
  // Keep API auth strictly in the Authorization header, never in query params
  url.searchParams.delete('api_key');
  if (typeof confidence === 'number' && Number.isFinite(confidence)) {
    const clamped = Math.min(0.95, Math.max(0.1, confidence));
    url.searchParams.set('confidence', clamped.toFixed(2));
  }
  return url.toString();
}

export function parseDetectPayload(rawText: string): DetectInput {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new HttpError(400, 'Image payload is required.');
  }

  let imageRaw = trimmed;
  let confidence: number | undefined;

  if (trimmed.startsWith('{')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new HttpError(400, 'Malformed JSON request body.');
    }
    if (!parsed || typeof parsed !== 'object' || typeof (parsed as { image?: unknown }).image !== 'string') {
      throw new HttpError(400, 'JSON body must include a string "image" field.');
    }
    const record = parsed as { image: string; confidence?: unknown };
    imageRaw = record.image;
    if (typeof record.confidence === 'number') {
      confidence = record.confidence;
    }
  }

  const imageBase64 = stripDataUrlPrefix(imageRaw);
  if (!imageBase64 || !/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
    throw new HttpError(400, 'Invalid base64 image payload.');
  }

  return { imageBase64, confidence };
}

async function readBodyFromRequest(req: IncomingMessage & { body?: unknown }): Promise<DetectInput> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
        throw new HttpError(413, 'Image payload exceeds 6 MB limit.');
      }
      return parseDetectPayload(req.body);
    }
    if (Buffer.isBuffer(req.body)) {
      if (req.body.length > MAX_BODY_BYTES) {
        throw new HttpError(413, 'Image payload exceeds 6 MB limit.');
      }
      return parseDetectPayload(req.body.toString('utf8'));
    }
    if (typeof req.body === 'object' && req.body !== null) {
      const serialized = JSON.stringify(req.body);
      if (Buffer.byteLength(serialized, 'utf8') > MAX_BODY_BYTES) {
        throw new HttpError(413, 'Image payload exceeds 6 MB limit.');
      }
      return parseDetectPayload(serialized);
    }
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : (chunk as Buffer);
    totalBytes += buf.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new HttpError(413, 'Image payload exceeds 6 MB limit.');
    }
    chunks.push(buf);
  }

  return parseDetectPayload(Buffer.concat(chunks).toString('utf8'));
}

export async function detectImageWithRoboflow(params: {
  imageBase64: string;
  apiKey: string;
  apiUrl?: string;
  confidence?: number;
  fetchFn?: typeof fetch;
}): Promise<{ status: number; data: unknown }> {
  const apiKey = params.apiKey.trim();
  if (!apiKey) {
    throw new HttpError(503, 'Vision inference service is not configured.');
  }

  const targetUrl = buildRoboflowUrl(params.apiUrl, params.confidence);
  const fetchFn = params.fetchFn ?? fetch;

  let response: Response;
  try {
    response = await fetchFn(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.imageBase64,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new HttpError(504, 'Vision inference request timed out.');
    }
    throw new HttpError(502, 'Failed to reach vision inference service.');
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text.slice(0, 200) };
  }

  if (!response.ok) {
    const msg =
      typeof (data as { message?: unknown })?.message === 'string'
        ? (data as { message: string }).message
        : `Upstream inference failed with status ${response.status}.`;
    return { status: response.status >= 400 && response.status < 600 ? response.status : 502, data: { error: msg } };
  }

  return { status: 200, data };
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export async function handleDetectRequest(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  envOverrides?: EnvLike
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { imageBase64, confidence } = await readBodyFromRequest(req);
    const apiKey = (process.env.ROBOFLOW_API_KEY || envOverrides?.ROBOFLOW_API_KEY || '').trim();
    const apiUrl = (process.env.ROBOFLOW_API_URL || envOverrides?.ROBOFLOW_API_URL || DEFAULT_ROBOFLOW_URL).trim();

    const result = await detectImageWithRoboflow({
      imageBase64,
      apiKey,
      apiUrl,
      confidence,
    });
    sendJson(res, result.status, result.data);
  } catch (err) {
    if (err instanceof HttpError) {
      sendJson(res, err.status, { error: err.message });
      return;
    }
    sendJson(res, 500, { error: 'Unexpected inference proxy error.' });
  }
}

export function createRoboflowMiddleware(envOverrides?: EnvLike) {
  return (
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
    next: (err?: unknown) => void
  ) => {
    void handleDetectRequest(req, res, envOverrides).catch(next);
  };
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse): Promise<void> {
  await handleDetectRequest(req, res);
}
