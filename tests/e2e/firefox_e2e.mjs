#!/usr/bin/env node
/**
 * Opaque-box, requirement-driven headless Firefox E2E verification suite for BisiGo.
 *
 * Enforces pure-CPU WASM execution (`webgl.disabled = true`), tracks all `pageerror`
 * and `console.error` / WebGL errors, and verifies R1–R4 + Acceptance Criteria.
 *
 * Usage:
 *   node tests/e2e/firefox_e2e.mjs              # Full E2E suite (auto-starts vite preview/dev)
 *   node tests/e2e/firefox_e2e.mjs --smoke      # Harness + WebGL-disabled + baseline route smoke
 *   node tests/e2e/firefox_e2e.mjs --dev        # Use Vite dev server instead of vite preview
 *   node tests/e2e/firefox_e2e.mjs --url http://127.0.0.1:3000  # Attach to existing server
 *   node tests/e2e/firefox_e2e.mjs --headed     # Launch visible Firefox window
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const REF_DIR = path.join(ROOT_DIR, 'public', 'roboflow-reference');

const ARGS = process.argv.slice(2);
const hasFlag = flag => ARGS.includes(flag);
const getArgValue = flag => {
  const idx = ARGS.indexOf(flag);
  return idx !== -1 && ARGS[idx + 1] ? ARGS[idx + 1] : null;
};

const SMOKE_ONLY = hasFlag('--smoke');
const USE_DEV = hasFlag('--dev');
const HEADED = hasFlag('--headed');
const EXTERNAL_URL = getArgValue('--url');
const FIREFOX_BIN = process.env.FIREFOX_BIN || '/usr/bin/firefox';

const R1_UNIT_TITLES = [
  'Perkenalan & Identitas Diri',
  'Sopan Santun & Konfirmasi',
  'Arah & Lokasi',
  'Aktivitas, Keinginan & Perasaan',
];

const KNOWN_WORD_CLASSES = [
  'Terima Kasih',
  'Sama-sama',
  'Laki-laki',
  'Perempuan',
  'Hubungan',
  'Menulis',
  'Sahabat',
  'Kiri',
  'Kanan',
  'Atas',
  'Bawah',
  'Kamu',
  'Saya',
  'Siapa',
  'Mana',
  'Apa',
  'Betul',
  'Salah',
  'Lagi',
  'Cinta',
  'Kuat',
  'Waktu',
  'Ingin',
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Dependency & Server Resolution
// ---------------------------------------------------------------------------

async function loadPuppeteerCore() {
  try {
    const mod = await import('puppeteer-core');
    return mod.default || mod;
  } catch {
    // Fallback to npx cache locations
  }

  const candidates = [
    '/home/sullivan/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core',
  ];

  const npxRoot = path.join(os.homedir(), '.npm', '_npx');
  if (fs.existsSync(npxRoot)) {
    for (const entry of fs.readdirSync(npxRoot)) {
      const candidate = path.join(npxRoot, entry, 'node_modules', 'puppeteer-core');
      if (!candidates.includes(candidate)) {
        candidates.push(candidate);
      }
    }
  }

  for (const dir of candidates) {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const entryRel = pkg.main || './lib/puppeteer/puppeteer-core.js';
    const entryAbs = path.resolve(dir, entryRel);
    if (fs.existsSync(entryAbs)) {
      const mod = await import(pathToFileURL(entryAbs).href);
      return mod.default || mod;
    }
  }

  throw new Error(
    'Could not locate puppeteer-core in node_modules or ~/.npm/_npx. Install puppeteer-core or run npx once.'
  );
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(err => (err ? reject(err) : resolve(port)));
    });
  });
}

async function startLocalServer() {
  if (EXTERNAL_URL) {
    return { url: EXTERNAL_URL.replace(/\/$/, ''), stop: async () => {} };
  }

  const viteBin = path.join(ROOT_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(viteBin)) {
    throw new Error(`Vite CLI not found at ${viteBin}`);
  }

  const port = await getFreePort();
  const hasDist = fs.existsSync(path.join(ROOT_DIR, 'dist', 'index.html'));
  const usePreview = !USE_DEV && hasDist;
  const viteArgs = usePreview
    ? [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort']
    : [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'];

  const logs = [];
  const child = spawn(process.execPath, viteArgs, {
    cwd: ROOT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  });

  child.stdout?.on('data', d => logs.push(d.toString()));
  child.stderr?.on('data', d => logs.push(d.toString()));

  let exited = false;
  child.once('exit', code => {
    exited = true;
    if (code !== null && code !== 0) {
      logs.push(`Server exited with code ${code}`);
    }
  });

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(`Local Vite server exited prematurely:\n${logs.join('')}`);
    }
    try {
      const res = await fetch(url);
      if (res.status < 500) {
        return {
          url,
          mode: usePreview ? 'vite preview (dist/)' : 'vite dev',
          stop: async () => {
            if (child.killed || exited) return;
            child.kill('SIGTERM');
            await Promise.race([
              new Promise(r => child.once('exit', r)),
              sleep(1500).then(() => {
                if (!exited) child.kill('SIGKILL');
              }),
            ]);
          },
        };
      }
    } catch {
      // Wait for server socket
    }
    await sleep(150);
  }

  child.kill('SIGKILL');
  throw new Error(`Timed out waiting for Vite server at ${url}\n${logs.join('')}`);
}

// ---------------------------------------------------------------------------
// Console & Error Tracking
// ---------------------------------------------------------------------------

function isIgnoredConsoleError(text) {
  const isGoogleFont = /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(text);
  const isNetworkLoad =
    /Loading failed|NetworkError|NS_ERROR|Failed to load resource|downloadable font:\s*download failed/i.test(
      text
    );
  if (isGoogleFont && isNetworkLoad) return true;
  return false;
}

function attachErrorTracker(page) {
  const state = {
    pageErrors: [],
    consoleErrors: [],
    webglErrors: [],
  };

  page.on('pageerror', err => {
    const msg = err?.stack || err?.message || String(err);
    if (!isIgnoredConsoleError(msg)) {
      state.pageErrors.push(msg);
    }
  });

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (/webgl/i.test(text) && (type === 'error' || type === 'warning')) {
      state.webglErrors.push(`[${type}] ${text}`);
    }

    if (type === 'error' && !isIgnoredConsoleError(text)) {
      state.consoleErrors.push(text);
    }
  });

  return {
    reset() {
      state.pageErrors.length = 0;
      state.consoleErrors.length = 0;
      state.webglErrors.length = 0;
    },
    snapshot() {
      return {
        pageErrors: [...state.pageErrors],
        consoleErrors: [...state.consoleErrors],
        webglErrors: [...state.webglErrors],
      };
    },
    assertClean(contextLabel) {
      const issues = [];
      if (state.pageErrors.length > 0) {
        issues.push(`pageerror(${state.pageErrors.length}): ${state.pageErrors.join(' | ')}`);
      }
      if (state.webglErrors.length > 0) {
        issues.push(`webglError(${state.webglErrors.length}): ${state.webglErrors.join(' | ')}`);
      }
      if (state.consoleErrors.length > 0) {
        issues.push(`console.error(${state.consoleErrors.length}): ${state.consoleErrors.join(' | ')}`);
      }
      if (issues.length > 0) {
        throw new Error(`[${contextLabel}] Browser console/runtime errors detected:\n  - ${issues.join('\n  - ')}`);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Opaque-box DOM Interaction Helpers
// ---------------------------------------------------------------------------

async function navigateTo(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForFunction(
    () => document.body && document.body.innerText.trim().length > 0,
    { timeout: 15_000 }
  );
  await sleep(250);
}

async function seedAppState(page, baseUrl, appState) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.evaluate(state => {
    localStorage.clear();
    if (state !== null) {
      localStorage.setItem('bisigo_state', JSON.stringify(state));
    }
  }, appState);
}

async function waitForText(page, regexSource, flags = 'i', timeout = 12_000) {
  await page.waitForFunction(
    (src, flg) => new RegExp(src, flg).test(document.body?.innerText || ''),
    { timeout },
    regexSource,
    flags
  );
}

async function getBodyText(page) {
  return page.evaluate(() => document.body?.innerText || '');
}

async function assertNoRoboflowInUI(page, label) {
  const text = await getBodyText(page);
  if (/roboflow/i.test(text)) {
    throw new Error(`[${label}] Visible UI text contains forbidden provider name "roboflow".`);
  }
}

async function clickElementByText(page, selector, regex, { exact = false } = {}) {
  const clicked = await page.evaluate(
    (sel, src, flg, isExact) => {
      const re = new RegExp(src, flg);
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const txt = (el.innerText || el.textContent || '').trim();
        const aria = (el.getAttribute('aria-label') || '').trim();
        const matches = isExact
          ? re.test(txt) && txt.replace(re, '').trim() === ''
          : re.test(txt) || re.test(aria);
        if (matches) {
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          el.click();
          return txt || aria || sel;
        }
      }
      return null;
    },
    selector,
    regex.source,
    regex.flags,
    exact
  );

  if (!clicked) {
    throw new Error(`Could not find enabled clickable element (${selector}) matching ${regex}`);
  }
  await sleep(150);
  return clicked;
}

async function hasEnabledButton(page, regex) {
  return page.evaluate(
    (src, flg) => {
      const re = new RegExp(src, flg);
      return Array.from(document.querySelectorAll('button')).some(btn => {
        if (btn.disabled) return false;
        const rect = btn.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const txt = (btn.innerText || btn.textContent || '').trim();
        return re.test(txt);
      });
    },
    regex.source,
    regex.flags
  );
}

async function hasAnyButton(page, regex) {
  return page.evaluate(
    (src, flg) => {
      const re = new RegExp(src, flg);
      return Array.from(document.querySelectorAll('button')).some(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const txt = (btn.innerText || btn.textContent || '').trim();
        return re.test(txt);
      });
    },
    regex.source,
    regex.flags
  );
}

async function loginAsGuestUI(page, baseUrl) {
  await seedAppState(page, baseUrl, null);
  await navigateTo(page, `${baseUrl}/`);
  await clickElementByText(
    page,
    'button',
    /MULAI BELAJAR.*GUEST|GET STARTED.*GUEST|MODE TAMU|GUEST MODE/i
  );
  await page.waitForFunction(
    () => window.location.pathname.startsWith('/learn'),
    { timeout: 10_000 }
  );
  await waitForText(page, 'Perkenalan|UNIT 1', 'i');
}

function matchWordClassFromText(rawText) {
  const lower = rawText.toLowerCase();
  for (const label of KNOWN_WORD_CLASSES) {
    if (lower.includes(label.toLowerCase())) {
      return label;
    }
  }
  return null;
}

async function installVirtualWebcam(page) {
  const initFn = () => {
    if (window.__e2eVirtualCamInstalled) return;
    window.__e2eVirtualCamInstalled = true;
    window.__e2eGetUserMediaCalls = 0;

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    let activeImg = null;

    const renderLoop = () => {
      if (ctx) {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(0, 0, 480, 360);
        if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
          // Draw into the center 360x360 square matching captureVideoFrame's 1:1 center ROI
          ctx.drawImage(activeImg, 60, 0, 360, 360);
        }
      }
    };
    renderLoop();
    window.setInterval(renderLoop, 50);

    window.__e2eSetCameraSign = async className => {
      if (!className) {
        activeImg = null;
        renderLoop();
        return true;
      }
      return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          activeImg = img;
          renderLoop();
          resolve(true);
        };
        img.onerror = () => {
          activeImg = null;
          renderLoop();
          resolve(false);
        };
        img.src = `/roboflow-reference/${encodeURIComponent(className)}.jpg`;
      });
    };

    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {},
        configurable: true,
      });
    }

    navigator.mediaDevices.getUserMedia = async () => {
      window.__e2eGetUserMediaCalls = (window.__e2eGetUserMediaCalls || 0) + 1;
      renderLoop();
      return canvas.captureStream(20);
    };
  };

  await page.evaluateOnNewDocument(initFn);
  await page.evaluate(initFn).catch(() => {});
}

async function setVirtualCameraSign(page, className) {
  await page.evaluate(cls => window.__e2eSetCameraSign?.(cls), className);
  await sleep(180);
}

async function assertNoDebugUI(page, label) {
  const text = await getBodyText(page);
  const forbiddenPatterns = [
    /Simulasikan Gerakan Benar/i,
    /Simulate Correct Gesture/i,
    /Uji Pakai Gambar/i,
    /Test With Image/i,
    /Lihat Foto Pose Referensi/i,
    /Sembunyikan Pose Referensi/i,
    /TFLite WASM/i,
  ];
  for (const re of forbiddenPatterns) {
    if (re.test(text)) {
      throw new Error(`[${label}] Found debug UI text matching ${re} in visible DOM.`);
    }
  }
  const hasFileInput = await page.evaluate(() => Boolean(document.querySelector('input[type="file"]')));
  if (hasFileInput) {
    throw new Error(`[${label}] Found debug <input type="file"> in DOM.`);
  }
}

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------

async function testWebGLDisabled(page, baseUrl) {
  await navigateTo(page, `${baseUrl}/`);
  const caps = await page.evaluate(() => {
    const c = document.createElement('canvas');
    return {
      webgl: c.getContext('webgl'),
      webgl2: c.getContext('webgl2'),
      experimental: c.getContext('experimental-webgl'),
      wasm: typeof WebAssembly === 'object',
      secureContext: window.isSecureContext,
    };
  });
  assert.equal(caps.webgl, null, 'Expected canvas.getContext("webgl") === null');
  assert.equal(caps.webgl2, null, 'Expected canvas.getContext("webgl2") === null');
  assert.equal(caps.experimental, null, 'Expected canvas.getContext("experimental-webgl") === null');
  assert.equal(caps.wasm, true, 'Expected WebAssembly support in headless Firefox');
  assert.equal(caps.secureContext, true, 'Expected window.isSecureContext === true on 127.0.0.1');
}

async function testSmokeBaseline(page, baseUrl, tracker) {
  tracker.reset();
  await loginAsGuestUI(page, baseUrl);
  await assertNoRoboflowInUI(page, 'smoke:/learn');
  await assertNoDebugUI(page, 'smoke:/learn');

  await navigateTo(page, `${baseUrl}/dictionary`);
  await assertNoRoboflowInUI(page, 'smoke:/dictionary');
  await assertNoDebugUI(page, 'smoke:/dictionary');

  await navigateTo(page, `${baseUrl}/settings`);
  await assertNoRoboflowInUI(page, 'smoke:/settings');
  await assertNoDebugUI(page, 'smoke:/settings');

  // Toggle dark mode via SettingsPage
  await clickElementByText(page, 'button', /^(Gelap|Dark)$/i);
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  assert.equal(isDark, true, 'Expected html.dark after clicking Dark theme');
  await clickElementByText(page, 'button', /^(Terang|Light)$/i);

  tracker.assertClean('smoke:baseline');
}

async function testLearnPageUnitsAndSidebar(page, baseUrl, tracker) {
  tracker.reset();
  await loginAsGuestUI(page, baseUrl);

  const learnCheck = await page.evaluate(expectedTitles => {
    const text = document.body?.innerText || '';
    const positions = expectedTitles.map(title => ({
      title,
      idx: text.indexOf(title),
    }));
    const charLink = document.querySelector('a[href="/characters"]');
    return {
      positions,
      charHref: charLink?.getAttribute('href') || null,
      charText: (charLink?.innerText || charLink?.textContent || '').trim(),
    };
  }, R1_UNIT_TITLES);

  for (const item of learnCheck.positions) {
    assert.ok(item.idx !== -1, `Missing Unit banner title on /learn: "${item.title}"`);
  }
  for (let i = 1; i < learnCheck.positions.length; i++) {
    assert.ok(
      learnCheck.positions[i - 1].idx < learnCheck.positions[i].idx,
      `Unit banner "${learnCheck.positions[i - 1].title}" should appear before "${learnCheck.positions[i].title}"`
    );
  }

  assert.equal(learnCheck.charHref, '/characters', 'Sidebar must link to /characters');
  assert.match(
    learnCheck.charText,
    /HURUF\s*&\s*ANGKA|CHARACTERS|HURUF/i,
    `Sidebar /characters link text "${learnCheck.charText}" should indicate Huruf & Angka / Characters`
  );

  await assertNoRoboflowInUI(page, 'Check1:/learn');
  await assertNoDebugUI(page, 'Check1:/learn');
  tracker.assertClean('Check1:/learn');
}

/**
 * Inspects the active LessonPage step and executes it.
 */
async function executeLessonStep(page, tracker, state) {
  await assertNoDebugUI(page, 'LessonPage:step');

  const stepInfo = await page.evaluate(() => {
    const body = document.body?.innerText || '';
    const hasWordBankTestId = Boolean(
      document.querySelector(
        '[data-testid="word-bank-options"], [data-testid="word-bank-answer-tray"], [data-testid="word-bank-step"]'
      )
    );
    const hasChainedTestId = Boolean(
      document.querySelector('[data-testid="chained-sequence-bar"], [data-testid="chained-camera-step"]')
    );
    const hasSequenceSlots =
      document.querySelectorAll('[data-testid^="chained-slot-"], [data-testid="sequence-slot"]').length >= 2;
    const hasVideoElement = Boolean(document.querySelector('main video'));
    const hasCameraSkipBtn = /Tidak Bisa Pakai Kamera|Can't Use Camera|Skip Camera/i.test(body);
    const hasCameraStage = hasVideoElement || hasCameraSkipBtn;
    const hasCheckBtn = Array.from(document.querySelectorAll('button')).some(b =>
      /^(PERIKSA|CHECK)$/i.test((b.innerText || '').trim())
    );
    const isStudy = /ISYARAT BARU|NEW SIGN|PANDUAN GERAKAN|GESTURE GUIDE/i.test(body) && !hasCheckBtn && !hasCameraStage;

    const mainEl = document.querySelector('main') || document.body;
    const hasNumberedShortcutBadges = Array.from(mainEl.querySelectorAll('button')).some(b => {
      const firstSpan = b.querySelector('span');
      const badge = (firstSpan?.innerText || '').trim();
      return /^[1-4]$/.test(badge);
    });

    const isChainedCamera = hasChainedTestId || hasSequenceSlots;
    const isSingleCamera = hasCameraStage && !isChainedCamera;
    const isWordBank =
      hasWordBankTestId ||
      (hasCheckBtn &&
        (/susun|rangkai|kalimat|arrange|sentence|word bank|urutan/i.test(body) || !hasNumberedShortcutBadges));

    return {
      isStudy,
      isChainedCamera,
      isSingleCamera,
      isWordBank,
      isSingleQuiz: hasCheckBtn && !isWordBank,
      getUserMediaCalls: window.__e2eGetUserMediaCalls || 0,
      bodySnippet: body.slice(0, 260),
    };
  });

  if (stepInfo.isStudy) {
    await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
    return 'study';
  }

  if (stepInfo.isSingleQuiz) {
    const clickedOption = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const buttons = Array.from(main.querySelectorAll('button')).filter(b => {
        const r = b.getBoundingClientRect();
        return !b.disabled && r.width > 60 && r.height > 30;
      });
      if (buttons.length === 0) return false;
      buttons[0].click();
      return true;
    });
    assert.ok(clickedOption, 'Expected clickable quiz option card');
    await sleep(120);
    await clickElementByText(page, 'button', /^(PERIKSA|CHECK)$/i);
    await sleep(150);
    await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
    return 'quiz';
  }

  if (stepInfo.isWordBank) {
    await runWordBankStep(page, state);
    return 'word-bank';
  }

  if (stepInfo.isChainedCamera) {
    await runChainedCameraStep(page, tracker, state);
    return 'chained-camera';
  }

  if (stepInfo.isSingleCamera) {
    assert.ok(
      stepInfo.getUserMediaCalls > 0,
      'Expected LessonPage camera step to request camera permission via navigator.mediaDevices.getUserMedia'
    );
    const headingText = await page.evaluate(() => document.querySelector('main h2, main h1')?.innerText || '');
    const targetClass = matchWordClassFromText(headingText);
    if (targetClass === 'Kamu' && fs.existsSync(path.join(REF_DIR, 'Kamu.jpg'))) {
      await setVirtualCameraSign(page, 'Kamu');
      await page.waitForFunction(
        () =>
          Array.from(document.querySelectorAll('button')).some(
            b => /^(LANJUTKAN|CONTINUE)$/i.test((b.innerText || '').trim()) && !b.disabled
          ),
        { timeout: 15_000 }
      );
      await setVirtualCameraSign(page, null);
      tracker.assertClean('camera:Kamu.jpg');
      state.testedKamuDetector = true;
      await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
    } else {
      await clickElementByText(page, 'button', /Tidak Bisa Pakai Kamera|Can't Use Camera/i);
    }
    return 'camera';
  }

  throw new Error(`Unrecognized LessonPage step UI:\n${stepInfo.bodySnippet}`);
}

async function getWordBankChips(page) {
  return page.evaluate(known => {
    const main = document.querySelector('main') || document.body;
    const explicit = Array.from(
      main.querySelectorAll(
        '[data-testid="word-bank-options"] [data-testid^="word-bank-option-"], [data-testid="word-bank-pool"] [data-testid="word-bank-chip"], [data-testid="word-bank-chip"]'
      )
    );
    const candidates =
      explicit.length > 0
        ? explicit
        : Array.from(main.querySelectorAll('button')).filter(b => {
            if (b.closest('[data-testid="word-bank-answer-tray"], [data-testid="word-bank-answer"]')) {
              return false;
            }
            const rect = b.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            const txt = (b.innerText || '').trim();
            if (/PERIKSA|CHECK|LEWATI|SKIP|LANJUTKAN|CONTINUE|COBA LAGI|TRY AGAIN|ULANG|REPLAY/i.test(txt)) {
              return false;
            }
            return known.some(k => txt.toLowerCase() === k.toLowerCase());
          });

    return candidates.map((el, idx) => ({
      idx,
      text: (el.innerText || '').trim(),
      disabled: Boolean(el.disabled),
    }));
  }, KNOWN_WORD_CLASSES);
}

async function clickWordBankChipByText(page, label) {
  const clicked = await page.evaluate(target => {
    const main = document.querySelector('main') || document.body;
    const poolContainer = main.querySelector(
      '[data-testid="word-bank-options"], [data-testid="word-bank-pool"]'
    );
    const explicit = poolContainer
      ? Array.from(
          poolContainer.querySelectorAll(
            '[data-testid^="word-bank-option-"], [data-testid="word-bank-chip"], button'
          )
        )
      : Array.from(main.querySelectorAll('[data-testid="word-bank-chip"]'));
    const pool = explicit.length > 0 ? explicit : Array.from(main.querySelectorAll('button'));
    // Iterate in reverse when falling back to all <main> buttons so pool (below answer tray) is preferred
    const ordered = poolContainer ? pool : [...pool].reverse();
    for (const btn of ordered) {
      if (btn.disabled) continue;
      if (btn.closest('[data-testid="word-bank-answer-tray"], [data-testid="word-bank-answer"]')) continue;
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if ((btn.innerText || '').trim().toLowerCase() === target.toLowerCase()) {
        btn.click();
        return true;
      }
    }
    return false;
  }, label);
  assert.ok(clicked, `Could not click word-bank chip "${label}"`);
  await sleep(100);
}

async function readExpectedWordBankSigns(page) {
  return page.evaluate(known => {
    const parseSignsText = rawText => {
      const cleaned = (rawText || '').trim();
      if (!cleaned) return [];
      const found = [];
      let remaining = cleaned;
      while (remaining.length > 0) {
        const matched = known.find(k => remaining.toLowerCase().startsWith(k.toLowerCase()));
        if (matched) {
          found.push(matched);
          remaining = remaining.slice(matched.length).replace(/^[\s+→,|/-]+/, '');
        } else {
          remaining = remaining.slice(1).replace(/^[\s+→,|/-]+/, '');
        }
      }
      if (found.length >= 2) return found;
      return cleaned
        .split(/[+→,|]+/)
        .map(s => s.trim())
        .filter(Boolean);
    };

    // 1. Footer expected-answer hook rendered on wrong word-bank submission
    const expectedAnswerEl = document.querySelector('[data-testid="word-bank-expected-answer"]');
    if (expectedAnswerEl) {
      const parsed = parseSignsText(expectedAnswerEl.innerText || expectedAnswerEl.textContent || '');
      if (parsed.length >= 2) return parsed;
    }

    // 2. Optional explicit test hook on demonstrator or step container
    const elWithData = document.querySelector('[data-expected-signs]');
    if (elWithData) {
      const parsed = parseSignsText(elWithData.getAttribute('data-expected-signs') || '');
      if (parsed.length >= 2) return parsed;
    }

    // 3. Sequence labels inside demonstrator (if exposed)
    const main = document.querySelector('main') || document.body;
    const seqItems = Array.from(main.querySelectorAll('[data-sign-class]'))
      .map(el => (el.getAttribute('data-sign-class') || '').trim())
      .filter(Boolean);
    if (seqItems.length >= 2) return seqItems;

    // 4. Parse "Urutan belum tepat. Jawaban benar:\nX + Y" or "Correct answer:\nX + Y"
    const body = document.body?.innerText || '';
    const fbMatch = body.match(/(?:Jawaban (?:yang )?benar|Correct answer)\s*:?\s*\n?\s*([^\n]+)/i);
    if (fbMatch) {
      const parsed = parseSignsText(fbMatch[1]);
      if (parsed.length >= 2) return parsed;
    }

    return null;
  }, KNOWN_WORD_CLASSES);
}

const WORD_BANK_WRONG_RE =
  /Urutan belum tepat|Jawaban (?:yang )?benar|Incorrect order|Correct answer/i;
const WORD_BANK_RIGHT_RE =
  /Urutan tepat|Correct sequence|Luar biasa|Amazing/i;

async function runWordBankStep(page, state) {
  const chips = await getWordBankChips(page);
  assert.ok(chips.length >= 2, `Expected >= 2 word-bank chips, found ${chips.length}`);

  let expectedSigns = await readExpectedWordBankSigns(page);

  // If we have not verified wrong order yet, genuinely submit a wrong/incomplete chip order first!
  if (!state.testedWrongWordBank) {
    if (expectedSigns && expectedSigns.length >= 2) {
      const reversed = [...expectedSigns].reverse();
      const isDifferentOrder =
        reversed.join('|').toLowerCase() !== expectedSigns.join('|').toLowerCase();
      const wrongSequence = isDifferentOrder ? reversed : [expectedSigns[0]];
      for (const label of wrongSequence) {
        await clickWordBankChipByText(page, label);
      }
    } else {
      // Sentences are 2-3 signs, so submitting 1 chip is guaranteed incomplete & marked wrong
      await clickWordBankChipByText(page, chips[chips.length - 1].text);
      const canCheckWithOne = await hasEnabledButton(page, /^(PERIKSA|CHECK)$/i);
      if (!canCheckWithOne) {
        await clickWordBankChipByText(page, chips[0].text);
      }
    }

    await clickElementByText(page, 'button', /^(PERIKSA|CHECK)$/i);
    await sleep(200);

    const feedbackText = await getBodyText(page);
    const markedWrong = WORD_BANK_WRONG_RE.test(feedbackText);
    const markedRight = WORD_BANK_RIGHT_RE.test(feedbackText);
    assert.ok(
      markedWrong && !markedRight,
      `Wrong word-bank chip order was NOT marked wrong! Feedback:\n${feedbackText.slice(-300)}`
    );
    state.testedWrongWordBank = true;

    // Read revealed correct answer from [data-testid="word-bank-expected-answer"]
    expectedSigns = await readExpectedWordBankSigns(page);
    assert.ok(
      expectedSigns && expectedSigns.length >= 2,
      'Expected [data-testid="word-bank-expected-answer"] to reveal the correct sign sequence after wrong submission'
    );

    // Click COBA LAGI / TRY AGAIN (exact match so we don't hit demonstrator's "Ulangi" Replay button)
    const hasRetry = await hasEnabledButton(page, /^(Coba Lagi|Try Again)$/i);
    assert.ok(hasRetry, 'Expected enabled COBA LAGI / TRY AGAIN button after wrong word-bank submission');
    await clickElementByText(page, 'button', /^(Coba Lagi|Try Again)$/i);
    await sleep(150);

    for (const label of expectedSigns) {
      await clickWordBankChipByText(page, label);
    }
    await clickElementByText(page, 'button', /^(PERIKSA|CHECK)$/i);
    await sleep(200);

    const passText = await getBodyText(page);
    assert.ok(
      WORD_BANK_RIGHT_RE.test(passText) && !WORD_BANK_WRONG_RE.test(passText),
      `Correct word-bank chip order should pass! Feedback:\n${passText.slice(-300)}`
    );
    state.testedCorrectWordBank = true;

    await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
    return;
  }

  // Subsequent word-bank steps (already tested wrong & right): resolve expected signs for THIS step
  if (!expectedSigns) {
    await clickWordBankChipByText(page, chips[0].text);
    await clickElementByText(page, 'button', /^(PERIKSA|CHECK)$/i);
    await sleep(200);
    const revealed = await readExpectedWordBankSigns(page);
    assert.ok(
      revealed && revealed.length >= 2,
      'Expected [data-testid="word-bank-expected-answer"] to reveal signs for word-bank step'
    );
    const hasRetry = await hasEnabledButton(page, /^(Coba Lagi|Try Again)$/i);
    assert.ok(hasRetry, 'Expected enabled COBA LAGI / TRY AGAIN button');
    await clickElementByText(page, 'button', /^(Coba Lagi|Try Again)$/i);
    await sleep(150);
    for (const label of revealed) {
      await clickWordBankChipByText(page, label);
    }
    await clickElementByText(page, 'button', /^(PERIKSA|CHECK)$/i);
    await sleep(200);
    const passText = await getBodyText(page);
    assert.ok(
      WORD_BANK_RIGHT_RE.test(passText) && !WORD_BANK_WRONG_RE.test(passText),
      'Correct word-bank chip order should pass on retry!'
    );
    state.testedCorrectWordBank = true;
    await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
    return;
  }

  for (const label of expectedSigns) {
    await clickWordBankChipByText(page, label);
  }
  await clickElementByText(page, 'button', /^(PERIKSA|CHECK)$/i);
  await sleep(200);
  const bodyPass = await getBodyText(page);
  assert.ok(
    WORD_BANK_RIGHT_RE.test(bodyPass) && !WORD_BANK_WRONG_RE.test(bodyPass),
    'Correct word-bank chip order should be marked correct!'
  );
  state.testedCorrectWordBank = true;
  await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
}

async function readChainedSlots(page) {
  return page.evaluate(known => {
    const main = document.querySelector('main') || document.body;
    const explicitSlots = Array.from(
      main.querySelectorAll('[data-testid^="chained-slot-"], [data-testid="sequence-slot"]')
    );

    if (explicitSlots.length >= 2) {
      return explicitSlots.map((el, i) => {
        const txt = (el.innerText || el.textContent || '').trim();
        const statusAttr = el.getAttribute('data-slot-status');
        const hasCheck =
          statusAttr === 'completed' ||
          statusAttr === 'done' ||
          txt.includes('✓') ||
          Boolean(el.querySelector('svg'));
        const signClass =
          el.getAttribute('data-sign-class') ||
          known.find(k => txt.toLowerCase().includes(k.toLowerCase())) ||
          null;
        return { index: i + 1, status: statusAttr, text: txt, done: hasCheck, signClass };
      });
    }

    // Semantic fallback (exclude sequence bar container and multi-slot parent elements)
    const allEls = Array.from(main.querySelectorAll('div, span, li, button'));
    const slots = [];
    for (let slotNum = 1; slotNum <= 3; slotNum++) {
      const re = new RegExp(`^\\s*${slotNum}\\.\\s+(.+)$`, 'i');
      const nextSlotRe = new RegExp(`\\b${slotNum + 1}\\.\\s+`, 'i');
      const matchEl = allEls.find(el => {
        if (el.getAttribute('data-testid') === 'chained-sequence-bar') return false;
        if (el.querySelector('[data-testid^="chained-slot-"]')) return false;
        if (el.children.length > 4) return false;
        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        return (
          re.test(t) &&
          !nextSlotRe.test(t) &&
          known.some(k => t.toLowerCase().includes(k.toLowerCase()))
        );
      });
      if (matchEl) {
        const t = (matchEl.innerText || '').replace(/\s+/g, ' ').trim();
        const signClass = known.find(k => t.toLowerCase().includes(k.toLowerCase())) || null;
        const statusAttr = matchEl.getAttribute('data-slot-status');
        const done =
          statusAttr === 'completed' ||
          statusAttr === 'done' ||
          t.includes('✓') ||
          Boolean(matchEl.querySelector('svg'));
        slots.push({ index: slotNum, status: statusAttr, text: t, done, signClass });
      }
    }
    return slots;
  }, KNOWN_WORD_CLASSES);
}

async function runChainedCameraStep(page, tracker, state) {
  await assertNoDebugUI(page, 'chained-camera');
  const initialSlots = await readChainedSlots(page);
  assert.ok(
    initialSlots.length >= 2,
    `Expected chained camera sequence bar with >= 2 slots, got ${JSON.stringify(initialSlots)}`
  );
  assert.equal(initialSlots[0].index, 1, 'First slot must be numbered 1');
  assert.equal(initialSlots[1].index, 2, 'Second slot must be numbered 2');
  assert.notEqual(initialSlots[0].status, 'completed', 'Slot 1 status must not start completed');
  assert.equal(initialSlots[0].done, false, 'Slot 1 must start incomplete');
  assert.notEqual(initialSlots[1].status, 'completed', 'Slot 2 status must not start completed');
  assert.equal(initialSlots[1].done, false, 'Slot 2 must start incomplete');

  // Verify LANJUTKAN / CONTINUE is initially disabled
  const continueInitiallyEnabled = await hasEnabledButton(page, /^(LANJUTKAN|CONTINUE)$/i);
  assert.equal(continueInitiallyEnabled, false, 'Continue button must be disabled before all slots complete');

  // Verify getUserMedia was invoked for camera permission
  const gumCalls = await page.evaluate(() => window.__e2eGetUserMediaCalls || 0);
  assert.ok(gumCalls > 0, 'Expected chained-camera step to invoke navigator.mediaDevices.getUserMedia');

  // Adversarial check: showing slot 2's sign during slot 1 must NOT advance slot 1 or skip to slot 2
  const slot1Sign = initialSlots[0].signClass;
  const slot2Sign = initialSlots[1].signClass;
  if (
    !state.testedChainedCamera &&
    slot1Sign &&
    slot2Sign &&
    slot1Sign !== slot2Sign &&
    fs.existsSync(path.join(REF_DIR, `${slot2Sign}.jpg`))
  ) {
    await setVirtualCameraSign(page, slot2Sign);
    await sleep(600);
    const afterWrongSign = await readChainedSlots(page);
    assert.notEqual(
      afterWrongSign[0].status,
      'completed',
      `Out-of-order sign (${slot2Sign}) must NOT mark slot 1 (${slot1Sign}) completed`
    );
    assert.equal(
      afterWrongSign[0].done,
      false,
      `Out-of-order sign (${slot2Sign}) must NOT complete slot 1 (${slot1Sign})`
    );
    assert.notEqual(
      afterWrongSign[1].status,
      'completed',
      'Out-of-order sign must NOT skip ahead to slot 2'
    );
    assert.equal(afterWrongSign[1].done, false, 'Out-of-order sign must NOT skip ahead to slot 2');
    await setVirtualCameraSign(page, null);
  }

  // If we have already verified full slot-by-slot live camera advancement on an earlier sentence in this level,
  // we can use the production accessibility skip button for remaining sentences to keep E2E fast.
  if (state.testedChainedCamera) {
    await setVirtualCameraSign(page, null);
    await clickElementByText(page, 'button', /Tidak Bisa Pakai Kamera|Can't Use Camera/i);
    return;
  }

  // Advance each slot strictly in order via real live camera detection!
  let allSlotsMatchedViaCamera = true;
  for (let i = 0; i < initialSlots.length; i++) {
    const slotSign = initialSlots[i].signClass;
    if (!slotSign || !fs.existsSync(path.join(REF_DIR, `${slotSign}.jpg`))) {
      allSlotsMatchedViaCamera = false;
      break;
    }

    await setVirtualCameraSign(page, slotSign);
    try {
      await page.waitForFunction(
        idx => {
          const chainedSlot = document.querySelector(`[data-testid="chained-slot-${idx}"]`);
          if (chainedSlot) {
            const st = chainedSlot.getAttribute('data-slot-status');
            return st === 'completed' || st === 'done' || Boolean(chainedSlot.querySelector('svg'));
          }
          return false;
        },
        { timeout: 10_000 },
        i
      );
      if (slotSign === 'Kamu') {
        state.testedKamuDetector = true;
      }
    } catch {
      allSlotsMatchedViaCamera = false;
      break;
    }

    await sleep(150);
    const slotsNow = await readChainedSlots(page);
    if (slotsNow[i].status !== null) {
      assert.equal(
        slotsNow[i].status,
        'completed',
        `Expected slot ${i + 1} (${slotSign}) data-slot-status to be "completed"`
      );
    }
    assert.equal(
      slotsNow[i].done,
      true,
      `Expected slot ${i + 1} (${slotSign}) to be marked completed after matching`
    );

    if (i < initialSlots.length - 1) {
      assert.notEqual(
        slotsNow[i + 1].status,
        'completed',
        `Slot ${i + 2} must remain incomplete right after slot ${i + 1} completes`
      );
      assert.equal(
        slotsNow[i + 1].done,
        false,
        `Slot ${i + 2} must remain pending right after slot ${i + 1} completes`
      );
      const earlyContinue = await hasEnabledButton(page, /^(LANJUTKAN|CONTINUE)$/i);
      assert.equal(earlyContinue, false, 'Continue must remain disabled until ALL slots complete');
    }
  }

  await setVirtualCameraSign(page, null);

  if (!allSlotsMatchedViaCamera) {
    await clickElementByText(page, 'button', /Tidak Bisa Pakai Kamera|Can't Use Camera/i);
    return;
  }

  // All slots completed -> Continue button must be enabled!
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('button')).some(
        b => /^(LANJUTKAN|CONTINUE)$/i.test((b.innerText || '').trim()) && !b.disabled
      ),
    { timeout: 5_000 }
  );

  tracker.assertClean('chained-camera');
  state.testedChainedCamera = true;
  await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
}

async function testUnit1LessonEndToEnd(page, baseUrl, tracker) {
  tracker.reset();
  await loginAsGuestUI(page, baseUrl);

  const state = {
    testedWrongWordBank: false,
    testedCorrectWordBank: false,
    testedChainedCamera: false,
    testedKamuDetector: false,
    rememberedWordBankAnswer: null,
  };

  // Discover Unit 1 level IDs from /learn DOM (first <section>)
  const unit1LevelIds = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('main section'));
    const unit1 = sections.find(s => /Perkenalan & Identitas Diri/i.test(s.innerText || ''));
    if (!unit1) return [];
    const btns = Array.from(unit1.querySelectorAll('button[aria-label^="Level "]'));
    return btns
      .map(b => {
        const m = (b.getAttribute('aria-label') || '').match(/Level\s+(\d+\.\d+)/i);
        return m ? m[1] : null;
      })
      .filter(Boolean);
  });

  assert.ok(unit1LevelIds.length >= 2, `Expected multiple Unit 1 levels on /learn, found: ${unit1LevelIds.join(', ')}`);

  for (const levelId of unit1LevelIds) {
    // Make sure we are on /learn and open this level node via popover
    if (!page.url().includes('/learn')) {
      await navigateTo(page, `${baseUrl}/learn`);
    }

    await clickElementByText(page, 'button', new RegExp(`^Level\\s+${levelId.replace('.', '\\.')}:`, 'i'));
    await sleep(200);
    await clickElementByText(page, 'button', /MULAI|START|LATIHAN LAGI|PRACTICE/i);
    await page.waitForFunction(
      id => window.location.pathname.includes(`/lesson/${id}`),
      { timeout: 10_000 },
      levelId
    );
    await sleep(250);

    // Step through entire lesson until completion modal
    let guard = 0;
    while (guard < 40) {
      guard += 1;
      const completed = await page.evaluate(() =>
        /Level Selesai|Lesson Complete/i.test(document.body?.innerText || '')
      );
      if (completed) break;

      await executeLessonStep(page, tracker, state);
      await sleep(150);
    }

    const didComplete = await page.evaluate(() =>
      /Level Selesai|Lesson Complete/i.test(document.body?.innerText || '')
    );
    assert.ok(didComplete, `Expected Level ${levelId} completion modal after stepping through exercises`);

    await clickElementByText(page, 'button', /^(SELESAI|DONE)$/i);
    await page.waitForFunction(() => window.location.pathname.startsWith('/learn'), { timeout: 10_000 });
    await sleep(200);

    if (state.testedWrongWordBank && state.testedCorrectWordBank && state.testedChainedCamera) {
      break;
    }
  }

  assert.ok(state.testedWrongWordBank, 'Unit 1 lessons did not exercise a failing word-bank check');
  assert.ok(state.testedCorrectWordBank, 'Unit 1 lessons did not exercise a passing word-bank check');
  assert.ok(state.testedChainedCamera, 'Unit 1 lessons did not exercise a chained-camera step');
  tracker.assertClean('Check2:Unit1LessonE2E');
  return state;
}

async function testCharactersPageAndPractice(page, baseUrl, tracker) {
  tracker.reset();
  await loginAsGuestUI(page, baseUrl);

  // Navigate via sidebar /characters link
  const sidebarLink = await page.$('a[href="/characters"]');
  assert.ok(sidebarLink, 'Sidebar must contain a[href="/characters"]');
  await sidebarLink.click();
  await page.waitForFunction(() => window.location.pathname === '/characters', { timeout: 10_000 });
  await sleep(250);
  await assertNoRoboflowInUI(page, 'Check3:/characters');
  await assertNoDebugUI(page, 'Check3:/characters');

  // 1. Abjad tab -> 26 cards (A-Z)
  await clickElementByText(page, 'button', /Abjad|Alphabet/i);
  await sleep(200);
  const abjadLetters = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid^="character-card-"]');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const body = document.body?.innerText || '';
    const tokens = new Set(body.split(/\s+/).map(s => s.trim()));
    const presentCount = letters.filter(l => tokens.has(l)).length;
    return { explicitCount: cards.length, presentCount };
  });
  if (abjadLetters.explicitCount > 0) {
    assert.equal(abjadLetters.explicitCount, 26, `Expected 26 Abjad cards, found ${abjadLetters.explicitCount}`);
  }
  assert.equal(abjadLetters.presentCount, 26, `Expected all 26 letters A-Z on Abjad tab, found ${abjadLetters.presentCount}`);

  // 2. Open Tips / Panduan modal
  await clickElementByText(page, 'button', /Tips|Panduan|Guide/i);
  await page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
  const modalVisible = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    return Boolean(dlg && dlg.innerText.trim().length > 10);
  });
  assert.ok(modalVisible, 'Tips/Panduan modal should display readable guidance');
  await page.keyboard.press('Escape');
  await sleep(200);
  const stillOpen = await page.$('[role="dialog"]');
  if (stillOpen) {
    await clickElementByText(page, '[role="dialog"] button', /Tutup|Close|Mengerti|OK|×/i);
    await sleep(150);
  }

  // 3. Angka tab -> 11 cards (Nol-Sepuluh)
  await clickElementByText(page, 'button', /Angka|Numbers/i);
  await sleep(200);
  const angkaCheck = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid^="character-card-"]');
    const names = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh'];
    const body = document.body?.innerText || '';
    const found = names.filter(n => new RegExp(`\\b${n}\\b`, 'i').test(body));
    return { explicitCount: cards.length, foundCount: found.length, found };
  });
  if (angkaCheck.explicitCount > 0) {
    assert.equal(angkaCheck.explicitCount, 11, `Expected 11 Angka cards, found ${angkaCheck.explicitCount}`);
  }
  assert.equal(
    angkaCheck.foundCount,
    11,
    `Expected all 11 Angka signs (Nol-Sepuluh) on Angka tab, found ${angkaCheck.foundCount}: ${angkaCheck.found.join(', ')}`
  );

  // 4. Start practice from Abjad tab and reach a camera step
  await clickElementByText(page, 'button', /Abjad|Alphabet/i);
  await sleep(150);
  await clickElementByText(page, 'button, a', /Mulai Latihan|Learn the Characters|Practice Abjad|Latihan Abjad/i);
  await page.waitForFunction(
    () => window.location.pathname.includes('/characters/practice') || window.location.pathname.includes('/lesson'),
    { timeout: 10_000 }
  );
  await reachCameraStepInPractice(page, 'Abjad');

  // Return to /characters
  await navigateTo(page, `${baseUrl}/characters`);

  // 5. Start practice from Angka tab and reach a camera step
  await clickElementByText(page, 'button', /Angka|Numbers/i);
  await sleep(150);
  await clickElementByText(page, 'button, a', /Mulai Latihan|Learn the Characters|Practice Numbers|Latihan Angka/i);
  await page.waitForFunction(
    () => window.location.pathname.includes('/characters/practice') || window.location.pathname.includes('/lesson'),
    { timeout: 10_000 }
  );
  await reachCameraStepInPractice(page, 'Angka');

  tracker.assertClean('Check3:CharactersPage');
}

async function reachCameraStepInPractice(page, categoryLabel) {
  for (let step = 0; step < 15; step++) {
    await sleep(200);
    await assertNoDebugUI(page, `CharactersPractice:${categoryLabel}`);
    const state = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      const hasCam =
        Boolean(document.querySelector('main video')) ||
        /Tidak Bisa Pakai Kamera|Can't Use Camera/i.test(body);
      const hasCheck = Array.from(document.querySelectorAll('button')).some(b =>
        /^(PERIKSA|CHECK)$/i.test((b.innerText || '').trim())
      );
      const isStudy = / KARAKTER |CHARACTER|ISYARAT BARU|NEW SIGN|PANDUAN GERAKAN|GESTURE GUIDE|LANJUTKAN|CONTINUE/i.test(body) && !hasCheck && !hasCam;
      return { hasCam, hasCheck, isStudy };
    });

    if (state.hasCam) {
      return;
    }
    if (state.hasCheck) {
      await clickElementByText(page, 'button', /^(LEWATI|SKIP)$/i);
      continue;
    }
    if (state.isStudy) {
      await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
      continue;
    }
  }
  throw new Error(`Did not reach a camera step during ${categoryLabel} character practice.`);
}

async function testRealLocalDetectorInFirefox(page, baseUrl, tracker, alreadyTestedKamu) {
  if (alreadyTestedKamu) {
    await testWebGLDisabled(page, baseUrl);
    tracker.assertClean('Check4:RealDetector(Kamu)');
    return;
  }

  tracker.reset();
  await loginAsGuestUI(page, baseUrl);
  await testWebGLDisabled(page, baseUrl);

  let detectedKamu = false;
  await navigateTo(page, `${baseUrl}/lesson/1.1`);
  for (let guard = 0; guard < 20; guard++) {
    await sleep(200);
    const step = await page.evaluate(() => {
      const body = document.body?.innerText || '';
      const hasCam =
        Boolean(document.querySelector('main video')) ||
        /Tidak Bisa Pakai Kamera|Can't Use Camera/i.test(body);
      const hasSkip = Array.from(document.querySelectorAll('button')).some(b =>
        /^(LEWATI|SKIP)$/i.test((b.innerText || '').trim())
      );
      const heading = document.querySelector('main h2, main h1')?.innerText || '';
      const hasKamuTarget = /\bKamu\b/i.test(heading);
      return { hasCam, hasSkip, hasKamuTarget };
    });

    if (step.hasCam && step.hasKamuTarget) {
      await setVirtualCameraSign(page, 'Kamu');
      await page.waitForFunction(
        () =>
          Array.from(document.querySelectorAll('button')).some(
            b => /^(LANJUTKAN|CONTINUE)$/i.test((b.innerText || '').trim()) && !b.disabled
          ),
        { timeout: 15_000 }
      );
      await setVirtualCameraSign(page, null);
      detectedKamu = true;
      break;
    }

    if (step.hasSkip) {
      await clickElementByText(page, 'button', /^(LEWATI|SKIP)$/i);
    } else if (step.hasCam) {
      await clickElementByText(page, 'button', /Tidak Bisa Pakai Kamera|Can't Use Camera/i);
    } else if (await hasEnabledButton(page, /^(LANJUTKAN|CONTINUE)$/i)) {
      await clickElementByText(page, 'button', /^(LANJUTKAN|CONTINUE)$/i);
    } else {
      break;
    }
  }

  assert.ok(detectedKamu, 'Failed to verify real local TFLite detector on Kamu.jpg in headless Firefox');
  tracker.assertClean('Check4:RealDetector(Kamu)');
}

async function testAllPagesThemesAndCleanConsole(page, baseUrl, tracker) {
  // 1. Test logged-out Home (/) in light & dark mode
  for (const theme of ['light', 'dark']) {
    tracker.reset();
    await seedAppState(page, baseUrl, {
      user: null,
      language: 'id',
      theme,
      streak: 0,
      lastCompletedDate: null,
      xp: 0,
      unlockedLevels: ['1.1', '2.1', '3.1', '4.1'],
      completedLevels: [],
      characterMastery: {},
    });
    await navigateTo(page, `${baseUrl}/`);
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    assert.equal(isDark, theme === 'dark', `Home (/) theme mismatch for ${theme}`);
    await assertNoRoboflowInUI(page, `Home(${theme})`);
    await assertNoDebugUI(page, `Home(${theme})`);
    tracker.assertClean(`Check5:Home(${theme})`);
  }

  // 2. Test authenticated guest routes in light & dark mode
  const routes = ['/learn', '/lesson/1.1', '/characters', '/dictionary', '/settings'];
  for (const theme of ['light', 'dark']) {
    tracker.reset();
    await seedAppState(page, baseUrl, {
      user: { id: 'e2e_guest', name: 'E2E Guest', isGuest: true },
      language: 'id',
      theme,
      streak: 1,
      lastCompletedDate: null,
      xp: 20,
      unlockedLevels: ['1.1', '2.1', '3.1', '4.1'],
      completedLevels: [],
      characterMastery: {},
    });

    for (const route of routes) {
      await navigateTo(page, `${baseUrl}${route}`);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      assert.equal(isDark, theme === 'dark', `Route ${route} theme mismatch for ${theme}`);
      await assertNoRoboflowInUI(page, `${route}(${theme})`);
      await assertNoDebugUI(page, `${route}(${theme})`);
      tracker.assertClean(`Check5:${route}(${theme})`);
    }
  }
}

async function testLegacyLocalStorageMigration(page, baseUrl, tracker) {
  tracker.reset();
  const legacyState = {
    user: { id: 'legacy_user_1', name: 'Legacy Learner', isGuest: true },
    language: 'id',
    theme: 'light',
    streak: 5,
    lastCompletedDate: null,
    xp: 240,
    unlockedLevels: ['1.1', '2.1', '3.1'],
    completedLevels: ['1.1', '1.4', '3.6'],
  };

  await seedAppState(page, baseUrl, legacyState);
  await navigateTo(page, `${baseUrl}/learn`);
  await waitForText(page, 'Perkenalan & Identitas Diri', 'i');

  const migrated = await page.evaluate(() => {
    const raw = localStorage.getItem('bisigo_state');
    return raw ? JSON.parse(raw) : null;
  });

  assert.ok(migrated, 'bisigo_state must exist after loading /learn');
  assert.equal(migrated.xp, 240, 'Legacy XP should be preserved across migration');
  assert.equal(migrated.streak, 5, 'Legacy streak should be preserved across migration');

  for (const starter of ['1.1', '2.1', '3.1', '4.1']) {
    assert.ok(
      Array.isArray(migrated.unlockedLevels) && migrated.unlockedLevels.includes(starter),
      `Expected starter level ${starter} to be unlocked after legacy migration, got ${JSON.stringify(migrated.unlockedLevels)}`
    );
  }

  // Also verify Unit 4 starter level (4.1) is visually unlocked in the DOM
  await clickElementByText(page, 'button', /^Level\s+4\.1:/i);
  await sleep(200);
  const popoverText = await getBodyText(page);
  assert.match(
    popoverText,
    /MULAI|START|LATIHAN LAGI|PRACTICE/i,
    'Level 4.1 must be unlocked and startable in UI after legacy migration'
  );
  assert.ok(!/Level 4\.1\s+(Terkunci|Locked)/i.test(popoverText), 'Level 4.1 must not appear locked');

  tracker.assertClean('Check6:LegacyMigration');
}

// ---------------------------------------------------------------------------
// Runner Main
// ---------------------------------------------------------------------------

async function runSuite() {
  if (!fs.existsSync(FIREFOX_BIN)) {
    throw new Error(`Firefox binary not found at ${FIREFOX_BIN}`);
  }

  const puppeteer = await loadPuppeteerCore();
  const server = await startLocalServer();
  console.log(`[E2E] Server ready at ${server.url} (${server.mode || 'external'})`);
  console.log(`[E2E] Launching ${FIREFOX_BIN} (headless=${!HEADED}, webgl.disabled=true)`);

  let browser;
  const results = [];

  try {
    browser = await puppeteer.launch({
      browser: 'firefox',
      executablePath: FIREFOX_BIN,
      headless: !HEADED,
      extraPrefsFirefox: {
        'webgl.disabled': true,
      },
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await installVirtualWebcam(page);
    const tracker = attachErrorTracker(page);

    const runTest = async (name, fn) => {
      const start = Date.now();
      try {
        await fn(page, server.url, tracker);
        const ms = Date.now() - start;
        results.push({ name, status: 'PASS', ms });
        console.log(`  PASS  ${name} (${ms}ms)`);
      } catch (err) {
        const ms = Date.now() - start;
        const message = err?.message || String(err);
        results.push({ name, status: 'FAIL', ms, message });
        console.error(`  FAIL  ${name} (${ms}ms)\n        ${message.replace(/\n/g, '\n        ')}`);
      }
    };

    await runTest('0. WebGL1 & WebGL2 disabled + WASM & SecureContext active', testWebGLDisabled);

    if (SMOKE_ONLY) {
      await runTest('1. Baseline route smoke (Home, Learn, Dictionary, Settings, Light/Dark)', testSmokeBaseline);
    } else {
      let unit1State = { testedKamuDetector: false };
      await runTest('1. Learn Page: 4 R1 Unit banners in order & Sidebar /characters link', testLearnPageUnitsAndSidebar);
      await runTest('2. Unit 1 Lesson E2E: word-bank (wrong & right) + chained-camera sequence bar', async (p, u, t) => {
        unit1State = await testUnit1LessonEndToEnd(p, u, t);
      });
      await runTest('3. Characters Page (/characters): Abjad(26), Tips modal, Angka(11), practice flows', testCharactersPageAndPractice);
      await runTest('4. Real Local TFLite Detector (Kamu.jpg) with webgl.disabled=true', (p, u, t) =>
        testRealLocalDetectorInFirefox(p, u, t, unit1State.testedKamuDetector)
      );
      await runTest('5. All Pages Light & Dark Mode + Clean Console + Zero Debug/Roboflow UI copy', testAllPagesThemesAndCleanConsole);
      await runTest('6. Legacy localStorage Migration (3-unit -> 4-unit starter unlock)', testLegacyLocalStorageMigration);
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    await server.stop().catch(() => {});
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n[E2E] Summary: ${passed} passed, ${failed} failed (total ${results.length})`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runSuite().catch(err => {
  console.error('[E2E] Fatal harness error:', err);
  process.exit(1);
});
