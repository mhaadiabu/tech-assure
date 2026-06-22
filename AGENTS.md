# TechAssure — Agent Guidelines

This is the global `AGENTS.md` for the tech-assure monorepo. Read
this before making any change.

## Stack

- **Frontend**: Next.js 16 (App Router) with the React Compiler on,
  Tailwind v4, Geist Sans + Geist Mono, base-ui primitives, shadcn
  components sourced from `@_scaffold/ui`.
- **Auth**: Clerk. JWT issuer is `CLERK_JWT_ISSUER_DOMAIN`,
  mirrored to Convex via the `convex` template.
- **Backend**: Convex (TypeScript), with the Clerk auth provider
  declared in `packages/backend/convex/auth.config.ts`.
- **Monorepo**: pnpm-style workspaces via bun. Apps in `apps/*`,
  shared packages in `packages/*` (`@_scaffold/*` aliases).

## Repo layout

```
apps/
  web/                     Next.js app (the only customer-facing surface)
packages/
  backend/                 Convex schema, queries, mutations
  ui/                      shadcn/ui primitives and shared components
  env/                     @t3-oss env validation per app target
  config/                  Shared tsconfig presets
```

## Commands

- `bun install` — install deps after pulling
- `bun run check-types` — typecheck every package
- `bun run check-types:convex` — typecheck the Convex code in isolation
- `cd apps/web && bun run dev` — start Next.js on port 3000
- `cd packages/backend && bunx convex dev` — start Convex dev
- `cd apps/web && bun run build` — production build

Always typecheck and build before opening a PR.

## Conventions

- **TypeScript**: strict. No `any`, no `// @ts-ignore` without
  comment justification, no eslint disables.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/).
  Types: `feat:`, `fix:`, `refactor:`, `style:`, `chore:`,
  `docs:`, `test:`, `perf:`. Keep commits small and atomic.
- **Branches**: short-lived topic branches off `main`. Rebase
  before merging.
- **PRs**: small, focused, with a clear summary of *what* and *why*.

## Commit trailer policy

**Do NOT add `Co-Authored-By: opencode` or any other AI co-author
trailer to commit messages.** Commits should be authored by a
human only.

If a tool, agent, or LLM produces a commit message that includes
a co-author trailer, strip the trailer before committing.

## Design language

The app UI is the product. Decisions and conventions:

- **Type**: Geist Sans, single family. No display fonts in UI labels.
  Tabular-nums on every numeric cell.
- **Color**: monochrome with a single warm accent (the `--accent-warm`
  token in `packages/ui/src/styles/globals.css`). Used sparingly,
  never as decoration.
- **Surfaces**: two levels only — page background and panel
  background (single bordered surface). No card-within-card.
- **Radius**: one radius token. The default is `--radius: 0.5rem`.
  Do not override with `rounded-none` or `rounded-xl` piecemeal.
- **Charts**: recharts, wrapped in `ResponsiveContainer` inside
  panels. Wrap chart parents in `min-w-0` to avoid recharts'
  width=-1 warning.
- **Roles**: dashboard sections are gated server-side by
  `dashboardSectionsByRole` and the dashboard's section page
  returns `notFound()` for sections the operator's role can't see.
  The sidebar filters sections by the same list.

For brand / marketing surfaces, follow the same design language
plus the references under `.agents/skills/`. The landing page is
for the TechAssure team only — no SaaS marketing chrome, no
"Get started" CTAs.

## Role-scoped UI

The four operator roles are `manager`, `operations`, `cashier`,
`analyst`. Each section is assigned to a subset of roles:

- `manager` — full access
- `cashier` — overview, POS, sales
- `operations` — overview, POS, inventory, suppliers
- `analyst` — overview, sales, forecast

When adding a new section, update `dashboardSectionsByRole` in
`apps/web/src/lib/techassure-demo-data.ts` AND the matching
constant on the backend. Mirroring the two is required for
server-side `notFound()` and client-side sidebar filtering to
agree.

## Auth & data flow

- Clerk holds the canonical user. Sign-in via Clerk, JWT
  forwarded to Convex via the `convex` template.
- Convex `users` table mirrors Clerk via two paths:
  1. Client-side `syncViewer` mutation on first sign-in.
  2. Server-side `upsertUserFromClerk` mutation from the
     `/api/webhooks/clerk` webhook handler.
- `ensureSeedData` is **NOT** auto-called. The dashboard renders
  an empty state until a manager clicks the "Seed data" button
  in the header. The seed only runs once; subsequent calls just
  rebuild forecasts.

## Hidden assumptions / things that will trip you up

- `proxy.ts` (not `middleware.ts`) is the Next.js 16 convention
  for what used to be middleware.
- The proxy's matcher excludes `/api/webhooks` so the Clerk
  webhook handler runs without auth middleware in front of it.
- The `Panel` component in `dashboard-shell.tsx` takes an
  `action` prop; the `New product` and `New supplier` buttons
  mount in the panel headers AND in the empty-state button row.
  Don't remove either; the empty-state is the path for the
  first-time user.
- The `provider.tsx` wraps the app in `ConvexProviderWithClerk`,
  which reads Clerk's session via `useAuth`. If the Clerk JWT
  template named `convex` doesn't exist, the session call 404s
  and the dashboard never authenticates with Convex.

## File conventions

- Components live next to their consumers in
  `apps/web/src/components/`. A new section of the dashboard
  goes in `dashboard-shell.tsx` (one file, many components),
  not a new file per section.
- Convex functions live in
  `packages/backend/convex/<topic>.ts`. `dashboard.ts` is the
  kitchen sink; smaller topics get their own file.
- New pages go under `apps/web/src/app/<route>/page.tsx` with
  an App Router page export.
- New dashboard sections need a label and a description in
  `apps/web/src/lib/techassure-demo-data.ts`.

## Review checklist

Before opening a PR, walk this:

1. `bun run check-types` and `bun run check-types:convex` both pass.
2. `cd apps/web && bun run build` produces no errors.
3. The dashboard renders correctly when the workspace is empty
   (no `notFound`, no infinite skeleton, no `requireSessionUser`
   thrown).
4. The role-gated controls (seed button, New product / New
   supplier buttons) show for managers, hide for cashiers.
5. No `Co-Authored-By` trailer in any commit message.
6. New section appears in `dashboardSectionsByRole` for at
   least one role and in the sidebar nav.
