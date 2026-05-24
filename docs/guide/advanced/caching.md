---
title: Caching
group: Advanced
children:
  - ./url-resolutions.md
  - ./deployment/self-hosted.md
  - ./deployment/vercel.md
  - ./deployment/netlify.md
---

# Caching content

Hosting providers often offer caching at the edge. Most sites see big
speed wins (and cost savings) by taking advantage of it — no cold
start, no request processing, no JavaScript parsing, just HTML served
straight from a CDN.

By default the user's session is read in a `loader` and rendered into
the HTML. That's fine for personalised pages, but it's a footgun the
moment those pages are cached: a cached response containing user A's
session will be served to user B.

To add caching in Remix, set `Cache-Control` headers from your route's
`headers` export. See the
[Remix caching docs](https://remix.run/docs/en/main/guides/caching).

:::warning
If you cache a route, that route's loader MUST NOT call `getSession()`
or return session data. Otherwise the first user's session leaks into
the cached HTML served to everyone else.
:::

## Page specific cache rules

For a single cached route, return a `Cache-Control` header from the
route and avoid touching the session in the loader. Read the session
on the client instead.

```ts
// app/routes/_index.tsx
export const headers = () => ({
  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
});

export const loader = async () => {
  // Do not call getSession() here. Read session client-side via the
  // useSession() hook if you need it.
  return json({ posts: await getPosts() });
};
```

## Global cache rules

To cache most pages by default, set `Cache-Control` from your root
loader's `headers` export and only override it on routes (like
`/profile`) that must stay dynamic.

```ts
// app/root.tsx
export const headers = () => ({
  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
});
```

## Combining rules

Remix resolves headers by walking from the leaf route up to the root.
The leaf route's `headers` function receives `parentHeaders` and can
override or merge values. So you can flip the default per route.

For example: cache every page except `/profile`.

```ts
// app/root.tsx — global default: cached
export const headers = () => ({
  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
});

// app/routes/profile.tsx — opt this route back into dynamic rendering
import { getSession } from '~/lib/auth.server';

export const headers = () => ({
  'Cache-Control': 'private, no-store',
});

export const loader = async ({ request }) => {
  const session = await getSession(request);
  return json({ session });
};
```
