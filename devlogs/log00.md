# Echo Kit: Dev Log 1

![Echo Kit Logo](media/echokit.png)

## Progress so far

Currently, I'm putting everything into a Svelte component called `GeminiLive`.

It's currently capable of:
- Recording audio from the user's microphone
- Sending audio data to the Gemini Live API

Wow, that's not much!

Behind the scenes, though, a lot is happening:
- An `AudioWorkletProcessor` to capture audio data without blocking the main thread
- Downsampling and encoding audio data into the required format (Gemini Live is strict about this)
- A queue to send audio (and other data in the future) to Gemini in a controlled manner

And while you can't hear Gemini's response yet, when I speak into the microphone, I see beautiful base64 data coming back from the API, which I can only hope is a wonderful "hello" back from Gemini.

## Design problems

The hardest part of this project seems to be designing the library itself. I've never really made a reusable component or library before.

1. Why am I using a component? Surely I could just make a class in a `.svelte.ts` file and export that?
2. Props are too intertwined
3. Empty audio data
    - Gemini wont respond if no audio data is sent. I need to handle this case.
4. Input & response modalities
    - Gemini Live is more than just audio. It can handle text I/O and video input too.

## The UI...

The component itself has no UI yet, but I've added some basic checkboxes to the demo page. It's real ugly though:

![Echo Kit Demo UI](media/echokit_demo_ui.png)

## The Logo

Honestly, I had a lot of fun making the logo. I used [Lunacy](https://icons8.com/lunacy).

It was originally going to be a horizontally centered audio wave. But as I copied the rounded rectangles and made them each a different size, I liked the top-aligned look.

So, I went with it.
