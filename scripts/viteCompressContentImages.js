import path from 'node:path';
import { compressContentImages } from './compress-content-images.mjs';

/**
 * Runs the content JPG compressor on build/dev start and whenever a JPG
 * is added or changed under src/content.
 */
export function compressContentImagesPlugin() {
  const contentDir = path.resolve('src/content');
  let running = null;
  let pending = false;
  let timer = 0;

  function log(message) {
    if (message.includes(': skipped')) return;
    console.log(`[compress:images] ${message}`);
  }

  async function run() {
    if (running) {
      pending = true;
      return running;
    }
    running = compressContentImages({ log })
      .catch((error) => {
        console.error('[compress:images]', error);
      })
      .finally(() => {
        running = null;
        if (pending) {
          pending = false;
          schedule();
        }
      });
    return running;
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = 0;
      run();
    }, 250);
  }

  function isContentJpg(file) {
    if (!/\.jpe?g$/i.test(file)) return false;
    const resolved = path.resolve(file);
    return (
      resolved === contentDir ||
      resolved.startsWith(contentDir + path.sep)
    );
  }

  return {
    name: 'compress-content-images',
    async buildStart() {
      await run();
    },
    configureServer(server) {
      run();
      const onFile = (file) => {
        if (!isContentJpg(file)) return;
        schedule();
      };
      server.watcher.add(contentDir);
      server.watcher.on('add', onFile);
      server.watcher.on('change', onFile);
    },
  };
}
