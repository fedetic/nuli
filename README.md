# nuli.nl

Showcase site for apps built by Nuli. Static site built with [Hugo](https://gohugo.io), styled with a Tachyons-based utility CSS build via webpack, deployed to Netlify on every push to `main`.

## Adding an app

Add a directory under `site/content/apps/<slug>/index.md` with front matter:

```yaml
title: App Name
tagline: One-line pitch
status: live            # live | coming-soon
icon: /img/apps/<slug>/icon.png   # optional
screenshots: []          # optional
features: []             # optional
appStoreUrl: ""
playStoreUrl: ""
supportUrl: /support/<slug>/
```

It'll automatically show up on the homepage and the `/apps/` hub, and get its own landing page at `/apps/<slug>/`.

If the app needs a support/data-deletion page (required by app store listings), add `site/content/support/<slug>/index.md`.

## Blog

Mandarin Hero's posts are markdown files in `site/content/apps/mandarinhero/blog/`. Questions under `faq:` show on the page and as FAQ structured data. A Dutch post gets `lang: nl`, and a post and its translation share a `translationKey`.

Posts are published by date: one dated in the future is on `main` but isn't built. Every hour, the "Publish due blog posts" GitHub Action checks whether a post is due but not yet on the live site, and if so rebuilds the site through a Netlify build hook (the `NETLIFY_BUILD_HOOK` repo secret). So to schedule a post, give it a future `date` with a time, e.g. `2026-11-09T12:22:00+01:00`, and push it to `main`. Only link to posts that are already live by then.

## Local development

```sh
yarn
yarn start
```

## Building

```sh
yarn build
```

## Testing

With the development server running:

```sh
yarn cypress:run
```

## Linting

```sh
yarn lint
```
