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
 */
export type RemixAuthConfig = Omit<AuthConfig, 'raw'>;

/**
 * Remix 3 loader/action argument type.
 */
export type RemixHandlerArgs = {
  request: Request;
  params?: Record<string, string>;
};

/**
 * Creates a Remix Auth handler for Remix 3+ applications.
 *
 * Remix 3 uses the Fetch API natively, so no request/response conversion is
 * needed. This handler is a thin wrapper around Auth.js core.
 *
 * @param config - Auth.js configuration
 * @returns Object containing handlers and getSession utility
 *
 * @example
 * ```ts
 * // app/auth.server.ts
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
 * // app/routes/api.auth.$.ts
 * import { handlers } from '~/auth.server';
 * export const { GET, POST } = handlers;
 * ```
 */
export function RemixAuth(config: RemixAuthConfig): {
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
  signOut: (options?: { redirectTo?: string }) => Promise<Response>;
} {
  config.basePath ??= '/api/auth';
  setEnvDefaults(process.env, config);

  async function handler(args: RemixHandlerArgs): Promise<Response> {
    return Auth(args.request, config);
  }

  async function getSession(request: Request): Promise<Session | null> {
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

  async function signIn(
    provider?: string,
    options: { redirectTo?: string } = {},
  ): Promise<Response> {
    const basePath = (config.basePath ?? '/api/auth').replace(/\/$/, '');
    const params = new URLSearchParams();
    if (options.redirectTo) params.set('callbackUrl', options.redirectTo);
    const paramStr = params.toString();
    const url = provider
      ? `${basePath}/signin/${provider}${paramStr ? `?${paramStr}` : ''}`
      : `${basePath}/signin${paramStr ? `?${paramStr}` : ''}`;
    return Response.redirect(url, 302);
  }

  async function signOut(
    options: { redirectTo?: string } = {},
  ): Promise<Response> {
    const basePath = (config.basePath ?? '/api/auth').replace(/\/$/, '');
    const params = new URLSearchParams();
    if (options.redirectTo) params.set('callbackUrl', options.redirectTo);
    const paramStr = params.toString();
    const url = `${basePath}/signout${paramStr ? `?${paramStr}` : ''}`;
    return Response.redirect(url, 302);
  }

  return {
    handlers: { GET: handler, POST: handler },
    GET: handler,
    POST: handler,
    getSession,
    auth: getSession,
    signIn,
    signOut,
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
 * import { authConfig } from '~/auth.server';
 *
 * const session = await getSession(request, authConfig);
 * ```
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
