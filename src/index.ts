/**
 * Auth.js integration for Remix (React Router v7).
 *
 * Provides authentication via Auth.js with support for OAuth providers,
 * credentials, JWT sessions, and Remix loader/action conventions.
 *
 * @packageDocumentation
 *
 * @example Basic usage
 * ```ts
 * // app/auth.server.ts
 * import { RemixAuth } from '@zitadel/remix-auth';
 * import Zitadel from '@auth/core/providers/zitadel';
 *
 * export const { handlers, getSession, signIn, signOut } = RemixAuth({
 *   providers: [Zitadel({ clientId: process.env.ZITADEL_CLIENT_ID! })],
 * });
 * ```
 *
 * @example Mounting the route handler
 * ```ts
 * // app/routes/api.auth.$.ts
 * export { GET, POST } from '~/auth.server';
 * ```
 *
 * @public
 */

import {
  Auth,
  type AuthConfig,
  setEnvDefaults,
  createActionURL,
} from '@auth/core';
import type { Session } from '@auth/core/types';

export { AuthError, CredentialsSignin } from '@auth/core/errors';
export type {
  Account,
  DefaultSession,
  Profile,
  Session,
  User,
} from '@auth/core/types';

/**
 * Auth.js configuration for Remix 3 applications.
 *
 * @public
 */
export type RemixAuthConfig = Omit<AuthConfig, 'raw'>;

/**
 * Remix 3 loader/action argument type.
 *
 * @public
 */
export type RemixHandlerArgs = {
  request: Request;
  params?: Record<string, string>;
};

/**
 * Either a static {@link RemixAuthConfig} object or a request-scoped factory
 * `(args) => RemixAuthConfig`.
 *
 * The factory form defers config evaluation until request time, which keeps
 * server-only imports out of any code path the bundler can reach from a
 * client entry point. Useful when reading config from request-scoped env
 * (Cloudflare Workers, Deno Deploy) rather than from `process.env`.
 *
 * @public
 */
export type RemixAuthConfigOrFactory =
  | RemixAuthConfig
  | ((args: RemixHandlerArgs) => RemixAuthConfig);

/**
 * Creates a Remix Auth handler for Remix 3+ applications.
 *
 * Accepts either a {@link RemixAuthConfig} object or a request-scoped
 * factory `(args) => RemixAuthConfig`. The factory form defers config
 * evaluation to request time, which keeps server-only imports off any
 * client-reachable graph.
 *
 * @param rawConfig - Auth.js configuration object or factory function
 * @returns Object containing handlers and getSession utility
 *
 * @example
 * ```ts
 * // app/auth.server.ts — object form
 * import { RemixAuth } from '@zitadel/remix-auth';
 * import Zitadel from '@auth/core/providers/zitadel';
 *
 * export const { handlers, getSession } = RemixAuth({
 *   providers: [Zitadel({ ... })],
 *   secret: process.env.AUTH_SECRET,
 * });
 * export const { GET, POST } = handlers;
 * ```
 *
 * @example
 * ```ts
 * // app/auth.server.ts — factory form (request-scoped env)
 * import { RemixAuth } from '@zitadel/remix-auth';
 *
 * export const { handlers, getSession } = RemixAuth(({ request }) => ({
 *   providers: [Zitadel({
 *     clientId: request.headers.get('x-zitadel-client-id') ?? '',
 *   })],
 *   secret: process.env.AUTH_SECRET,
 * }));
 * ```
 *
 * @example
 * ```ts
 * // app/routes/api.auth.$.ts
 * import { handlers } from '~/auth.server';
 * export const { GET, POST } = handlers;
 * ```
 *
 * @public
 */
export function RemixAuth(rawConfig: RemixAuthConfigOrFactory): {
  handlers: {
    GET: (args: RemixHandlerArgs) => Promise<Response>;
    POST: (args: RemixHandlerArgs) => Promise<Response>;
  };
  /** @deprecated Use `handlers.GET` instead */
  GET: (args: RemixHandlerArgs) => Promise<Response>;
  /** @deprecated Use `handlers.POST` instead */
  POST: (args: RemixHandlerArgs) => Promise<Response>;
  getSession: (request: Request) => Promise<Session | null>;
  /** @deprecated Use `getSession` instead */
  auth: (request: Request) => Promise<Session | null>;
  signIn: (
    provider?: string,
    options?: { redirectTo?: string },
  ) => Promise<Response>;
  signInUrl: (options?: { redirectTo?: string }) => string;
  signOut: (options?: { redirectTo?: string }) => Promise<Response>;
  signOutUrl: (options?: { redirectTo?: string }) => string;
} {
  function resolveConfig(args: RemixHandlerArgs): RemixAuthConfig {
    const c = typeof rawConfig === 'function' ? rawConfig(args) : rawConfig;
    c.basePath ??= '/api/auth';
    setEnvDefaults(process.env, c);
    return c;
  }

  async function handler(args: RemixHandlerArgs): Promise<Response> {
    const config = resolveConfig(args);
    return Auth(args.request, config);
  }

  async function getSession(request: Request): Promise<Session | null> {
    const config = resolveConfig({ request });
    const url = createActionURL(
      'session',
      new URL(request.url).protocol.slice(0, -1) as 'http' | 'https',
      new Headers(request.headers),
      process.env,
      config,
    );

    const response = await Auth(
      new Request(url, {
        headers: { cookie: request.headers.get('cookie') ?? '' },
      }),
      config,
    );

    const { status } = response;
    const data = (await response.json()) as Record<string, unknown> | null;
    if (!data || !Object.keys(data).length) return null;
    if (status === 200) return data as unknown as Session;
    throw new Error((data as { message?: string }).message ?? 'Session error');
  }

  // signIn / signOut have no request in scope; use the default basePath
  // for the factory form. Users who need a per-request basePath should
  // call Auth.js directly via handlers.GET/POST.
  function defaultBasePath(): string {
    if (typeof rawConfig === 'function') return '/api/auth';
    return (rawConfig.basePath ?? '/api/auth').replace(/\/$/, '');
  }

  /**
   * Returns the relative URL of the sign-in endpoint, with `callbackUrl`
   * appended when `redirectTo` is provided. Useful when the framework's
   * native redirect helper takes a URL string (e.g. SvelteKit's
   * `throw redirect(302, url)`, TanStack Router's
   * `throw redirect({ href: url })`).
   */
  function signInUrl(options: { redirectTo?: string } = {}): string {
    const basePath = defaultBasePath();
    const params = new URLSearchParams();
    if (options.redirectTo) params.set('callbackUrl', options.redirectTo);
    const paramStr = params.toString();
    return `${basePath}/signin${paramStr ? `?${paramStr}` : ''}`;
  }

  /**
   * Returns the relative URL of the sign-out endpoint, with `callbackUrl`
   * appended when `redirectTo` is provided.
   */
  function signOutUrl(options: { redirectTo?: string } = {}): string {
    const basePath = defaultBasePath();
    const params = new URLSearchParams();
    if (options.redirectTo) params.set('callbackUrl', options.redirectTo);
    const paramStr = params.toString();
    return `${basePath}/signout${paramStr ? `?${paramStr}` : ''}`;
  }

  /**
   * Server-side helper to start the Auth.js sign-in flow.
   *
   * Returns a `Response` with a 302 + Location header pointing at the
   * Auth.js sign-in chooser. The `provider` argument is kept in the
   * signature for parity with client-side `signIn()` callers, but is
   * intentionally ignored server-side (see inline comment).
   *
   * @public
   */
  async function signIn(
    provider?: string,
    options: { redirectTo?: string } = {},
  ): Promise<Response> {
    // The `provider` argument is intentionally ignored on the server side:
    // Auth.js's per-provider sign-in endpoint (/api/auth/signin/{provider})
    // requires a POST with a CSRF token, which a 302 redirect cannot
    // produce. Server-side signIn always routes through the chooser
    // (/api/auth/signin); when `pages.signIn` is configured, Auth.js then
    // bounces to the consumer's custom sign-in page (where the POST form
    // + CSRF live). The `provider` arg is kept in the signature for
    // parity with client-side signIn() callers.
    void provider;
    // Use a raw Response rather than Response.redirect(): the static
    // Response.redirect() method validates the URL and rejects relative
    // ones, but we don't have the request origin in this scope. Browsers
    // accept relative Location headers per RFC 7231 §7.1.2.
    return new Response(null, {
      status: 302,
      headers: { Location: signInUrl(options) },
    });
  }

  /**
   * Server-side helper to start the Auth.js sign-out flow.
   *
   * Returns a `Response` with a 302 + Location header pointing at the
   * Auth.js sign-out endpoint. When `redirectTo` is provided it is
   * appended as `callbackUrl`.
   *
   * @public
   */
  async function signOut(
    options: { redirectTo?: string } = {},
  ): Promise<Response> {
    return new Response(null, {
      status: 302,
      headers: { Location: signOutUrl(options) },
    });
  }

  return {
    handlers: { GET: handler, POST: handler },
    GET: handler,
    POST: handler,
    getSession,
    auth: getSession,
    signIn,
    signInUrl,
    signOut,
    signOutUrl,
  };
}

/**
 * Retrieves the current session on the server side.
 *
 * Standalone two-argument form — use this when you don't have a factory
 * instance but have a request and config available directly.
 *
 * @param req - The current Request object
 * @param config - Auth.js configuration
 * @returns The session object or null
 *
 * @example
 * ```ts
 * import { getSession } from '@zitadel/remix-auth';
 * import { authOptions } from '~/auth.server';
 *
 * const session = await getSession(request, authOptions);
 * ```
 *
 * @public
 */
export async function getSession(
  req: Request,
  config: RemixAuthConfig,
): Promise<Session | null> {
  config.basePath ??= '/api/auth';
  setEnvDefaults(process.env, config);

  const url = createActionURL(
    'session',
    new URL(req.url).protocol.slice(0, -1) as 'http' | 'https',
    new Headers(req.headers),
    process.env,
    config,
  );

  const response = await Auth(
    new Request(url, { headers: { cookie: req.headers.get('cookie') ?? '' } }),
    config,
  );

  const { status } = response;
  const data = (await response.json()) as Record<string, unknown> | null;
  if (!data || !Object.keys(data).length) return null;
  if (status === 200) return data as unknown as Session;
  throw new Error((data as { message?: string }).message ?? 'Session error');
}
