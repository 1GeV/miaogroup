# Miao Group

Static academic website for Miao Group, built with Astro and designed for free deployment on GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

The production build is generated with `npm run build`.

## GitHub Pages setup

1. Create a repository named `miaogroup` under the GitHub account or organization that will own the site.
2. Push this project to the repository's `main` branch.
3. In **Settings → Pages**, choose **GitHub Actions** as the source.
4. The workflow in `.github/workflows/deploy.yml` will build and deploy the site automatically after each push.

The project uses `/miaogroup/` as its default project-site path. If the repository is owned by a different GitHub account, update `site` in `astro.config.mjs` and the placeholder GitHub links in the page content before the first deployment.

## Editing content without code

You can create or edit files directly in the GitHub web interface. Each academic activity is one Markdown file in `src/content/events/`. Each seminar talk is one Markdown file in `src/content/seminars/`. After committing, GitHub Actions publishes the update automatically.

See [CONTRIBUTING.md](CONTRIBUTING.md) for copy-and-paste templates and field explanations.
