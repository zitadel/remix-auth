---
title: Protecting Pages
group: Application Side
---

# Protecting pages

Remix gates routes from inside the route's `loader`. Throw a `redirect` if
the session is absent and the request never proceeds to the component.

## Loader-based gate

```ts
// app/routes/profile.tsx
import { getSession } from '~/auth.server';
import { redirect, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  if (!session) {
    const url = new URL(request.url);
    throw redirect(`/auth/login?callbackUrl=${encodeURIComponent(url.pathname)}`);
  }
  return { user: session.user };
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();
  return <h1>Hello, {user?.name}</h1>;
}
```

## Reusable helper

Extract a `requireSession()` for routes that share the gate:

```ts
// app/lib/require-session.ts
import { getSession } from '~/auth.server';
import { redirect } from 'react-router';

export async function requireSession(request: Request) {
  const session = await getSession(request);
  if (!session) {
    const url = new URL(request.url);
    throw redirect(`/auth/login?callbackUrl=${encodeURIComponent(url.pathname)}`);
  }
  return session;
}
```

Then in a loader:

```ts
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  return { user: session.user };
}
```
