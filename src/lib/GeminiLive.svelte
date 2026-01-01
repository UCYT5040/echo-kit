<script lang="ts">
	import type { LiveConnectParameters } from "@google/genai";
	import type { LiveConnectConfig } from "@google/genai";
	import type { Session } from "@google/genai";
	import { GoogleGenAI, Modality } from "@google/genai";

    let {apiKey, connected, model, config}: {
        apiKey: string;
        connected: boolean;
        listening: boolean;
        paused: boolean;
        model?: string;
        config?: LiveConnectConfig
    } = $props();

    /* TODO: Handle when API key changes
        I suspect it is not as simple as just wrapping this in $derived...
        That would then effect the session, possibly disconnecting it?
        Although maybe disconnecting on an API key change is intended?    
    */
    let ai = new GoogleGenAI({
        apiKey: apiKey
    });

    let session: Session | null = null;

    const DEFAULT_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

    // TODO: Better handle default values for config (like, what if a config was provided, but it has no response modality?)

    let liveConnectParameters: LiveConnectParameters = $derived({
        config: config || {responseModalities: [Modality.AUDIO]},
        model: model || DEFAULT_MODEL,
        callbacks: {
            onopen: () => console.log('Connected to Gemini Live API'),
            onmessage: (message) => console.log('Message:', message),
            onerror: (e) => console.error('Error:', e.message),
            onclose: (e) => console.log('Closed:', e.reason),
        }
    });

    // Handle connecting/disconnecting
    $effect(()=>{
        if (connected && !session) {
            (async ()=>{
                session = await ai.live.connect(liveConnectParameters);
            })();
        } else if (!connected && session) {
            session.close();
            session = null;
        }
    });

    interface AudioOutboxItem {
        type: 'audio',
        data: string // A base64 string 
    };

    interface TextOutboxItem {
        type: 'text',
        text: string
    };

    type OutboxItem = AudioOutboxItem | TextOutboxItem;
    
    // TODO: Add video support

    let outbox: OutboxItem[] = $state([]); // TODO: Clear outbox when disconnected

    $effect(()=>{
        if (outbox.length > 0 && session) {
            let item = outbox.shift();
            if (!item) return; // This is redundant (we checked in the if condition) but helps type safety. And this might solve a race condition, so I'll keep it
            switch (item.type) {
                case "audio":
                    session.sendRealtimeInput({
                        audio: {
                            data: (item as AudioOutboxItem).data,
                            mimeType: 'audio/pcm;rate=16000'
                        }
                    });
                case "text":
                    session.sendRealtimeInput({
                        text: (item as TextOutboxItem).text
                    });
            }
        }
    });

    // TODO: Microphone implementation
</script>

