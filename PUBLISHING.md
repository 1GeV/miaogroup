# Publishing

Both modes use the same Astro source, layout, and features at https://1gev.github.io/miaogroup/.

## Setup and modes

Requirements: Node.js 22 or newer, Git, a checkout on `main`, and a Git Credential Manager login with repository administrator access. Missing website dependencies are installed automatically.

Double-click a Windows shortcut to save the mode in `publishing.json` and apply it:

| Shortcut | Mode | Publishing behavior |
| --- | --- | --- |
| `publish-local.cmd` | `local` | Build locally and upload to `gh-pages`; disable the original Actions workflow to avoid the current billing lock. |
| `publish-github.cmd` | `github` | Restore the original Actions workflow and request an online build. Subsequent source pushes publish automatically. |

Both shortcuts call `publish.ps1` and keep the window open for the result. `npm run publish` or `.\publish.ps1` uses the saved mode. Editing `publishing.json` alone does not apply Pages settings; a selected mode remains saved even if publication fails.

## Publish changes

1. Edit source files on `main`. For a local preview, run `.\preview.ps1`, then stop it with `Ctrl+C`.
2. Commit and upload the source changes:

   ```powershell
   git add .
   git commit -m "Update website"
   git push
   ```

3. Double-click `publish-local.cmd` for the emergency fallback. Wait for `Published successfully:` and the site address, then refresh the site to check the result.

Publishing scripts do not stage, commit, or push source changes. They synchronize source without overwriting local edits; uncommitted changes other than `publishing.json` must be committed first. The ignored `work/` and `dist/` directories do not need manual cleanup.

After edits made directly on GitHub, skip the Git commands and run the shortcut. Only one maintainer needs a local build environment. Local mode requires publication after each content update; it does not switch automatically on a billing error. The computer can be shut down after successful publication.

## Restore GitHub Actions

Run `publish-github.cmd` and check the requested build in GitHub Actions. If the billing lock persists, run `publish-local.cmd` to restore the fallback. Commit and push `publishing.json` separately to share a mode change.

Once Actions publishing works, ordinary source pushes are sufficient. Running the GitHub shortcut again requests another build and may cancel an older run.

## Checks and time behavior

- **Uncertain deployment result:** run `npm run publish:check` before uploading again. A failed status check does not necessarily mean publication failed. Retry network failures after connectivity returns.
- **Source conflicts:** commit local changes and reconcile conflicts before retrying. Edit `main`, not generated HTML on `gh-pages`.
- **Queued run cannot be cancelled:** local mode can continue past GitHub's specific pre-queue cancellation conflict only after confirming zero jobs and a disabled original workflow. Runs with actual jobs and other cancellation errors still block the switch.
- **Pages rejects publication:** inspect its deployment error. Local mode avoids the current Actions build lock but cannot bypass every account restriction.

Countdowns, the homepage seminar banner, and date comparisons retain their browser behavior. Term status and the calendar's current date are evaluated on page load; a page left open across a date boundary may need refreshing. Visitor device clocks must be accurate.

`calendar.ics` and its 12-month window refresh at build time, including each local publication. They do not regenerate solely as time passes; calendar applications synchronize on their own schedules. Content changes require another build and publication.

## GitHub backups

Source checkpoints are stored as tags in `1GeV/miaogroup`:

| Tag | Checkpoint |
| --- | --- |
| `v2026.11.07-before-emergency-publishing` | Original Astro source, including the November 10 activity. |
| `v2026.11.07-emergency-publishing` | Initial emergency switch. |
| `v2026.11.07-emergency-publishing-ready` | Complete fallback and handling for interrupted status checks. |

The earlier Jekyll prototype is tagged `v2026.11.07-jekyll-publishing-checkpoint` in `1GeV/miaogroup-deploy-test-20261107`; it does not reproduce all Astro features.

Restore from a tag on a new branch while preserving later content updates. Tags preserve source, not Pages settings; apply the desired mode through the publishing script.

Maintenance tools and coding assistants should read this file and `publishing.json`, inspect `npm run publish:check`, preserve contributor changes, and confirm the expected content or publication marker online. Maintained project text uses English and neutral wording.
