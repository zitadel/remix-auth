---
title: RemixAuth Factory
group: OAuth Provider
---

# RemixAuth Factory

The `RemixAuth()` factory wires up the auth handler and returns helpers
bound to your config. Call it once in `app/auth.server.ts`:

```ts
import { RemixAuth } from '@zitadel/remix-auth';

export const {
  handlers,     // { GET, POST } for the catch-all route
  GET, POST,    // top-level aliases
  getSession,   // server-side session reader
  signIn, signInUrl, signOut, signOutUrl,
  auth,         // deprecated alias for getSession
} = RemixAuth({
  secret: process.env.AUTH_SECRET,
  providers: [/* ... */],
});
```

## Return values

| Key | Type | Use |
|---|---|---|
| `handlers` | `{ GET, POST }` | Mount in the catch-all resource route |
| `getSession` | `(request: Request) => Promise<Session \| null>` | Read the session in loaders/actions |
| `signIn`, `signInUrl`, `signOut`, `signOutUrl` | helpers | Compute or perform the redirect |

## Mounting the handlers

```ts
// app/routes/api.auth.$.ts
import { handlers } from '~/auth.server';

export const loader = handlers.GET;
export const action = handlers.POST;
```

## Server-side reads

See [Server-side session access](./server-side/session-access.md).
