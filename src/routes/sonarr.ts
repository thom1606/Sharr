import { PlexMediaType } from '../utils/plex';
import { importListResponse } from './importList';

export async function sonarrHandler(): Promise<Response> {
	// Sonarr matches series on their TVDB id
	return importListResponse(
		PlexMediaType.Show,
		(item) => item.tvdbId,
		(tvdbId) => ({ tvdbId }),
	);
}
