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
