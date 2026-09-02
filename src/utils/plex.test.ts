import { describe, expect, test } from 'bun:test';
import {
	getMediaItemDetails,
	getStreamingServices,
	getWatchlist,
	isReleased,
	PlexMediaType,
	toMediaItem,
} from './plex';

/// UNIT TESTS
describe('toMediaItem', () => {
	test('maps a movie including every external id', () => {
		expect(
			toMediaItem({
				ratingKey: '123',
				type: 'movie',
				title: 'Charlie and the Chocolate Factory',
				originallyAvailableAt: '2005-07-13',
				year: 2005,
				Guid: [
					{ id: 'imdb://tt0367594' },
					{ id: 'tvdb://564' },
					{ id: 'tmdb://118' },
				],
			}),
		).toEqual({
			id: '123',
			type: PlexMediaType.Movie,
			title: 'Charlie and the Chocolate Factory',
			originallyAvailableAt: '2005-07-13',
			year: 2005,
			imdbId: 'tt0367594',
			tvdbId: '564',
			tmdbId: '118',
		});
	});

	test('treats anything that is not a movie as a show', () => {
		const item = toMediaItem({
			ratingKey: '456',
			type: 'show',
			title: 'Severance',
			originallyAvailableAt: '2022-02-18',
			year: 2022,
		});

		expect(item.type).toBe(PlexMediaType.Show);
		expect(item.tmdbId).toBeUndefined();
	});
});

describe('isReleased', () => {
	const now = new Date('2026-01-01T00:00:00Z');

	test('accepts a date in the past', () => {
		expect(isReleased('2005-07-13', now)).toBe(true);
	});

	test('rejects a date in the future', () => {
		expect(isReleased('2030-01-01', now)).toBe(false);
	});

	test('rejects a missing or unparsable date', () => {
		expect(isReleased(undefined, now)).toBe(false);
		expect(isReleased('', now)).toBe(false);
		expect(isReleased('not a date', now)).toBe(false);
	});
});

/// LIVE TESTS
// These talk to the real Plex API and are skipped when no token is configured.
const live = test.skipIf(!process.env.PLEX_OWNER_TOKEN);

live('Test if the watchlist can be fetched from the owner user', async () => {
	const watchlist = await getWatchlist(
		process.env.PLEX_OWNER_TOKEN ?? '',
		PlexMediaType.All,
	);
	expect(watchlist).toBeArray();
});

live('Test if we are able to fetch the preferred services', async () => {
	const services = await getStreamingServices();
	expect(services).toBeArray();
});

live('Test if we are able to fetch a specific show from plex', async () => {
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
