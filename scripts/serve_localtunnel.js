const localtunnel = require('localtunnel');

async function start() {
  console.log('🚀 Connecting CarbonRoute to Public HTTPS URL with custom subdomain...');
  try {
    const tunnel = await localtunnel({
      port: 5000,
      subdomain: 'carbonroute'
    });

    console.log('================================================================');
    console.log('🎉 CARBONROUTE PUBLIC LIVE HTTPS URL:');
    console.log(tunnel.url);
    console.log('================================================================');

    tunnel.on('close', () => {
      console.log('Tunnel connection closed. Reconnecting in 5s...');
      setTimeout(start, 5000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
      setTimeout(start, 5000);
    });
  } catch (err) {
    console.error('Failed to create tunnel:', err);
    setTimeout(start, 5000);
  }
}

start();
