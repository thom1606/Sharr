import { getRequestTimeoutMs } from '../config';

/** Status codes that are worth a second attempt. */
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class PlexRequestError extends Error {
	readonly status: number;

	constructor(message: string, status = 0) {
		super(message);
		this.name = 'PlexRequestError';
		this.status = status;
	}
}

/**
 * Fetch JSON from Plex with a timeout and a few retries.
 *
 * Without a timeout a stalled Plex connection would hang the whole request
 * until Radarr/Sonarr gives up, and a single hiccup used to fail the entire
 * list refresh.
 *
 * @param url The url to fetch
 * @param label Human readable description used in error messages
 * @param retries How many extra attempts to make on a transient failure
 */
export const fetchPlexJson = async <T>(
	url: string,
	label: string,
	retries = 2,
): Promise<T> => {
	let lastError: PlexRequestError | undefined;

	for (let attempt = 0; attempt <= retries; attempt++) {
		if (attempt > 0) {
			// Back off a little so we do not hammer Plex while it is struggling
			await sleep(250 * 2 ** (attempt - 1));
		}

		let res: Response;
		try {
			res = await fetch(url, {
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(getRequestTimeoutMs()),
			});
		} catch (error) {
			lastError = new PlexRequestError(
				`Failed to ${label}: ${(error as Error).message}`,
			);
			continue;
		}

		if (res.ok) {
			return (await res.json()) as T;
		}

		lastError = new PlexRequestError(
			`Failed to ${label}: ${res.status} ${res.statusText}`,
			res.status,
		);

		// An invalid token or a missing item will not fix itself, so stop early
		if (!RETRYABLE_STATUSES.has(res.status)) {
			break;
		}
	}

	throw lastError ?? new PlexRequestError(`Failed to ${label}`);
};
