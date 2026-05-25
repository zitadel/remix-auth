# Remix Auth

A [Remix](https://remix.run/) / [React Router v7](https://reactrouter.com/)
integration that provides seamless
authentication with multiple providers, session management, and Remix-native
loader and action patterns.

This integration brings the power and flexibility of OAuth to Remix 3+
applications with full TypeScript support, native Fetch API handling, and
idiomatic Remix patterns for server-side loaders and resource routes.

### Why?

Modern web applications require robust, secure, and flexible authentication
systems. Integrating OAuth and session management with Remix applications requires careful consideration of
framework patterns, server-side rendering, and TypeScript integration.

However, a direct integration isn't always straightforward. Different types
of applications or deployment scenarios might warrant different approaches:

- **Resource Route Integration:** OAuth and auth flows operate at the HTTP level, while
  Remix uses resource routes with `loader` and `action` exports. A proper
  integration should bridge this gap by providing GET and POST handlers that
  plug directly into Remix's routing system.
- **HTTP Request Handling:** Remix 3 uses the native Fetch API, so no
  request/response conversion is needed. This integration wraps the auth handler
  with Remix's `LoaderFunctionArgs` and `ActionFunctionArgs` shapes.
- **Session and Request Lifecycle:** Proper session handling in Remix requires
  utilities that work with server-side loaders, giving routes access to
  authentication state without additional boilerplate.
- **Route Protection:** Many applications need fine-grained authorization
  beyond simple authentication. `getSession()` provides a clean server-side
  primitive suitable for protecting loaders and actions.

This integration, `@zitadel/remix-auth`, aims to provide the flexibility to
handle such scenarios. It allows you to leverage the full OAuth provider ecosystem
while maintaining Remix best practices, ultimately leading to a more effective
and less burdensome authentication implementation.

## Installation

Install using NPM by using the following command:

```sh
npm install @zitadel/remix-auth
```

## Usage

To use this integration, call `RemixAuth()` with your authentication configuration
and export the resulting handlers from your catch-all auth resource route.

First, create your auth server module:

```ts
// app/auth.server.ts
import { RemixAuth } from '@zitadel/remix-auth';
import Zitadel from '@auth/core/providers/zitadel';

export const { handlers, getSession } = RemixAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET,
      issuer: process.env.ZITADEL_DOMAIN,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});

export const { GET, POST } = handlers;
```

Then wire up the resource route:

```ts
// app/routes/api.auth.$.ts
export { GET as loader, POST as action } from '~/auth.server';
```

#### Using the Authentication System

The integration provides several functions and hooks for handling
authentication:

**Server Utilities:**

- `RemixAuth(config)`: Creates `{ handlers: { GET, POST }, getSession }`
- `getSession(request)`: Retrieves the current session from a request

**Basic Usage in a Loader:**

```ts
// app/routes/_index.tsx
import type { LoaderFunctionArgs } from 'react-router';
import { getSession } from '~/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  return { session };
}

export default function Index() {
  const { session } = useLoaderData<typeof loader>();

  return (
    <main>
      {session ? (
        <>
          <p>Welcome, {session.user?.name}</p>
          <a href="/api/auth/signout">Sign out</a>
        </>
      ) : (
        <a href="/api/auth/signin">Sign in</a>
      )}
    </main>
  );
}
```

**Protecting a Route:**

```ts
// app/routes/profile.tsx
import { redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { getSession } from '~/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  if (!session) throw redirect('/api/auth/signin');
  return { user: session.user };
}
```

##### Example: Advanced Configuration with Multiple Providers

This example shows how to use the integration with multiple OAuth
providers and custom session configuration:

```ts
// app/auth.server.ts
import { RemixAuth } from '@zitadel/remix-auth';
import Zitadel from '@auth/core/providers/zitadel';
import Google from '@auth/core/providers/google';

export const { handlers, getSession } = RemixAuth({
  providers: [
    Zitadel({
      clientId: process.env.ZITADEL_CLIENT_ID,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET,
      issuer: process.env.ZITADEL_DOMAIN,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).roles = (user as any).roles;
      return token;
    },
    async session({ session, token }) {
      (session.user as any).roles = (token as any).roles as
        | string[]
        | undefined;
      return session;
    },
  },
});

export const { GET, POST } = handlers;
```

## Known Issues

- **Remix 3 / React Router v7 Required:** This integration targets Remix 3+
  (which uses React Router v7 under the hood with native Fetch API). Older
  Remix versions that use Node.js `Request`/`Response` are not supported.
- **Environment Configuration:** The integration relies on `AUTH_SECRET` and,
  in many hosting scenarios, `AUTH_TRUST_HOST`. Ensure these are correctly set
  in your environment for production.
- **Callback URLs:** OAuth providers must be configured with the correct
  callback URL: `[origin]/api/auth/callback/[provider]`.
- **Type Augmentation:** If you attach additional properties (e.g., roles) to
  the user session object, extend your app's types accordingly so consumers of
  `session.user` remain type-safe.
- **Redirect Semantics:** OAuth providers expect real browser navigations during
  sign-in. The client helpers handle this for you — avoid manual `fetch()` calls
  to provider endpoints unless you know you need credential/email flows.

## Useful links

- **[Remix / React Router](https://reactrouter.com/):** The framework this
  integration targets.

## Contributing

If you have suggestions for how this integration could be improved, or
want to report a bug, open an issue — we'd love all and any contributions.

## License

Apache-2.0
