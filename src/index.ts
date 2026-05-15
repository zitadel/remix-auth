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
  getSession: (request: Request) => Promise<Session | null>;
} {
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
    const data = await response.json();
    if (!data || !Object.keys(data).length) return null;
    if (status === 200) return data as Session;
    throw new Error((data as { message?: string }).message ?? 'Session error');
  }

  return {
    handlers: { GET: handler, POST: handler },
    getSession,
  };
}
