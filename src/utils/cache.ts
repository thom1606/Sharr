type CacheEntry<T> = {
	expiresAt: number;
	value: T;
};

/**
 * A tiny single-flight TTL cache.
 *
 * Radarr and Sonarr poll their import lists on their own schedule, and both
 * endpoints need the exact same watchlist. Without this, every poll re-fetched
 * every page for every user. `inFlight` additionally makes sure two polls that
 * arrive at the same time share a single fetch instead of racing.
 */
export class SingleFlightCache<T> {
	private entry: CacheEntry<T> | undefined;
	private inFlight: Promise<T> | undefined;

	/**
	 * @param produce Called to compute a fresh value on a miss
	 * @param ttlMs How long a value stays fresh. 0 disables caching
	 */
	constructor(
		private readonly produce: () => Promise<T>,
		private readonly ttlMs: () => number,
	) {}

	async get(now = Date.now()): Promise<T> {
		if (this.entry && this.entry.expiresAt > now) {
			return this.entry.value;
		}
		if (this.inFlight) {
			return this.inFlight;
		}

		const pending = this.produce()
			.then((value) => {
				const ttl = this.ttlMs();
				// Never cache a failure: the entry is only written on success
				this.entry = ttl > 0 ? { value, expiresAt: now + ttl } : undefined;
				return value;
			})
			.finally(() => {
				this.inFlight = undefined;
			});

		this.inFlight = pending;
		return pending;
	}

	clear(): void {
		this.entry = undefined;
	}
}
