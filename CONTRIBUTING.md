# Content guide

Create one Markdown file for every calendar activity and seminar talk. Set `draft: true` while preparing a record; drafts are not published.

Use `README-UPDATED.md` for complete YAML templates. Important rules:

- Use `HH:MM-HH:MM` for a time range and `HH:MM` for a start time only.
- Use single-quoted YAML values when formulas contain backslashes, for example `title: 'Action $I=S/\hbar$'`.
- `description` is displayed for calendar activities and seminar talks and supports formulas.
- `references.label` is visible link text. Prefer concise labels such as `arXiv: 2401.12345`, `DOI`, `Slides`, or `Recording`; `url` is optional.
- `onlineMeeting.label` is always displayed. `url` is optional, and number groups in `copy` are individually copyable.
- The `series` value in a `seminar-terms` file may contain a formula and becomes the displayed series heading.

Check the date, timezone, speaker name, and links before committing.
