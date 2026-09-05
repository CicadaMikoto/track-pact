# Track Pact

Tripp and May's weekly music-production club. Live app: https://cicadamikoto.github.io/track-pact/

## Use it

1. Open the app. Both producers read the same published challenge from `public/club.json`.
2. Generate a draft, reroll individual fields, and click **Lock Challenge**.
3. Click **Continue on GitHub**, then **Create** on the prefilled request. GitHub applies it and closes the request, usually within a minute. Return to the app and click **Refresh shared**.
4. Enter a track title, status, notes, and a submission link. Click **Save Tripp's update** or **Save May's update**, then submit the prefilled request in the same way.
5. When both submitted statuses are published, share listening notes.

No API token, third-party account, server, or payment setup is needed. The repository owner and collaborators with write access can publish changes. Other visitors can read the public club but cannot change it. GitHub sign-in is required only to submit a save request. GitHub Actions and Pages must remain enabled.

Drafts and unsent edits are backed up in your browser. They are marked as local until saved to the repository. The app refreshes on focus and once per minute; **Refresh shared** checks immediately. It keeps local edits if someone else's save arrives at the same time. Use **Back up edits & load shared** to resolve that situation without losing your local copy.

## Privacy and music files

This app, its challenges, shared notes, and change requests are public. Do not put private sample libraries, credentials, or private session notes in this repo. Local unsent drafts stay in the browser until you submit them.

Ableton audio/project uploads are not implemented in the browser. For now, save a private Drive/Dropbox link or a link to a private GitHub project repository. Access to that destination is controlled there, independently of this app. For portable projects, use Ableton **Collect All and Save**, then archive the whole project folder. Include a rendered listening export. Third-party plugins must be installed separately.

A future private music repository can use `week-01/tripp/`, `week-01/may/`, and Git LFS for large assets. Keep music files out of this public application repository.

## Maintainers

- `app/model.ts`: generator and musical pools.
- `public/club.json`: authoritative shared record, readable and editable through GitHub.
- `scripts/operations.mjs`: validates section-specific changes and rejects stale edits.
- `scripts/apply-request.mjs`: applies authorized requests with optimistic concurrency and replay protection.
- `.github/workflows/save-request.yml`: processes `[Track Pact]` issues from users who have write/maintain/admin repository permission.
- `.github/workflows/pages.yml`: tests, builds, and publishes the static app on source pushes.

Add May in **Settings → Collaborators → Add people**. Write access is sufficient. No app configuration change is needed after they accept the invitation.

A request that fails validation stays open. Its Actions run explains the error. Refresh the app and submit a corrected request. For a transient GitHub failure, close and reopen the request to retry; already-applied request IDs are not processed twice.

## Develop

Use Node 24 and npm:

```sh
npm ci --ignore-scripts
npm run dev
npm test
npm run build
```

Vite serves `/track-pact/`. The public deployment uses the same path. `npm test` checks generator coherence, immutable locks, overlapping edits, link validation, and permission gates. The backend workflow uses only Node's built-in modules and the GitHub API; it never executes issue text or checks out issue-controlled code.

The app fetches the latest shared record from this repo rather than relying on a potentially older Pages build. A failed/offline fetch uses the last local copy or the seed bundled with the app.

Repository write history provides an audit trail. Old weeks retain both submissions and listening notes. No automatic cleanup deletes older weeks or music.
