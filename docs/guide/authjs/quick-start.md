---
title: Quick Start
group: OAuth Provider
children:
  - ./remix-auth-handler.md
  - ./session-data.md
  - ./custom-pages.md
  - ./server-side/session-access.md
  - ./server-side/rest-api.md
---

# OAuth Quick Start

This guide walks through setting up `@zitadel/remix-auth` with the OAuth
provider, suitable for OAuth, magic links, and credentials sign-in.

## Installation

Install `@auth/core` alongside `@zitadel/remix-auth`:

```bash
npm install @zitadel/remix-auth @auth/core
```

## Configure RemixAuth

Create `app/auth.server.ts` and call the `RemixAuth()` factory:

```ts
// app/auth.server.ts
import { RemixAuth } from '@zitadel/remix-auth';
import GitHub from '@auth/core/providers/github';

export const { handlers, getSession, signIn, signInUrl, signOut, signOutUrl } =
  RemixAuth({
    secret: process.env.AUTH_SECRET,
    providers: [
      GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    ],
  });
```

## Mount the catch-all route

Create a Remix resource route that delegates to the handlers:

```ts
// app/routes/api.auth.$.ts
import { handlers } from '~/auth.server';

export const loader = handlers.GET;
export const action = handlers.POST;
```

All auth endpoints are now served under `/api/auth/*`.

## Set the secret

The `secret` is used to sign + encrypt session JWTs. In production this MUST
be set:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set it as `AUTH_SECRET` in your environment.

## Next Steps

- [Customize session data](./session-data.md)
- [Override the default auth pages](./custom-pages.md)
- [Access the session server-side](./server-side/session-access.md)
