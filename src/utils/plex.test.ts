import { expect, test } from 'bun:test';
import {
	PlexMediaType,
	getMediaItemDetails,
	getStreamingServices,
	getWatchlist,
} from './plex';

/// TESTS
test('Test if the watchlist can be fetched from the owner user', async () => {
	const watchlist = await getWatchlist(
		process.env.PLEX_OWNER_TOKEN ?? '',
		PlexMediaType.All,
	);
	expect(watchlist).toBeArray();
});

test('Test if we are able to fetch the preferred services', async () => {
	const services = await getStreamingServices();
	expect(services).toBeArray();
});

test('Test if we are able to fetch a specific show from plex', async () => {
	const item = await getMediaItemDetails(
		process.env.PLEX_OWNER_TOKEN ?? '',
		'5d7768243c3c2a001fbca85a',
	);
	expect(item).toMatchObject({
		id: '5d7768243c3c2a001fbca85a',
		type: PlexMediaType.Movie,
		title: 'Charlie and the Chocolate Factory',
		originallyAvailableAt: '2005-07-13',
		year: 2005,
		imdbId: 'tt0367594',
		tvdbId: '564',
		tmdbId: '118',
	});
});
