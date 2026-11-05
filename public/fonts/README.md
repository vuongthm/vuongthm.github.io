# Local typefaces

Self-hosted WOFF2 Unicode subsets for the website. CSS retains the original Unicode ranges, weights, swap behavior and fallback metrics. Only matching subsets load in the browser; Vietnamese/Latin body and heading subsets are preloaded through `site/font-preloads.json`.

Families: Inter, Fraunces, JetBrains Mono, Noto Sans JP and Noto Sans SC. Each family directory includes its SIL Open Font License from the official Google Fonts repository:

- https://github.com/google/fonts/tree/main/ofl/inter
- https://github.com/google/fonts/tree/main/ofl/fraunces
- https://github.com/google/fonts/tree/main/ofl/jetbrainsmono
- https://github.com/google/fonts/tree/main/ofl/notosansjp
- https://github.com/google/fonts/tree/main/ofl/notosanssc

These are source assets; commit them with `styles/fonts.css`. Build and dev do not download fonts. For updates, obtain licensed font subsets and update CSS/preload paths together, preserving Unicode coverage for Vietnamese, Japanese and Chinese.
