# Local typefaces

Self-hosted WOFF2 Unicode subsets for the website. CSS retains the original Unicode ranges, weights and swap behavior. Only matching subsets load in the browser. Be Vietnam Pro is shared by body text and headings; its Vietnamese/Latin subsets are preloaded through `site/font-preloads.json`.

Active families and their SIL Open Font Licenses from the official Google Fonts repository:

- https://github.com/google/fonts/tree/main/ofl/bevietnampro
- https://github.com/google/fonts/tree/main/ofl/jetbrainsmono
- https://github.com/google/fonts/tree/main/ofl/notosansjp
- https://github.com/google/fonts/tree/main/ofl/notosanssc

Be Vietnam Pro is declared in `styles/be-vietnam-pro.css`; JetBrains Mono, Noto Sans JP and Noto Sans SC are declared in `styles/fonts.css`. The `Inter Fallback` face uses local Arial with adjusted metrics; it does not download an Inter font file. Japanese and Chinese use their own Noto families, including the full subset coverage and declared weights.

`styles/typography.css` owns the shared font stacks and responsive type scale. Interface text, headings, labels, metadata and controls use `--font-ui` (`--font-heading` is the same family). Only code and keyboard shortcuts use `--font-mono`. Japanese/Chinese change the shared stack at the document language level. Reuse these variables when adding a page; do not introduce a separate page-specific font stack.

These are source assets; commit them with the corresponding CSS and license. Build and dev do not download fonts. For updates, obtain licensed font subsets and update CSS/preload paths together, preserving Unicode coverage for Vietnamese, Japanese and Chinese. Do not discard a subset solely because the current published articles do not use its characters.
