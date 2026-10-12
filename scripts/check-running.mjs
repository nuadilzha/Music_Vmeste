import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';
import { SourceTextModule } from 'node:vm';

const devOrigin = process.env.DEV_ORIGIN || 'http://localhost:3000';
const appOrigin = process.env.CHECK_ORIGIN || 'http://localhost:3001';
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  return response.text();
}
const devHtml = await get(devOrigin);
assert(devHtml.includes('id="root"'));
const main = await get(new URL('/src/main.tsx', devOrigin));
const moduleUrls = [...new Set([...main.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]))];
await Promise.all(moduleUrls.map((url) => get(new URL(url, devOrigin))));
await get(new URL('/@react-refresh', devOrigin));
await get(new URL('/@vite/client', devOrigin));
console.log(
  'Development: client entry, React, dependencies and refresh runtime load successfully.',
);

const html = await get(appOrigin);
const scriptUrl = /<script\b[^>]*\bsrc="([^"]+)"/.exec(html)?.[1];
assert(scriptUrl, 'Built client script is missing');
const bundle = await get(new URL(scriptUrl, appOrigin));
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(error.message));
const dom = new JSDOM(html, {
  url: appOrigin,
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole,
});
try {
  dom.window.fetch = (url, options) => fetch(new URL(url, appOrigin), options);
  dom.window.scrollTo = () => {};
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const clientModule = new SourceTextModule(bundle, {
    context: dom.getInternalVMContext(),
    initializeImportMeta(meta) {
      meta.url = new URL(scriptUrl, appOrigin).href;
    },
  });
  await clientModule.link(() => {
    throw new Error('Unexpected external import in built client');
  });
  await clientModule.evaluate();
  const deadline = Date.now() + 10000;
  while (
    !dom.window.document.getElementById('root').textContent.includes('Ваш звук.') &&
    Date.now() < deadline &&
    !errors.length
  ) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.deepEqual(errors, [], 'Client runtime errors');
  const root = dom.window.document.getElementById('root');
  assert(
    root.textContent.includes('Ваш звук.'),
    `Home did not render: ${root.textContent.slice(0, 500)}`,
  );
  assert(root.querySelectorAll('.profile-card').length > 0, 'Profile cards did not render');
  globalThis.console.log(
    `Built client: React rendered the home page and ${root.querySelectorAll('.profile-card').length} cards with the running API.`,
  );
} catch (error) {
  globalThis.console.error(`${error.name}: ${error.message}`);
  process.exitCode = 1;
} finally {
  dom.window.close();
}
