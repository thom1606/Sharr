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

export const getHealthCheck = async (
	plexUserToken: string,
): Promise<boolean> => {
	const res = await fetch(
		`https://clients.plex.tv/api/v2/user?X-Plex-Token=${plexUserToken}`,
		{
			headers: {
				Accept: 'application/json',
			},
		},
	);

	return res.ok;
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
	const excludeGuids: Set<string> = new Set<string>();

	// Get a page from the watchlist with the given offset
	const getWatchlistPage = async (offset = 0) => {
		const [resAll, resServices] = await Promise.all([
			fetch(
				`https://discover.provider.plex.tv/library/sections/watchlist/all?includeFields=title,type,year,ratingKey,originallyAvailableAt,guid&includeGuids=1&sort=watchlistedAt:desc&type=${mediaType}&X-Plex-Token=${plexUserToken}&X-Plex-Container-Size=300&X-Plex-Container-Start=${offset}`,
				{
					headers: {
						Accept: 'application/json',
					},
				},
			),
			includeStreamable
				? Promise.resolve({
						ok: true,
						status: 200,
						statusText: 'OK',
						json: async () => ({ MediaContainer: { Metadata: [] } }),
					})
				: fetch(
						`https://discover.provider.plex.tv/library/sections/watchlist/all?includeFields=guid&type=${mediaType}&X-Plex-Token=${plexUserToken}&preferredServices=1&X-Plex-Container-Size=300&X-Plex-Container-Start=${offset}`,
						{
							headers: {
								Accept: 'application/json',
							},
						},
					),
		]);

		if (!resAll.ok) {
			throw new Error(
				`Failed to fetch plex watchlist: ${resAll.status} ${resAll.statusText}`,
			);
		}
		if (!resServices.ok) {
			throw new Error(
				`Failed to fetch plex watchlist: ${resServices.status} ${resServices.statusText}`,
			);
		}

		const [bodyAll, bodyServices] = await Promise.all([
			resAll.json() as Promise<{
				MediaContainer: {
					totalSize: number;
					size: number;
					Metadata: Array<{
						guid: string;
						ratingKey: string;
						type: string;
						title: string;
						originallyAvailableAt: string;
						year: number;
						Guid: Array<{
							id: string;
						}>;
					}>;
				};
			}>,
			includeStreamable
				? Promise.resolve({ MediaContainer: { Metadata: [] } })
				: (resServices.json() as Promise<{
						MediaContainer: {
							size: number;
							Metadata?: Array<{
								guid: string;
							}>;
						};
					}>),
		]);

		if (bodyAll.MediaContainer.size === 0) {
			return {
				items: [],
				totalSize: 0,
				offset: offset,
			};
		}

		const newGuids = (bodyServices.MediaContainer.Metadata ?? []).map(
			(item) => item.guid,
		);
		for (const guid of newGuids) {
			excludeGuids.add(guid);
		}

		return {
			items: bodyAll.MediaContainer.Metadata
				// Only get the shows that are released and are not available in another streaming service
				.filter(
					(item) =>
						new Date(item.originallyAvailableAt) < new Date() &&
						!excludeGuids.has(item.guid),
				)
				// Map everything a MediaItem object
				.map((item) => ({
					id: item.ratingKey,
					type:
						item.type === 'movie' ? PlexMediaType.Movie : PlexMediaType.Show,
					title: item.title,
					originallyAvailableAt: item.originallyAvailableAt,
					year: item.year,
					imdbId: item.Guid.find((item) =>
						item.id.startsWith('imdb'),
					)?.id.replace('imdb://', ''),
					tvdbId: item.Guid.find((item) =>
						item.id.startsWith('tvdb'),
					)?.id.replace('tvdb://', ''),
					tmdbId: item.Guid.find((item) =>
						item.id.startsWith('tmdb'),
					)?.id.replace('tmdb://', ''),
				})),
			totalSize: bodyAll.MediaContainer.totalSize,
			offset: offset + bodyAll.MediaContainer.size,
		};
	};

	// Fetch all the watchlist pages
	const usableItems = [];
	const { items, totalSize, offset } = await getWatchlistPage();
	usableItems.push(...items);
	let latestOffset = offset;
	// Keep fetching pages until we have all the items or we have enough
	while (items.length > 0) {
		if (usableItems.length >= totalSize) {
			break;
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
		const plexPage = await getWatchlistPage(latestOffset);
		// If the offset is the same as the last one, we are done
		if (plexPage.offset === latestOffset) {
			break;
		}
		// Push the new items to the list and update the offset
		usableItems.push(...plexPage.items);
		latestOffset = plexPage.offset;
	}
	return usableItems;
};

/**
 * Fetch the streaming services that are available to the owner
 * @returns An array of strings containing the streaming services
 */
export const getStreamingServices = async () => {
	const res = await fetch(
		`https://discover.provider.plex.tv/settings/preferredServices?X-Plex-Token=${process.env.PLEX_OWNER_TOKEN}`,
		{
			headers: {
				Accept: 'application/json',
			},
		},
	);

	if (!res.ok) {
		throw new Error(
			`Failed to fetch plex streaming services: ${res.status} ${res.statusText}`,
		);
	}

	const body = await (res.json() as Promise<{
		MediaContainer: {
			size: number;
			AvailabilityPlatform: Array<{
				platform: string;
			}>;
		};
	}>);

	if (body.MediaContainer.size === 0) {
		return [];
	}

	return body.MediaContainer.AvailabilityPlatform.map((item) => item.platform);
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
	const res = await fetch(
		`https://discover.provider.plex.tv/library/metadata/${showId}?X-Plex-Token=${plexUserToken}`,
		{
			headers: {
				Accept: 'application/json',
			},
		},
	);

	if (!res.ok) {
		throw new Error(
			`Failed to fetch plex streaming services: ${res.status} ${res.statusText}`,
		);
	}

	const body = await (res.json() as Promise<{
		MediaContainer: {
			Metadata: Array<{
				ratingKey: string;
				type: string;
				title: string;
				originallyAvailableAt: string;
				year: number;
				Guid: Array<{
					id: string;
				}>;
			}>;
		};
	}>);

	const firstItem = body.MediaContainer.Metadata[0];
	return {
		id: firstItem.ratingKey,
		type: firstItem.type === 'movie' ? PlexMediaType.Movie : PlexMediaType.Show,
		title: firstItem.title,
		originallyAvailableAt: firstItem.originallyAvailableAt,
		year: firstItem.year,
		imdbId: firstItem.Guid.find((item) =>
			item.id.startsWith('imdb'),
		)?.id.replace('imdb://', ''),
		tvdbId: firstItem.Guid.find((item) =>
			item.id.startsWith('tvdb'),
		)?.id.replace('tvdb://', ''),
		tmdbId: firstItem.Guid.find((item) =>
			item.id.startsWith('tmdb'),
		)?.id.replace('tmdb://', ''),
	};
};
