# Content guide

Create one Markdown file for every calendar activity and every seminar talk. Set `draft: true` while preparing a record; drafts are not published.

## Calendar activity

Create a file in `src/content/events/` using the calendar activity template in `README-UPDATED.md`.

- `type`: `group-meeting`, `lecture`, `seminar`, `defense`, or `other`.
- `date`: required start time. Use `+08:00` for Asia/Shanghai.
- `endDate`, `time`, `location`, `speaker`, `onlineMeeting`, and `description`: optional.
- `public`: include the activity in the homepage upcoming section.
- `draft`: hide the activity from the website and calendar.

## Seminar talk

Create one file in `src/content/seminars/` for each talk.

- `series`: seminar column; matching values are grouped together.
- `semester`: archive heading within the column.
- `date`, `speaker`, and `title`: required.
- `paper`, `references`, `onlineMeeting`, and `recordingUrl`: optional.
- `draft`: hide the talk from the website and calendar.

## Automatic archive date

Create one file in `src/content/seminar-terms/` with `series`, `semester`, and `archiveAfter`. After that date, the term automatically displays `Archive`. Without a term file, the term is archived after its last scheduled talk.

Use the exact field names and valid URL format shown in `README-UPDATED.md`. Check the date, timezone, speaker name, and links before committing.
