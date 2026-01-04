<script lang="ts">
	import type { LiveConnectParameters } from '@google/genai';
	import type { LiveConnectConfig } from '@google/genai';
	import type { Session } from '@google/genai';
	import { GoogleGenAI, Modality } from '@google/genai';

	import workletUrl from './recorder-processor.js?url';
	import { arrayBufferToBase64, downsampleBuffer, floatTo16BitPCM } from './audioUtils.ts';

	// TODO: Extract some of the microphone handling (this file is getting large)

	let {
		apiKey,
		connected,
		model,
		config,
		microphone,
		listening
	}: {
		apiKey: string;
		connected: boolean;
		microphone?: boolean;
		listening?: boolean; // Only relevant if microphone is true
		paused: boolean;
		model?: string;
		config?: LiveConnectConfig;
	} = $props();

	let ai: GoogleGenAI;
	$effect(() => {
		ai = new GoogleGenAI({
			apiKey: apiKey
		});
	});

	let session: Session | null = null;

	const DEFAULT_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

	// TODO: Better handle default values for config (like, what if a config was provided, but it has no response modality?)

	let liveConnectParameters: LiveConnectParameters = $derived({
		config: config || { responseModalities: [Modality.AUDIO] },
		model: model || DEFAULT_MODEL,
		callbacks: {
			onopen: () => console.log('Connected to Gemini Live API'),
			onmessage: (message) => console.log('Message:', message),
			onerror: (e) => console.error('Error:', e.message),
			onclose: (e) => console.log('Closed:', e.reason)
		}
	});

	// Handle connecting/disconnecting
	$effect(() => {
		if (connected && !session) {
			(async () => {
				session = await ai.live.connect(liveConnectParameters);
			})();
		} else if (!connected && session) {
			session.close();
			session = null;
		}
	});

	interface AudioOutboxItem {
		type: 'audio';
		data: string; // A base64 string, must be resampled to 16kHz PCM mono!
	}

	interface TextOutboxItem {
		type: 'text';
		text: string;
	}

	type OutboxItem = AudioOutboxItem | TextOutboxItem;

	// TODO: Add video support

	let outbox: OutboxItem[] = $state([]); // TODO: Clear outbox when disconnected

	$effect(() => {
		if (outbox.length > 0 && session) {
			let item = outbox.shift();
			if (!item) return; // This is redundant (we checked in the if condition) but helps type safety. And this might solve a race condition, so I'll keep it
			switch (item.type) {
				case 'audio':
					session.sendRealtimeInput({
						audio: {
							data: (item as AudioOutboxItem).data,
							mimeType: 'audio/pcm;rate=16000'
						}
					});
				case 'text':
					session.sendRealtimeInput({
						text: (item as TextOutboxItem).text
					});
			}
		}
	});

	let audioContext: AudioContext | null = null;
	let mediaStream: MediaStream | null = null;

	$effect(() => {
		if (microphone) {
			if (!audioContext) {
				audioContext = new AudioContext(/*{sampleRate: 16000}*/); // Some browsers refuse to resample from the hardware rate, so it will be done manually
				if (!audioContext) {
					console.error('Failed to create AudioContext');
					return;
				}
				(async () => {
					await audioContext.audioWorklet.addModule(workletUrl);

					const workletNode = new AudioWorkletNode(audioContext!, 'recorder.worklet');

					const sourceSampleRate = audioContext.sampleRate;

					try {
						mediaStream = await navigator.mediaDevices.getUserMedia({
							audio: {
								channelCount: 1
							}
						});
					} catch (e) {
						console.error('Error accessing microphone:', e);
						return;
					}

					const source = audioContext.createMediaStreamSource(mediaStream);
					source.connect(workletNode);

					let bufferAccumulator: number[] = [];
					const BUFFER_THRESHOLD = Math.floor(sourceSampleRate * 0.1); // 100ms of audio

					workletNode.port.onmessage = (event) => {
						if (!listening) return;
						const float32Chunk = event.data as Float32Array;

						bufferAccumulator.push(...float32Chunk);

						if (bufferAccumulator.length >= BUFFER_THRESHOLD) {
							const rawBuffer = new Float32Array(bufferAccumulator);
							// Downsample to 16kHz
							const downsampledBuffer = downsampleBuffer(rawBuffer, sourceSampleRate, 16000);

							// Convert to 16-bit PCM
							const int16Data = floatTo16BitPCM(downsampledBuffer);

							// Convert to base64
							const base64String = arrayBufferToBase64(int16Data);

							// Add to outbox!
							outbox.push({
								type: 'audio',
								data: base64String
							});

							// Clear accumulator
							bufferAccumulator = [];
						}
					};
				})();
			}
		}

		return () => {
			if (audioContext) {
				audioContext.close();
				audioContext = null;
			}
			if (mediaStream) {
				mediaStream.getTracks().forEach((track) => track.stop());
				mediaStream = null;
			}
		};
	});
</script>
