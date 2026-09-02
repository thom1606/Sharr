import { getPlexTokens, getPort } from './src/config';
import { healthHandler } from './src/routes/health';
import { radarrHandler } from './src/routes/radarr';
import { sonarrHandler } from './src/routes/sonarr';

const routes: Record<string, () => Promise<Response>> = {
	'/health': healthHandler,
	'/radarr': radarrHandler,
	'/sonarr': sonarrHandler,
};

if (getPlexTokens().length === 0) {
	console.warn(
		'[sharr] No Plex token configured. Set PLEX_OWNER_TOKEN, otherwise every list stays empty.',
	);
}

const server = Bun.serve({
	port: getPort(),
	// Building a large watchlist takes more than the 10s default, which would
	// otherwise drop the connection while Radarr/Sonarr is still waiting.
	idleTimeout: 120,
	async fetch(req) {
		const { pathname } = new URL(req.url);
		const handler = routes[pathname];

		if (!handler) {
			return new Response('Not Found', { status: 404 });
		}

		return await handler();
	},
	error(error) {
		// Never let an unexpected throw take the process down
		console.error('[sharr] unhandled error:', error);
		return Response.json(
			{ error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
			{ status: 500 },
		);
	},
});

console.log(`Listening on http://localhost:${server.port}`);

// Handle graceful shutdown
const shutdown = async () => {
	await server.stop();
	process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
