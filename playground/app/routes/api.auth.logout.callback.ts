import type { LoaderFunctionArgs } from 'react-router';

// noinspection JSUnusedGlobalSymbols
/**
 * Handles the logout callback by unconditionally clearing all Auth.js session
 * cookies and redirecting to the success page. This endpoint is used by
 * Playwright tests to verify that session cookies are properly cleared on
 * logout. In a production ZITADEL integration, this would also validate a
 * state parameter for CSRF protection.
 *
 * @param request - The incoming request object.
 * @returns A redirect response to /logout/success with authjs.* cookies cleared.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const cookieNames = cookieHeader
    .split(';')
    .filter(Boolean)
    .map((c) => c.trim().split('=')[0].trim())
    .filter((name) => name.startsWith('authjs.'));

  const headers = new Headers({ Location: '/' });
  for (const name of cookieNames) {
    headers.append('Set-Cookie', `${name}=; Max-Age=0; Path=/`);
  }

  return new Response(null, { status: 302, headers });
}
