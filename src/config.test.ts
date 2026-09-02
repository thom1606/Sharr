import { afterEach, expect, test } from 'bun:test';
import {
	getCacheTtlMs,
	getPlexTokens,
	getPort,
	ignorePreferredServices,
	maskToken,
} from './config';

const original = { ...process.env };

afterEach(() => {
	process.env = { ...original };
});

test('collects the owner token first, then the extra tokens', () => {
	process.env.PLEX_OWNER_TOKEN = 'owner';
	process.env.PLEX_EXTRA_USER_TOKENS = 'two,three';

	expect(getPlexTokens()).toEqual(['owner', 'two', 'three']);
});

test('ignores blank entries, whitespace and duplicates', () => {
	process.env.PLEX_OWNER_TOKEN = ' owner ';
	process.env.PLEX_EXTRA_USER_TOKENS = 'two, ,owner,  three  ,';

	expect(getPlexTokens()).toEqual(['owner', 'two', 'three']);
});

test('returns nothing when no token is configured', () => {
	process.env.PLEX_OWNER_TOKEN = undefined;
	process.env.PLEX_EXTRA_USER_TOKENS = undefined;

	expect(getPlexTokens()).toEqual([]);
});

test('masks all but the last four characters of a token', () => {
	expect(maskToken('abcdefghijkl')).toBe('****ijkl');
	expect(maskToken('abc')).toBe('****');
});

test('falls back to defaults for missing or invalid numbers', () => {
	process.env.PORT = undefined;
	process.env.CACHE_TTL_SECONDS = 'nonsense';
	expect(getPort()).toBe(6464);
	expect(getCacheTtlMs()).toBe(300_000);

	process.env.PORT = '8080';
	process.env.CACHE_TTL_SECONDS = '0';
	expect(getPort()).toBe(8080);
	expect(getCacheTtlMs()).toBe(0);
});

test('only ignores preferred services when explicitly set to true', () => {
	process.env.IGNORE_PREFERRED_SERVICES = 'true';
	expect(ignorePreferredServices()).toBe(true);

	process.env.IGNORE_PREFERRED_SERVICES = 'TRUE';
	expect(ignorePreferredServices()).toBe(true);

	process.env.IGNORE_PREFERRED_SERVICES = 'false';
	expect(ignorePreferredServices()).toBe(false);

	process.env.IGNORE_PREFERRED_SERVICES = undefined;
	expect(ignorePreferredServices()).toBe(false);
});
