import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remark } from 'remark';
import remarkDirective from 'remark-directive';
import remarkProjectMetaBar from './index.js';

function process(md, frontmatter) {
  const processor = remark().use(remarkDirective).use(remarkProjectMetaBar);
  const file = { value: md, data: { frontmatter } };
  const tree = processor.parse(file);
  processor.runSync(tree, file);
  return tree;
}

test('renders a single project bar from frontmatter', () => {
  const tree = process('::project-meta-bar', {
    projects: [
      {
        project_name: 'my-package',
        code_urls: ['https://github.com/user/my-package'],
        cli: 'npm install my-package',
      },
    ],
  });

  const html = tree.children[0].children[0].value;
  assert.match(html, /<dl class="project-meta-bar"/);
  assert.match(html, /<dt class="project-meta-bar-name">my-package<\/dt>/);
  assert.match(html, /github\.com\/user\/my-package/);
  assert.match(html, /npm install my-package/);
});

test('renders multiple project bars when frontmatter has multiple', () => {
  const tree = process('::project-meta-bar', {
    projects: [
      { project_name: 'one' },
      { project_name: 'two' },
    ],
  });

  const html = tree.children[0].children[0].value;
  const matches = html.match(/<dl class="project-meta-bar"/g);
  assert.equal(matches.length, 2);
});

test('selects projects by name with [labels]', () => {
  const tree = process('::project-meta-bar[two]', {
    projects: [
      { project_name: 'one' },
      { project_name: 'two' },
      { project_name: 'three' },
    ],
  });

  const html = tree.children[0].children[0].value;
  assert.match(html, /<dt class="project-meta-bar-name">two<\/dt>/);
  assert.doesNotMatch(html, /one/);
  assert.doesNotMatch(html, /three/);
});

test('selects multiple projects with comma-separated labels', () => {
  const tree = process('::project-meta-bar[one,three]', {
    projects: [
      { project_name: 'one' },
      { project_name: 'two' },
      { project_name: 'three' },
    ],
  });

  const html = tree.children[0].children[0].value;
  assert.match(html, /one/);
  assert.doesNotMatch(html, />two</);
  assert.match(html, /three/);
});

test('detects npm URLs in code_urls', () => {
  const tree = process('::project-meta-bar', {
    projects: [
      {
        project_name: 'pkg',
        code_urls: ['https://www.npmjs.com/package/pkg'],
      },
    ],
  });

  const html = tree.children[0].children[0].value;
  assert.match(html, /aria-label="View on npm"/);
});

test('renders nothing for empty frontmatter', () => {
  const tree = process('::project-meta-bar', {});
  const html = tree.children[0].children[0].value;
  assert.equal(html, '');
});

test('escapes HTML in user-provided values', () => {
  const tree = process('::project-meta-bar', {
    projects: [
      {
        project_name: '<script>alert(1)</script>',
        cli: 'echo "hi"',
      },
    ],
  });

  const html = tree.children[0].children[0].value;
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test('directive name can be customized', () => {
  const processor = remark().use(remarkDirective).use(remarkProjectMetaBar, { directiveName: 'project' });
  const file = { value: '::project', data: { frontmatter: { projects: [{ project_name: 'pkg' }] } } };
  const tree = processor.parse(file);
  processor.runSync(tree, file);
  assert.match(tree.children[0].children[0].value, /pkg/);
});
