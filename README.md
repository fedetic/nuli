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

Upcoming posts wait on the `blog-queue` branch, one commit per post in publish order, each titled `Post <date>: <title>`. To publish everything that's due, push the commit of the latest due post to `main`:

```sh
git log --reverse --format='%h %s' main..origin/blog-queue   # the queue, oldest first
git push origin <hash>:main
```

A post whose `date` is still in the future isn't built, so pushing a little early does no harm. Posts only link to posts that come before them in the queue. After editing `main` directly, rebase `blog-queue` onto it.

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
