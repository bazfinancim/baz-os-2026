module.exports = {
  apps: [{
    name: 'baz-panel',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/baz-panel',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      N8N_COMPANY_PING_WEBHOOK: 'https://n8n.baz-f.co.il/webhook/company-ping',
      N8N_GLOBAL_SYNC_WEBHOOK: 'https://n8n.baz-f.co.il/webhook/global-sync',
      BASE44_API_KEY: 'apk-69f0ecbea8b87cb75fe513c9-default'
    }
  }]
};