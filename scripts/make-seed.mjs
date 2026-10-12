import fs from 'node:fs';
const data = await import('../src/data/demoData.ts');
fs.mkdirSync('server', { recursive: true });
fs.writeFileSync(
  'server/seed.json',
  JSON.stringify(
    {
      profiles: [...data.demoProfiles, ...data.demoSpecialists],
      groups: data.demoGroups,
      listings: data.listingsSeed,
      posts: data.demoMessages.map((m) => ({
        id: m.id,
        author: m.author,
        text: m.text,
        tags: m.tags,
        createdAt: '2026-01-01T10:00:00.000Z',
        ownerId: null,
      })),
    },
    null,
    2,
  ),
);
