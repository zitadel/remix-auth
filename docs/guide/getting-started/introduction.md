---
title: Introduction
group: Getting Started
children:
  - ./installation.md
---

# Introduction

`@zitadel/remix-auth` is an open source library that provides authentication
for Remix 3 applications. It wraps [Auth.js](https://authjs.dev/) (`@auth/core`)
to bring OAuth, credentials, and magic-link authentication to Remix with a
native developer experience.

Through a direct integration into Remix's loaders and actions, you can access
and utilize user sessions within your route modules and resource routes
directly.

## Features

### Authentication providers

- OAuth (eg. GitHub, Google, Twitter, Azure...)
- Custom OAuth (Add your own!)
- Credentials (username / email + password)
- Email Magic URLs

### Application Side Session Management

- Session fetching from loaders via `getSession`
- Methods to `getSession`, `signIn` and `signOut`
- Full TypeScript support for all methods and properties

### Application protection

- Loader-based protection: redirect from `loader` when session is absent
- Resource route protection via `getSession(request)`
- Server-side session access in any loader / action
