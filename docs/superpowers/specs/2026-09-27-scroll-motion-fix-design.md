# Correct the approved geological scroll motion

Owner reports crooked motion while scrolling. Start SHA: ff2bf66, matching local/origin/Production success.

Browser reproduction: at progress .20 and .25 layer transforms are identical; crossing .34 or .68 starts a one-second CSS transition which continues after scrolling stops. At 1024×740 EN the changing explanation height shifts the copy heading/buttons by 11.25px. Ancestors do not interfere with sticky; 64px header offset is correct.

Fix within approved scene 08: continuously interpolate the existing three exact poses from actual scroll progress; scroll mode has no timed transform/filter animation. Scroll up must retrace the same path, fast jumps clamp to endpoints. Manual/mobile buttons and static no-JS/reduced motion remain supported. Desktop buttons scroll to a pose; their selected state follows actual scroll rather than jumping ahead. Explanations reserve the largest stage's height so the copy stays anchored. No new assets, palette, commercial copy or section order.

Acceptance: measured motion inside a stage, no residual drift after stopping, same transforms at same position in both directions, stable heading/control geometry, no overflow/clipping at desktop740/900 and mobile375; localized labels/selection remain accessible. Test all four languages and themes plus reduced/noJS, viewport switches and real locale-route preservation. Full Jest baseline, lint, build, independent review, master push and production verification.
