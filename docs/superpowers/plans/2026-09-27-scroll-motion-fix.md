# Scroll motion correction plan

1. Reproduce current discontinuities and moving copy in browser; save baseline in /tmp/qaznedr-scroll-browser.
2. Add failing tests for continuous progress, reversal/endpoints and desktop-button selection timing.
3. Update GeologyScene effects/CSS: interpolated existing poses, direct scroll motion, stable explanation grid; keep manual/static and storage behavior.
4. Run focused tests, full Jest, lint/build. Measure browser transforms/geometry during forward/backward scroll, stationary waits, fast jumps and buttons; cover languages/themes/responsive modes.
5. Independent review, fix important issues with tests, update roadmap, commit explicit files, push master, verify production and SHA synchronization.
