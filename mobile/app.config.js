export default ({ config }) => ({
  ...config,
  name: 'NazenazeAI',
  slug: 'nazenazeai',
  scheme: 'nazenazeai',
  extra: {
    API_BASE_URL: process.env.API_BASE_URL || 'https://3000-ibwodaj4kacyh39l8w8vb-6532622b.e2b.dev',
    AUTH_TOKEN: process.env.AUTH_TOKEN || 'dev-token'
  }
});
