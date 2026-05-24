---
title: Session Access (client)
group: Application Side
---

# Client-side session access

Remix's data model favours fetching the session in your loader and passing
it to the component via `useLoaderData`. There's no built-in client
provider — the session lives in the request lifecycle.

## In a route loader

```ts
// app/routes/_app.tsx
import { getSession } from '~/auth.server';
import { Outlet, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  return { session };
}

export default function AppLayout() {
  const { session } = useLoaderData<typeof loader>();
  return (
    <>
      {session ? <UserBadge user={session.user} /> : <a href="/auth/login">Sign in</a>}
      <Outlet />
    </>
  );
}
```

Nested routes inherit the parent loader's data via `useRouteLoaderData`.

## signIn / signOut

For client-triggered sign-in / sign-out, either POST a form to the auth
endpoints directly, or use the client helpers:

```ts
import { signIn, signOut } from '@zitadel/remix-auth/client';

<form action="/api/auth/signout" method="post">
  <button type="submit">Sign out</button>
</form>
```
