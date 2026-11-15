import { projects } from './studio';

import { luckyStory } from './lucky-story';
export { luckyStory } from './lucky-story';

export type EditorialWorkStory = {
  slug: string; category: 'work'; title: string; summary: string; notice?: string; path?: string;
  introduction: string[]; sections: { title: string; paragraphs: string[] }[];
};
export const editorialWorkStories: EditorialWorkStory[] = [luckyStory];

export function workStoryPath(slug: string) {
  return editorialWorkStories.find(story => story.slug === slug)?.path ?? `/blog/work/${slug}`;
}

// New work stories belong here by default. Homepage selection is independent.
export const workStories = [
  ...projects.map(project => ({ slug: project.slug, category: 'work' as const, title: project.name, summary: project.summary })),
  ...editorialWorkStories.map(({ slug, category, title, summary }) => ({ slug, category, title, summary })),
];

// Explicit owner-approved selection: adding a blog story never changes this list.
export const homepageFeaturedSlugs = ['theatrical-prop-packaging', 'live-sports-broadcasting'] as const;
export const featuredProjects = homepageFeaturedSlugs.map(slug => {
  const project = projects.find(entry => entry.slug === slug);
  if (!project) throw new Error(`Missing featured project: ${slug}`);
  return project;
});
