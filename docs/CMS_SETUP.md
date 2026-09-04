# Content Manager setup

The site has a web-based content manager at **https://shiftingcorridors.com/admin.html**
so Game Masters can add and edit events without writing markdown.

It's [Sveltia CMS](https://sveltiacms.app) — a git-based CMS. There's no server
and no database: saving in the form commits a markdown file to this repository.
Content stays in git, and if the tool ever goes away the content is unaffected.

## How a save reaches the site

```
GM fills in the form and clicks Save
  └─ commit to the `content` branch
       ├─ deploy-dev-on-pr.yml  → preview at dev.shiftingcorridors.com
       └─ content-pr.yml        → opens a PR into main (first push only)
            └─ you review and merge
                 ├─ deploy-production.yml    → live in ~2 minutes
                 └─ sync-content-branch.yml  → content back level with main
```

Sveltia has no editorial workflow of its own yet (it's deferred until 1.0), so a
Save commits directly to whatever branch it targets. Pointing it at `content`
rather than `main` is what buys the preview and the review step.

**Merge content PRs with a merge commit, not a squash.** Squashing rewrites the
commits, so `content` still looks like it has changes to contribute and the next
PR re-proposes edits that already landed.

## One-time setup

Steps 1–4 need doing once before the sign-in button works. Until then the login
screen offers "Sign In with Token" instead, which works but asks each person for
a GitHub personal access token.

### 1. Let Actions open pull requests

`content-pr.yml` opens the pull request as `GITHUB_TOKEN`, which GitHub forbids
by default:

```
pull request create failed: GraphQL: GitHub Actions is not permitted to
create or approve pull requests (createPullRequest)
```

Enable it under **Settings → Actions → General → Workflow permissions**:
*Allow GitHub Actions to create and approve pull requests*. Or:

```bash
gh api -X PUT repos/martyjhenderson/shifting-corridors-site/actions/permissions/workflow \
  -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=true
```

Leave the default token permission at **read** — every workflow here declares
the scopes it needs.

That one checkbox governs *create and approve* together, so it also lets a
workflow approve a pull request. If you ever add a "require approvals" rule to
`main`, know that a workflow could satisfy it.

### 2. Create the `content` branch

```bash
git checkout main && git pull
git checkout -b content
git push -u origin content
```

Branch it from `main`, not from a feature branch — otherwise `content` carries
commits that aren't on `main` yet and the first content PR duplicates them.

### 3. Deploy the authenticator

Sveltia needs a small OAuth broker to exchange a GitHub login for a token. It
runs as a free Cloudflare Worker and is independent of where the site is hosted —
the site stays on S3/CloudFront.

```bash
git clone https://github.com/sveltia/sveltia-cms-auth.git
cd sveltia-cms-auth
npx wrangler deploy
```

Note the URL it prints, e.g. `https://sveltia-cms-auth.<subdomain>.workers.dev`.

Use the free `*.workers.dev` hostname for now. A custom domain like
`auth.shiftingcorridors.com` needs the DNS zone on Cloudflare, and this domain
is on Route 53.

### 4. Register the GitHub OAuth app

At **Settings → Developer settings → OAuth Apps → New OAuth App**:

| Field | Value |
| --- | --- |
| Application name | Shifting Corridors Content Manager |
| Homepage URL | `https://shiftingcorridors.com` |
| Authorization callback URL | `https://<your-worker>.workers.dev/callback` |

The callback points at the **worker**, not the site — so moving the site later
(to Cloudflare Pages, say) never invalidates it.

Then set the worker's secrets:

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put ALLOWED_DOMAINS   # shiftingcorridors.com,dev.shiftingcorridors.com
```

Finally, replace the placeholder in [`public/admin-config.yml`](../public/admin-config.yml):

```yaml
backend:
  base_url: https://REPLACE-ME.workers.dev    # <- your worker URL
```

### 5. Give Game Masters access

Each GM needs **write access to this repository** — the CMS acts as them, so a
read-only collaborator can't save. Invite them under **Settings → Collaborators**.

Then protect `main` (**Settings → Branches → Add rule**) so they can commit to
`content` but not straight to production:

- Branch name pattern: `main`
- Require a pull request before merging

## Adding a field

The form and the markdown front-matter are two descriptions of one schema. To add
a field, change all three:

1. `public/admin-config.yml` — the form control
2. `src/utils/staticData.ts` — the `MarkdownMeta` or `Scenario` type
3. `src/components/EventDetails.tsx` — how it renders

`src/tests/cmsConfig.test.ts` fails if content uses a key the form doesn't
declare, which catches the most common half-finished version of this.

## Upgrading Sveltia

The version is pinned in `public/admin.html` so a CDN release can't change the
editor under everyone without a deploy. To upgrade, bump the version there, open
a PR, and try the editor on the dev preview before merging.

## Notes

- `/admin.html`, not `/admin/`. CloudFront fronts the S3 REST endpoint, which
  doesn't serve directory index files; `/admin/` would 404 and the distribution's
  `404 → /index.html` rule would then serve the React site instead of the CMS.
- The page is `noindex`, but it isn't a secret — it's a login screen, and GitHub
  does the actual authorisation.
