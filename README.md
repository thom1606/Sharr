![Banner](./assets/images/readme-banner.png)

Welcome to the **Sharr** repository! This is a simple docker service which allows you to download shows and movies from your Plex watchlist. It uses the Plex API to get the watchlist and gives you a list compatible with radarr and sonarr.

## Project Overview

Sharr converts your watchlist into lists which are compatible with many different services. The main difference from using this other than importing your plex watchlist directly is that you can filter out shows and movies which are already available on your preferred streaming services (Set in Plex). This will greatly reduce the amount of downloads and storage needed.

## Getting Started

1. Add the service to your docker compose file

```yaml
services:
  sharr:
    image: thom1606/sharr:latest
    container_name: sharr
    ports:
      - 6464:6464
    environment:
      - PLEX_EXTRA_USER_TOKENS=token2,token3 # Optional
      - PLEX_OWNER_TOKEN=token1
      - IGNORE_PREFERRED_SERVICES=false # Optional
```

2. Start your docker containers
3. Add the service url to your radarr or sonarr settings

### Setting up Radarr

1. Go to Settings > Import Lists > Add List > Custom Lists
2. Set the list URL to `http://localhost:6464/radarr`
3. Test if the list is reachable and save

### Setting up Sonarr

1. Go to Settings > Import Lists > Add List > Custom Lists
2. Set the list URL to `http://localhost:6464/sonarr`
3. Test if the list is reachable and save

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PLEX_OWNER_TOKEN | The token for the owner of the plex server | |
| PLEX_EXTRA_USER_TOKENS | A comma separated list of tokens for extra users | |
| IGNORE_PREFERRED_SERVERS | Whether to ignore your preferred services | false |
