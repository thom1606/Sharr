const readInt = (value: string | undefined, fallback: number): number => {
	const parsed = Number.parseInt(value ?? '', 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

/**
 * Collect every configured Plex token, owner first.
 * Blank entries and duplicates are dropped so a trailing comma or a
 * copy/pasted owner token can never cause double work.
 */
export const getPlexTokens = (): string[] => {
	const tokens = [
		process.env.PLEX_OWNER_TOKEN,
		...(process.env.PLEX_EXTRA_USER_TOKENS ?? '').split(','),
	]
		.map((token) => token?.trim())
		.filter((token): token is string => Boolean(token));

	return [...new Set(tokens)];
};

/**
 * Plex tokens grant full access to an account, so they must never end up in a
 * response body or in the Radarr/Sonarr logs. Keep just enough to tell two
 * configured tokens apart.
 */
export const maskToken = (token: string): string =>
	token.length <= 4 ? '****' : `****${token.slice(-4)}`;

export const getPort = (): number => readInt(process.env.PORT, 6464);

/** Whether media that is streamable on a preferred service should be kept. */
export const ignorePreferredServices = (): boolean =>
	(process.env.IGNORE_PREFERRED_SERVICES ?? '').trim().toLowerCase() === 'true';

/** How long a fetched watchlist may be reused. 0 disables caching. */
export const getCacheTtlMs = (): number =>
	readInt(process.env.CACHE_TTL_SECONDS, 300) * 1000;

/** Per-request timeout for calls to Plex. */
export const getRequestTimeoutMs = (): number =>
	readInt(process.env.PLEX_TIMEOUT_SECONDS, 15) * 1000;
