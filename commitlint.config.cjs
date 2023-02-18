const {
  utils: { getProjects },
} = require('@commitlint/config-nx-scopes');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': async (ctx) => [
      2,
      'always',
      // For now don't filter nx packages, return all
      [...(await getProjects(ctx).then((packages) => packages))],
    ],
  },
};
