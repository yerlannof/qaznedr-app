import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('ping-search-engines script', () => {
  it('fails with current guidance without calling curl or claiming success', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'qaznedr-ping-test-'));
    const curlCalls = path.join(tempDir, 'curl-calls');
    const curlStub = path.join(tempDir, 'curl');
    writeFileSync(curlStub, `#!/bin/sh\necho called >> "${curlCalls}"\n`, {
      mode: 0o755,
    });

    try {
      const result = spawnSync(
        'bash',
        [path.resolve(process.cwd(), 'scripts/ping-search-engines.sh')],
        {
          encoding: 'utf8',
          env: { ...process.env, PATH: `${tempDir}:${process.env.PATH}` },
        }
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('sitemap ping is no longer supported');
      expect(result.stderr).toContain('robots.txt or Search Console');
      expect(result.stderr).toContain('IndexNow');
      expect(result.stdout).not.toContain('Done');
      expect(result.error).toBeUndefined();
      expect(existsSync(curlCalls)).toBe(false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
