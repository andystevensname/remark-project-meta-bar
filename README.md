# remark-project-meta-bar

A [remark](https://github.com/remarkjs/remark) plugin that renders project metadata bars from a frontmatter `projects` array, placed inline in Markdown via the `::project-meta-bar` directive.

## Why

If you write documentation pages about open-source projects, you usually want to display a small bar at the top showing the project name, links to GitHub/npm/docs, and an install command. Hand-writing this in HTML is repetitive. Putting it in the page template means you can't control where it appears in the flow of the article.

This plugin lets you keep all the project metadata in your page's frontmatter (one source of truth) and decide where in the article body the bar should appear, using a one-line directive.

## Install

```sh
npm install remark-project-meta-bar remark-directive
```

`remark-directive` and `unist-util-visit` are peer dependencies.

## Usage

```js
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import remarkProjectMetaBar from 'remark-project-meta-bar';

const md = `---
projects:
  - project_name: my-package
    code_urls:
      - https://github.com/user/my-package
      - https://www.npmjs.com/package/my-package
    cli: npm install my-package
    docs: https://my-package.dev
---

Some intro text.

::project-meta-bar

More text below.
`;

const html = await remark()
  .use(remarkFrontmatter)
  .use(remarkDirective)
  .use(remarkProjectMetaBar)
  .process(md);
```

In Astro, frontmatter is automatically available on `file.data.astro.frontmatter`, so the plugin works out of the box without `remark-frontmatter`.

## Syntax

The plugin recognizes leaf directives named `project-meta-bar`:

```md
::project-meta-bar
```

This renders one bar per project in the frontmatter `projects` array.

To render only specific projects, pass a label with the project names:

```md
::project-meta-bar[my-package]

::project-meta-bar[my-package,other-package]
```

## Frontmatter format

```yaml
projects:
  - project_name: my-package        # required, used as the <dt>
    code_urls:                      # optional array of URLs
      - https://github.com/...
      - https://www.npmjs.com/package/...
    cli: npm install my-package     # optional install command
    docs: https://my-package.dev    # optional documentation URL
```

The plugin auto-detects GitHub and npm URLs in the `code_urls` array and renders icon links for them. Any other URLs are ignored (you can render them yourself with regular Markdown links).

## Output

Each `::project-meta-bar` directive becomes a `<div class="project-meta-bar-group">` containing one `<dl class="project-meta-bar">` per project. The structure uses semantic description list elements:

```html
<div class="project-meta-bar-group">
  <dl class="project-meta-bar" aria-label="my-package project info">
    <dt class="project-meta-bar-name">my-package</dt>
    <div class="project-meta-bar-rest">
      <div class="project-meta-bar-links">
        <dd><a href="..." class="project-meta-bar-link">...Docs</a></dd>
        <dd><a href="..." class="project-meta-bar-link" aria-label="View on GitHub">...</a></dd>
        <dd><a href="..." class="project-meta-bar-link" aria-label="View on npm">...</a></dd>
      </div>
      <dd class="project-meta-bar-cli-wrap">
        <span class="sr-only">Install: npm install my-package</span>
        <code class="project-meta-bar-cli" aria-hidden="true">npm install my-package</code>
        <button type="button" class="project-meta-bar-copy" data-copy="npm install my-package" aria-label="Copy install command">...</button>
        <span class="sr-only" role="status" aria-live="polite"></span>
      </dd>
    </div>
  </dl>
</div>
```

You provide the CSS to lay it out and the JavaScript to wire up the copy button. The plugin only handles the markup.

## Options

```js
remarkProjectMetaBar({
  directiveName: 'project-meta-bar',         // change the directive name
  frontmatterKey: 'projects',         // change the frontmatter key
  getFrontmatter: (file) =>           // override how frontmatter is read
    file.data.astro?.frontmatter ?? file.data.frontmatter ?? {},
})
```

## Accessibility

- Each bar is a `<dl>` with the project name as the `<dt>` and metadata items as `<dd>` elements
- The bar is labeled with `aria-label="<project name> project info"`
- The cli `<code>` is `aria-hidden` to prevent screen readers from spelling out the command character-by-character; a visually-hidden `<span>` provides "Install: <command>" as readable text
- The copy button has an `aria-label` and a sibling `[role="status"][aria-live="polite"]` element for announcing copy success

## License

MIT
