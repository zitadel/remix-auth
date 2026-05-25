---
title: Custom Pages
group: OAuth Provider
---

# Custom auth pages

OAuth ships default sign-in and error pages. To use your own pages,
point `pages.signIn` and `pages.error` at your custom routes:

## Config

```ts
// app/auth.server.ts
RemixAuth({
  // ...
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
})
```

## Custom sign-in page

The page POSTs to `/api/auth/signin/{provider}` with a CSRF token:

```tsx
// app/routes/auth.login.tsx
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [csrfToken, setCsrfToken] = useState('');
  useEffect(() => {
    fetch('/api/auth/csrf').then((r) => r.json()).then((d) => setCsrfToken(d.csrfToken));
  }, []);
  return (
    <form action="/api/auth/signin/github" method="post">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <button type="submit">Sign in with GitHub</button>
    </form>
  );
}
```

## Custom error page

```tsx
// app/routes/auth.error.tsx
import { useSearchParams } from 'react-router';

export default function ErrorPage() {
  const [params] = useSearchParams();
  const error = params.get('error') ?? 'default';
  return <main><h1>Sign-in error</h1><p>Code: {error}</p></main>;
}
```
