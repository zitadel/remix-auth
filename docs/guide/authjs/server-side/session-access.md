---
title: Session Access
group: OAuth Provider
category: Server Side
---

# Server-side session access

Access the current session from any server context (loader, action,
resource route) using the factory-bound `getSession`:

## In a loader

```ts
// app/routes/profile.tsx
import { getSession } from '~/auth.server';
import { redirect, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  if (!session) throw redirect('/auth/login');
  return { user: session.user };
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();
  return <h1>Hello, {user?.name}</h1>;
}
```

## In a resource route

```ts
// app/routes/api.me.ts
import { getSession } from '~/auth.server';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'unauthorised' }, { status: 401 });
  return Response.json({ user: session.user });
}
```

## Return shape

`getSession()` returns the `Session` object OAuth builds in the `session`
callback, or `null` when no valid session exists. It throws when OAuth
returns a non-200 (e.g. on signature/decode failure).
