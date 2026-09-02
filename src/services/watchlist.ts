import {
	getCacheTtlMs,
	getPlexTokens,
	ignorePreferredServices,
	maskToken,
} from '../config';
import { SingleFlightCache } from '../utils/cache';
import {
	getWatchlist,
	type MediaItem,
	type PlexMediaType,
} from '../utils/plex';

/**
 * Raised when one of the configured Plex accounts could not be read.
 *
 * Only the masked token is kept: error objects end up in the logs verbatim, so
 * the raw token must never be attached to one.
 */
export class WatchlistError extends Error {
	readonly client: string;

	constructor(client: string, cause: unknown) {
		super(`Failed to get watchlist: ${(cause as Error)?.message ?? cause}`);
		this.name = 'WatchlistError';
		this.client = client;
		this.cause = cause;
	}
}

/**
 * Fetch and merge the watchlists of every configured account.
 *
 * The accounts are fetched concurrently instead of one after another, and the
 * result is deduplicated because two users watchlisting the same title used to
 * show up twice in the exported list.
 */
const fetchCombinedWatchlist = async (
	mediaType: PlexMediaType,
): Promise<MediaItem[]> => {
	const includeStreamable = ignorePreferredServices();

	const lists = await Promise.all(
		getPlexTokens().map(async (token) => {
			try {
				return await getWatchlist(token, mediaType, includeStreamable);
			} catch (error) {
				// Fail the whole request: returning a partial list would make
				// Radarr/Sonarr drop everything the failing account contributed.
				throw new WatchlistError(maskToken(token), error);
			}
		}),
	);

	const byId = new Map<string, MediaItem>();
	for (const item of lists.flat()) {
		byId.set(item.id, item);
	}
	return [...byId.values()];
};

const caches = new Map<PlexMediaType, SingleFlightCache<MediaItem[]>>();

/**
 * The merged watchlist for a media type, reusing a recent result when possible.
 * @param mediaType What type of media to fetch
 */
export const getCombinedWatchlist = (
	mediaType: PlexMediaType,
): Promise<MediaItem[]> => {
	let cache = caches.get(mediaType);
	if (!cache) {
		cache = new SingleFlightCache(
			() => fetchCombinedWatchlist(mediaType),
			getCacheTtlMs,
		);
		caches.set(mediaType, cache);
	}
	return cache.get();
};

/** Drop every cached watchlist. Exposed for tests. */
export const clearWatchlistCache = (): void => {
	for (const cache of caches.values()) {
		cache.clear();
	}
};
