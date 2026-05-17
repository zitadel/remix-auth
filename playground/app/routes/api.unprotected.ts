/** Public endpoint — accessible without authentication. */
export async function loader() {
  return Response.json({ ok: true });
}
