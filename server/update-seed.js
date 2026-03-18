const fs = require('fs');

const path = 'src/db/seed.js';
let file = fs.readFileSync(path, 'utf8');

const updatedBooksContent = `[
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
    ]`;

const booksRegex = /(\.insert\(books\)\s*\n\s*\.values\()\[[\s\S]*?\](\))/;
file = file.replace(booksRegex, '$1' + updatedBooksContent + '$2');

file = file.replace(/'The Stars Are Ours'/g, "'The War of the Worlds'");
file = file.replace(/"The Dragon's Last Oath"/g, "\"Alice's Adventures in Wonderland\"");
file = file.replace(/'The Vanishing Hour'/g, "'The Hound of the Baskervilles'");

fs.writeFileSync(path, file);
console.log('Seed updated correctly.');
