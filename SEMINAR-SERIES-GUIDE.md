# Seminar column settings

Create one file in `src/content/seminar-series/` for each seminar column. The file is optional; the column can exist without it.

```md
---
series: "Strings, Fields and Holography Seminar"
description: "A public seminar for talks and reading discussions across high-energy theory."
contact: "Email: seminar@example.edu"
links:
  - label: "Seminar webpage"
    url: "https://example.com/strings-fields-holography"
  - label: "Registration form"
    url: "https://example.com/strings-fields-holography/register"
  - label: "Feedback questionnaire"
    url: "https://example.com/strings-fields-holography/feedback"
draft: false
---
```

- `series`: must exactly match the `series` field in the talk files.
- `description`: optional public introduction for the whole column.
- `contact`: optional public contact text. Email addresses become `mailto:` links and `https://` addresses become external links automatically.
- `links`: optional labelled links for registration, a questionnaire, or a series homepage. `url` is optional; without it, the label is shown as plain text.
- `draft`: hides this column-level information; it does not hide the talks.

The `series` field in a term file can contain an inline formula and is used as the displayed series heading:

```yaml
series: 'Strings, Fields and Holography Seminar $\eta$'
semester: "2026 Fall"
archiveAfter: 2027-02-28T23:59:59+08:00
```

The formula-bearing term series is matched to the talk series by its plain-text part, so the talk files do not need to repeat the formula.

For a particular talk, put papers, recordings, slides, and notes in that talk's `references` list:

```yaml
references:
  - label: "arXiv"
    url: "https://arxiv.org/abs/0000.00000"
  - label: "Recording"
    url: "https://example.com/recording"
```

`url` is optional. A reference with only `label` is shown as plain text, which is useful for a paper or resource that is not publicly linked yet.

`label` is the visible link text. Prefer a concise resource label, such as `arXiv: 2401.12345`, `DOI`, `Slides`, or `Recording`. Use the talk's `paper` field for the paper title; add the author and year there when useful.

Talks may also include an optional `location` field. Both calendar activities and seminar talks accept an `onlineMeeting` with only a `label`; `url` and `copy` are optional. This works for all activity types, not only seminars:

```yaml
location: "Room 101"
onlineMeeting:
  label: "Tencent Meeting"
```

Use `description` for a public note about the talk. It is shown on the seminar page and in the academic calendar, and it supports inline formulas:

```yaml
description: 'Discussion of the entropy formula $S_A$ and its geometric meaning.'
```

Only publish recordings when the speaker, copyright holders, and any participants shown in the recording have given appropriate permission. Prefer an external academic or video platform; do not store video files in this GitHub repository.

For online participation, use a labelled URL plus copyable meeting details:

```yaml
onlineMeeting:
  label: "Zoom"
  url: "https://zoom.us/j/example"
  copy: "Meeting ID: 123 456 789; Passcode: 2468"
```

The URL is opened directly. Each number group in `copy` can be clicked to copy it. Seminar series names and talk titles accept inline formulas such as `$AdS_3$` and `$Z_{CFT}=Z_{AdS}$`.

For a formula containing a backslash, use single quotes around the YAML value:

```yaml
title: 'Entanglement entropy $S_A$ and action $I=S/\hbar$'
```

Do not put a single backslash formula inside YAML double quotes. If double quotes are required, write the backslash twice: `"$I=S/\\hbar$"`.

If there is no online URL yet, keep only the label:

```yaml
onlineMeeting:
  label: "Tencent Meeting"
```
