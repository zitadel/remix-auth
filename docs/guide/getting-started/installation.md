---
title: Installation
group: Getting Started
---

# Installation

Install `@zitadel/remix-auth` and `@auth/core`:

```bash
# npm
npm install @zitadel/remix-auth @auth/core

# pnpm
pnpm add @zitadel/remix-auth @auth/core

# yarn
yarn add @zitadel/remix-auth @auth/core
```

Mount the catch-all auth route at `app/routes/api.auth.$.ts`:

```ts
// app/routes/api.auth.$.ts
import { handlers } from '~/auth.server';

export const loader = handlers.GET;
export const action = handlers.POST;
```
