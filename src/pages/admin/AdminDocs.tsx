import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function AdminDocs() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Admin Docs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Internal reference for content management conventions and best practices.
        </p>
      </div>

      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="changelog">
          <AccordionTrigger className="text-base font-semibold">
            Changelog &amp; Versioning
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              We use <strong className="text-foreground">Semantic Versioning</strong> (SemVer):{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">MAJOR.MINOR.PATCH</code>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">PATCH</strong> (e.g. 1.2.3 → 1.2.4) — Bug fixes, typo corrections, minor tweaks</li>
              <li><strong className="text-foreground">MINOR</strong> (e.g. 1.2.4 → 1.3.0) — New features, new pages, new content sections</li>
              <li><strong className="text-foreground">MAJOR</strong> (e.g. 1.3.0 → 2.0.0) — Large redesigns, breaking changes, major milestones</li>
            </ul>
            <p><strong className="text-foreground">Change types:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">feature</code> — A brand-new capability</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">improvement</code> — Enhancement to existing functionality</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">bugfix</code> — Something broken that was fixed</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">new</code> — New content (heroes, items, guides added)</li>
            </ul>
            <p><strong className="text-foreground">Tips:</strong> Write titles as short action phrases (e.g. "Added hero filtering" not "We have added the ability to filter heroes"). Descriptions can be longer.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="content">
          <AccordionTrigger className="text-base font-semibold">
            Writing News &amp; Guides
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">News articles:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use a clear, descriptive title — avoid clickbait</li>
              <li>The <strong className="text-foreground">excerpt</strong> appears in cards/lists — keep it under 160 characters</li>
              <li>Body content supports full Markdown (see cheat sheet below)</li>
              <li>Categories: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">update</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">guide</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">event</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">community</code></li>
            </ul>
            <p><strong className="text-foreground">Guides:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Target a specific topic (e.g. "Best builds for Warrior class")</li>
              <li>Include an author name for attribution</li>
              <li>Set <strong className="text-foreground">published</strong> to false while drafting, flip to true when ready</li>
            </ul>
            <p><strong className="text-foreground">Slugs:</strong> Use lowercase, hyphen-separated words. Example: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">best-warrior-builds-2026</code></p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="flags">
          <AccordionTrigger className="text-base font-semibold">
            Feature Flags Reference
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Feature flags control which public sections are visible. Toggle them in <strong className="text-foreground">Settings</strong>.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">database</code> — Heroes, items, skills, and materials database pages</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">guides</code> — Community guides section</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">tools</code> — Interactive tools (tier lists, team builder, calculators)</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">community</code> — Community hub page</li>
            </ul>
            <p>When a flag is <strong className="text-foreground">off</strong>, visitors see a "Coming Soon" placeholder.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="roadmap">
          <AccordionTrigger className="text-base font-semibold">
            Roadmap Statuses
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">planned</code> — Accepted idea, not yet started</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">in_progress</code> — Actively being worked on</li>
              <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">completed</code> — Done and live on the site</li>
            </ul>
            <p>Use <strong className="text-foreground">sort_order</strong> to control display order within each status column. Lower numbers appear first.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="markdown">
          <AccordionTrigger className="text-base font-semibold">
            Markdown Cheat Sheet
          </AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <div className="bg-muted rounded-md p-4 font-mono text-xs space-y-2">
              <p># Heading 1</p>
              <p>## Heading 2</p>
              <p>### Heading 3</p>
              <p className="mt-2">**bold text**</p>
              <p>*italic text*</p>
              <p>~~strikethrough~~</p>
              <p className="mt-2">- Bullet list item</p>
              <p>1. Numbered list item</p>
              <p className="mt-2">[Link text](https://example.com)</p>
              <p>![Alt text](https://example.com/image.png)</p>
              <p className="mt-2">`inline code`</p>
              <p>```</p>
              <p>code block</p>
              <p>```</p>
              <p className="mt-2">&gt; Blockquote</p>
              <p>---  (horizontal rule)</p>
            </div>
            <p><strong className="text-foreground">Image URLs:</strong> Use full URLs (e.g. from a CDN or public hosting). Relative paths won't work in Markdown content fields.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
