import { PlexMediaType } from '../utils/plex';
import { importListResponse } from './importList';

export async function radarrHandler(): Promise<Response> {
	// Radarr matches movies on their TMDB id
	return importListResponse(
		PlexMediaType.Movie,
		(item) => item.tmdbId,
		(id) => ({ id }),
	);
}
