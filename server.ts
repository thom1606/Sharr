import express from 'express';

import { healthRoute } from './src/routes/health';
import { radarrRoute } from './src/routes/radarr';
import { sonarrRoute } from './src/routes/sonarr';

const app = express();

// ROUTES
app.use(radarrRoute);
app.use(sonarrRoute);
app.use(healthRoute);

const server = app.listen(6464);

function exitHandler() {
	server.close();
}

// Close all the connection
process.on('SIGTERM', exitHandler);
process.on('SIGINT', exitHandler);
