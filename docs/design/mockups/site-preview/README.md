# Site preview review notes

Open [`site-preview.html`](../../review/site-preview.html) locally. Query parameters select `screen`, `lang`, and `theme`; for example `?screen=teaser&lang=zh&theme=dark&code=DEMO-B02`.

The preview covers Home, Portfolio, Teaser, Services, About, Contact, Insights, Article, and Metal. It uses the approved A3 + D2 direction and three bespoke geological illustrations. The wordmark is a **typographic production placeholder**: the approved A3 contour character is represented through quiet serif typography, because its exact master vector and licensed type are still pending. The illustrations describe geology and method, not real sites or project evidence.

The 65 full-page PNGs cover every page in EN at 375 and 1440 px in both themes, every page in EN at 768 px light, every page in ZH at 375 px in both themes, and RU Home at 375 and 1440 px light. [`qa.json`](qa.json) reports zero JavaScript errors, broken images, external requests, or horizontal overflows. [`qa-affected.json`](qa-affected.json) passes all three demo project codes in RU/EN/ZH, their contact context, and the revised article. Browser interaction checks passed for mobile menu Escape and focus return, filter overlay and empty/reset behavior, teaser code retention through contact, preview form, language, and theme. Actual button, menu, filter, form, and status states are collected in [`states.html`](states.html).

After the final services/contact polish, [`qa-services.json`](qa-services.json) rechecked the affected screenshots and all four service topics in RU/EN/ZH (27 checks, zero failures). Topic links keep language and theme, show a localized context note, and prefill the non-sending contact form. Unrecognized topic values are ignored.

[`qa-focus.json`](qa-focus.json) checks computed focus ring colors and tap heights at 375 and 1440 px in both themes (8 checks, zero failures). Light surfaces use a slate ring; dark surfaces, including the slate contact and service bands, use a chalk ring. Menu, desktop navigation, footer links, and form controls meet the 44 px minimum measured tap height.

All project codes and cards are demonstrative. Actual project grades, areas, rights, contact channels, QR/ID, company details, personnel photos, source links, update date, and legal wording require verification before implementation. The contact form is visibly marked as a non-sending design preview. KZ remains disabled pending translation.
