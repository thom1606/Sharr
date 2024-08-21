# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html); The public API surface will not change outside major releases. The public API includes:

- Supported services
- All documented Plex functions

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
