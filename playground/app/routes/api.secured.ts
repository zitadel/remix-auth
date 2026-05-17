import type { LoaderFunctionArgs } from 'react-router';
import { getSession } from '~/auth.server';

/** Protected endpoint — returns 403 when the request is unauthenticated. */
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  return Response.json({ ok: true });
}
