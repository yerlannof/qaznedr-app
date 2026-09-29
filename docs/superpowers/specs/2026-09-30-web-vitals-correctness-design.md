# Web Vitals measurement correctness

Technical maintenance under the owner's ongoing website improvement request. No new public copy, design, account settings or data changes.

## Problem

The installed web-vitals v5 library reports INP, but the tracker labels it FID and uses FID thresholds. The monitoring service ignores valid zero values and TTFB. The unload summary sends already-reported values a second time, and effect cleanup leaves a resource timer and manual observers active.

## Required behavior

- Library INP is stored and reported as INP, with good <=200 ms, needs improvement <=500 ms, poor >500 ms (https://web.dev/articles/inp).
- Keep FID solely for the existing legacy first-input fallback; never interpret it as INP.
- Report valid finite non-negative values, including zero; reject malformed values. Monitoring ratings use inclusive boundaries consistently for all metrics.
- Preserve valid updated library values and new metric IDs (including bfcache), suppress exact repeat callbacks, and never resend metrics from the unload summary.
- Cleanup suppresses callbacks from obsolete effects, cancels the delayed resource task and disconnects manual observers. The library does not expose an unsubscribe; guard its callbacks.
- CLS is unitless in breadcrumbs; timing metrics are milliseconds.

## Validation

Behavior tests must first fail on the existing code: INP identity and boundaries, zero and invalid values, updated callbacks, unload duplication and cleanup. Targeted tests, full baseline comparison, lint, build, independent review, browser smoke and exact-commit deployment verification.

This repairs measurement. It does not claim a performance improvement or ranking increase.
