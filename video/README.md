# Stander launch video — source footage

Screen recordings of the live hub, filmed by driving Chrome over the DevTools
Protocol (`Page.startScreencast`) at a 1440x900 viewport, DPR 2, on the real
GPU — SwiftShader manages about 8fps on the mascot's WebGL scene and the edit
compresses the streaming passages, which would leave roughly three distinct
frames a second on screen.

Every answer here came from the live `/api/hub-agent` endpoint. Nothing is
staged: the funding figures, the SIP-6 refusal and the navigation to
`/en/brand-kit` are what a visitor gets.

Delivered at 1920x1200 rather than the 2880x1800 masters. The widest use is a
1.6x punch-in on a 1080-wide canvas, which needs 1728px, so this still
oversamples while halving what the cloud renderer has to fetch and seek. Short
keyframe interval (`-g 15`) because the composition seeks these files on every
frame rather than playing them.

This branch is never merged into `main`: production deploys from `main` and
these files have no business in a page build. `vercel.json` disables even a
preview deploy of the branch.
