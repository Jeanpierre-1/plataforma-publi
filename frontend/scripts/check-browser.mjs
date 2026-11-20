// Local smoke check using the installed Chrome/Edge and Node's native CDP client.
// No browser automation dependencies are installed. Artifacts stay in ignored tmp/.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const existingOrigin = process.env['BROWSER_QA_ORIGIN']?.replace(/\/$/, '');
const artifacts = join(root, 'tmp', 'browser-qa', ...(existingOrigin ? ['development'] : []));
await mkdir(artifacts, { recursive: true });

const chromePath = [
  process.env['CHROME_PATH'],
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((path) => path && existsSync(path));
assert(chromePath, 'Set CHROME_PATH to an installed Chrome or Edge executable.');
if (!existingOrigin) {
  assert(existsSync(join(root, 'dist/frontend/server/server.mjs')), 'Run npm run build first.');
}

const port = await new Promise((resolvePort, reject) => {
  const socket = createServer();
  socket.on('error', reject);
  socket.listen(0, '127.0.0.1', () => {
    const address = socket.address();
    socket.close(() => resolvePort(address.port));
  });
});
const origin = existingOrigin ?? `http://localhost:${port}`;
const server = existingOrigin
  ? undefined
  : spawn(process.execPath, ['dist/frontend/server/server.mjs'], {
      cwd: root,
      env: { ...process.env, PORT: String(port) },
      windowsHide: true,
      stdio: 'pipe',
    });
let serverOutput = '';
server?.stdout.on('data', (data) => {
  serverOutput += data;
});
server?.stderr.on('data', (data) => {
  serverOutput += data;
});
let browser;
let socket;
let commandId = 0;
const pending = new Map();
const browserErrors = [];
const apiRequests = [];
const results = [];

function check(name, details) {
  results.push({ name, details });
  console.log(`PASS ${name}${details ? `: ${details}` : ''}`);
}

async function eventually(predicate, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await delay(100);
  }
  throw new Error(`${message}\n${serverOutput}`);
}

function send(method, params = {}, sessionId) {
  const id = ++commandId;
  if (process.env['BROWSER_QA_TRACE'])
    console.error('CDP send', id, method, sessionId ?? 'browser');
  return new Promise((resolveCommand, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolveCommand(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

try {
  await eventually(async () => {
    try {
      return (await fetch(origin)).ok;
    } catch {
      return false;
    }
  }, `Local server did not respond at ${origin}`);

  for (const path of [
    '/',
    '/eventos',
    '/impresiones',
    '/portafolio',
    '/cotizaciones',
    '/contacto',
  ]) {
    const response = await fetch(`${origin}${path}`);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.match(html, /<h1[\s>]/, `${path}: rendered heading without JavaScript`);
    assert.match(html, /name="description"/, `${path}: server metadata`);
    assert.match(html, /<html lang="es"/, `${path}: Spanish language`);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${path}: single page heading`);
  }
  check('Six routes return rendered content and SEO without JavaScript');
  const missing = await fetch(`${origin}/pagina-que-no-existe`);
  assert.equal(missing.status, 404);
  const missingHtml = await missing.text();
  assert.match(missingHtml, /Esta página no está aquí/);
  assert.match(missingHtml, /noindex, follow/);
  check('Unknown URLs render a real HTTP 404 with noindex');

  browser = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${join(artifacts, `profile-${Date.now()}`)}`,
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      'about:blank',
    ],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
  );
  if (process.env['BROWSER_QA_TRACE'])
    browser.stderr.on('data', (data) => process.stderr.write(data));
  const debuggerUrl = await new Promise((resolveUrl, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Browser debugging endpoint did not start.')),
      15000,
    );
    browser.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    browser.stderr.on('data', (data) => {
      const match = String(data).match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolveUrl(match[1]);
      }
    });
  });
  socket = new WebSocket(debuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (process.env['BROWSER_QA_TRACE'])
      console.error('CDP received', message.id ?? message.method, message.error ?? '');
    if (message.id) {
      const promise = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) promise?.reject(new Error(JSON.stringify(message.error)));
      else promise?.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown')
      browserErrors.push(message.params.exceptionDetails);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      // Network 404s are checked separately at the HTTP layer.
      if (message.params.entry.source !== 'network') browserErrors.push(message.params.entry);
    }
    if (
      message.method === 'Runtime.consoleAPICalled' &&
      ['error', 'warning'].includes(message.params.type)
    ) {
      browserErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    }
    if (
      message.method === 'Network.requestWillBeSent' &&
      message.params.request.url.includes('/api/v1')
    )
      apiRequests.push(message.params.request.url);
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params = {}) => send(method, params, sessionId);
  await page('Page.enable');
  await page('Runtime.enable');
  await page('Log.enable');
  await page('Network.enable');
  const evaluate = async (expression) => {
    const result = await page('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const navigate = async (path) => {
    await page('Page.navigate', { url: `${origin}${path}` });
    await eventually(
      () => evaluate(`document.readyState === 'complete' && !!document.querySelector('h1')`),
      `Page did not load: ${path}`,
    );
    await delay(200);
  };
  const resize = (width, height = 900) =>
    page('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });

  const capture = async (name) => {
    await evaluate(`scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`);
    await eventually(
      () =>
        evaluate(`[...document.images].every(image => image.complete && image.naturalWidth > 0)`),
      'Deferred images did not load',
    );
    await evaluate(`scrollTo({ top: 0, behavior: 'instant' })`);
    const screenshot = await page('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    await writeFile(join(artifacts, `${name}.png`), Buffer.from(screenshot.data, 'base64'));
  };

  const checkTextContrast = async () => {
    const failures = await evaluate(`(() => {
      const rgb = value => (value.match(/[\\d.]+/g) || []).map(Number);
      const luminance = color => color.slice(0, 3).map(value => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      }).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
      const background = element => {
        for (let parent = element; parent; parent = parent.parentElement) {
          const color = rgb(getComputedStyle(parent).backgroundColor);
          if (color.length === 3 || color[3] === 1) return color;
        }
        return [255, 255, 255];
      };
      const failures = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const element = node.parentElement;
        if (!node.textContent.trim() || !element.checkVisibility() || element.closest('script, style, svg')) continue;
        const style = getComputedStyle(element);
        const foreground = luminance(rgb(style.color));
        const backdrop = luminance(background(element));
        const ratio = (Math.max(foreground, backdrop) + .05) / (Math.min(foreground, backdrop) + .05);
        const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.667 && parseFloat(style.fontWeight) >= 700);
        if (ratio < (large ? 3 : 4.5)) failures.push({ text: node.textContent.trim(), ratio });
      }
      return failures;
    })()`);
    assert.deepEqual(failures, [], `Insufficient text contrast: ${JSON.stringify(failures)}`);
  };

  for (const width of [320, 375, 768, 1024, 1440]) {
    await resize(width);
    await navigate('/');
    const layout = await evaluate(`({
      width: document.documentElement.clientWidth,
      contentWidth: document.documentElement.scrollWidth,
      imagesReady: [...document.images].every(image => {
        const bounds = image.getBoundingClientRect();
        return bounds.bottom <= 0 || bounds.top >= innerHeight || (image.complete && image.naturalWidth > 0);
      }),
      mainCount: document.querySelectorAll('main').length,
      headingCount: document.querySelectorAll('h1').length,
      menuVisible: getComputedStyle(document.querySelector('.menu-toggle')).display !== 'none',
      navigationVisible: getComputedStyle(document.querySelector('#public-navigation')).display !== 'none',
      focusVisible: [...document.styleSheets].some(sheet => { try { return [...sheet.cssRules].some(rule => rule.selectorText?.includes(':focus-visible')); } catch { return false; } }),
      labelsPresent: [...document.querySelectorAll('button, a')].every(element => (element.getAttribute('aria-label') || element.textContent).trim()),
    })`);
    assert(
      layout.contentWidth <= layout.width,
      `Horizontal overflow at ${width}px: ${JSON.stringify(layout)}`,
    );
    assert(layout.imagesReady && layout.mainCount === 1 && layout.headingCount === 1);
    assert(layout.focusVisible && layout.labelsPresent);
    assert.equal(layout.menuVisible, width < 1024);
    assert.equal(layout.navigationVisible, width >= 1024);
    await checkTextContrast();
    if ([375, 1440].includes(width)) {
      await capture(`home-${width}`);
    }
    check(
      `Responsive home at ${width}px`,
      'no overflow, image loaded, named controls and one main/h1',
    );
  }

  for (const width of [320, 375, 768, 1024, 1440]) {
    await resize(width);
    for (const path of ['/eventos', '/impresiones', '/portafolio', '/cotizaciones']) {
      await navigate(path);
      const layout = await evaluate(`({
        width: document.documentElement.clientWidth,
        contentWidth: document.documentElement.scrollWidth,
        mainCount: document.querySelectorAll('main').length,
        headingCount: document.querySelectorAll('h1').length,
        formCount: document.querySelectorAll('form').length,
      })`);
      assert(layout.contentWidth <= layout.width, `Horizontal overflow on ${path} at ${width}px`);
      assert(layout.mainCount === 1 && layout.headingCount === 1);
      assert.equal(layout.formCount, path === '/cotizaciones' ? 1 : 0);
      await checkTextContrast();
      if ([375, 1440].includes(width)) await capture(`${path.slice(1)}-${width}`);
    }
    check(
      `Services, portfolio and quotations at ${width}px`,
      'no overflow, one main/h1 and readable text',
    );
  }

  await resize(375);
  for (const path of ['/eventos', '/impresiones']) {
    await navigate(path);
    await evaluate(`document.querySelector('summary').focus()`);
    await page('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      text: '\r',
      unmodifiedText: '\r',
      windowsVirtualKeyCode: 13,
    });
    await page('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
    });
    assert(
      await evaluate(`document.querySelector('details').open`),
      `${path}: FAQ keyboard toggle`,
    );
    await checkTextContrast();
    await evaluate(`document.querySelector('a[href="${path}#preparar-proyecto"]').click()`);
    await eventually(
      () =>
        evaluate(
          `location.hash === '#preparar-proyecto' && Math.abs(document.querySelector('#preparar-proyecto').getBoundingClientRect().top) < 60`,
        ),
      `${path}: preparation anchor did not scroll`,
    );
    assert(await evaluate(`!document.querySelector('form')`));
  }
  check(
    'Service FAQs open with the keyboard and preparation anchors scroll without submitting data',
  );

  await navigate('/portafolio');
  assert(
    await evaluate(
      `document.body.textContent.includes('No hay proyectos publicados por el momento.') && document.querySelector('meta[name="robots"]').content === 'noindex, follow'`,
    ),
  );
  await evaluate(`document.querySelector('.service-link[href="/eventos"]').click()`);
  await eventually(
    () =>
      evaluate(
        `location.pathname === '/eventos' && document.querySelector('h1')?.textContent === 'Eventos musicales'`,
      ),
    'Portfolio service link did not navigate',
  );
  await evaluate(`document.querySelector('.related-service a').click()`);
  await eventually(
    () =>
      evaluate(
        `location.pathname === '/impresiones' && document.querySelector('h1')?.textContent === 'Gigantografías e impresiones'`,
      ),
    'Related service link did not navigate',
  );
  await evaluate(`document.querySelector('app-project-cta a').click()`);
  await eventually(
    () =>
      evaluate(
        `location.pathname === '/cotizaciones' && document.querySelector('#quote-total')?.textContent.trim() === 'S/ 210.00'`,
      ),
    'Quotation link did not navigate',
  );
  check('Empty portfolio, related services and quotation links navigate correctly');

  const enterQuoteValue = async (id, value) => {
    await evaluate(`(() => {
      const input = document.getElementById(${JSON.stringify(id)});
      input.value = ${JSON.stringify(value)};
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
  };
  const expectQuoteTotal = (amount) =>
    eventually(
      () =>
        evaluate(
          `document.querySelector('#quote-total').textContent.trim() === ${JSON.stringify(amount)}`,
        ),
      `Quotation total did not become ${amount}`,
    );

  await navigate('/cotizaciones');
  await expectQuoteTotal('S/ 210.00');
  assert(await evaluate(`document.querySelector('#quote-area').textContent === '21 m²'`));
  await enterQuoteValue('quote-rate', '12');
  await expectQuoteTotal('S/ 252.00');
  await evaluate(`document.querySelector('#quote-slats').focus()`);
  await page('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: ' ',
    code: 'Space',
    text: ' ',
    windowsVirtualKeyCode: 32,
  });
  await page('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: ' ',
    code: 'Space',
    windowsVirtualKeyCode: 32,
  });
  await eventually(
    () => evaluate(`!!document.querySelector('#quote-slats-price')`),
    'Slat price did not open with the keyboard',
  );
  await expectQuoteTotal('—');
  await enterQuoteValue('quote-slats-price', '20,50');
  await expectQuoteTotal('S/ 272.50');
  await checkTextContrast();
  await capture('cotizaciones-listones-375');
  await evaluate(`document.querySelector('#quote-slats-price').focus()`);
  await page('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Enter',
    code: 'Enter',
    text: '\r',
    windowsVirtualKeyCode: 13,
  });
  await page('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
  });
  await delay(150);
  await expectQuoteTotal('S/ 272.50');
  assert(await evaluate(`location.pathname === '/cotizaciones' && !location.search`));
  await evaluate(`document.querySelector('#quote-slats').click()`);
  await expectQuoteTotal('S/ 252.00');
  assert(await evaluate(`!document.querySelector('#quote-slats-price')`));
  await enterQuoteValue('quote-width', '-1');
  await expectQuoteTotal('—');
  assert(
    await evaluate(
      `document.querySelector('#quote-width').getAttribute('aria-invalid') === 'true' && !!document.querySelector('#quote-width-error')`,
    ),
  );
  await checkTextContrast();
  await enterQuoteValue('quote-width', '2,5');
  await enterQuoteValue('quote-height', '1,2');
  await enterQuoteValue('quote-rate', '10,10');
  await expectQuoteTotal('S/ 30.30');
  await enterQuoteValue('quote-rate', '10.001');
  await expectQuoteTotal('—');
  await evaluate(`document.querySelector('[data-action="reset-quote"]').click()`);
  await expectQuoteTotal('S/ 210.00');
  assert(
    await evaluate(
      `document.querySelector('#quote-width').value === '7' && document.querySelector('#quote-height').value === '3' && !document.querySelector('#quote-slats').checked && !document.querySelector('.field-error')`,
    ),
  );
  check(
    'Quotation calculator updates editable prices, decimal measurements and optional slats; invalid values clear the total and reset restores the example',
  );

  await enterQuoteValue('quote-quantity', '2');
  await expectQuoteTotal('S/ 420.00');
  await evaluate(`document.querySelector('#quote-slats').click()`);
  await eventually(
    () => evaluate(`!!document.querySelector('#quote-slats-price')`),
    'Slats did not open',
  );
  await enterQuoteValue('quote-slats-price', '20');
  await expectQuoteTotal('S/ 440.00');

  const addQuoteItem = async (id) => {
    await evaluate(`document.querySelector('[data-action="add-item"]').click()`);
    await eventually(
      () => evaluate(`document.activeElement?.id === ${JSON.stringify(id + '-description')}`),
      'New item did not receive keyboard focus',
    );
  };
  const fillQuoteItem = async (id, quantity, width, height, rate) => {
    await enterQuoteValue(`${id}-description`, 'Gráfica de ingreso');
    await enterQuoteValue(`${id}-quantity`, quantity);
    await enterQuoteValue(`${id}-width`, width);
    await enterQuoteValue(`${id}-height`, height);
    await enterQuoteValue(`${id}-rate`, rate);
  };
  const removeQuoteItem = async (id) => {
    await evaluate(
      `document.querySelector('[data-item-id="${id}"] [data-action="remove-item"]').click()`,
    );
  };

  await addQuoteItem('quote-2');
  await expectQuoteTotal('—');
  await fillQuoteItem('quote-2', '3', '2', '1', '15');
  await expectQuoteTotal('S/ 530.00');
  assert(
    await evaluate(
      `document.querySelector('#quote-total-quantity').textContent === '5' && document.querySelector('#quote-area').textContent === '48 m²'`,
    ),
  );
  for (const width of [320, 375, 768, 1024, 1440]) {
    await resize(width);
    assert(
      await evaluate(
        `document.documentElement.scrollWidth <= document.documentElement.clientWidth`,
      ),
      `Multiple-item quotation overflows at ${width}px`,
    );
    assert(
      await evaluate(
        `(() => { const ids = [...document.querySelectorAll('[id]')].map(element => element.id); return ids.length === new Set(ids).size; })()`,
      ),
      'Quotation contains duplicate IDs',
    );
    await checkTextContrast();
    if ([375, 1440].includes(width)) await capture(`cotizaciones-varios-items-${width}`);
  }
  await enterQuoteValue('quote-quantity', '3');
  await expectQuoteTotal('S/ 740.00');
  await removeQuoteItem('quote');
  await expectQuoteTotal('S/ 90.00');
  await eventually(
    () => evaluate(`document.activeElement?.id === 'quote-2-description'`),
    'Focus was lost after deleting an item',
  );
  await addQuoteItem('quote-3');
  await enterQuoteValue('quote-3-width', '-1');
  await addQuoteItem('quote-4');
  await fillQuoteItem('quote-4', '1', '1', '1', '10');
  await expectQuoteTotal('—');
  await removeQuoteItem('quote-3');
  await expectQuoteTotal('S/ 100.00');
  assert(
    await evaluate(
      `document.querySelector('#quote-4-width').value === '1' && !document.querySelector('#quote-4-width-error')`,
    ),
  );
  await removeQuoteItem('quote-2');
  await expectQuoteTotal('S/ 10.00');
  await removeQuoteItem('quote-4');
  await expectQuoteTotal('—');
  await eventually(
    () => evaluate(`document.activeElement === document.querySelector('[data-action="add-item"]')`),
    'Empty quotation did not restore focus to Add item',
  );
  assert(await evaluate(`document.body.textContent.includes('Agrega tu primera pieza.')`));
  await addQuoteItem('quote-5');
  assert(await evaluate(`document.querySelector('#quote-5-quantity').value === '1'`));
  await evaluate(`document.querySelector('[data-action="reset-quote"]').click()`);
  await expectQuoteTotal('S/ 210.00');
  assert(
    await evaluate(
      `document.querySelectorAll('app-quote-item-editor').length === 1 && !document.querySelector('.field-error')`,
    ),
  );
  check(
    'Multiple-item quotations sum quantities, areas and slats, remain responsive, preserve surviving inputs after deletion and manage keyboard focus',
  );

  await resize(375);
  await navigate('/');
  // Wait for hydration: a native click must update signal-controlled ARIA state.
  await eventually(async () => {
    await evaluate(`document.querySelector('.menu-toggle').click()`);
    await delay(100);
    return evaluate(
      `document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true'`,
    );
  }, 'Menu did not hydrate');
  assert(
    await evaluate(
      `getComputedStyle(document.querySelector('#public-navigation')).display !== 'none'`,
    ),
  );
  await checkTextContrast();
  await evaluate(`document.querySelector('.menu-toggle').focus()`);
  await page('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });
  assert(
    await evaluate(`document.activeElement === document.querySelector('#public-navigation a')`),
  );
  await page('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });
  await evaluate(`document.querySelector('#public-navigation a').focus()`);
  await page('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await page('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await delay(100);
  assert(
    await evaluate(
      `document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false' && document.activeElement === document.querySelector('.menu-toggle')`,
    ),
  );
  check('Hydrated mobile menu opens, closes with Escape and restores focus');

  await evaluate(`document.querySelector('.menu-toggle').click()`);
  await delay(100);
  await evaluate(`document.querySelector('header a[href="/eventos"]').click()`);
  await eventually(
    () =>
      evaluate(
        `location.pathname === '/eventos' && document.querySelector('h1')?.textContent === 'Eventos musicales'`,
      ),
    'SPA navigation did not finish',
  );
  assert(
    await evaluate(
      `document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false' && document.activeElement?.id === 'contenido'`,
    ),
  );
  assert(
    await evaluate(
      `document.querySelector('header a[href="/eventos"]').getAttribute('aria-current') === 'page'`,
    ),
  );
  check('SPA navigation closes mobile menu, marks the active link and focuses main content');

  for (const path of ['/impresiones', '/portafolio', '/cotizaciones', '/contacto']) {
    await navigate(path);
    assert(
      await evaluate(
        `document.documentElement.scrollWidth <= document.documentElement.clientWidth && !!document.querySelector('meta[name="description"]').content`,
      ),
    );
    await checkTextContrast();
  }
  await navigate('/cotizaciones');
  assert(
    await evaluate(
      `!!document.querySelector('.quote-form') && !document.querySelector('button[type="submit"]') && document.body.textContent.includes('No se guarda ni se envía una solicitud.')`,
    ),
  );
  check('Public routes work on mobile; quotations calculate locally without a submission flow');
  check('Visible text meets AA contrast thresholds on public pages and the mobile menu');

  await navigate('/');
  await evaluate(`document.querySelector('.skip-link').focus()`);
  await page('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
  });
  await page('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
  });
  await eventually(
    () => evaluate(`document.activeElement?.id === 'contenido'`),
    'Skip link did not focus main content',
  );
  check('Keyboard skip link focuses the main content');
  await delay(300);
  await evaluate(`document.querySelector('a[href="/#servicios"]').click()`);
  try {
    await eventually(
      () =>
        evaluate(
          `location.hash === '#servicios' && Math.abs(document.querySelector('#servicios').getBoundingClientRect().top) < 60`,
        ),
      'Services anchor did not scroll',
    );
  } catch (error) {
    const position = await evaluate(
      `({ hash: location.hash, scroll: scrollY, target: document.querySelector('#servicios').getBoundingClientRect().top })`,
    );
    throw new Error(`${error.message}: ${JSON.stringify(position)}`);
  }
  check('Explore services navigates to the services section');

  await page('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  assert(
    await evaluate(
      `matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.documentElement).scrollBehavior === 'auto' && getComputedStyle(document.querySelector('a[appbutton]')).transitionDuration === '0s'`,
    ),
  );
  check('Reduced motion disables smooth scrolling and button transitions');

  const { nodes } = await page('Accessibility.getFullAXTree');
  assert(nodes.some((node) => node.role?.value === 'main'));
  assert(nodes.filter((node) => node.role?.value === 'navigation').length >= 1);
  assert(
    nodes.some(
      (node) =>
        node.role?.value === 'heading' &&
        node.properties?.some(
          (property) => property.name === 'level' && property.value.value === 1,
        ),
    ),
  );
  check('Browser accessibility tree exposes landmarks and a level-one heading');

  assert.equal(apiRequests.length, 0, 'Commercial pages must not contact the future API');
  assert.deepEqual(
    browserErrors,
    [],
    `Browser errors or warnings: ${JSON.stringify(browserErrors)}`,
  );
  check('No browser errors, hydration warnings or API requests');
  await writeFile(
    join(artifacts, 'results.json'),
    JSON.stringify(
      {
        origin,
        mode: existingOrigin ? 'existing-server' : 'production',
        results,
        browserErrors,
        apiRequests,
      },
      null,
      2,
    ),
  );
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try {
      await send('Browser.close');
    } catch {
      /* Process may close before acknowledgement. */
    }
    socket.close();
  }
  browser?.kill();
  server?.kill();
}
