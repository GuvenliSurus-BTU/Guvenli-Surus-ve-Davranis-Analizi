module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'scope-enum': [
      2,
      'always',
      [
        'db',
        'api',
        'anomaly',
        'auth',
        'validation',
        'realtime',
        'docs',
        'services',
        'server',
        'tooling',
        'scripts',
        'config',
        'test',
        'release',
      ],
    ],
  },
};
