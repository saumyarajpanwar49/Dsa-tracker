const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const DEFAULT_TOPICS = [
  'Array', 'String', 'Matrix / 2D Array', 'Prefix Sum',
  'Linked List', 'Doubly Linked List', 'Fast & Slow Pointers',
  'Stack', 'Queue', 'Deque', 'Monotonic Stack', 'Monotonic Queue',
  'Binary Tree', 'Binary Search Tree', 'AVL Tree',
  'Segment Tree', 'Fenwick Tree / BIT', 'Trie', 'N-ary Tree', 'Tree DP',
  'Graph', 'BFS', 'DFS', 'Topological Sort',
  'Shortest Path (Dijkstra)', 'Shortest Path (Bellman-Ford)',
  'Shortest Path (Floyd-Warshall)', 'Minimum Spanning Tree',
  'Union Find / DSU', 'Bipartite Graph', 'Strongly Connected Components',
  'Binary Search', 'Sorting', 'Quick Select',
  'Sliding Window', 'Two Pointers', 'HashMap / HashSet',
  'Heap / Priority Queue',
  'DP - 1D', 'DP - 2D', 'DP - Knapsack (0/1)',
  'DP - Knapsack (Unbounded)', 'DP - LCS / LIS',
  'DP - Matrix Chain', 'DP - Digit DP', 'DP - Bitmask DP',
  'DP - Interval DP', 'DP - Tree DP', 'DP - Stock Problems',
  'Greedy', 'Interval / Scheduling',
  'Recursion', 'Backtracking', 'Divide & Conquer',
  'Bit Manipulation', 'Math', 'Number Theory (GCD, LCM, Prime)',
  'Modular Arithmetic', 'Combinatorics',
  'String Matching (KMP / Z-algo)', 'Rabin-Karp / Rolling Hash',
  'Game Theory', 'Geometry', 'Design (LRU, LFU, etc.)', 'Simulation',
];

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [customTopics, deletedTopics] = await Promise.all([
      prisma.customTopic.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.deletedTopic.findMany({ where: { userId } }),
    ]);

    const customNames = customTopics.map((topic) => topic.name);
    const deletedNames = new Set(deletedTopics.map((topic) => topic.name));

    const topics = [
      ...DEFAULT_TOPICS,
      ...customNames.filter((name) => !DEFAULT_TOPICS.includes(name)),
    ].filter((name) => !deletedNames.has(name));

    res.json({ topics, custom: customNames });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Topic name is required' });
    }

    const trimmed = name.trim();
    const userId = req.user.id;

    await prisma.deletedTopic.deleteMany({
      where: { userId, name: trimmed },
    });

    const topic = await prisma.customTopic.upsert({
      where: {
        userId_name: { userId, name: trimmed },
      },
      update: {},
      create: { userId, name: trimmed },
    });

    res.status(201).json(topic);
  } catch (error) {
    next(error);
  }
});

router.delete('/:name', async (req, res, next) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const userId = req.user.id;

    if (DEFAULT_TOPICS.includes(name)) {
      await prisma.deletedTopic.upsert({
        where: {
          userId_name: { userId, name },
        },
        update: {},
        create: { userId, name },
      });
    } else {
      await prisma.customTopic.deleteMany({
        where: { userId, name },
      });
    }

    res.json({ message: `Topic "${name}" deleted` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
