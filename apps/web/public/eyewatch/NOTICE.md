# Local eye-watch assets

MediaPipe JS/WASM: `@mediapipe/tasks-vision` 1.1.0, Apache-2.0, Google. The worker uses the package's module WASM loader and binary. Original package WASM files are copied without changes.

Face Landmarker model: official float16 version 1 from
https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

SHA-256: `64184E229B263107BC2B804C6625DB1341FF2BB731874B0BCC2FE6544E0BC9FF`

Model documentation: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker

`voice/tired.wav` and `voice/lost.wav` were generated locally with Windows System.Speech on 10 October 2026, using the build guide's spoken copy. They provide an offline fallback when an on-device English speech voice is unavailable. No runtime speech service is called.

All runtime asset requests are same-origin. Camera frames remain in the browser and its local worker; the worker returns numerical signals and fit flags, never image data or landmarks.
