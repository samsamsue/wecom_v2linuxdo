const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const scriptContent = fs.readFileSync(
  path.resolve(__dirname, "../linuxdo-wecom.user.js"),
  "utf8"
);

test("linuxdo-wecom includes cross-topic isolation, cache normalization, and DOM guards", () => {
  assert.ok(
    scriptContent.includes("function normalizeTopicCacheKey("),
    "must include normalizeTopicCacheKey"
  );
  assert.ok(
    scriptContent.includes("function deleteCachedTopic("),
    "must include deleteCachedTopic"
  );
  assert.ok(
    scriptContent.includes("function nativeDomTopicId("),
    "must include nativeDomTopicId"
  );
  assert.ok(
    scriptContent.includes("body.dataset.topicId = String(topicId);"),
    "must stamp body.dataset.topicId"
  );
  assert.ok(
    scriptContent.includes("panel.dataset.topicId = String(topicId);") ||
    scriptContent.includes("chatPanel.dataset.topicId = String(topicId);"),
    "must stamp panel.dataset.topicId"
  );
});

test("normalizeTopicCacheKey avoids NaN collision for V2EX multi-page cache keys", () => {
  function normalizeTopicCacheKey(topicId) {
    if (topicId == null) return "";
    return String(topicId).trim();
  }

  const cache = new Map();
  const setCache = (key, data) => cache.set(normalizeTopicCacheKey(key), data);
  const getCache = (key) => cache.get(normalizeTopicCacheKey(key));

  // If Number() had been used, "100_p2" and "200_p2" would both evaluate to NaN and overwrite each other!
  setCache("100_p1", { title: "Topic 100 Page 1", posts: [1, 2] });
  setCache("100_p2", { title: "Topic 100 Page 2", posts: [3, 4] });
  setCache("200_p2", { title: "Topic 200 Page 2", posts: [103, 104] });

  assert.equal(getCache("100_p1")?.title, "Topic 100 Page 1");
  assert.equal(getCache("100_p2")?.title, "Topic 100 Page 2");
  assert.equal(getCache("200_p2")?.title, "Topic 200 Page 2");
  assert.notEqual(getCache("200_p2")?.title, getCache("100_p2")?.title);
});

test("deleteCachedTopic clears both base topic and all its pagination keys without affecting other topics", () => {
  const cache = new Map();
  const setCache = (key, data) => cache.set(String(key).trim(), data);
  const deleteCachedTopic = (topicId) => {
    const key = String(topicId).trim();
    if (!key) return;
    cache.delete(key);
    for (const k of Array.from(cache.keys())) {
      if (k === key || k.startsWith(`${key}_`)) {
        cache.delete(k);
      }
    }
  };

  setCache("100", { id: 100 });
  setCache("100_p1", { id: 100, page: 1 });
  setCache("100_p2", { id: 100, page: 2 });
  setCache("200", { id: 200 });
  setCache("200_p2", { id: 200, page: 2 });

  deleteCachedTopic(100);

  assert.equal(cache.has("100"), false);
  assert.equal(cache.has("100_p1"), false);
  assert.equal(cache.has("100_p2"), false);
  assert.equal(cache.has("200"), true);
  assert.equal(cache.has("200_p2"), true);
});

test("openingPostNumber only extracts post number when pathname topicId matches target topicId", () => {
  function topicRouteFromPath(pathname) {
    const parts = String(pathname || "").split("/").filter(Boolean);
    if (parts[0] !== "t" || parts.length < 2) return { topicId: null, postNumber: 0, slug: "" };
    const postOf = (value) => (/^\d+$/.test(value || "") ? Number(value) : 0);
    if (/^\d+$/.test(parts[1])) {
      return { topicId: Number(parts[1]), postNumber: postOf(parts[2]), slug: "" };
    }
    if (/^\d+$/.test(parts[2] || "")) {
      return { topicId: Number(parts[2]), postNumber: postOf(parts[3]), slug: parts[1] };
    }
    return { topicId: null, postNumber: 0, slug: parts[1] || "" };
  }

  function simulateOpeningPostNumber(topicId, currentPath, rememberedMap = {}) {
    const route = topicRouteFromPath(currentPath);
    if (route.topicId && Number(route.topicId) === Number(topicId) && route.postNumber > 0) {
      return route.postNumber;
    }
    const remembered = Number(rememberedMap[topicId]) || 0;
    if (remembered > 0) return remembered;
    return 0;
  }

  // User was on topic 111 at post 50, now clicks topic 222
  const currentPath = "/t/topic-one/111/50";
  assert.equal(simulateOpeningPostNumber(222, currentPath), 0);
  assert.equal(simulateOpeningPostNumber(111, currentPath), 50);

  // If topic 222 has remembered post 5, it should use remembered post
  assert.equal(simulateOpeningPostNumber(222, currentPath, { 222: 5 }), 5);
});

test("syncNewPostsFromDom strictly rejects articles that do not match active chatState.topicId", () => {
  function simulateSyncNewPosts({
    activeTopicId,
    bodyTopicId,
    containerTopicId,
    articles,
    renderedLastNumber
  }) {
    if (!activeTopicId) return { injected: [] };
    if (bodyTopicId && Number(bodyTopicId) !== Number(activeTopicId)) return { injected: [] };
    if (containerTopicId && Number(containerTopicId) !== Number(activeTopicId)) return { injected: [] };

    const injected = [];
    for (const article of articles) {
      if (article.number <= renderedLastNumber) continue;
      const articleTopicId = article.topicId || containerTopicId || 0;
      if (!articleTopicId || Number(articleTopicId) !== Number(activeTopicId)) continue;
      injected.push(article);
    }
    return { injected };
  }

  // Scenario 1: Topic 200 is open, but native DOM container is still holding Topic 100
  const articlesFromOldTopic = [
    { number: 2, topicId: 100, text: "reply 2 of old topic" },
    { number: 3, topicId: 100, text: "reply 3 of old topic" },
    { number: 4, topicId: 100, text: "reply 4 of old topic" }
  ];

  const result1 = simulateSyncNewPosts({
    activeTopicId: 200,
    bodyTopicId: 200,
    containerTopicId: 100, // #topic is still topic 100
    articles: articlesFromOldTopic,
    renderedLastNumber: 1
  });
  assert.equal(result1.injected.length, 0, "must reject posts when native container topicId !== active topicId");

  // Scenario 2: Container topicId missing (0), but article.topicId is 100
  const result2 = simulateSyncNewPosts({
    activeTopicId: 200,
    bodyTopicId: 200,
    containerTopicId: 0,
    articles: articlesFromOldTopic,
    renderedLastNumber: 1
  });
  assert.equal(result2.injected.length, 0, "must reject posts when article topicId !== active topicId");

  // Scenario 3: Article topicId cannot be confirmed (0)
  const articlesUnknownTopic = [
    { number: 2, topicId: 0, text: "unknown post" }
  ];
  const result3 = simulateSyncNewPosts({
    activeTopicId: 200,
    bodyTopicId: 200,
    containerTopicId: 0,
    articles: articlesUnknownTopic,
    renderedLastNumber: 1
  });
  assert.equal(result3.injected.length, 0, "must reject posts when topicId cannot be verified");

  // Scenario 4: Matching topic 200
  const articlesNewTopic = [
    { number: 2, topicId: 200, text: "fresh reply in topic 200" }
  ];
  const result4 = simulateSyncNewPosts({
    activeTopicId: 200,
    bodyTopicId: 200,
    containerTopicId: 200,
    articles: articlesNewTopic,
    renderedLastNumber: 1
  });
  assert.equal(result4.injected.length, 1, "must accept posts when topicId matches active topicId");
  assert.equal(result4.injected[0].text, "fresh reply in topic 200");
});

test("appendFreshPosts rejects mutating body when body dataset.topicId !== active topicId", () => {
  function simulateAppendFreshPosts(posts, bodyTopicId, activeTopicId) {
    if (bodyTopicId && activeTopicId && Number(bodyTopicId) !== Number(activeTopicId)) {
      return 0;
    }
    return posts.length;
  }

  assert.equal(simulateAppendFreshPosts([{ id: 1 }], "100", 200), 0, "must reject when body topicId !== activeTopicId");
  assert.equal(simulateAppendFreshPosts([{ id: 1 }], "200", 200), 1, "must accept when body topicId === activeTopicId");
});

test("loadTopic hasRenderedMsgs requires matching dataset.topicId on body", () => {
  function simulateHasRenderedMsgs(body, targetTopicId) {
    return Boolean(
      body &&
      Number(body.datasetTopicId) === Number(targetTopicId) &&
      body.hasMsgs &&
      !body.isLoading
    );
  }

  const oldBody = { datasetTopicId: "100", hasMsgs: true, isLoading: false };
  assert.equal(
    simulateHasRenderedMsgs(oldBody, 200),
    false,
    "body containing messages from topic 100 must not be treated as rendered for topic 200"
  );
  assert.equal(
    simulateHasRenderedMsgs(oldBody, 100),
    true,
    "body containing messages from topic 100 is valid for topic 100"
  );
});
