# Miao Group website

Static Astro website deployed free through GitHub Pages.

## Update content

Create one Markdown file for each calendar activity in `src/content/events/`, or one file for each seminar talk in `src/content/seminars/`. Set `draft: true` while preparing a record. Drafts are not published. Commit changes to publish them through GitHub Actions.

### Calendar activity

```md
---
title: 'Weekly group meeting $S_A$'
type: group-meeting
date: 2026-09-15T15:00:00+08:00
time: "15:00-17:00"
location: "Room 101"
speaker: "Miao Group"
description: 'Discussion of the formula $S_A$.'
onlineMeeting:
  label: "Tencent Meeting"
  url: "https://meeting.tencent.com/dm/example"
  copy: "Meeting ID: 123 456 789; Passcode: 2468"
references:
  - label: "arXiv: 2401.12345"
    url: "https://arxiv.org/abs/2401.12345"
public: false
draft: false
---
```

`type` can be `group-meeting`, `lecture`, `seminar`, `defense`, or `other`. Use `HH:MM-HH:MM` for a range; use `HH:MM` for a start time only. `description` is shown in the calendar list and supports formulas.

`onlineMeeting.label` is always shown. `url` is optional and becomes a link when present. Each number group in `copy` can be clicked to copy only that number group.

### Seminar talk

Create one file in `src/content/seminars/` for each talk:

```md
---
series: 'Strings, Fields and Holography Seminar $\eta$'
semester: "2026 Fall"
date: 2026-09-18T16:00:00+08:00
time: "15:00-17:00"
speaker: "Name"
title: 'Talk title $Z_{CFT}=Z_{AdS}$'
paper: 'Paper title, Author (2026)'
description: 'A short note about the talk and the formula $S_A$.'
references:
  - label: "arXiv: 2401.12345"
    url: "https://arxiv.org/abs/2401.12345"
  - label: "Slides"
onlineMeeting:
  label: "Zoom"
  url: "https://zoom.us/j/example"
  copy: "Meeting ID: 123 456 789; Passcode: 2468"
recordingUrl: "https://example.com/recording"
draft: false
---
```

`description` is shown on the seminar page and in the academic calendar. `references.label` is the visible link text; use concise labels such as `arXiv: 2401.12345`, `DOI`, `Slides`, or `Recording`. The URL is optional, so a pending resource can contain only a label. Use `paper` for the paper title and author/year information.

### Automatic archive date

Create one file in `src/content/seminar-terms/`:

```md
---
series: 'Strings, Fields and Holography Seminar $\eta$'
semester: "2026 Fall"
archiveAfter: 2026-12-31T23:59:59+08:00
---
```

The `seminar-terms.series` value is used as the displayed seminar heading. Its plain-text part is matched to the talk series, so the talk files do not need to repeat the formula. After `archiveAfter`, the term is labelled `Archive` automatically.

### Formulas

Use single quotes for YAML values containing LaTeX backslashes:

```yaml
title: 'Action $I=S/\hbar$ and boundary term $\partial M$'
```

Do not put a single backslash formula inside YAML double quotes. If double quotes are required, write the backslash twice: `"$I=S/\\hbar$"`.

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
