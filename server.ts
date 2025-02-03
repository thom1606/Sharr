import type { ServeOptions } from 'bun';
import { healthHandler } from './src/routes/health';
import { radarrHandler } from './src/routes/radarr';
import { sonarrHandler } from './src/routes/sonarr';

const server = Bun.serve({
	port: 6464,
	async fetch(req) {
		const url = new URL(req.url);

		// Route handlers
		switch (url.pathname) {
			case '/health':
				return await healthHandler(req);
			case '/radarr':
				return await radarrHandler(req);
			case '/sonarr':
				return await sonarrHandler(req);
			default:
				return new Response('Not Found', { status: 404 });
		}
	},
});

console.log(`Listening on http://localhost:${server.port}`);

// Handle graceful shutdown
process.on('SIGTERM', () => server.stop());
process.on('SIGINT', () => server.stop());
