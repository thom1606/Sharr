import { expect, test } from 'bun:test';
import { SingleFlightCache } from './cache';

test('reuses a value until it expires', async () => {
	let calls = 0;
	const cache = new SingleFlightCache(
		async () => ++calls,
		() => 1000,
	);

	expect(await cache.get(0)).toBe(1);
	expect(await cache.get(500)).toBe(1);
	expect(await cache.get(1500)).toBe(2);
	expect(calls).toBe(2);
});

test('shares a single fetch between concurrent callers', async () => {
	let calls = 0;
	const cache = new SingleFlightCache(
		async () => {
			calls++;
			await Bun.sleep(10);
			return calls;
		},
		() => 1000,
	);

	const results = await Promise.all([cache.get(), cache.get(), cache.get()]);

	expect(results).toEqual([1, 1, 1]);
	expect(calls).toBe(1);
});

test('does not cache a failure', async () => {
	let calls = 0;
	const cache = new SingleFlightCache(
		async () => {
			calls++;
			if (calls === 1) {
				throw new Error('boom');
			}
			return calls;
		},
		() => 1000,
	);

	expect(cache.get(0)).rejects.toThrow('boom');
	await Bun.sleep(1);
	expect(await cache.get(0)).toBe(2);
});

test('always refetches when the ttl is zero', async () => {
	let calls = 0;
	const cache = new SingleFlightCache(
		async () => ++calls,
		() => 0,
	);

	await cache.get(0);
	await cache.get(0);

	expect(calls).toBe(2);
});
