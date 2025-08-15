module.exports = {
  apps: [
    {
      name: 'nazenazeai-server',
      cwd: './server',
      script: './node_modules/.bin/tsx',
      args: 'watch src/index.ts',
      watch: false,
      env: { PORT: 3000 },
    },
  ],
};
