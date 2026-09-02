import { getPort } from './src/config';

// Used by the Docker HEALTHCHECK: exits 0 when the service answers, 1 otherwise.
try {
	const res = await fetch(`http://127.0.0.1:${getPort()}/health`, {
		signal: AbortSignal.timeout(30_000),
	});
	process.exit(res.ok ? 0 : 1);
} catch (error) {
	console.error('[sharr] health check failed:', (error as Error).message);
	process.exit(1);
}
