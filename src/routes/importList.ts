import { getCombinedWatchlist, WatchlistError } from '../services/watchlist';
import type { MediaItem, PlexMediaType } from '../utils/plex';

/**
 * Build an import list response for one of the *arr services.
 *
 * @param mediaType What type of media the service expects
 * @param idOf Picks the external id the service needs, if the item has one
 * @param toEntry Turns that id into the entry shape the service expects
 */
export const importListResponse = async <T>(
	mediaType: PlexMediaType,
	idOf: (item: MediaItem) => string | undefined,
	toEntry: (id: string) => T,
): Promise<Response> => {
	let watchlist: MediaItem[];

	try {
		watchlist = await getCombinedWatchlist(mediaType);
	} catch (error) {
		const client = error instanceof WatchlistError ? error.client : 'unknown';
		console.error(`[sharr] watchlist failed for ${client}:`, error);

		return Response.json(
			{
				error: `Failed to get watchlist for client: ${client}`,
				code: 'FAILED_TO_GET_WATCHLIST',
				client,
			},
			{ status: 500 },
		);
	}

	// Only export items the service can actually match on, without duplicates
	const ids = new Set<string>();
	for (const item of watchlist) {
		const id = idOf(item);
		if (id) {
			ids.add(id);
		}
	}

	return Response.json([...ids].map(toEntry));
};
