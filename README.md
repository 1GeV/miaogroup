# Miao Group website

Static Astro website deployed free through GitHub Pages.

## Update content

Create one Markdown file for each calendar activity in `src/content/events/`, or for each seminar talk in `src/content/seminars/`. You can edit or create files directly in GitHub. Commit the change to publish it automatically.

Set `draft: true` while preparing a record. Drafts do not appear on the website.

### Calendar activity

Create a file in `src/content/events/`:

```md
---
title: "Weekly group meeting"
type: group-meeting
date: 2026-09-15T15:00:00+08:00
endDate: 2026-09-15T17:00:00+08:00
time: "15:00-17:00"
location: "Room 101"
speaker: "Miao Group"
onlineMeeting: "Tencent Meeting: 123 456 789"
description: "Optional description for the iCal export."
public: false
draft: false
---
```

- `title`: activity name.
- `type`: `group-meeting`, `lecture`, `seminar`, `defense`, or `other`.
- `date`: required start date and time. Use `+08:00` for Shanghai.
- `endDate`, `time`, `location`, `speaker`, `onlineMeeting`, `description`: optional details.
- `public`: show this activity in the homepage upcoming section.
- `draft`: hide the activity from the website and calendar.

### Seminar talk

Create one file in `src/content/seminars/` for each talk:

```md
---
series: "Strings, Fields and Holography Seminar"
semester: "2026 Fall"
date: 2026-09-18T16:00:00+08:00
speaker: "Name"
title: "Talk title"
paper: "Optional paper title"
references:
  - label: "arXiv"
    url: "https://arxiv.org/abs/0000.00000"
onlineMeeting: "Zoom Meeting ID: 123 456 789"
recordingUrl: "https://example.com/recording"
draft: false
---
```

- `series`: seminar column. Records with the same value are grouped together.
- `semester`: archive heading within that column.
- `date`, `speaker`, `title`: required talk details.
- `paper`, `references`, `onlineMeeting`, `recordingUrl`: optional details.
- `draft`: hide the talk from the website and calendar.

### Automatic archive date

To set a fixed archive date for a term, create one file in `src/content/seminar-terms/`:

```md
---
series: "Strings, Fields and Holography Seminar"
semester: "2026 Fall"
archiveAfter: 2026-12-31T23:59:59+08:00
---
```

After `archiveAfter`, the term is automatically labelled `Archive`, including when no new deployment has happened. If no term file exists, the term is archived after its last scheduled talk.

## Local preview

```powershell
npm install
npm run dev
```

Open the local address printed in the terminal. Stop the preview with `Ctrl+C`.

## Publish changes

```powershell
git add .
git commit -m "Update website"
git push
```
