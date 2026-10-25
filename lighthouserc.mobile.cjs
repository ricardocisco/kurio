/**
 * Lighthouse CI: mobile profile (Moto G Power emulation, slow 4G throttling). Audits the optimized build (`npm run build`) served by
 * `vite preview`, with the default mock scenario. 3 runs per URL; LHCI reports the median run.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:4173/', 'http://localhost:4173/nfts/emerald-ape-0042'],
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['warn', { minScore: 0.9, aggregationMethod: 'median-run' }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './docs/lighthouse/mobile',
      reportFilenamePattern: '%%HOSTNAME%%%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
