module.exports = {
  apps: [
    {
      name: 'nazenazeai-server',
      cwd: './server',
      script: './node_modules/.bin/ts-node-dev',
      args: '--respawn --transpile-only src/index.ts',
      watch: false,
      env: { PORT: 3000 },
    },
  ],
};
