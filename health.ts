(async () => {
	try {
		const response = await fetch('http://localhost:6464/health');
		if (response.ok) {
			process.exit(0); // Healthy
		} else {
			process.exit(1); // Unhealthy
		}
	} catch (error) {
		process.exit(1); // Unhealthy if the request fails
	}
})();
