<script lang="ts">
	import GeminiLive from '$lib/GeminiLive.svelte';

	let apiKey: string = '';
	let connected: boolean = false;
	let microphone: boolean = true;
	let listening: boolean = true;
	let paused: boolean = false;
</script>

<h1>Echo Kit</h1>

<GeminiLive {apiKey} {connected} {microphone} {listening} {paused} />

<label>
	API Key:
	<input type="text" bind:value={apiKey} />
</label>

<label>
	Connected:
	<input type="checkbox" bind:checked={connected} />
</label>

<label>
	Microphone:
	<input type="checkbox" bind:checked={microphone} />
</label>

<label>
	Listening:
	<input type="checkbox" bind:checked={listening} />
</label>

<label>
	Paused:
	<input type="checkbox" bind:checked={paused} />
</label>
