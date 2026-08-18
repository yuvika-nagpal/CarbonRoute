import { startTunnel } from 'untun';

async function main() {
  console.log('🚀 Initializing Public Cloudflare HTTPS Tunnel for CarbonRoute...');
  try {
    const tunnel = await startTunnel({
      port: 5000,
      acceptCloudflareNotice: true,
    });

    const url = await tunnel.getURL();
    console.log('================================================================');
    console.log('🎉 CARBONROUTE PUBLIC LIVE HTTPS URL:');
    console.log(url);
    console.log('================================================================');

    // Keep process alive
    setInterval(() => {}, 60000);
  } catch (err) {
    console.error('Cloudflare tunnel failed:', err);
    process.exit(1);
  }
}

main();
