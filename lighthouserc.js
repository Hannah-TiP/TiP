module.exports = {
  ci: {
    collect: {
      // Use the production build
      startServerCommand: 'node .next/standalone/server.js',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dream-hotels',
        'http://localhost:3000/sign-in',
      ],
      numberOfRuns: 1, // keep CI fast; increase for more stable scores
      settings: {
        preset: 'desktop',
        // Skip checks that don't apply in CI (no HTTPS, no HTTP/2)
        skipAudits: ['redirects-http', 'uses-http2'],
      },
    },
    assert: {
      assertions: {
        // Performance: warn at 60, fail at 40
        'categories:performance': ['warn', { minScore: 0.6, aggregationMethod: 'median-run' }],
        // Accessibility: warn at 80, fail at 60
        'categories:accessibility': ['error', { minScore: 0.6, aggregationMethod: 'median-run' }],
        // Best practices: warn at 80
        'categories:best-practices': ['warn', { minScore: 0.8, aggregationMethod: 'median-run' }],
        // SEO: warn at 80
        'categories:seo': ['warn', { minScore: 0.8, aggregationMethod: 'median-run' }],
      },
    },
    upload: {
      // Store reports as CI artifacts (no external server needed)
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
