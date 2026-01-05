import { type MediaItem, PlexMediaType, getWatchlist } from '../utils/plex';

export async function sonarrHandler(req: Request) {
	// get the watchlist from all the users
	const clients = [
		process.env.PLEX_OWNER_TOKEN,
		...(process.env.PLEX_EXTRA_USER_TOKENS ?? '').split(','),
	].filter((token) => Boolean(token) && (token ?? '').length > 0);
	const finalWatchlist: MediaItem[] = [];

	// Whether or not to include streamable items
	const includeStreamable =
		(process.env.IGNORE_PREFERRED_SERVICES ?? '') === 'true';

	for (const client of clients) {
		if (!client) {
			continue;
		}
		try {
			const watchlist = (
				await getWatchlist(client, PlexMediaType.Show, includeStreamable)
			).filter((item) => Boolean(item.tmdbId));
			finalWatchlist.push(...watchlist);
		} catch {
			return Response.json(
				{
					error: `Failed to get watchlist for client: ${client}`,
					code: 'FAILED_TO_GET_WATCHLIST',
					client,
				},
				{ status: 500 },
			);
		}
	}

	// Map the response to a valid Sonarr response
	return Response.json(
		finalWatchlist.map((item) => ({
			tvdbId: item.tvdbId,
		})),
	);
}
