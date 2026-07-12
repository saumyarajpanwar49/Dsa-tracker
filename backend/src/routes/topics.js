const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Comprehensive pre-loaded DSA topics — no need to create these manually
const DEFAULT_TOPICS = [
  // Arrays & Strings
  'Array',
  'String',
  'Matrix / 2D Array',
  'Prefix Sum',

  // Linked Lists
  'Linked List',
  'Doubly Linked List',
  'Fast & Slow Pointers',

  // Stacks & Queues
  'Stack',
  'Queue',
  'Deque',
  'Monotonic Stack',
  'Monotonic Queue',

  // Trees
  'Binary Tree',
  'Binary Search Tree',
  'AVL Tree',
  'Segment Tree',
  'Fenwick Tree / BIT',
  'Trie',
  'N-ary Tree',
  'Tree DP',

  // Graphs
  'Graph',
  'BFS',
  'DFS',
  'Topological Sort',
  'Shortest Path (Dijkstra)',
  'Shortest Path (Bellman-Ford)',
  'Shortest Path (Floyd-Warshall)',
  'Minimum Spanning Tree',
  'Union Find / DSU',
  'Bipartite Graph',
  'Strongly Connected Components',

  // Searching & Sorting
  'Binary Search',
  'Sorting',
  'Quick Select',

  // Sliding Window & Two Pointers
  'Sliding Window',
  'Two Pointers',

  // Hashing
  'HashMap / HashSet',

  // Heap
  'Heap / Priority Queue',

  // Dynamic Programming
  'DP - 1D',
  'DP - 2D',
  'DP - Knapsack (0/1)',
  'DP - Knapsack (Unbounded)',
  'DP - LCS / LIS',
  'DP - Matrix Chain',
  'DP - Digit DP',
  'DP - Bitmask DP',
  'DP - Interval DP',
  'DP - Tree DP',
  'DP - Stock Problems',

  // Greedy
  'Greedy',
  'Interval / Scheduling',

  // Recursion & Backtracking
  'Recursion',
  'Backtracking',
  'Divide & Conquer',

  // Bit Manipulation
  'Bit Manipulation',

  // Math & Number Theory
  'Math',
  'Number Theory (GCD, LCM, Prime)',
  'Modular Arithmetic',
  'Combinatorics',

  // Advanced / Miscellaneous
  'String Matching (KMP / Z-algo)',
  'Rabin-Karp / Rolling Hash',
  'Game Theory',
  'Geometry',
  'Design (LRU, LFU, etc.)',
  'Simulation',
];

// GET /api/topics — returns default + custom, excluding deleted
router.get('/', async (req, res, next) => {
  try {
    const [customTopics, deletedTopics] = await Promise.all([
      prisma.customTopic.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.deletedTopic.findMany(),
    ]);

    const customNames = customTopics.map((t) => t.name);
    const deletedNames = new Set(deletedTopics.map((t) => t.name));

    // Merge defaults + custom, then filter out deleted ones
    const merged = [
      ...DEFAULT_TOPICS,
      ...customNames.filter((n) => !DEFAULT_TOPICS.includes(n)),
    ].filter((t) => !deletedNames.has(t));

    res.json({ topics: merged, custom: customNames });
  } catch (err) {
    next(err);
  }
});

// POST /api/topics — add a custom topic
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Topic name is required' });
    }
    const trimmed = name.trim();

    // If it was previously deleted, restore it
    await prisma.deletedTopic.deleteMany({ where: { name: trimmed } }).catch(() => {});

    const topic = await prisma.customTopic.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed },
    });

    res.status(201).json(topic);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/topics/:name — works for both custom and default topics
router.delete('/:name', async (req, res, next) => {
  try {
    const name = decodeURIComponent(req.params.name);

    if (DEFAULT_TOPICS.includes(name)) {
      // Default topic: record it as deleted so it won't show up
      await prisma.deletedTopic.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    } else {
      // Custom topic: remove from DB entirely
      await prisma.customTopic.deleteMany({ where: { name } });
    }

    res.json({ message: `Topic "${name}" deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
