

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const API_URL = 'https://leetcode.com/graphql/';
const PAGE_SIZE = 100;

const QUERY = `
query problemsetQuestionList(
  $categorySlug: String,
  $limit: Int,
  $skip: Int,
  $filters: QuestionListFilterInput
) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug,
    limit: $limit,
    skip: $skip,
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      difficulty
      frontendQuestionId: questionFrontendId
      paidOnly: isPaidOnly
      title
      titleSlug
      topicTags {
        name
        slug
      }
    }
  }
}`;

const TOPIC_MAP = {
  'array': 'Arrays',
  'hash table': 'Hashing',
  'string': 'Strings',
  'two pointers': 'Two Pointers',
  'sliding window': 'Sliding Window',
  'stack': 'Stack',
  'queue': 'Queue',
  'binary search': 'Binary Search',
  'linked list': 'Linked List',
  'tree': 'Trees & BST',
  'binary tree': 'Trees & BST',
  'binary search tree': 'Trees & BST',
  'graph': 'Graphs',
  'heap (priority queue)': 'Heap',
  'dynamic programming': 'Dynamic Programming',
  'greedy': 'Greedy',
  'backtracking': 'Backtracking',
  'trie': 'Trie',
  'bit manipulation': 'Bit Manipulation',
  'math': 'Math & Geometry',
  'geometry': 'Math & Geometry',
  'sorting': 'Sorting',
  'matrix': 'Matrix',
  'database': 'Database',
  'shell': 'Shell',
  'concurrency': 'Concurrency',
  'design': 'Design',
  'simulation': 'Simulation',
  'prefix sum': 'Prefix Sum',
  'union find': 'Union-Find',
  'counting': 'Counting',
  'enumeration': 'Enumeration',
  'number theory': 'Number Theory',
  'combinatorics': 'Combinatorics',
  'segment tree': 'Segment Tree',
  'binary indexed tree': 'Fenwick Tree',
  'divide and conquer': 'Divide & Conquer',
  'topological sort': 'Graphs',
  'shortest path': 'Graphs',
  'minimum spanning tree': 'Graphs'
};

function getTopic(tags) {
  for (const tag of tags) {
    const topic = TOPIC_MAP[tag.toLowerCase()];
    if (topic) return topic;
  }

  return 'Other';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(skip) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Referer': 'https://leetcode.com/problemset/all/',
      'Origin': 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0'
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        categorySlug: '',
        skip,
        limit: PAGE_SIZE,
        filters: {}
      }
    })
  });

  if (!response.ok) {
    throw new Error(
      `LeetCode returned HTTP ${response.status} at offset ${skip}`
    );
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(
      JSON.stringify(result.errors)
    );
  }

  const page = result.data?.problemsetQuestionList;

  if (!page) {
    throw new Error('Unexpected LeetCode API response.');
  }

  return page;
}

async function saveQuestions(questions) {
  let processed = 0;

  for (let i = 0; i < questions.length; i += 50) {
    const batch = questions.slice(i, i + 50);

    await Promise.all(
      batch.map(question =>
        prisma.question.upsert({
          where: {
            slug: question.slug
          },
          update: question,
          create: question
        })
      )
    );

    processed += batch.length;

    console.log(
      `Saved ${processed} / ${questions.length} questions`
    );
  }
}

async function main() {
  console.log('Connecting to LeetCode public problem list...');

  let skip = 0;
  let total = null;

  const uniqueQuestions = new Map();

  while (total === null || skip < total) {
    console.log(`Fetching questions from offset ${skip}...`);

    const page = await fetchPage(skip);

    if (total === null) {
      total = page.total;
      console.log(`LeetCode reports ${total} total questions.`);
    }

    const rows = page.questions || [];

    if (rows.length === 0) {
      console.log('No more questions returned.');
      break;
    }

    for (const q of rows) {
      const id = Number(q.frontendQuestionId);

      if (
        !q.title ||
        !q.titleSlug ||
        !Number.isInteger(id) ||
        id <= 0
      ) {
        continue;
      }

      const tags = (q.topicTags || [])
        .map(tag => tag.name)
        .filter(Boolean);

      const difficulty = ['Easy', 'Medium', 'Hard'].includes(q.difficulty)
        ? q.difficulty
        : 'Medium';

      const topic = getTopic(tags);

      uniqueQuestions.set(q.titleSlug, {
        title: q.title,
        slug: q.titleSlug,
        leetcodeId: id,
        url: `https://leetcode.com/problems/${q.titleSlug}/`,
        difficulty,
        topic,
        pattern: tags[0] || topic,
        tags,
        paidOnly: Boolean(q.paidOnly),
        sortOrder: id,
        isActive: true
      });
    }

    skip += rows.length;

    if (skip < total) {
      await sleep(700);
    }
  }

  const questions = [...uniqueQuestions.values()];

  if (!questions.length) {
    throw new Error('No valid questions were downloaded.');
  }

  console.log(`\nUnique questions downloaded: ${questions.length}`);

  console.log('Saving questions to PostgreSQL...');

  await saveQuestions(questions);

  const finalCount = await prisma.question.count({
    where: { isActive: true }
  });

  const topicCounts = await prisma.question.groupBy({
    by: ['topic'],
    where: { isActive: true },
    _count: { _all: true },
    orderBy: { topic: 'asc' }
  });

  console.log('\n========== FINAL QUESTION BANK ==========');
  console.log(`LeetCode reported total: ${total}`);
  console.log(`Downloaded unique questions: ${questions.length}`);
  console.log(`Total active database questions: ${finalCount}`);

  console.log('\nTOPIC-WISE COUNTS');

  for (const item of topicCounts) {
    console.log(`${item.topic}: ${item._count._all}`);
  }

  console.log('=========================================');
}

main()
  .catch(error => {
    console.error('\nIMPORT FAILED:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

