# Credits & third-party assets

## Tutor character

The tutor is an original flat-vector SVG character drawn for this app (`app/src/components/FlatTutor.tsx`).
No third-party character assets are shipped.

## Models & libraries

| What | Used for | Notes |
|---|---|---|
| [Google Gemini API](https://ai.google.dev/) | Scene role-play, free talk, translation | Free tier; the key is entered by the user in Settings and kept in `localStorage`. No key ships with this repo |
| [Ollama](https://ollama.com/) | Optional local chat model | Runs on the user's own machine at `localhost:11434` |
| [Kokoro TTS 82M](https://github.com/hexgrad/kokoro) via [`kokoro-js`](https://www.npmjs.com/package/kokoro-js) | Offline speech synthesis | ~90MB model fetched at runtime, cached in the browser — not vendored here |
| Web Speech API | Speech recognition and fallback synthesis | Browser built-in |

## Inspiration

The product concept is inspired by **BeeSpeaker**. No code or assets were taken from it.
