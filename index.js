import { visit } from 'unist-util-visit';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function findGithub(urls = []) {
  return urls.find((u) => u.includes('github.com'));
}

function findNpm(urls = []) {
  return urls.find((u) => u.includes('npmjs.com'));
}

const DOCS_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke-linecap="round"/><path d="M6 17L20 17" stroke-linecap="round"/><path d="M6 21L20 21" stroke-linecap="round"/><path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const GITHUB_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`;

const NPM_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323h13.837v13.548h-3.464V8.691h-3.46v10.18H5.13z"/></svg>`;

const COPY_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.4 20H9.6C9.26863 20 9 19.7314 9 19.4V9.6C9 9.26863 9.26863 9 9.6 9H19.4C19.7314 9 20 9.26863 20 9.6V19.4C20 19.7314 19.7314 20 19.4 20Z"/><path d="M15 9V4.6C15 4.26863 14.7314 4 14.4 4H4.6C4.26863 4 4 4.26863 4 4.6V14.4C4 14.7314 4.26863 15 4.6 15H9"/></svg>`;

function renderProjectBar(p) {
  const githubUrl = findGithub(p.code_urls);
  const npmUrl = findNpm(p.code_urls);
  const name = escapeHtml(p.project_name);

  let html = `<dl class="project-meta-bar" aria-label="${name} project info">`;
  html += `<dt class="project-meta-bar-name">${name}</dt>`;

  const links = [];
  if (p.docs) {
    links.push(`<li><a href="${escapeHtml(p.docs)}" class="project-meta-bar-link" aria-label="Project documentation">${DOCS_SVG}<span class="sr-only">Docs</span></a></li>`);
  }
  if (githubUrl) {
    links.push(`<li><a href="${escapeHtml(githubUrl)}" class="project-meta-bar-link" aria-label="View on GitHub">${GITHUB_SVG}<span class="sr-only">GitHub</span></a></li>`);
  }
  if (npmUrl) {
    links.push(`<li><a href="${escapeHtml(npmUrl)}" class="project-meta-bar-link" aria-label="View on npm">${NPM_SVG}<span class="sr-only">npm</span></a></li>`);
  }
  if (links.length) {
    html += `<dd class="project-meta-bar-links"><ul class="project-meta-bar-link-list">${links.join('')}</ul></dd>`;
  }

  if (p.cli) {
    const cli = escapeHtml(p.cli);
    html += `<dd class="project-meta-bar-cli-wrap">`;
    html += `<span class="sr-only">Install: ${cli}</span>`;
    html += `<code class="project-meta-bar-cli" aria-hidden="true">${cli}</code>`;
    html += `<button type="button" class="project-meta-bar-copy" data-copy="${cli}" aria-label="Copy install command">${COPY_SVG}</button>`;
    html += `<span class="sr-only" role="status" aria-live="polite"></span>`;
    html += `</dd>`;
  }

  html += `</dl>`;
  return html;
}

const defaultGetFrontmatter = (file) =>
  file.data.astro?.frontmatter ?? file.data.frontmatter ?? {};

export default function remarkProjectMetaBar(options = {}) {
  const {
    directiveName = 'project-meta-bar',
    frontmatterKey = 'projects',
    getFrontmatter = defaultGetFrontmatter,
  } = options;

  return (tree, file) => {
    visit(tree, (node) => {
      if (
        node.type !== 'leafDirective' &&
        node.type !== 'containerDirective' &&
        node.type !== 'textDirective'
      ) return;
      if (node.name !== directiveName) return;

      const frontmatter = getFrontmatter(file);
      const allProjects = frontmatter[frontmatterKey] ?? [];

      // ::project-meta-bar[name1,name2] selects specific projects by name
      // ::project-meta-bar with no label renders all projects
      let selected = allProjects;
      const label = node.children?.[0]?.value;
      if (label) {
        const names = label.split(',').map((s) => s.trim());
        selected = allProjects.filter((p) => names.includes(p.project_name));
      }

      const html = selected.map(renderProjectBar).join('');
      node.data = node.data ?? {};
      node.data.hName = 'div';
      node.data.hProperties = { className: 'project-meta-bar-group' };
      node.children = [{ type: 'html', value: html }];
    });
  };
}
