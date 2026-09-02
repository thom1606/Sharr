import { getRequestTimeoutMs } from '../config';
import { fetchPlexJson } from './http';

export enum PlexMediaType {
	Movie = '1',
	Show = '2',
	All = '99',
}

export interface MediaItem {
	id: string;
	type: PlexMediaType;
	title: string;
	originallyAvailableAt: string;
	year: number;
	imdbId?: string;
	tvdbId?: string;
	tmdbId?: string;
}

interface PlexMetadata {
	guid?: string;
	ratingKey: string;
	type: string;
	title: string;
	originallyAvailableAt: string;
	year: number;
	Guid?: Array<{ id: string }>;
}

interface PlexContainer<T> {
	MediaContainer: {
		totalSize?: number;
		size?: number;
		Metadata?: T[];
	};
}

const DISCOVER_URL = 'https://discover.provider.plex.tv';
const PAGE_SIZE = 300;
/** Hard stop so a misbehaving API can never spin us forever. */
const MAX_PAGES = 100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Pull an external id (imdb/tvdb/tmdb) out of the Plex `Guid` list. */
const findGuid = (guids: Array<{ id: string }> | undefined, prefix: string) =>
	guids
		?.find((guid) => guid.id.startsWith(`${prefix}://`))
		?.id.slice(prefix.length + 3);

/** Convert a raw Plex metadata entry into our own shape. */
export const toMediaItem = (item: PlexMetadata): MediaItem => ({
	id: item.ratingKey,
	type: item.type === 'movie' ? PlexMediaType.Movie : PlexMediaType.Show,
	title: item.title,
	originallyAvailableAt: item.originallyAvailableAt,
	year: item.year,
	imdbId: findGuid(item.Guid, 'imdb'),
	tvdbId: findGuid(item.Guid, 'tvdb'),
	tmdbId: findGuid(item.Guid, 'tmdb'),
});

/**
 * Whether a release date is in the past. Media without a usable date is treated
 * as unreleased so announced-but-unavailable titles never reach Radarr/Sonarr.
 */
export const isReleased = (
	originallyAvailableAt: string | undefined,
	now = new Date(),
): boolean => {
	if (!originallyAvailableAt) {
		return false;
	}
	const released = new Date(originallyAvailableAt);
	return !Number.isNaN(released.getTime()) && released < now;
};

const watchlistUrl = (
	plexUserToken: string,
	mediaType: PlexMediaType,
	offset: number,
	{ preferredServices = false } = {},
) => {
	const params = new URLSearchParams({
		includeFields: preferredServices
			? 'guid'
			: 'title,type,year,ratingKey,originallyAvailableAt,guid',
		type: mediaType,
		'X-Plex-Token': plexUserToken,
		'X-Plex-Container-Size': String(PAGE_SIZE),
		'X-Plex-Container-Start': String(offset),
	});
	if (preferredServices) {
		params.set('preferredServices', '1');
	} else {
		params.set('includeGuids', '1');
		params.set('sort', 'watchlistedAt:desc');
	}
	return `${DISCOVER_URL}/library/sections/watchlist/all?${params}`;
};

/**
 * Walk every page of a watchlist query.
 *
 * @param onPage Receives each page of metadata and returns the page size
 */
const eachPage = async <T>(
	url: (offset: number) => string,
	label: string,
	onPage: (metadata: T[]) => void,
): Promise<void> => {
	let offset = 0;

	for (let page = 0; page < MAX_PAGES; page++) {
		if (page > 0) {
			// Stay friendly to the Plex API while paging through large lists
			await sleep(100);
		}

		const body = await fetchPlexJson<PlexContainer<T>>(url(offset), label);
		const metadata = body.MediaContainer.Metadata ?? [];
		if (metadata.length === 0) {
			return;
		}

		onPage(metadata);

		offset += metadata.length;
		if (offset >= (body.MediaContainer.totalSize ?? offset)) {
			return;
		}
	}
};

/**
 * Every guid on the watchlist that is streamable on a preferred service.
 *
 * This is collected up front instead of page by page: the preferred-services
 * query returns a different, differently ordered result set, so matching it
 * against the main list offset for offset would exclude the wrong items.
 */
const getPreferredServiceGuids = async (
	plexUserToken: string,
	mediaType: PlexMediaType,
): Promise<Set<string>> => {
	const guids = new Set<string>();

	await eachPage<{ guid?: string }>(
		(offset) =>
			watchlistUrl(plexUserToken, mediaType, offset, {
				preferredServices: true,
			}),
		'fetch plex preferred services',
		(metadata) => {
			for (const item of metadata) {
				if (item.guid) {
					guids.add(item.guid);
				}
			}
		},
	);

	return guids;
};

/**
 * Check whether a Plex token is still valid.
 * @param plexUserToken The token to validate
 */
export const getHealthCheck = async (
	plexUserToken: string,
): Promise<boolean> => {
	try {
		const res = await fetch(
			`https://clients.plex.tv/api/v2/user?X-Plex-Token=${encodeURIComponent(plexUserToken)}`,
			{
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(getRequestTimeoutMs()),
			},
		);
		return res.ok;
	} catch {
		return false;
	}
};

/**
 * Fetch the watchlist of a user (only returns released media items)
 * @param plexUserToken The user of which to fetch the watchlist
 * @param mediaType What type of media to fetch
 * @param includeStreamable Whether to include the streamable media items
 * @returns An array of MediaItem objects
 */
export const getWatchlist = async (
	plexUserToken: string,
	mediaType = PlexMediaType.All,
	includeStreamable = true,
): Promise<MediaItem[]> => {
	const excludeGuids = includeStreamable
		? new Set<string>()
		: await getPreferredServiceGuids(plexUserToken, mediaType);

	const now = new Date();
	const items: MediaItem[] = [];

	await eachPage<PlexMetadata>(
		(offset) => watchlistUrl(plexUserToken, mediaType, offset),
		'fetch plex watchlist',
		(metadata) => {
			for (const item of metadata) {
				// Skip anything that is unreleased or already on a preferred service
				if (!isReleased(item.originallyAvailableAt, now)) {
					continue;
				}
				if (item.guid && excludeGuids.has(item.guid)) {
					continue;
				}
				items.push(toMediaItem(item));
			}
		},
	);

	return items;
};

/**
 * Fetch the streaming services that are available to the owner
 * @returns An array of strings containing the streaming services
 */
export const getStreamingServices = async (): Promise<string[]> => {
	const body = await fetchPlexJson<{
		MediaContainer: {
			size?: number;
			AvailabilityPlatform?: Array<{ platform: string }>;
		};
	}>(
		`${DISCOVER_URL}/settings/preferredServices?X-Plex-Token=${encodeURIComponent(process.env.PLEX_OWNER_TOKEN ?? '')}`,
		'fetch plex streaming services',
	);

	return (body.MediaContainer.AvailabilityPlatform ?? []).map(
		(item) => item.platform,
	);
};

/**
 * Get all the details of a show or movie
 * @param plexUserToken The plex user token
 * @param showId The id of the show or movie to fetch
 * @returns A MediaItem object with the details of the show or movie
 */
export const getMediaItemDetails = async (
	plexUserToken: string,
	showId: string,
): Promise<MediaItem> => {
	const body = await fetchPlexJson<PlexContainer<PlexMetadata>>(
		`${DISCOVER_URL}/library/metadata/${encodeURIComponent(showId)}?X-Plex-Token=${encodeURIComponent(plexUserToken)}`,
		`fetch plex media item ${showId}`,
	);

	const firstItem = body.MediaContainer.Metadata?.[0];
	if (!firstItem) {
		throw new Error(`Plex returned no metadata for media item ${showId}`);
	}

	return toMediaItem(firstItem);
};
