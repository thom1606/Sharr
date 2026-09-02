import { getPlexTokens, maskToken } from '../config';
import { getHealthCheck } from '../utils/plex';

export async function healthHandler(): Promise<Response> {
	const tokens = getPlexTokens();

	if (tokens.length === 0) {
		return Response.json(
			{
				error: 'No Plex tokens configured',
				code: 'NO_TOKENS_CONFIGURED',
			},
			{ status: 503 },
		);
	}

	// Check every account at once instead of one after another
	const results = await Promise.all(
		tokens.map(async (token) => ({
			client: maskToken(token),
			healthy: await getHealthCheck(token),
		})),
	);

	const failed = results.filter((result) => !result.healthy);
	if (failed.length > 0) {
		const clients = failed.map((result) => result.client);
		console.error(`[sharr] health check failed for: ${clients.join(', ')}`);

		return Response.json(
			{
				error: `Failed health check for users: ${clients.join(', ')}`,
				code: 'PLEX_TOKEN_INVALID',
				clients,
			},
			{ status: 401 },
		);
	}

	return Response.json({ status: 'ok', clients: results.length });
}
