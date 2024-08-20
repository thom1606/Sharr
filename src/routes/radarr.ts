import express from 'express';
import { type MediaItem, PlexMediaType, getWatchlist } from '../utils/plex';

export const radarrRoute = express().get('/radarr', async (_, res) => {
	// get the watchlist from all the users
	const clients = [
		process.env.PLEX_OWNER_TOKEN,
		...(process.env.PLEX_EXTRA_USER_TOKENS ?? '').split(','),
	].filter((token) => Boolean(token) && (token ?? '').length > 0);
	const finalWatchlist: MediaItem[] = [];

	const includeStreamable =
		(process.env.IGNORE_PREFERRED_SERVICES ?? '') === 'true';
	for (const client of clients) {
		if (!client) {
			continue;
		}
		const watchlist = (
			await getWatchlist(client, PlexMediaType.Movie, includeStreamable)
		).filter((item) => Boolean(item.tmdbId));
		finalWatchlist.push(...watchlist);
	}

	res.json(
		finalWatchlist.map((item) => ({
			id: item.tmdbId,
		})),
	);
});
