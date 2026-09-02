# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html); The public API surface will not change outside major releases. The public API includes:

- Supported services
- All documented Plex functions

## 1.0.8

_released `02 Sep 2026`_

This release makes the service a lot cheaper to poll and fixes a number of latent bugs that show up on large watchlists.

- 🐛 Bug fixes
    - Sonarr items were filtered on their TMDB id while the list exports TVDB ids. Whenever Plex does not supply both ids for a series, it was either dropped or exported as an empty entry.
    - Media that is streamable on a preferred service is now excluded reliably. The exclusion list is fetched up front instead of page by page, which on watchlists over 300 items per type compared two differently ordered result sets.
    - The watchlist is no longer cut short at 300 items per type when the first page contains only unreleased or already streamable items.
    - Plex tokens are no longer included in error responses or logs; only the last four characters are shown.
- 🐎 Performance improvements
    - Fetched watchlists are cached for `CACHE_TTL_SECONDS` (5 minutes by default), and polls that arrive at the same time share a single fetch instead of each doing their own.
    - All configured accounts are fetched concurrently instead of one after another.
    - Duplicate titles across accounts are merged instead of exported twice.
    - The Docker image is now Alpine based, runs as a non-root user and no longer ships development dependencies.
- ⭐️ New features
    - Configurable `PORT`, `CACHE_TTL_SECONDS` and `PLEX_TIMEOUT_SECONDS`.
    - Requests to Plex now time out and retry on transient failures instead of hanging.
- 😴 Other stuff
    - Updated Biome to 2.x, TypeScript to 5.9, `actions/checkout` to v6 and `setup-bun` to v2.
    - The Docker build now runs on every pull request, so a broken Dockerfile is caught before release.
    - Added offline unit tests; the tests that hit the live Plex API are skipped when no token is configured.

## 1.0.7

_released `05 Jan 2026`_

This release only adds a fallback for invalid plex tokens so your radarr or sonarr won't be cleared when they invalidate.

## 1.0.6

_released `03 Feb 2025`_

This release adds performance improvements by switching to Bun serve instead of Express.

- 🐎 Performance improvements
    - Switching to Bun serve instead of Express.

## 1.0.5

_released `29 Nov 2024`_

This release I fixed a bug where the health check could not succeed due to a missing dependency.

- 🐛 Bug fixes
    - The health check could not succeed duo to a missing dependency. This has been fixed.

## 1.0.4

_released `29 Nov 2024`_

This release intergrates a new health check endpoint. You can now check if the service is running as expected.

- ⭐️ New features
    - A healt check is run every 3 hours to ensure the service is running as expected.

## 1.0.3

_released `25 Nov 2024`_

This release fixes an issue where invalid plex tokens would block the whole process. We now skip the account and continue with the next one.

- 🐛 Bug fixes
    - We now skip the account and continue with the next one if the token is invalid.

## 1.0.2

_released `28 Aug 2024`_

This release fixes a bug with large plex watchlists. We are sorry for the inconvenience. 🙏

- 🐛 Bug fixes
    - We now fetch the watchlist in chunks of 300 items and keep fetching until we have all items.

## 1.0.1

_released `21 Aug 2024`_

This is the first public release! 🎉 Your Plex watchlist is now fully able to export to Radarr and Sonarr.

- 🐛 Bug fixes
    - Added platforms `linux/amd64` and `linux/arm64` to the GitHub Actions build pipeline
- 😴 Other stuff
    - Cleaned up the dockerignore
    - Cleaned up the gitignore
    - Cleaned up unused imports

## 1.0.0

_released `20 Aug 2024`_

- ⭐️ New features
    - Get the Plex watchlist from multiple accounts
    - Exclude shows/movies you have on other streaming services
    - Export the watchlist to Radarr
    - Export the watchlist to Sonarr
