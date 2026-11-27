import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  buildRoboflowUrl,
  detectImageWithRoboflow,
  handleDetectRequest,
  HttpError,
  parseDetectPayload,
  stripDataUrlPrefix,
} from './detect.ts';

function createMockResponse() {
  const headers: Record<string, string> = {};
  let body = '';
  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = String(value);
    },
    end(chunk?: string) {
      if (chunk) body += chunk;
    },
  } as unknown as ServerResponse;

  return {
    res,
    headers,
    readJson: () => JSON.parse(body || '{}'),
  };
}

test('stripDataUrlPrefix removes MIME data URL header and whitespace', () => {
  const cleaned = stripDataUrlPrefix('data:image/jpeg;base64, /9j/4AAQ \n SkZJRg==');
  assert.equal(cleaned, '/9j/4AAQSkZJRg==');
});

test('buildRoboflowUrl keeps API key out of query string and clamps confidence', () => {
  const built = buildRoboflowUrl('https://serverless.roboflow.com/gerakan-bisindo/4?api_key=leak', 0.01);
  assert.equal(built, 'https://serverless.roboflow.com/gerakan-bisindo/4?confidence=0.10');
  assert.ok(!built.includes('api_key'));
});

test('parseDetectPayload accepts JSON and raw base64 and rejects invalid inputs', () => {
  const fromJson = parseDetectPayload(JSON.stringify({ image: 'data:image/png;base64,AAAA', confidence: 0.4 }));
  assert.deepEqual(fromJson, { imageBase64: 'AAAA', confidence: 0.4 });

  const fromRaw = parseDetectPayload('BBBB');
  assert.deepEqual(fromRaw, { imageBase64: 'BBBB', confidence: undefined });

  assert.throws(() => parseDetectPayload('   '), (err) => err instanceof HttpError && err.status === 400);
  assert.throws(() => parseDetectPayload('not valid base64!'), (err) => err instanceof HttpError && err.status === 400);
});

test('detectImageWithRoboflow sends Authorization Bearer header and urlencoded base64 body', async () => {
  let capturedUrl = '';
  let capturedInit: RequestInit | undefined;

  const mockFetch: typeof fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(
      JSON.stringify({
        predictions: [{ x: 100, y: 120, width: 80, height: 90, confidence: 0.88, class: 'Makan' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const result = await detectImageWithRoboflow({
    imageBase64: 'AAAA',
    apiKey: 'secret-test-key',
    confidence: 0.3,
    fetchFn: mockFetch,
  });

  assert.equal(result.status, 200);
  assert.equal(capturedUrl, 'https://serverless.roboflow.com/gerakan-bisindo/4?confidence=0.30');
  assert.ok(!capturedUrl.includes('secret-test-key'));
  assert.equal(capturedInit?.method, 'POST');
  assert.deepEqual(capturedInit?.headers, {
    Authorization: 'Bearer secret-test-key',
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  assert.equal(capturedInit?.body, 'AAAA');
});

test('handleDetectRequest rejects non-POST, missing key (without leaking), and bad payloads', async () => {
  const originalKey = process.env.ROBOFLOW_API_KEY;
  delete process.env.ROBOFLOW_API_KEY;

  try {
    const getMock = createMockResponse();
    await handleDetectRequest({ method: 'GET' } as IncomingMessage, getMock.res);
    assert.equal(getMock.res.statusCode, 405);

    const noKeyReq = Object.assign(Readable.from([JSON.stringify({ image: 'AAAA' })]), {
      method: 'POST',
    }) as IncomingMessage;
    const noKeyRes = createMockResponse();
    await handleDetectRequest(noKeyReq, noKeyRes.res, { ROBOFLOW_API_KEY: '' });
    assert.equal(noKeyRes.res.statusCode, 503);

    const badReq = Object.assign(Readable.from(['{"bad"']), {
      method: 'POST',
    }) as IncomingMessage;
    const badRes = createMockResponse();
    await handleDetectRequest(badReq, badRes.res, { ROBOFLOW_API_KEY: 'abc' });
    assert.equal(badRes.res.statusCode, 400);
  } finally {
    if (originalKey !== undefined) process.env.ROBOFLOW_API_KEY = originalKey;
  }
});
