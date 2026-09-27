# Credits & third-party assets

## 3D avatars (VRM)

The app renders a VRM avatar with [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm).

**Shipped in this repo**

| File | Model | Source |
|---|---|---|
| `app/public/avatars/tutor.vrm` | Seed-san | Official VRM Consortium mascot |

**Not shipped in this repo — deliberately**

Two avatars used during local development are excluded, because models published by individual
creators on VRoid Hub carry per-model terms set by their author and **redistribution is commonly
not permitted** even when personal use is:

| File | Model | Author |
|---|---|---|
| `shino.vrm` | Shino | Official VRoid sample |
| `lia.vrm` | Lia | WierdlyA (VRoid Hub) |

They are listed here for attribution, not distributed. Anyone running the app can supply their
own `.vrm` from **Settings → avatar**, which is stored in IndexedDB on their own device
(`services/avatar-file.ts`). To restore them locally, drop the files into
`app/public/avatars/` and uncomment the two entries in `BUNDLED_AVATARS`.

## Models & libraries

| What | Used for | Notes |
|---|---|---|
| [Google Gemini API](https://ai.google.dev/) | Scene role-play, free talk, translation | Free tier; the key is entered by the user in Settings and kept in `localStorage`. No key ships with this repo |
| [Ollama](https://ollama.com/) | Optional local chat model | Runs on the user's own machine at `localhost:11434` |
| [Kokoro TTS 82M](https://github.com/hexgrad/kokoro) via [`kokoro-js`](https://www.npmjs.com/package/kokoro-js) | Offline speech synthesis | ~90MB model fetched at runtime, cached in the browser — not vendored here |
| Web Speech API | Speech recognition and fallback synthesis | Browser built-in |

## Inspiration

The product concept is inspired by **BeeSpeaker**. No code or assets were taken from it.
