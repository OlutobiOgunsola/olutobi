export type Quote = { text: string; author: string };

/** The hero picks one of these at random on every page load. */
export const quotes: Quote[] = [
  { text: "The most dangerous phrase in the language is, ‘We’ve always done it this way.’", author: "Grace Hopper" },
  { text: "Beware of bugs in the above code; I have only proved it correct, not tried it.", author: "Donald Knuth" },
  { text: "Program testing can be used to show the presence of bugs, but never to show their absence!", author: "Edsger W. Dijkstra" },
  {
    text: "Everyone knows that debugging is twice as hard as writing a program in the first place. So if you’re as clever as you can be when you write it, how will you ever debug it?",
    author: "Brian Kernighan",
  },
  { text: "There are only two hard things in Computer Science: cache invalidation and naming things.", author: "Phil Karlton" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  {
    text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
  },
  { text: "Adding manpower to a late software project makes it later.", author: "Fred Brooks" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "The only way to go fast, is to go well.", author: "Robert C. Martin" },
];

/** One quote at random. Call it at request time (after `connection()`), not during a prerender. */
export function randomQuote(): Quote {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
