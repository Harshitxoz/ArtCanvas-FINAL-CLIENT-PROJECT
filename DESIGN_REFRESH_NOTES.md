# ArtCanvas Visual Refresh

Updated the existing project structure without requiring manual folder moves.

## Changes
- Added immersive cinematic hero component under `components/home/`.
- Upgraded the homepage Hand-Painted / Printed Canvas chooser to support background video.
- Upgraded `/hand-painted` with a cinematic hero, editorial value cards, collection area, and process-video section.
- Upgraded `/printed-canvas` with a cinematic hero, room-style value cards, collection area, room inspiration cards, and process-video section.
- Added graceful poster fallbacks using the existing `public/images/hero.png`.
- Added `public/videos/README.txt` describing the drop-in MP4 filenames.

## Video slots
`public/videos/hand-painted.mp4`
`public/videos/hand-painted-process.mp4`
`public/videos/printed-canvas.mp4`
`public/videos/printed-canvas-process.mp4`

No existing backend, MongoDB, authentication, Razorpay, Cloudinary, order, or admin business logic was intentionally changed by this visual refresh.
