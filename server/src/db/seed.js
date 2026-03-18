require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const bcrypt = require('bcrypt');
const { categories, books, chapters, admins } = require('./schema');

// Use neon websocket pool to bypass TCP/VPN drop issues
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { categories, books, chapters, admins } });

async function main() {
  console.log('🌱 Seeding database...');

  // ── Categories ────────────────────────────────────────────────────────────
  const insertedCategories = await db
    .insert(categories)
    .values([
      { name: 'Science Fiction', description: 'Futuristic worlds, space exploration, and technology.' },
      { name: 'Fantasy', description: 'Magic, mythical creatures, and epic adventures.' },
      { name: 'Mystery & Thriller', description: 'Detective stories, suspense, and crime fiction.' },
      { name: 'Classic Literature', description: 'Timeless works that shaped literary history.' },
      { name: 'Non-Fiction', description: 'Factual books on history, science, biography, and more.' },
    ])
    .onConflictDoNothing()
    .returning();

  // Re-fetch in case of conflict (idempotent re-runs)
  const { eq, or } = require('drizzle-orm');
  const allCats = await db.select().from(categories);
  const catMap = Object.fromEntries(allCats.map((c) => [c.name, c]));

  const sciFi = catMap['Science Fiction'];
  const fantasy = catMap['Fantasy'];
  const mystery = catMap['Mystery & Thriller'];
  const classics = catMap['Classic Literature'];
  const nonFiction = catMap['Non-Fiction'];

  console.log(`✅ ${allCats.length} categories ready`);

  // ── Books ─────────────────────────────────────────────────────────────────
  const insertedBooks = await db
    .insert(books)
    .values([
      { title: 'The War of the Worlds', author: 'H. G. Wells', description: 'A classic science fiction novel describing the invasion of Earth by Martians from a narrator in London.', isFeatured: true, categoryId: sciFi.id, coverImage: 'https://www.gutenberg.org/cache/epub/36/pg36.cover.medium.jpg' },
      { title: 'The Time Machine', author: 'H. G. Wells', description: 'A man travels into the distant future and discovers the divided descendants of humanity: the Eloi and the Morlocks.', isFeatured: true, categoryId: sciFi.id, coverImage: 'https://www.gutenberg.org/cache/epub/35/pg35.cover.medium.jpg' },
      { title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', description: 'A young girl falls through a rabbit hole into a fantasy world populated by peculiar, anthropomorphic creatures.', isFeatured: true, categoryId: fantasy.id, coverImage: 'https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg' },
      { title: 'Peter Pan', author: 'J. M. Barrie', description: 'The story of a mischievous boy who can fly and never grows up, spending his never-ending childhood on the island of Neverland.', isFeatured: false, categoryId: fantasy.id, coverImage: 'https://www.gutenberg.org/cache/epub/16/pg16.cover.medium.jpg' },
      { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', description: 'Sherlock Holmes investigates the legend of a supernatural hound on the haunted moors of Devonshire.', isFeatured: true, categoryId: mystery.id, coverImage: 'https://www.gutenberg.org/cache/epub/2852/pg2852.cover.medium.jpg' },
      { title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', description: 'A collection of twelve short stories featuring the famous consulting detective Sherlock Holmes and his friend Dr. John Watson.', isFeatured: false, categoryId: mystery.id, coverImage: 'https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg' },
      { title: 'Pride and Prejudice', author: 'Jane Austen', description: 'The timeless story of Elizabeth Bennet and the proud Mr. Darcy in Regency-era England.', isFeatured: true, categoryId: classics.id, coverImage: 'https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg' },
      { title: 'Walden', author: 'Henry David Thoreau', description: 'A reflection upon simple living in natural surroundings, and a manual for self-reliance.', isFeatured: false, categoryId: nonFiction.id, coverImage: 'https://www.gutenberg.org/cache/epub/205/pg205.cover.medium.jpg' },
      { title: 'Frankenstein', author: 'Mary Wollstonecraft Shelley', description: 'The story of a young scientist who creates a sapient creature in an unorthodox scientific experiment.', isFeatured: true, categoryId: sciFi.id, coverImage: 'https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg' },
      { title: 'Narrative of the Life of Frederick Douglass', author: 'Frederick Douglass', description: 'An influential memoir and treatise on abolition written by a famous orator and former slave.', isFeatured: false, categoryId: nonFiction.id, coverImage: 'https://www.gutenberg.org/cache/epub/23/pg23.cover.medium.jpg' },
    ])
    .onConflictDoNothing()
    .returning();

  // Re-fetch books for chapter insertion
  const allBooks = await db.select().from(books);
  const bookMap = Object.fromEntries(allBooks.map((b) => [b.title, b]));
  console.log(`✅ ${allBooks.length} books ready`);

  // ── Chapters ──────────────────────────────────────────────────────────────
  const chaptersToInsert = [
    // The Stars Are Ours
    {
      bookId: bookMap['The War of the Worlds'].id,
      title: 'Departure',
      order: 1,
      content: `<h2>Chapter 1: Departure</h2>
<p>The last shuttle left Earth's atmosphere at 03:14 GMT on a Tuesday—not that anyone was counting days anymore. Mira pressed her face against the viewport, watching the blue marble shrink until it was indistinguishable from any other star in the black.</p>
<p>"You should strap in," said Juno, the ship's AI, her voice warm despite the cold of the void pressing against the hull. "Acceleration phase begins in four minutes."</p>
<p>Mira didn't move. She had waited twenty-three years for this moment—half her life—and she wasn't going to spend it strapped into a seat.</p>
<p>There were forty-seven thousand of them aboard the <em>Prometheus</em>. Forty-seven thousand souls chosen by lottery, by genetics, by skill, by pure dumb luck. The last seeds of a civilization that had burned through its home planet in three centuries of industrial fury.</p>
<p>The ship groaned as the engines fired. Mira grabbed the viewport railing, felt the force build in her chest, and watched Earth disappear into the past.</p>`,
    },
    {
      bookId: bookMap['The War of the Worlds'].id,
      title: 'First Contact',
      order: 2,
      content: `<h2>Chapter 2: First Contact</h2>
<p>They were sixteen months into the journey when the signal arrived.</p>
<p>It came from ahead—not from behind, not from Earth's dying radio ghost—but from the direction of Proxima Centauri, their destination. Commander Yusuf called an emergency bridge meeting at 0200 hours ship-time, pulling Mira and the senior science team from their sleep cycles.</p>
<p>"We've run it through every filter we have," said Dr. Patel, her hands trembling slightly as she pulled up the waveform on the main display. "It's structured. Repeating. Non-random."</p>
<p>The bridge was silent except for the hum of life support.</p>
<p>"Could be a pulsar artifact," Mira offered, though she didn't believe it as she said it.</p>
<p>"Pulsars don't respond to our own transmissions," Commander Yusuf said quietly. "This one did."</p>
<p>The implications settled over the room like a slow tide. They were not alone. They had never been alone. And whatever was waiting for them at Proxima Centauri already knew they were coming.</p>`,
    },
    {
      bookId: bookMap['The War of the Worlds'].id,
      title: 'The Weight of Distance',
      order: 3,
      content: `<h2>Chapter 3: The Weight of Distance</h2>
<p>Three years in, the psychological reports started coming in waves. Commander Yusuf read each one in his quarters with the lights dimmed, making notes in the margins with a pen—an affectation, his crew called it, but he found the physical act of writing kept him grounded when everything else was in freefall.</p>
<p>Depression rates up 12%. Interpersonal conflicts trending 30% above baseline. Two attempted suicides, both unsuccessful, both now under care. The <em>Prometheus</em> was a closed system in more ways than one.</p>
<p>He closed the report and looked out at the stars—unchanging, indifferent, vast. They had left behind everything familiar, and what lay ahead was, at best, a mathematical probability.</p>
<p>Mira knocked on his door at midnight. She carried two cups of the synthetic coffee that everyone called "dirt water" and nobody stopped drinking.</p>
<p>"The signal is getting stronger," she said, handing him a cup. "Whatever is there—it's not small."</p>`,
    },
    // The Dragon's Last Oath
    {
      bookId: bookMap["Alice's Adventures in Wonderland"].id,
      title: 'The Dying Fire',
      order: 1,
      content: `<h2>Chapter 1: The Dying Fire</h2>
<p>The dragon came down from the Ashpeak Mountains on a Wednesday, which Lena thought was a strange day for the end of an age.</p>
<p>She was pulling turnips in the north field when she heard it—a sound like the sky cracking open, low and resonant, felt in the chest before it reached the ears. The chickens scattered. Old Mab, her father's draft horse, reared and broke her tether. Lena dropped her basket and shaded her eyes against the afternoon sun.</p>
<p>The dragon was enormous—larger than the barn, larger than the mill house, larger than anything she'd been told still existed in the world. Its scales were the grey of old ash, its eyes twin fires burning toward amber. It was flying slowly, she realized. Not the predatory glide of a hunting beast, but the labored wingbeats of something exhausted.</p>
<p>It landed in the commons three hundred paces from her and did not move.</p>
<p>The village held its breath. Then the dragon lowered its great head to the ground, and Lena felt, with absolute certainty she could not explain, that it was waiting for her.</p>`,
    },
    {
      bookId: bookMap["Alice's Adventures in Wonderland"].id,
      title: 'The Bond',
      order: 2,
      content: `<h2>Chapter 2: The Bond</h2>
<p>Her name—the dragon's name, which she showed Lena not in words but in sensation—was something like burning cedar and distant thunder. Lena called her Ash, which the dragon seemed to find acceptable, or at least not offensive enough to correct.</p>
<p>The bonding happened before the village elders arrived to decide what to do. It happened because Lena walked up to the dragon while everyone else was running away, placed her hand on the ridge of scales above Ash's left eye, and simply <em>stayed there</em>.</p>
<p>The world opened up between them. Not her memories flooding into Ash, or Ash's into her—something more like two rivers finding the same sea. Lena saw flashes: mountains she'd never visited, battles fought over centuries, a sky thick with dragons that had thinned and thinned until there was only one left.</p>
<p>"You're the last," she said aloud. Her voice came out surprisingly steady.</p>
<p>Ash's answer was not in words. It was in the weight of it—the terrible, specific weight of being the final thing of its kind, and knowing it.</p>`,
    },
    // The Vanishing Hour
    {
      bookId: bookMap['The Hound of the Baskervilles'].id,
      title: 'The Call',
      order: 1,
      content: `<h2>Chapter 1: The Call</h2>
<p>The call came at 6:47 a.m., which Detective Cara Solis knew was significant because murderers almost never called at convenient times.</p>
<p>"We've got a missing person," said Lieutenant Torres. "High profile. The mayor's niece."</p>
<p>Cara was already pulling on her coat one-handed, phone wedged between ear and shoulder. "How long?"</p>
<p>"Last seen at eleven PM last night. Didn't come home. Mother found her room empty at six this morning."</p>
<p>"Seven hours." Cara did the math automatically. Seven hours with a high-profile victim was pressure she could already feel building behind her eyebrows. "Threat level?"</p>
<p>Torres hesitated. "We found a note. Explicit. The writer claims she's the fifth."</p>
<p>Cara stopped moving. "The fifth what?"</p>
<p>"That's what we need you to figure out. And Solis—the note says we have until midnight."</p>`,
    },
    {
      bookId: bookMap['The Hound of the Baskervilles'].id,
      title: 'The Scene',
      order: 2,
      content: `<h2>Chapter 2: The Scene</h2>
<p>The mayor's niece was named Sophie Tran, twenty-four years old, a graduate student in environmental science. Bed made (unusual, per the mother). Laptop open at forty-five degrees. Phone charger still plugged in, phone absent. Running shoes by the door.</p>
<p>Cara stood in the doorway and did what she always did first: nothing. She just looked.</p>
<p>The note was on the desk, under the laptop's left corner. Printed, not handwritten—careful, deliberate.</p>
<p><em>She's the fifth. You found the others too late. Let's see if you've learned anything.</em></p>
<p>Cara's jaw tightened. A killer who'd been watching her work. Eleven hours left on a clock she hadn't known was running.</p>`,
    },
    // Pride and Prejudice
    {
      bookId: bookMap['Pride and Prejudice'].id,
      title: 'A Truth Universally Acknowledged',
      order: 1,
      content: `<h2>Chapter 1: A Truth Universally Acknowledged</h2>
<p>It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.</p>
<p>However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.</p>
<p>"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"</p>
<p>Mr. Bennet replied that he had not.</p>
<p>"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."</p>
<p>Mr. Bennet made no answer.</p>
<p>"Do not you want to know who has taken it?" cried his wife impatiently.</p>
<p>"You want to tell me, and I have no objection to hearing it."</p>
<p>This was invitation enough.</p>`,
    },
    {
      bookId: bookMap['Pride and Prejudice'].id,
      title: 'The Netherfield Ball',
      order: 2,
      content: `<h2>Chapter 2: The Netherfield Ball</h2>
<p>The ball at Netherfield was a source of conversation for the whole neighbourhood for several days before it took place. Mrs. Bennet had so thoroughly enjoyed the anticipation that she seemed almost sorry to arrive.</p>
<p>Elizabeth went in determined to enjoy it as much as she could. She loved dancing, she loved the music, and she was curious about Mr. Bingley's intimate friend, of whom Jane had said so much.</p>
<p>Mr. Darcy stood near the entrance—tall and handsome indeed—but his expression held a coldness that made the handsomeness feel like a trap. He danced only twice in the first half of the evening.</p>
<p>He came toward her for the first time, close enough to be heard over the music, and said with the air of completing an obligation: "I suppose, Miss Bennet, that you do not dance."</p>
<p>She looked at him steadily. "I am perfectly capable of it, Mr. Darcy. I was merely waiting for a partner worth the effort."</p>`,
    },
  ];

  await db.insert(chapters).values(chaptersToInsert).onConflictDoNothing();
  console.log(`✅ ${chaptersToInsert.length} chapters seeded`);

  // ── Admin user ─────────────────────────────────────────────────────────────
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(admins)
    .values({ username, passwordHash })
    .onConflictDoNothing();

  console.log(`✅ Admin user "${username}" seeded`);
  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => pool.end());
