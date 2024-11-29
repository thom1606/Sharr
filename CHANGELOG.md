# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html); The public API surface will not change outside major releases. The public API includes:

- Supported services
- All documented Plex functions

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
