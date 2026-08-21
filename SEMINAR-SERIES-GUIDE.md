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
- `contact`: optional public contact text.
- `links`: optional labelled links for registration, a questionnaire, or a series homepage.
- `draft`: hides this column-level information; it does not hide the talks.

For a particular talk, put papers, recordings, slides, and notes in that talk's `references` list:

```yaml
references:
  - label: "arXiv"
    url: "https://arxiv.org/abs/0000.00000"
  - label: "Recording"
    url: "https://example.com/recording"
```

Only publish recordings when the speaker, copyright holders, and any participants shown in the recording have given appropriate permission. Prefer an external academic or video platform; do not store video files in this GitHub repository.
