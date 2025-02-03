import { getHealthCheck } from '../utils/plex';

export async function healthHandler(req: Request) {
	// get all the active plex tokens
	const clients = [
		process.env.PLEX_OWNER_TOKEN,
		...(process.env.PLEX_EXTRA_USER_TOKENS ?? '').split(','),
	].filter((token) => Boolean(token) && (token ?? '').length > 0);

	// Check the health of all the clients
	for (const client of clients) {
		if (!client) {
			continue;
		}
		try {
			// Try to get the health check for the client
			if (!(await getHealthCheck(client))) {
				throw new Error('Failed to get health check');
			}
		} catch {
			// If a single client fails, return a 401
			return Response.json(
				{
					error: `Failed health check for user: ${client}`,
					client,
				},
				{ status: 401 },
			);
		}
	}

	// If all clients are healthy, return a 200
	return Response.json({ status: 'ok' });
}
