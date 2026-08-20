# Content contribution guide

This site is intentionally maintained through small text files. You do not need to edit the page code to add an event or seminar talk.

## Add an academic calendar event

Create a new file in `src/content/events/`, for example `2026-09-15-group-meeting.md`:

```md
---
title: "Weekly group meeting"
type: group-meeting
date: 2026-09-15T15:00:00+08:00
endDate: 2026-09-15T17:00:00+08:00
time: "15:00–17:00"
location: "Room / online link"
speaker: "Speaker name"
meetingUrl: "https://example.com"
description: "Short description shown in calendar export."
draft: false
---

Optional longer notes can go here.
```

Allowed `type` values: `group-meeting`, `lecture`, `seminar`, `defense`, `other`.

Use the timezone `+08:00` for Asia/Shanghai. Set `draft: true` while preparing an entry; it will not appear on the website.

## Add a seminar talk

Create one file in `src/content/seminars/`, for example `2026-fall-first-talk.md`:

```md
---
semester: "2026 Fall"
current: true
date: 2026-09-18T16:00:00+08:00
speaker: "Name"
title: "Talk title"
paper: "Optional paper title"
references:
  - label: "arXiv"
    url: "https://arxiv.org/abs/0000.00000"
recordingUrl: "https://example.com/recording"
draft: false
---

Optional abstract or notes.
```

Set `current: true` for the active semester. Usually only one semester should be marked current. Keep old records in the repository so the archive remains complete.

## Review checklist

- Check the date, time, timezone, speaker, and links.
- Use quotation marks around text values containing punctuation.
- Confirm that every URL starts with `https://`.
- Preview the GitHub diff before committing.
- After committing, check the Actions tab if the website does not update within a few minutes.
