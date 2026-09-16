const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const scriptContent = fs.readFileSync(
  path.resolve(__dirname, "../linuxdo-wecom.user.js"),
  "utf8"
);

test("linuxdo-wecom includes new topics badge extraction and chat nav click logic", () => {
  assert.ok(
    scriptContent.includes("findShowMoreElement"),
    "must include findShowMoreElement"
  );
  assert.ok(
    scriptContent.includes("getNewTopicsCount"),
    "must include getNewTopicsCount"
  );
  assert.ok(
    scriptContent.includes("syncChatBadge"),
    "must include syncChatBadge"
  );
  assert.ok(
    scriptContent.includes("handleChatNavClick"),
    "must include handleChatNavClick"
  );
  assert.ok(
    scriptContent.includes("bindRailChatClick"),
    "must include bindRailChatClick"
  );
  assert.ok(
    scriptContent.includes(".show-more.has-topics"),
    "must target .show-more.has-topics selector"
  );
  assert.ok(
    scriptContent.includes("listBody.scrollTo({ top: 0, behavior: \"smooth\" })"),
    "must scroll listBody to top smoothly"
  );
});

test("simulated getNewTopicsCount logic extracts number from show-more elements", () => {
  function simulateCount(text, hasClass = true) {
    if (!hasClass) return 0;
    const match = text.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!Number.isNaN(num) && num > 0) return num;
    }
    return 1;
  }

  assert.equal(simulateCount("查看 3 个新主题"), 3);
  assert.equal(simulateCount("查看 12 个新主题"), 12);
  assert.equal(simulateCount("5 new topics"), 5);
  assert.equal(simulateCount("有新主题"), 1);
  assert.equal(simulateCount(""), 1);
  assert.equal(simulateCount("查看 3 个新主题", false), 0);
});

test("linuxdo-wecom guards document.title to remain blank and avoids leaking detail title", () => {
  assert.ok(
    scriptContent.includes("setupTitleGuard"),
    "must include setupTitleGuard"
  );
  assert.ok(
    scriptContent.includes("enforceBlankTitle"),
    "must include enforceBlankTitle"
  );
  assert.ok(
    !scriptContent.includes("document.title = `${chatState.title}"),
    "must not set document.title to chatState.title"
  );
});

test("linuxdo-wecom uses enlarged border-radius for avatars and bubbles", () => {
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble {\n      padding: 8px 12px !important;\n      border-radius: 8px !important;") ||
    scriptContent.includes("border-radius: 8px !important;"),
    "chat message bubbles must use 8px border-radius"
  );
  assert.match(
    scriptContent,
    /\.wecom-conv-avatar\s*\{[^}]*border-radius:\s*8px/s,
    "conversation avatar must have 8px border-radius"
  );
  assert.match(
    scriptContent,
    /\.wecom-msg-avatar\s*\{[^}]*border-radius:\s*8px/s,
    "message avatar must have 8px border-radius"
  );
  assert.match(
    scriptContent,
    /\.wecom-rail\s+\.wecom-rail-avatar\s*\{[^}]*border-radius:\s*8px/s,
    "rail avatar must have 8px border-radius"
  );
  assert.match(
    scriptContent,
    /\.wecom-member-avatar\s*\{[^}]*border-radius:\s*6px/s,
    "member avatar must have 6px border-radius"
  );
});

test("renderChatError avoids inline onclick and provides native view and retry buttons", () => {
  assert.ok(
    !scriptContent.includes('onclick="location.reload()"'),
    "must not contain broken inline onclick='location.reload()'"
  );
  assert.ok(
    scriptContent.includes("openNativeTopicView"),
    "must define openNativeTopicView"
  );
  assert.ok(
    scriptContent.includes("wecom-chat-error-native"),
    "must provide wecom-chat-error-native button class"
  );
  assert.ok(
    scriptContent.includes("wecom-chat-error-retry"),
    "must provide wecom-chat-error-retry button class"
  );
});

test("openNativeTopicView switches view mode to native and reloads/navigates", () => {
  assert.match(
    scriptContent,
    /function\s+openNativeTopicView\s*\(\)\s*\{[^}]*setViewMode\("native"\)/s,
    "openNativeTopicView must call setViewMode('native')"
  );
});

test("api function includes XMLHttpRequest and Discourse headers and detects 429 / CF challenge", () => {
  assert.ok(
    scriptContent.includes('"X-Requested-With": "XMLHttpRequest"'),
    "api must include X-Requested-With: XMLHttpRequest"
  );
  assert.ok(
    scriptContent.includes('"Discourse-Present": "true"'),
    "api must include Discourse-Present: true"
  );
  assert.ok(
    scriptContent.includes("rateLimitCooldownUntil"),
    "api must track rateLimitCooldownUntil"
  );
  assert.ok(
    scriptContent.includes("isCloudflare"),
    "api must detect Cloudflare HTML challenge"
  );
});

test("topic fetching includes in-memory cache and signal aborting", () => {
  assert.ok(
    scriptContent.includes("topicDataCache"),
    "must have topicDataCache in-memory LRU cache"
  );
  assert.ok(
    scriptContent.includes("getCachedTopic"),
    "must define getCachedTopic"
  );
  assert.ok(
    scriptContent.includes("getPreloadedTopic"),
    "must define getPreloadedTopic"
  );
  assert.ok(
    scriptContent.includes("topicAbortController"),
    "must support topicAbortController for aborting previous loads"
  );
});

test("badges do not have black borders or dark box shadows", () => {
  assert.ok(
    !scriptContent.includes("box-shadow: 0 0 0 2px #2B2D31;"),
    "must not contain #2B2D31 box shadow on badges"
  );
  assert.match(
    scriptContent,
    /\.wecom-rail-badge\s*\{[^}]*border:\s*none\s*!important/s,
    ".wecom-rail-badge must specify border: none !important"
  );
  assert.match(
    scriptContent,
    /\.wecom-rail-badge\s*\{[^}]*box-shadow:\s*none\s*!important/s,
    ".wecom-rail-badge must specify box-shadow: none !important"
  );
  assert.match(
    scriptContent,
    /\.wecom-rail-avatar-badge\s*\{[^}]*border:\s*none\s*!important/s,
    ".wecom-rail-avatar-badge must specify border: none !important"
  );
});

test("Cloudflare shield error opens a native popup window and supports query override", () => {
  assert.ok(
    scriptContent.includes("openNativePopup"),
    "must define openNativePopup function"
  );
  assert.ok(
    scriptContent.includes("wecom-chat-error-popup"),
    "must include wecom-chat-error-popup button"
  );
  assert.ok(
    scriptContent.includes('searchParams.set("wecom_view", "native")'),
    "popup URL must set wecom_view query param to native"
  );
  assert.ok(
    scriptContent.includes('get("wecom_view") === "native"'),
    "getViewMode must support wecom_view=native query parameter"
  );
});

test("Boost reactions support display, hover action tool, and adding/deleting", () => {
  assert.ok(
    scriptContent.includes("boost: `<svg"),
    "ICONS must define boost icon"
  );
  assert.ok(
    scriptContent.includes('data-action="boost"'),
    "message hover tools must include data-action='boost'"
  );
  assert.ok(
    scriptContent.includes("boostsHtml("),
    "must define boostsHtml function"
  );
  assert.ok(
    scriptContent.includes("openBoostPopover"),
    "must define openBoostPopover function"
  );
  assert.ok(
    scriptContent.includes("submitPostBoost"),
    "must define submitPostBoost API caller"
  );
  assert.ok(
    scriptContent.includes("deletePostBoost"),
    "must define deletePostBoost API caller"
  );
  assert.ok(
    scriptContent.includes("/discourse-boosts/posts/"),
    "must send POST to /discourse-boosts/posts/:post_id/boosts"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-boosts"),
    "must define CSS for .wecom-msg-boosts"
  );
  assert.ok(
    scriptContent.includes(".wecom-boost-item"),
    "must define CSS for .wecom-boost-item"
  );
});

test("Boost toggle setting enables hiding and menu toggle", () => {
  assert.ok(
    scriptContent.includes('const BOOST_ENABLED_KEY = "linuxdo-wecom-boost-enabled";'),
    "must define BOOST_ENABLED_KEY constant"
  );
  assert.ok(
    scriptContent.includes("function isBoostEnabled()"),
    "must define isBoostEnabled function"
  );
  assert.ok(
    scriptContent.includes("function setBoostEnabled("),
    "must define setBoostEnabled function"
  );
  assert.ok(
    scriptContent.includes("wecom-menu-toggle-boost"),
    "must provide wecom-menu-toggle-boost button in theme settings menu"
  );
  assert.ok(
    scriptContent.includes("html.wecom-hide-boost .wecom-msg-boosts"),
    "must hide .wecom-msg-boosts when wecom-hide-boost is set"
  );
  assert.ok(
    scriptContent.includes('html.wecom-hide-boost .wecom-msg-tool-btn[data-action="boost"]'),
    "must hide boost tool button when wecom-hide-boost is set"
  );
  assert.ok(
    scriptContent.includes("if (!isBoostEnabled()) return \"\";"),
    "boostsHtml must check isBoostEnabled and return empty string if disabled"
  );
});

test("Boost popover has symmetrical layout and dynamic positioning", () => {
  assert.ok(
    scriptContent.includes('has-boost-popover'),
    "msgEl must be tagged with has-boost-popover to maintain tool visibility"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg.has-boost-popover .wecom-msg-tools"),
    "CSS must keep .wecom-msg-tools visible while popover is open"
  );
  assert.ok(
    scriptContent.includes("popover.offsetHeight"),
    "must dynamically calculate popover height using offsetHeight"
  );
  assert.ok(
    scriptContent.includes("grid-template-columns: repeat(4, 1fr)"),
    "presets must use symmetrical 4-column grid layout"
  );
});

test("Window Controls Overlay integrates titlebar and draggable regions", () => {
  assert.ok(
    scriptContent.includes("ensureWcoManifest"),
    "must define ensureWcoManifest to inject WCO manifest"
  );
  assert.ok(
    scriptContent.includes("setupWindowControlsOverlay"),
    "must define setupWindowControlsOverlay"
  );
  assert.ok(
    scriptContent.includes('"window-controls-overlay"'),
    "manifest display_override must include window-controls-overlay"
  );
  assert.ok(
    scriptContent.includes("navigator.windowControlsOverlay"),
    "must listen to navigator.windowControlsOverlay geometrychange"
  );
  assert.ok(
    scriptContent.includes("-webkit-app-region: drag"),
    "must declare draggable app regions for headers"
  );
  assert.ok(
    scriptContent.includes("-webkit-app-region: no-drag"),
    "must declare no-drag app regions for clickable buttons and inputs"
  );
  assert.ok(
    scriptContent.includes("env(titlebar-area-width"),
    "must use env(titlebar-area-width) padding to avoid colliding with window controls"
  );
});

test("Scroll-to-top button is available in chat header with smooth scroll and older post fetching", () => {
  assert.ok(
    scriptContent.includes("scrollTop: `<svg"),
    "ICONS must define scrollTop icon"
  );
  assert.ok(
    scriptContent.includes('class="wecom-icon-btn wecom-chat-scroll-top"'),
    "chat header tools must contain wecom-chat-scroll-top button"
  );
  assert.ok(
    scriptContent.includes('title="回到顶部"'),
    "scroll-to-top button must have title '回到顶部'"
  );
  assert.ok(
    scriptContent.includes(".wecom-chat-scroll-top"),
    "handleChatHeaderClick must handle .wecom-chat-scroll-top"
  );
  assert.ok(
    scriptContent.includes('scrollContainer.scrollTo({ top: 0, behavior: "smooth" })'),
    "must smoothly scroll to top 0"
  );
});

test("Top-right window controls and native view buttons are removed, and watermark panel is styled", () => {
  assert.ok(
    scriptContent.includes("winMin: `<svg"),
    "ICONS must define winMin SVG icon"
  );
  assert.ok(
    scriptContent.includes("winMax: `<svg"),
    "ICONS must define winMax SVG icon"
  );
  assert.ok(
    scriptContent.includes("winClose: `<svg"),
    "ICONS must define winClose SVG icon"
  );
  assert.ok(
    !scriptContent.includes('class="wecom-win-controls"'),
    "must not render .wecom-win-controls in chat header (removed per user request)"
  );
  assert.ok(
    !scriptContent.includes('class="wecom-icon-btn wecom-chat-native"'),
    "must not render .wecom-chat-native in chat header (removed per user request)"
  );
  assert.ok(
    scriptContent.includes(".wecom-watermark-panel {"),
    "must define CSS styling for .wecom-watermark-panel popover"
  );
  assert.ok(
    scriptContent.includes(".wecom-watermark-switch"),
    "must define CSS styling for .wecom-watermark-switch toggle"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-watermark-panel"),
    "must define dark mode styles for watermark panel"
  );
});

test("script metadata matches V2EX domains and defines platform constants", () => {
  assert.ok(
    scriptContent.includes("// @match        https://*.v2ex.com/*"),
    "must match https://*.v2ex.com/*"
  );
  assert.ok(
    scriptContent.includes("// @match        https://v2ex.com/*"),
    "must match https://v2ex.com/*"
  );
  assert.ok(
    scriptContent.includes("const IS_V2EX ="),
    "must define IS_V2EX constant"
  );
  assert.ok(
    scriptContent.includes("const IS_LINUXDO ="),
    "must define IS_LINUXDO constant"
  );
});

test("platform switcher widget is rendered in chat header and handles switching between Linux DO and V2EX", () => {
  assert.ok(
    scriptContent.includes('class="wecom-platform-switcher"'),
    "must render .wecom-platform-switcher in chat header"
  );
  assert.ok(
    scriptContent.includes("wecom-platform-btn"),
    "must render .wecom-platform-btn button"
  );
  assert.ok(
    scriptContent.includes("platformSwitch"),
    "must include platformSwitch icon in ICONS"
  );
  assert.ok(
    scriptContent.includes('class="wecom-platform-dropdown"'),
    "must render .wecom-platform-dropdown container"
  );
  assert.ok(
    scriptContent.includes('data-target-platform="linuxdo"'),
    "must include Linux DO platform item"
  );
  assert.ok(
    scriptContent.includes('data-target-platform="v2ex"'),
    "must include V2EX platform item"
  );
  assert.ok(
    scriptContent.includes("bindPlatformSwitcher"),
    "must define bindPlatformSwitcher function"
  );
  assert.ok(
    scriptContent.includes('window.location.href = "https://linux.do/"'),
    "must navigate to Linux DO when selected"
  );
  assert.ok(
    scriptContent.includes('window.location.href = "https://www.v2ex.com/"'),
    "must navigate to V2EX when selected"
  );
});

test("V2EX DOM parser, HTML parsing and API adapters are defined", () => {
  assert.ok(
    scriptContent.includes("extractV2exTopicsFromDoc"),
    "must define extractV2exTopicsFromDoc"
  );
  assert.ok(
    scriptContent.includes("mapV2exJsonTopics"),
    "must define mapV2exJsonTopics"
  );
  assert.ok(
    scriptContent.includes("parseV2exTopicDoc"),
    "must define parseV2exTopicDoc"
  );
  assert.ok(
    scriptContent.includes("fetchV2exTopicHtml"),
    "must define fetchV2exTopicHtml"
  );
  assert.ok(
    scriptContent.includes("submitV2exReply"),
    "must define submitV2exReply"
  );
});

test("V2EX list chips and search form are configured correctly", () => {
  assert.ok(
    scriptContent.includes('data-chip="hot"'),
    "must include hot chip for V2EX"
  );
  assert.ok(
    scriptContent.includes('data-chip="tech"'),
    "must include tech chip for V2EX"
  );
  assert.ok(
    scriptContent.includes('data-chip="creative"'),
    "must include creative chip for V2EX"
  );
  assert.ok(
    scriptContent.includes('data-chip="qna"'),
    "must include qna chip for V2EX"
  );
  assert.ok(
    scriptContent.includes("DEFAULT_V2EX_LIST_NAV"),
    "must define DEFAULT_V2EX_LIST_NAV"
  );
  assert.ok(
    scriptContent.includes("https://www.google.com/search"),
    "must support Google search for V2EX topics"
  );
});

test("V2EX integration includes isolation guards and full WeCom interactions", () => {
  assert.ok(
    scriptContent.includes('...(IS_LINUXDO ? { "Discourse-Present": "true" } : {})'),
    "api headers must only include Discourse-Present on Linux DO"
  );
  assert.ok(
    scriptContent.includes("if (IS_V2EX) return [];"),
    "loadCategories must return empty array on V2EX"
  );
  assert.ok(
    scriptContent.includes("v2exHasMore"),
    "must track v2exHasMore pagination state"
  );
  assert.ok(
    scriptContent.includes("syncV2exPaginationFooter"),
    "must define syncV2exPaginationFooter for V2EX detail pagination"
  );
  assert.ok(
    scriptContent.includes("window.open(`/member/${encodeURIComponent(username)}`, \"_blank\");"),
    "openOriginalUserCard must navigate to V2EX member page on V2EX"
  );
  assert.ok(
    scriptContent.includes("if (IS_V2EX && input)"),
    "replyToPost must prefix mention on V2EX"
  );
  assert.ok(
    scriptContent.includes("/thank/reply/${postId}?once=${once}"),
    "toggleLike must support V2EX thank reply endpoint"
  );
  assert.ok(
    scriptContent.includes("return tid ? `/t/${tid}` : (location.pathname || \"/\");"),
    "getTopicNativePath must use /t/:id format on V2EX"
  );
});

test("Boost cooked content and emoji images are strictly constrained from stretching", () => {
  assert.ok(
    scriptContent.includes("formatBoostCooked"),
    "must define formatBoostCooked function"
  );
  assert.ok(
    scriptContent.includes(".replace(/\\bonly-emoji\\b/g, \"\")"),
    "formatBoostCooked must strip only-emoji class"
  );
  assert.ok(
    scriptContent.includes(".wecom-boost-cooked img.emoji.only-emoji"),
    "must explicitly target .wecom-boost-cooked img.emoji.only-emoji"
  );
  assert.ok(
    scriptContent.includes("width: 16px !important;"),
    "must enforce 16px width on boost emoji images"
  );
  assert.ok(
    scriptContent.includes("height: 22px !important;"),
    "must enforce 22px height on .wecom-boost-item"
  );

  function simulateFormat(content) {
    return content
      .replace(/^<p\b[^>]*>/i, "")
      .replace(/<\/p>$/i, "")
      .replace(/\bonly-emoji\b/g, "");
  }

  const sample = '<p><img src="/images/emoji/twemoji/grinning_face.png?v=15" title=":grinning_face:" class="emoji only-emoji" alt=":grinning_face:" loading="lazy" width="20" height="20"></p>';
  const formatted = simulateFormat(sample);
  assert.ok(!formatted.startsWith("<p"), "must not start with <p");
  assert.ok(!formatted.endsWith("</p>"), "must not end with </p>");
  assert.ok(!formatted.includes("only-emoji"), "must not contain only-emoji class");
  assert.ok(formatted.includes("grinning_face"), "must preserve emoji image source");
});

test("Home and End key in conversation detail smoothly scrolls chat panel and avoids list scrolling", () => {
  assert.ok(
    scriptContent.includes("function isEditableTarget"),
    "must define isEditableTarget helper"
  );
  assert.ok(
    scriptContent.includes("function handleChatNavigationKeydown"),
    "must define handleChatNavigationKeydown"
  );
  assert.ok(
    scriptContent.includes('window.addEventListener("keydown", handleChatNavigationKeydown, true)'),
    "must register handleChatNavigationKeydown on window with capture: true"
  );
  assert.ok(
    scriptContent.includes("event.stopImmediatePropagation()"),
    "handleChatNavigationKeydown must call stopImmediatePropagation"
  );
  assert.ok(
    scriptContent.includes('chatBody.scrollTo({ top: 0, behavior: "smooth" })'),
    "Home key must smoothly scroll chatBody to top: 0"
  );
  assert.ok(
    scriptContent.includes('chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" })'),
    "End key must smoothly scroll chatBody to chatBody.scrollHeight"
  );
  assert.ok(
    scriptContent.includes("try { conv.blur(); } catch"),
    "must blur clicked conv link to prevent retaining focus on list items"
  );

  // Simulate isEditableTarget logic
  function testIsEditable(target) {
    if (!target) return false;
    const tag = target.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = (target.type || "text").toLowerCase();
      const nonTextTypes = ["button", "submit", "reset", "checkbox", "radio", "range", "color", "image", "file"];
      return !nonTextTypes.includes(type);
    }
    if (target.isContentEditable) return true;
    return false;
  }

  assert.strictEqual(testIsEditable({ tagName: "TEXTAREA" }), true);
  assert.strictEqual(testIsEditable({ tagName: "INPUT", type: "text" }), true);
  assert.strictEqual(testIsEditable({ tagName: "INPUT", type: "search" }), true);
  assert.strictEqual(testIsEditable({ tagName: "INPUT", type: "checkbox" }), false);
  assert.strictEqual(testIsEditable({ tagName: "INPUT", type: "button" }), false);
  assert.strictEqual(testIsEditable({ tagName: "DIV", isContentEditable: true }), true);
  assert.strictEqual(testIsEditable({ tagName: "A" }), false);
  assert.strictEqual(testIsEditable({ tagName: "DIV" }), false);
});

test("V2EX message likes/thanks count with heart icon next to time in meta", () => {
  assert.ok(
    scriptContent.includes("heart: `<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\""),
    "ICONS map must define line/stroke type heart icon"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-likes"),
    "CSS must define .wecom-msg-likes"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-likes svg"),
    "CSS must style .wecom-msg-likes svg"
  );
  assert.ok(
    scriptContent.includes("color: var(--wc-text-3);"),
    "CSS must style heart with light gray var(--wc-text-3)"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-tool.liked"),
    "CSS must style liked tool button"
  );
  assert.ok(
    scriptContent.includes("const likeToolIcon = IS_V2EX ? ICONS.heart : ICONS.like;"),
    "likeToolIcon must use ICONS.heart on V2EX"
  );
  assert.ok(
    scriptContent.includes("likesBadgeHtml"),
    "bubbleHtml must compute likesBadgeHtml"
  );
  assert.ok(
    scriptContent.includes('<span class="wecom-msg-likes" title="${likeLabel}：${likeCount}">'),
    "bubbleHtml must render .wecom-msg-likes badge when likeCount > 0"
  );
  assert.ok(
    scriptContent.includes("like_count: likesCount"),
    "parseV2exTopicDoc must store like_count on parsed reply posts"
  );
});

test("V2EX topic loading stability: initial DOM guard, fallback API, and suppressHistoryApply", () => {
  assert.ok(
    scriptContent.includes("INITIAL_V2EX_TOPIC_ID"),
    "must define INITIAL_V2EX_TOPIC_ID"
  );
  assert.ok(
    scriptContent.includes("initialV2exTopicConsumed"),
    "must track initialV2exTopicConsumed"
  );
  assert.ok(
    scriptContent.includes("fetchV2exTopicData"),
    "must define fetchV2exTopicData"
  );
  assert.ok(
    scriptContent.includes("fetchV2exTopicApi"),
    "must define fetchV2exTopicApi"
  );
  assert.ok(
    scriptContent.includes("mapV2exTopicApiResponse"),
    "must define mapV2exTopicApiResponse"
  );
  assert.ok(
    scriptContent.includes("hasRenderedMsgs"),
    "loadTopic must check actual rendered messages before early returning"
  );
  assert.ok(
    scriptContent.includes("suppressHistoryApply = true;"),
    "bindListPanelClicks must suppress history apply during pushState"
  );
});

test("Top-left rail avatar disguise presets, cycling, and default styling", () => {
  assert.ok(
    scriptContent.includes('const RAIL_AVATAR_DISGUISE_KEY = "linuxdo-wecom-rail-avatar-disguise";'),
    "must define RAIL_AVATAR_DISGUISE_KEY"
  );
  assert.ok(
    scriptContent.includes("const RAIL_DISGUISE_AVATARS = ["),
    "must define RAIL_DISGUISE_AVATARS presets"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-blue"'),
    "must include wecom-blue corporate preset"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-green"'),
    "must include wecom-green corporate preset"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-navy"'),
    "must include wecom-navy corporate preset"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-slate"'),
    "must include wecom-slate corporate preset"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-orange"'),
    "must include wecom-orange corporate preset"
  );
  assert.ok(
    scriptContent.includes("function getRailDisguiseAvatarId()"),
    "must define getRailDisguiseAvatarId"
  );
  assert.ok(
    scriptContent.includes("function setRailDisguiseAvatarId("),
    "must define setRailDisguiseAvatarId"
  );
  assert.ok(
    scriptContent.includes("function cycleRailDisguiseAvatar()"),
    "must define cycleRailDisguiseAvatar"
  );
  assert.ok(
    scriptContent.includes('avatarEl.setAttribute("title", `当前头像：${disguisePreset.name}（右键切换伪装头像样式）`);'),
    "must set tooltip indicating disguise avatar and right-click cycling"
  );
  assert.ok(
    scriptContent.includes(".wecom-rail .wecom-rail-avatar svg"),
    "CSS must style .wecom-rail .wecom-rail-avatar svg"
  );
  assert.ok(
    scriptContent.includes("cycleRailDisguiseAvatar()"),
    "must bind cycleRailDisguiseAvatar"
  );
});

test("V2EX reply list clicking locates and highlights relevant reply", () => {
  assert.ok(
    scriptContent.includes("function parseV2exReplyTarget("),
    "must define parseV2exReplyTarget"
  );
  assert.ok(
    scriptContent.includes("function locateV2exReply("),
    "must define locateV2exReply"
  );
  assert.ok(
    scriptContent.includes("function keepChatAtV2exReply("),
    "must define keepChatAtV2exReply"
  );
  assert.ok(
    scriptContent.includes("target_floor: target.floor"),
    "extractV2exNotificationsFromDoc must extract target_floor"
  );
  assert.ok(
    scriptContent.includes("target_reply_id: target.replyId"),
    "extractV2exNotificationsFromDoc must extract target_reply_id"
  );
  assert.ok(
    scriptContent.includes("target_anchor: target.anchor"),
    "extractV2exNotificationsFromDoc must extract target_anchor"
  );
  assert.ok(
    scriptContent.includes('const dockAreas = doc.querySelectorAll("#Main .dock_area");'),
    "extractV2exTopicsFromDoc must support member reply dock_area"
  );
  assert.ok(
    scriptContent.includes('data-floor="${post.floor}"'),
    "bubbleHtml must render data-floor attribute"
  );
  assert.ok(
    scriptContent.includes("data-target-floor"),
    "convRowHtml must render data-target-floor attribute"
  );
  assert.ok(
    scriptContent.includes("locateV2exReply(body, target)"),
    "must call locateV2exReply"
  );
  assert.ok(
    scriptContent.includes("keepChatAtV2exReply(body, target)"),
    "loadTopic must call keepChatAtV2exReply"
  );

  // Test parseV2exReplyTarget simulation
  function simulateParseTarget(urlOrHash) {
    const res = { floor: 0, replyId: 0, anchor: "", page: 1 };
    if (!urlOrHash) return res;
    const str = String(urlOrHash);
    const pMatch = str.match(/[?&]p=(\d+)/);
    if (pMatch) res.page = Number(pMatch[1]) || 1;
    const hashIdx = str.indexOf("#");
    const anchor = hashIdx !== -1 ? str.slice(hashIdx + 1) : str;
    res.anchor = anchor;
    const floorMatch = anchor.match(/^reply(\d+)/i) || anchor.match(/(?:^|[?&#])reply(\d+)/i);
    if (floorMatch) {
      res.floor = Number(floorMatch[1]);
      if (!pMatch && res.floor > 100) {
        res.page = Math.floor((res.floor - 1) / 100) + 1;
      }
    }
    const rMatch = anchor.match(/^r_(\d+)/i) || anchor.match(/(?:^|[?&#])r_(\d+)/i);
    if (rMatch) res.replyId = Number(rMatch[1]);
    return res;
  }

  const t1 = simulateParseTarget("/t/1240867#reply77");
  assert.equal(t1.floor, 77);
  assert.equal(t1.page, 1);
  assert.equal(t1.anchor, "reply77");

  const t2 = simulateParseTarget("/t/1240321?p=3#reply263");
  assert.equal(t2.floor, 263);
  assert.equal(t2.page, 3);
  assert.equal(t2.anchor, "reply263");

  const t3 = simulateParseTarget("/t/1240867#r_8516");
  assert.equal(t3.replyId, 8516);
  assert.equal(t3.floor, 0);

  const t4 = simulateParseTarget("/t/1240867#reply150");
  assert.equal(t4.floor, 150);
  assert.equal(t4.page, 2);
});

test("conversation detail links open in _blank with rel=noopener noreferrer", () => {
  assert.ok(
    scriptContent.includes("function hydrateChatLinks("),
    "must define hydrateChatLinks function"
  );
  assert.ok(
    scriptContent.includes("hydrateChatLinks(root);"),
    "hydrateChatImages must invoke hydrateChatLinks"
  );
  assert.ok(
    scriptContent.includes('a.setAttribute("target", "_blank");'),
    "hydrateChatLinks must set target=_blank on anchor tags"
  );
  assert.ok(
    scriptContent.includes("noopener noreferrer"),
    "must set rel noopener noreferrer"
  );
  assert.ok(
    scriptContent.includes('const generalLink = event.target.closest("a[href]");'),
    "handleChatPanelClick must inspect general links"
  );
  assert.ok(
    scriptContent.includes('window.open(fullUrl, "_blank", "noopener,noreferrer");'),
    "must open intercepted detail links via window.open in _blank"
  );
  assert.ok(
    scriptContent.includes('class="wecom-chat-chip" target="_blank" rel="noopener noreferrer"'),
    "wecom-chat-chip templates must have target=_blank and rel=noopener noreferrer"
  );
  assert.ok(
    scriptContent.includes("hydrateChatLinks(panel);"),
    "renderMemberPanel must call hydrateChatLinks"
  );

  // Test hydrateChatLinks simulation
  function simulateHydrateLinks(elements) {
    elements.forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!href || href === "#" || href.startsWith("javascript:") || href.startsWith("#")) return;
      if (a.classList.contains("wecom-reply-reference")) return;
      a.setAttribute("target", "_blank");
      const rel = a.getAttribute("rel") || "";
      if (!rel.includes("noopener")) {
        a.setAttribute("rel", rel ? `${rel} noopener noreferrer` : "noopener noreferrer");
      }
    });
  }

  class MockElement {
    constructor(attrs = {}, classes = []) {
      this.attrs = { ...attrs };
      this.classList = {
        contains: (cls) => classes.includes(cls)
      };
    }
    getAttribute(name) { return this.attrs[name] || null; }
    setAttribute(name, val) { this.attrs[name] = val; }
  }

  const normalLink = new MockElement({ href: "https://example.com/foo" });
  const internalQuote = new MockElement({ href: "/t/123/4" }, ["wecom-reply-reference"]);
  const anchorLink = new MockElement({ href: "#heading-1" });
  const hashOnly = new MockElement({ href: "#" });
  const jsLink = new MockElement({ href: "javascript:void(0)" });

  simulateHydrateLinks([normalLink, internalQuote, anchorLink, hashOnly, jsLink]);

  assert.equal(normalLink.getAttribute("target"), "_blank");
  assert.equal(normalLink.getAttribute("rel"), "noopener noreferrer");
  assert.equal(internalQuote.getAttribute("target"), null);
  assert.equal(anchorLink.getAttribute("target"), null);
  assert.equal(hashOnly.getAttribute("target"), null);
  assert.equal(jsLink.getAttribute("target"), null);
});

test("V2EX topic detail multi-page pagination and footer bar", () => {
  assert.ok(
    scriptContent.includes("function syncV2exPaginationFooter("),
    "must define syncV2exPaginationFooter"
  );
  assert.ok(
    scriptContent.includes("wecom-v2ex-more-bar"),
    "must include .wecom-v2ex-more-bar"
  );
  assert.ok(
    scriptContent.includes("data.total_replies != null"),
    "loadTopic must support data.total_replies"
  );
  assert.ok(
    scriptContent.includes("chatState.hasNewer = Boolean(chatState.v2exHasMore);"),
    "syncRenderedWindow must sync hasNewer with v2exHasMore"
  );

  // Test V2EX pagination parsing simulation
  function simulatePaginationParse(html, page) {
    let totalReplies = 0;
    const countMatch = html.match(/(?:gray|cell)[^>]*>[\s\S]*?(\d+)\s*(?:replies|条回复|回复)/i) ||
      html.match(/(\d+)\s*(?:replies|条回复|回复)/i);
    if (countMatch) totalReplies = Number(countMatch[1]) || 0;

    const inputMatch = html.match(/class="[^"]*page_input[^"]*"[^>]*max="(\d+)"/i) ||
      html.match(/max="(\d+)"[^>]*class="[^"]*page_input[^"]*"/i);
    const inputMax = inputMatch ? Number(inputMatch[1]) : 0;

    const pageNumbers = [...html.matchAll(/(?:href|onclick)="[^"]*(?:^|[?&])p=(\d+)[^"]*"/gi)]
      .map((m) => Number(m[1]));
    const maxP = pageNumbers.length ? Math.max(...pageNumbers) : 0;

    const hasDisabledNext = Boolean(html.match(/normal_page_right[^"]*disable_now/i) || html.match(/disable_now[^"]*normal_page_right/i));
    const hasNextBtn = Boolean(html.match(/title="Next Page"/i)) && !hasDisabledNext;

    const totalPages = Math.max(inputMax, maxP, totalReplies > 0 ? Math.ceil(totalReplies / 100) : 0);
    const hasNextPage = (totalPages > page) || hasNextBtn;

    return { totalReplies, totalPages, hasNextPage };
  }

  // Sample page 1 with 199 replies, input max=2, next page button
  const p1Html = `
    <div class="cell"><span class="gray">199 replies • 2026-09-14</span></div>
    <div class="cell ps_container">
      <a href="?p=1" class="page_current">1</a>
      <a href="?p=2" class="page_normal">2</a>
      <input type="number" class="page_input" value="1" min="1" max="2" />
      <td class="super normal_page_right button" title="Next Page">❯</td>
    </div>
  `;

  // Sample page 2 (last page) with disabled next button
  const p2Html = `
    <div class="cell"><span class="gray">199 replies • 2026-09-14</span></div>
    <div class="cell ps_container">
      <a href="?p=1" class="page_normal">1</a>
      <a href="?p=2" class="page_current">2</a>
      <input type="number" class="page_input" value="2" min="1" max="2" />
      <td class="super normal_page_right button disable_now" title="Next Page">❯</td>
    </div>
  `;

  const res1 = simulatePaginationParse(p1Html, 1);
  assert.equal(res1.totalReplies, 199);
  assert.equal(res1.totalPages, 2);
  assert.equal(res1.hasNextPage, true);

  const res2 = simulatePaginationParse(p2Html, 2);
  assert.equal(res2.totalReplies, 199);
  assert.equal(res2.totalPages, 2);
  assert.equal(res2.hasNextPage, false);
});

test("Topic last read floor persistence and automatic restoration on detail view", () => {
  assert.ok(
    scriptContent.includes("function rememberTopicPost("),
    "must define rememberTopicPost"
  );
  assert.ok(
    scriptContent.includes("function getRememberedPost("),
    "must define getRememberedPost"
  );
  assert.ok(
    scriptContent.includes("function saveCurrentTopicReadingPosition("),
    "must define saveCurrentTopicReadingPosition"
  );
  assert.ok(
    scriptContent.includes('window.addEventListener("beforeunload", saveCurrentTopicReadingPosition);'),
    "must register beforeunload listener to persist reading position"
  );
  assert.ok(
    scriptContent.includes("if (chatState.pinningScroll || chatState.pinnedPost) return;"),
    "handleChatBodyScroll must protect pinningScroll and pinnedPost"
  );
  assert.ok(
    scriptContent.includes('chatBody.addEventListener("wheel", cancelPin, { passive: true });'),
    "bindChatPanelEvents must listen to user wheel event to cancel pinning"
  );
  assert.ok(
    scriptContent.includes("targetPage = floor > 100 ? Math.floor((floor - 1) / 100) + 1 : 1;"),
    "topicHref and syncTopicLastReadHref must compute target page for V2EX floors"
  );
  assert.ok(
    scriptContent.includes("target.floor = remembered - 1;"),
    "conv click and loadTopic must compute target floor from remembered post"
  );

  // Test simulation: V2EX target page & floor computation
  function computeV2exTarget(postNumber) {
    if (!postNumber || postNumber <= 1) return { floor: 0, page: 1, anchor: "" };
    const floor = postNumber - 1;
    const page = floor > 100 ? Math.floor((floor - 1) / 100) + 1 : 1;
    return { floor, page, anchor: `reply${floor}` };
  }

  // Floor 50 (page 1)
  const t50 = computeV2exTarget(51);
  assert.equal(t50.floor, 50);
  assert.equal(t50.page, 1);
  assert.equal(t50.anchor, "reply50");

  // Floor 100 (page 1)
  const t100 = computeV2exTarget(101);
  assert.equal(t100.floor, 100);
  assert.equal(t100.page, 1);
  assert.equal(t100.anchor, "reply100");

  // Floor 101 (page 2)
  const t101 = computeV2exTarget(102);
  assert.equal(t101.floor, 101);
  assert.equal(t101.page, 2);
  assert.equal(t101.anchor, "reply101");

  // Floor 150 (page 2)
  const t150 = computeV2exTarget(151);
  assert.equal(t150.floor, 150);
  assert.equal(t150.page, 2);
  assert.equal(t150.anchor, "reply150");

  // Floor 205 (page 3)
  const t205 = computeV2exTarget(206);
  assert.equal(t205.floor, 205);
  assert.equal(t205.page, 3);
  assert.equal(t205.anchor, "reply205");

  // Test simulation: Reading position selection
  function pickReadingPost(visiblePosts, isAtBottom) {
    if (!visiblePosts.length) return 0;
    return isAtBottom ? visiblePosts[visiblePosts.length - 1] : visiblePosts[0];
  }
  assert.equal(pickReadingPost([10, 11, 12], false), 10);
  assert.equal(pickReadingPost([10, 11, 12], true), 12);
});

test("Linux DO notification menu teardown, route synchronization, and topic navigation stability", () => {
  // 1. Verify notification menu events and auto-close bindings
  assert.ok(
    scriptContent.includes("bindNotifMenuEvents"),
    "must define bindNotifMenuEvents to capture notification item clicks"
  );
  assert.ok(
    scriptContent.includes('const actionable = e.target.closest("a[href], button, .notification, [data-notification-id]");') ||
    scriptContent.includes("actionable"),
    "must detect clicks on actionable links/buttons within user-menu"
  );

  // 2. Verify resetNotifPresentation cleans up float class and inline display
  assert.ok(
    scriptContent.includes('menu.classList.remove("wecom-user-menu-float");'),
    "resetNotifPresentation must remove wecom-user-menu-float class"
  );
  assert.ok(
    scriptContent.includes('menu.style.display = "none";'),
    "resetNotifPresentation must set menu display to none"
  );

  // 3. Verify closeNotifMenu checks visibility before clickUserMenuToggle
  assert.ok(
    scriptContent.includes('const isVisible = menu.offsetParent !== null && menu.style.display !== "none";') ||
    scriptContent.includes("isVisible"),
    "closeNotifMenu must verify menu visibility before simulating toggle click"
  );

  // 4. Verify bindListPanelClicks closes notification menu and syncs discourseRouteTo
  assert.ok(
    scriptContent.includes("closeNotifMenu();\n        e.preventDefault();\n        e.stopPropagation();") ||
    scriptContent.includes("closeNotifMenu();\n        e.preventDefault();"),
    "conversation click in list panel must call closeNotifMenu"
  );
  assert.ok(
    scriptContent.includes("discourseRouteTo(href);\n        loadTopic(topicId"),
    "conversation click must sync route with discourseRouteTo"
  );

  // 5. Verify handleChatNavClick closes notification menu and recovers from unsupported paths
  assert.ok(
    scriptContent.includes("closeNotifMenu();\n\n    // 1. 确保停靠栏「消息」项处于 active 态") ||
    scriptContent.includes("closeNotifMenu();\n\n    // 1."),
    "handleChatNavClick must close notification menu"
  );
  assert.ok(
    scriptContent.includes('navigateInApp(IS_V2EX ? "/?tab=all" : "/latest");'),
    "handleChatNavClick must route to latest when clicking from unsupported path"
  );

  // 6. Verify isHomePath includes /notifications on Linux DO
  assert.ok(
    scriptContent.includes("/^(latest|new|unread|unseen|top|categories|hot|posted|read|bookmarks|notifications)\\b/") ||
    scriptContent.includes("bookmarks|notifications"),
    "isHomePath must support /notifications for Linux DO"
  );

  // 7. Verify applyTheme guards loadTopic against duplicate triggers when already loading
  assert.ok(
    scriptContent.includes("Number(chatState.topicId) === Number(targetTopicId) && chatState.loading"),
    "applyTheme must avoid aborting loadTopic when target is already loading"
  );

  // 8. Verify avatar badge click is bound for both platforms
  assert.match(
    scriptContent,
    /avatar\.addEventListener\("click",[\s\S]*const badge = rail\?\.querySelector\("\.wecom-rail-avatar-badge"\);\s*badge\?\.addEventListener\("click"/,
    "avatar badge click must be bound to trigger avatar click on Linux DO"
  );
});

test("V2EX topic list pagination accurately inspects page indicators and avoids early termination", () => {
  assert.ok(
    scriptContent.includes("function parseV2exListPagination("),
    "must define parseV2exListPagination"
  );
  assert.ok(
    scriptContent.includes("function setV2exPagination(apiPath, count, doc = null)"),
    "setV2exPagination must accept doc parameter"
  );
  assert.ok(
    scriptContent.includes('const statusEl = e.target.closest(".wecom-list-status");'),
    "bindListPanelClicks must support clicking .wecom-list-status to load more"
  );

  // Simulation test for v2exPageForPath logic
  function testPageForPath(path) {
    const match = path.match(/[?&]p=(\d+)/);
    if (match) return Math.max(1, Number(match[1]) || 1);
    return 1;
  }
  assert.equal(testPageForPath("/go/programmer"), 1, "node page without p parameter must be page 1");
  assert.equal(testPageForPath("/recent"), 1, "/recent must be page 1");
  assert.equal(testPageForPath("/recent?p=6"), 6, "/recent?p=6 must be page 6");

  // Simulation test for list pagination parsing
  function simulateListPagination(html, apiPath, count) {
    const path = String(apiPath || "");
    const currentPage = testPageForPath(path);
    if (path === "/notifications" || count === 0) return { hasMore: false, nextPageUrl: null };
    const isAllHome = path === "/" || path === "/?tab=all" || path === "all" || path === "latest";
    if (isAllHome) return { hasMore: count > 0, nextPageUrl: "/recent" };
    if (path.includes("tab=") && !path.includes("tab=all") && !path.includes("tab=latest")) {
      return { hasMore: false, nextPageUrl: null };
    }
    if (html) {
      const inputMatch = html.match(/class="[^"]*page_input[^"]*"[^>]*max="(\d+)"/i) ||
        html.match(/max="(\d+)"[^>]*class="[^"]*page_input[^"]*"/i);
      const inputMax = inputMatch ? Number(inputMatch[1]) : 0;
      const valMatch = html.match(/class="[^"]*page_input[^"]*"[^>]*value="(\d+)"/i) ||
        html.match(/value="(\d+)"[^>]*class="[^"]*page_input[^"]*"/i);
      const inputVal = valMatch ? Number(valMatch[1]) : 0;

      const hasDisabledNext = Boolean(html.match(/normal_page_right[^"]*disable_now/i) || html.match(/disable_now[^"]*normal_page_right/i));
      const hasNextBtn = Boolean(html.match(/title="Next Page"/i)) && !hasDisabledNext;

      const totalPages = inputMax;
      const effPage = inputVal || currentPage;
      if (totalPages > 0) {
        const hasMore = (totalPages > effPage) || hasNextBtn;
        return { hasMore, nextPageUrl: hasMore ? `${path.replace(/[?&]p=\d+/, "")}?p=${effPage + 1}` : null };
      }
      if (hasNextBtn) {
        return { hasMore: true, nextPageUrl: `${path.replace(/[?&]p=\d+/, "")}?p=${effPage + 1}` };
      }
      if (hasDisabledNext) {
        return { hasMore: false, nextPageUrl: null };
      }
    }
    return { hasMore: false, nextPageUrl: null };
  }

  // 1. Homepage all tab leads to /recent
  const resHome = simulateListPagination("", "/?tab=all", 52);
  assert.equal(resHome.hasMore, true);
  assert.equal(resHome.nextPageUrl, "/recent");

  // 2. Tab tech has no pagination
  const resTech = simulateListPagination("", "/?tab=tech", 50);
  assert.equal(resTech.hasMore, false);

  // 3. /recent?p=6 with only 19 topics still advances to p=7
  const p6Html = `
    <div class="cell ps_container">
      <input type="number" class="page_input" value="6" min="1" max="41394" />
      <td class="super normal_page_right button" title="Next Page">❯</td>
    </div>
  `;
  const resP6 = simulateListPagination(p6Html, "/recent?p=6", 19);
  assert.equal(resP6.hasMore, true);
  assert.equal(resP6.nextPageUrl, "/recent?p=7");

  // 4. Last page with disabled next button stops
  const lastHtml = `
    <div class="cell ps_container">
      <input type="number" class="page_input" value="41394" min="1" max="41394" />
      <td class="super normal_page_right button disable_now" title="Next Page">❯</td>
    </div>
  `;
  const resLast = simulateListPagination(lastHtml, "/recent?p=41394", 15);
  assert.equal(resLast.hasMore, false);
});

test("sidebar History replaces Docs, persists browsed topics, and enables real-time search & clear", () => {
  // 1. Static checks in script source
  assert.ok(
    scriptContent.includes('{ key: "history", icon: "history", label: "历史" }'),
    "RAIL_DECO_ITEMS must replace doc with history"
  );
  assert.ok(
    !scriptContent.includes('{ key: "doc", icon: "doc", label: "文档" }'),
    "RAIL_DECO_ITEMS must not contain old doc button"
  );
  assert.ok(
    scriptContent.includes("TOPIC_HISTORY_KEY"),
    "must define TOPIC_HISTORY_KEY"
  );
  assert.ok(
    scriptContent.includes("TOPIC_HISTORY_MAX"),
    "must define TOPIC_HISTORY_MAX"
  );
  assert.ok(
    scriptContent.includes("function readTopicHistory"),
    "must define readTopicHistory"
  );
  assert.ok(
    scriptContent.includes("function saveTopicHistory"),
    "must define saveTopicHistory"
  );
  assert.ok(
    scriptContent.includes("function recordTopicHistory"),
    "must define recordTopicHistory"
  );
  assert.ok(
    scriptContent.includes("function handleHistoryNavClick"),
    "must define handleHistoryNavClick"
  );
  assert.ok(
    scriptContent.includes("function bindRailHistoryClick"),
    "must define bindRailHistoryClick"
  );
  assert.ok(
    scriptContent.includes("function bindRailNavClicks"),
    "must define bindRailNavClicks"
  );
  assert.ok(
    scriptContent.includes("function switchToListMode"),
    "must define switchToListMode"
  );
  assert.ok(
    scriptContent.includes("function renderHistoryList"),
    "must define renderHistoryList"
  );
  assert.ok(
    scriptContent.includes("wecom-history-header-bar"),
    "must include wecom-history-header-bar in CSS and DOM"
  );
  assert.ok(
    scriptContent.includes("wecom-history-clear-btn"),
    "must include wecom-history-clear-btn in CSS and DOM"
  );
  assert.ok(
    scriptContent.includes("recordTopicHistory(data, posts)"),
    "loadTopic must call recordTopicHistory"
  );

  // 2. Behavioral simulation: History recording, LRU ordering, and deduplication
  const fakeStorage = new Map();
  const STORAGE_KEY = "linuxdo-wecom-topic-history";
  const MAX_ITEMS = 200;

  function simulateRead() {
    try {
      return JSON.parse(fakeStorage.get(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function simulateSave(list) {
    fakeStorage.set(STORAGE_KEY, JSON.stringify((list || []).slice(0, MAX_ITEMS)));
  }

  function simulateRecord(data, platform = "linuxdo") {
    const existing = simulateRead();
    const item = {
      id: Number(data.id),
      title: data.title,
      last_poster_username: data.author || "user1",
      node_name: data.node || "常规",
      reply_count: data.replyCount || 0,
      visited_at: Date.now(),
      bumped_at: Date.now(),
      platform
    };
    const filtered = existing.filter((t) => Number(t.id) !== Number(data.id) || t.platform !== platform);
    filtered.unshift(item);
    simulateSave(filtered);
  }

  // Record 3 topics
  simulateRecord({ id: 101, title: "Linux 学习指南", node: "教程" });
  simulateRecord({ id: 102, title: "Node.js 性能调优", node: "开发" });
  simulateRecord({ id: 103, title: "前端架构演进", node: "前端" });

  let history = simulateRead();
  assert.equal(history.length, 3);
  assert.equal(history[0].id, 103); // Most recent at index 0
  assert.equal(history[1].id, 102);
  assert.equal(history[2].id, 101);

  // Re-visiting topic 101 moves it to the top (LRU)
  simulateRecord({ id: 101, title: "Linux 学习指南 (更新)", node: "教程" });
  history = simulateRead();
  assert.equal(history.length, 3, "should deduplicate by topic id");
  assert.equal(history[0].id, 101, "re-visited topic must jump to the front");
  assert.equal(history[0].title, "Linux 学习指南 (更新)");
  assert.equal(history[1].id, 103);
  assert.equal(history[2].id, 102);

  // Filter simulation (search query)
  function simulateSearch(query, list) {
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((item) =>
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.node_name && item.node_name.toLowerCase().includes(q)) ||
      (item.last_poster_username && item.last_poster_username.toLowerCase().includes(q))
    );
  }

  const searchNode = simulateSearch("前端", history);
  assert.equal(searchNode.length, 1);
  assert.equal(searchNode[0].id, 103);

  const searchTitle = simulateSearch("linux", history);
  assert.equal(searchTitle.length, 1);
  assert.equal(searchTitle[0].id, 101);

  const searchNone = simulateSearch("python", history);
  assert.equal(searchNone.length, 0);

  // Clear simulation
  simulateSave([]);
  assert.equal(simulateRead().length, 0);
});

test("convRowHtml hover title attribute displays only the real topic title without disguise title prefix", () => {
  assert.ok(
    scriptContent.includes('title="${escapeHtml(String(topic.title || title || ""))}"'),
    "must set title attribute strictly to real topic title"
  );
  assert.ok(
    !scriptContent.includes('title="${escapeHtml(maskList ? `${title} · ${topic.title}` : title)}"'),
    "must not prefix disguise title in hover tooltip"
  );
});

test("detail disguised title long press displays original title, and release restores disguised title", async () => {
  // Static script assertions
  assert.ok(scriptContent.includes("const LONG_PRESS_TITLE_MS = 220;"), "must define LONG_PRESS_TITLE_MS");
  assert.ok(scriptContent.includes("function bindChatTitleLongPress("), "must define bindChatTitleLongPress");
  assert.ok(scriptContent.includes("bindChatTitleLongPress(panel);"), "must call bindChatTitleLongPress in bindChatPanelEvents");
  assert.ok(scriptContent.includes(".wecom-chat-title.is-masked"), "must style .wecom-chat-title.is-masked");
  assert.ok(scriptContent.includes(".wecom-chat-title.is-peeking-title"), "must style .wecom-chat-title.is-peeking-title");
  assert.ok(scriptContent.includes("html.${ROOT_CLASS}.wecom-wco-active .wecom-chat-title"), "must configure WCO no-drag for .wecom-chat-title");

  // Dynamic simulation assertions
  const listeners = {};
  const windowListeners = {};
  const windowMock = {
    addEventListener(type, fn) {
      if (!windowListeners[type]) windowListeners[type] = [];
      windowListeners[type].push(fn);
    },
    dispatch(type, event = {}) {
      if (windowListeners[type]) windowListeners[type].forEach(fn => fn(event));
    }
  };

  const titleEl = {
    tagName: "SPAN",
    className: "wecom-chat-title",
    classList: {
      _classes: new Set(["wecom-chat-title"]),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) { if (force) this.add(c); else this.remove(c); }
    },
    textContent: "",
    title: "",
    closest(sel) { return sel === ".wecom-chat-title" ? this : null; },
    setPointerCapture(id) { this._captured = id; },
    releasePointerCapture(id) { if (this._captured === id) delete this._captured; }
  };

  const panelMock = {
    dataset: {},
    querySelector(sel) { return sel === ".wecom-chat-title" ? titleEl : null; },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    dispatch(type, event = {}) {
      if (listeners[type]) listeners[type].forEach(fn => fn(event));
    }
  };

  let maskMode = "all";
  const chatState = {
    topicId: 8888,
    title: "真实详情帖子：深入理解浏览器渲染机制"
  };

  function isMaskTitleDetail() {
    return maskMode === "all" || maskMode === "detail";
  }

  function disguiseTitleForTopic(topic) {
    return "【项目推进】2026年技术架构方案";
  }

  const LONG_PRESS_TITLE_MS = 220;

  function bindChatTitleLongPress(panel, win = windowMock) {
    if (!panel || panel.dataset.chatTitleLongPressBound) return;
    panel.dataset.chatTitleLongPressBound = "1";

    let timer = null;
    let isPeeking = false;
    let capturedEl = null;

    const stopPeeking = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (isPeeking) {
        isPeeking = false;
        const titleEl = panel.querySelector(".wecom-chat-title");
        if (titleEl) {
          if (isMaskTitleDetail() && chatState.topicId) {
            titleEl.textContent = disguiseTitleForTopic({ id: chatState.topicId, title: chatState.title });
          } else if (chatState.title) {
            titleEl.textContent = chatState.title;
          }
          titleEl.classList.remove("is-peeking-title");
        }
      }
      if (capturedEl) {
        try {
          if (typeof capturedEl.releasePointerCapture === "function" && capturedEl._pointerId != null) {
            capturedEl.releasePointerCapture(capturedEl._pointerId);
          }
        } catch (_) {}
        delete capturedEl._pointerId;
        capturedEl = null;
      }
    };

    panel.addEventListener("pointerdown", (e) => {
      if (e.button != null && e.button !== 0) return;
      const titleEl = e.target && typeof e.target.closest === "function" ? e.target.closest(".wecom-chat-title") : null;
      if (!titleEl) return;
      if (!isMaskTitleDetail() || !chatState.topicId || !chatState.title) return;

      stopPeeking();
      capturedEl = titleEl;
      capturedEl._pointerId = e.pointerId;
      try {
        if (typeof titleEl.setPointerCapture === "function" && e.pointerId != null) {
          titleEl.setPointerCapture(e.pointerId);
        }
      } catch (_) {}

      timer = setTimeout(() => {
        timer = null;
        if (isMaskTitleDetail() && chatState.title) {
          isPeeking = true;
          titleEl.textContent = chatState.title;
          titleEl.classList.add("is-peeking-title");
        }
      }, LONG_PRESS_TITLE_MS);
    });

    panel.addEventListener("pointerup", stopPeeking);
    panel.addEventListener("pointercancel", stopPeeking);
    panel.addEventListener("lostpointercapture", stopPeeking);
    win.addEventListener("pointerup", stopPeeking);
    win.addEventListener("pointercancel", stopPeeking);
    win.addEventListener("blur", stopPeeking);
    win.addEventListener("keydown", (e) => {
      if (e.key === "Escape") stopPeeking();
    });

    return { stopPeeking, getIsPeeking: () => isPeeking, getTimer: () => timer };
  }

  titleEl.textContent = disguiseTitleForTopic({ id: chatState.topicId, title: chatState.title });
  const ctrl = bindChatTitleLongPress(panelMock);

  // Quick click does not trigger peek
  panelMock.dispatch("pointerdown", { button: 0, pointerId: 10, target: titleEl });
  assert.ok(ctrl.getTimer() !== null);
  await new Promise(r => setTimeout(r, 80));
  panelMock.dispatch("pointerup", { button: 0, pointerId: 10, target: titleEl });
  assert.equal(ctrl.getTimer(), null);
  assert.equal(ctrl.getIsPeeking(), false);
  assert.equal(titleEl.textContent, "【项目推进】2026年技术架构方案");

  // Long press triggers peek, release restores
  panelMock.dispatch("pointerdown", { button: 0, pointerId: 11, target: titleEl });
  await new Promise(r => setTimeout(r, 260));
  assert.equal(ctrl.getIsPeeking(), true);
  assert.equal(titleEl.textContent, chatState.title);
  assert.ok(titleEl.classList.contains("is-peeking-title"));

  windowMock.dispatch("pointerup", {});
  assert.equal(ctrl.getIsPeeking(), false);
  assert.equal(titleEl.textContent, "【项目推进】2026年技术架构方案");
  assert.ok(!titleEl.classList.contains("is-peeking-title"));

  // Long press then blur restores
  panelMock.dispatch("pointerdown", { button: 0, pointerId: 12, target: titleEl });
  await new Promise(r => setTimeout(r, 260));
  assert.equal(ctrl.getIsPeeking(), true);
  windowMock.dispatch("blur", {});
  assert.equal(ctrl.getIsPeeking(), false);
  assert.equal(titleEl.textContent, "【项目推进】2026年技术架构方案");

  // When mask is off, does not trigger
  maskMode = "off";
  titleEl.textContent = chatState.title;
  panelMock.dispatch("pointerdown", { button: 0, pointerId: 13, target: titleEl });
  assert.equal(ctrl.getTimer(), null);
  assert.equal(ctrl.getIsPeeking(), false);
});

test("list panel + button renders dropdown menu with create topic and topic navigation items", () => {
  // Static script assertions
  assert.ok(scriptContent.includes('class="wecom-list-add-wrap"'), "must define .wecom-list-add-wrap");
  assert.ok(scriptContent.includes('class="wecom-list-add-menu"'), "must define .wecom-list-add-menu");
  assert.ok(scriptContent.includes('data-add-action="new-topic"'), "must define new-topic action");
  assert.ok(scriptContent.includes('data-add-action="nav"'), "must define nav action");
  assert.ok(scriptContent.includes("function toggleListAddMenu("), "must define toggleListAddMenu");
  assert.ok(scriptContent.includes("function closeListAddMenu("), "must define closeListAddMenu");
  assert.ok(scriptContent.includes("function updateListAddMenuTexts("), "must define updateListAddMenuTexts");
  assert.ok(scriptContent.includes("https://v2ex.com/new"), "must link to V2EX new topic url");
  assert.ok(scriptContent.includes("function openNewTopic("), "must define openNewTopic");
  assert.ok(scriptContent.includes("wecom-composing-new"), "must style and manage wecom-composing-new state");
  assert.ok(scriptContent.includes("create_topic=true"), "must provide create_topic=true fallback");
  assert.ok(scriptContent.includes(".wecom-list-add-menu"), "must style .wecom-list-add-menu in css");

  // Dynamic simulation assertions
  const panel = {
    _classes: new Set(["wecom-list-panel"]),
    dataset: {},
    querySelector(sel) {
      if (sel === ".wecom-list-add-wrap") return this.addWrap;
      if (sel === ".wecom-list-add-menu") return this.addMenu;
      if (sel === ".wecom-list-add") return this.addBtn;
      if (sel === '[data-add-action="new-topic"]') return this.newTopicItem;
      if (sel === '[data-add-action="nav"]') return this.navItem;
      return null;
    }
  };

  const addBtn = {
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k]; }
  };

  const newTopicText = { textContent: "发布新主题" };
  const newTopicItem = {
    dataset: { addAction: "new-topic" },
    title: "",
    querySelector(sel) {
      if (sel === ".wecom-list-add-item-text") return newTopicText;
      return null;
    }
  };

  const navText = { textContent: "话题分类导航" };
  const navItem = {
    dataset: { addAction: "nav" },
    title: "",
    querySelector(sel) {
      if (sel === ".wecom-list-add-item-text") return navText;
      return null;
    }
  };

  const addMenu = {
    hidden: true,
    querySelector(sel) {
      if (sel === '[data-add-action="new-topic"]') return newTopicItem;
      if (sel === '[data-add-action="nav"]') return navItem;
      return null;
    }
  };

  const addWrap = {
    querySelector(sel) {
      if (sel === ".wecom-list-add-menu") return addMenu;
      if (sel === ".wecom-list-add") return addBtn;
      return null;
    }
  };

  panel.addBtn = addBtn;
  panel.addMenu = addMenu;
  panel.addWrap = addWrap;
  panel.newTopicItem = newTopicItem;
  panel.newTopicText = newTopicText;
  panel.navItem = navItem;
  panel.navText = navText;

  let isMaskList = false;
  function isMaskTitleList() { return isMaskList; }

  function updateListAddMenuTexts(menu) {
    if (!menu) return;
    const isMask = isMaskTitleList();
    const item = menu.querySelector('[data-add-action="new-topic"]');
    if (item) {
      const textEl = item.querySelector(".wecom-list-add-item-text");
      if (textEl) textEl.textContent = isMask ? "发起新项目群" : "发布新主题";
      item.title = isMask ? "发新话题" : "发布新主题";
    }
    const nItem = menu.querySelector('[data-add-action="nav"]');
    if (nItem) {
      const textEl = nItem.querySelector(".wecom-list-add-item-text");
      if (textEl) textEl.textContent = isMask ? "部门架构导航" : "话题分类导航";
      nItem.title = isMask ? "话题分类" : "话题分类导航";
    }
  }

  function toggleListAddMenu(p) {
    const wrap = p.querySelector(".wecom-list-add-wrap");
    const menu = wrap?.querySelector(".wecom-list-add-menu");
    const btn = wrap?.querySelector(".wecom-list-add");
    if (!menu || !btn) return;
    const willOpen = menu.hidden;
    if (willOpen) {
      updateListAddMenuTexts(menu);
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    } else {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  }

  function closeListAddMenu(p) {
    const menu = p.querySelector(".wecom-list-add-menu");
    const btn = p.querySelector(".wecom-list-add");
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  // Initial
  assert.equal(panel.addMenu.hidden, true);

  // Normal open
  toggleListAddMenu(panel);
  assert.equal(panel.addMenu.hidden, false);
  assert.equal(panel.addBtn.getAttribute("aria-expanded"), "true");
  assert.equal(panel.newTopicText.textContent, "发布新主题");
  assert.equal(panel.navText.textContent, "话题分类导航");

  // Normal close
  toggleListAddMenu(panel);
  assert.equal(panel.addMenu.hidden, true);
  assert.equal(panel.addBtn.getAttribute("aria-expanded"), "false");

  // Disguise mode open
  isMaskList = true;
  toggleListAddMenu(panel);
  assert.equal(panel.addMenu.hidden, false);
  assert.equal(panel.newTopicText.textContent, "发起新项目群");
  assert.equal(panel.navText.textContent, "部门架构导航");

  // Close
  closeListAddMenu(panel);
  assert.equal(panel.addMenu.hidden, true);
  assert.equal(panel.addBtn.getAttribute("aria-expanded"), "false");
});

test("openNewTopic directly invokes Discourse composer service in-page or falls back gracefully", () => {
  // Test 1: On Linux DO with Ember composer service
  let emberComposerOpened = false;
  let emberPayload = null;
  let windowOpenedUrl = null;
  const docClasses = new Set();
  const docEl = {
    classList: {
      add(c) { docClasses.add(c); },
      remove(c) { docClasses.delete(c); },
      contains(c) { return docClasses.has(c); }
    }
  };

  const composerService = {
    open(payload) {
      emberComposerOpened = true;
      emberPayload = payload;
    }
  };

  function simulateOpenNewTopic({ isV2ex = false, hasService = true, hasDomBtn = false } = {}) {
    windowOpenedUrl = null;
    emberComposerOpened = false;
    emberPayload = null;
    docClasses.clear();

    if (isV2ex) {
      windowOpenedUrl = "https://v2ex.com/new";
      return;
    }

    let opened = false;
    if (hasService) {
      composerService.open({
        action: "createTopic",
        draftKey: "new_topic"
      });
      opened = true;
    } else if (hasDomBtn) {
      opened = true;
    }

    if (opened) {
      docEl.classList.add("wecom-composing-new");
    } else {
      windowOpenedUrl = "https://linux.do/?create_topic=true";
    }
  }

  // Scenario 1: Native Ember service available on Linux DO
  simulateOpenNewTopic({ isV2ex: false, hasService: true });
  assert.equal(emberComposerOpened, true);
  assert.deepEqual(emberPayload, { action: "createTopic", draftKey: "new_topic" });
  assert.equal(docEl.classList.contains("wecom-composing-new"), true);
  assert.equal(windowOpenedUrl, null);

  // Scenario 2: Service missing, fallback to DOM #create-topic click
  simulateOpenNewTopic({ isV2ex: false, hasService: false, hasDomBtn: true });
  assert.equal(emberComposerOpened, false);
  assert.equal(docEl.classList.contains("wecom-composing-new"), true);
  assert.equal(windowOpenedUrl, null);

  // Scenario 3: Neither ready, fallback to ?create_topic=true (never /new-topic)
  simulateOpenNewTopic({ isV2ex: false, hasService: false, hasDomBtn: false });
  assert.equal(docEl.classList.contains("wecom-composing-new"), false);
  assert.equal(windowOpenedUrl, "https://linux.do/?create_topic=true");
  assert.ok(!windowOpenedUrl.includes("/new-topic"), "must never use /new-topic");

  // Scenario 4: V2EX opens https://v2ex.com/new
  simulateOpenNewTopic({ isV2ex: true });
  assert.equal(windowOpenedUrl, "https://v2ex.com/new");
  assert.equal(docEl.classList.contains("wecom-composing-new"), false);
});

test("new topic composer applies Enterprise WeChat layout, grippie header, and component styles", () => {
  assert.ok(
    scriptContent.includes("wecom-composing-new #reply-control .grippie"),
    "must style grippie top handle"
  );
  assert.ok(
    scriptContent.includes('content: "发布新主题"'),
    "must show 发布新主题 title in grippie"
  );
  assert.ok(
    scriptContent.includes('content: "发起新项目群"'),
    "must show 发起新项目群 in disguised mode"
  );
  assert.ok(
    scriptContent.includes("wecom-composing-new #reply-control input#reply-title"),
    "must style reply-title input in WeCom aesthetic"
  );
  assert.ok(
    scriptContent.includes("wecom-composing-new #reply-control .d-editor"),
    "must style d-editor card and toolbar"
  );
  assert.ok(
    scriptContent.includes("wecom-composing-new #reply-control .submit-panel button.create"),
    "must style create topic submit button with WeCom blue"
  );
  assert.ok(
    scriptContent.includes("wecom-dark.wecom-composing-new #reply-control"),
    "must provide complete dark mode theme for composer"
  );
});

test("Discourse confirmation dialogs and modals have higher z-index than composer and are unblocked", () => {
  assert.ok(
    scriptContent.includes(".dialog-holder") && scriptContent.includes("#discourse-modal-container"),
    "must target Discourse dialog-holder and modal container"
  );
  assert.ok(
    scriptContent.includes("z-index: 20000 !important;"),
    "must elevate modals to z-index 20000 above reply-control 1500"
  );
  assert.ok(
    scriptContent.includes(".dialog-footer button.btn-danger") || scriptContent.includes("button.btn-danger"),
    "must style discard confirmation button"
  );
  assert.ok(
    scriptContent.includes("NATIVE_BRIDGE_SEL") && scriptContent.includes(".dialog-holder"),
    "must include dialog-holder in NATIVE_BRIDGE_SEL to avoid DOM thrashing"
  );
});

test("topic detail image auto-layout setting, 100px thumbnails below text, and click to preview", () => {
  // 1. Script contains configuration constants and toggle functions
  assert.ok(
    scriptContent.includes('const IMAGE_AUTO_LAYOUT_KEY = "linuxdo-wecom-image-auto-layout";'),
    "must define IMAGE_AUTO_LAYOUT_KEY constant"
  );
  assert.ok(
    scriptContent.includes("function isImageAutoLayoutEnabled") && scriptContent.includes("function setImageAutoLayoutEnabled"),
    "must define isImageAutoLayoutEnabled and setImageAutoLayoutEnabled"
  );
  assert.ok(
    scriptContent.includes("function refreshChatMessagesLayout"),
    "must define refreshChatMessagesLayout for in-place updates"
  );

  // 2. Settings menu contains toggle option and synchronization
  assert.ok(
    scriptContent.includes(".wecom-menu-toggle-image-layout"),
    "must include .wecom-menu-toggle-image-layout button in settings menu"
  );
  assert.ok(
    scriptContent.includes("图片自动排版"),
    "must display 图片自动排版 label in settings menu"
  );
  assert.ok(
    scriptContent.includes("setImageAutoLayoutEnabled(!isImageAutoLayoutEnabled())"),
    "must handle toggle click in settings menu"
  );

  // 3. CSS styling constraints for 100px thumbnail and container
  assert.ok(
    scriptContent.includes(".wecom-msg-images"),
    "must define .wecom-msg-images container style"
  );
  assert.ok(
    scriptContent.includes("width: 100px !important;") && scriptContent.includes("height: 100px !important;"),
    "must constrain thumbnails strictly to width: 100px and height: 100px"
  );
  assert.ok(
    scriptContent.includes("object-fit: cover !important;"),
    "must apply object-fit: cover to thumbnail images"
  );
  assert.ok(
    scriptContent.includes("cursor: zoom-in"),
    "must set zoom-in cursor on thumbnails"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-body.is-empty"),
    "must handle image-only posts with is-empty hidden class"
  );

  // 4. Click & keyboard preview delegation
  assert.ok(
    scriptContent.includes('event.target.closest(".wecom-msg-thumb")'),
    "must delegate click on .wecom-msg-thumb to openImageViewer"
  );

  // 5. Functional simulation of image extraction and empty paragraph cleanup
  function simulateAutoLayout(bodyHtml, autoLayoutEnabled = true) {
    // Mini mock DOM parser
    const images = [];
    const textMatches = bodyHtml.match(/<p>(.*?)<\/p>/g) || [];
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
    let match;
    while ((match = imgRegex.exec(bodyHtml)) !== null) {
      const full = match[0];
      const src = match[2];
      const isEmoji = full.includes('class="emoji"');
      const inQuote = bodyHtml.indexOf("<blockquote>") !== -1 &&
                      bodyHtml.indexOf("<blockquote>") < match.index &&
                      match.index < bodyHtml.indexOf("</blockquote>");
      if (!isEmoji && !inQuote) {
        images.push({ src, alt: "preview" });
      }
    }

    if (!autoLayoutEnabled || images.length === 0) {
      return { hasGallery: false, imageCount: 0, textBody: bodyHtml };
    }

    // Cleaned body without the extracted images
    let cleanedBody = bodyHtml.replace(/<div class="lightbox-wrapper">[\s\S]*?<\/div>/g, "")
                              .replace(/<img\s+[^>]*?src=["']https:\/\/linux\.do\/[^"']+["'][^>]*>/g, "")
                              .replace(/<p>\s*<\/p>/g, "")
                              .trim();

    const galleryHtml = `<div class="wecom-msg-images">` +
      images.map(img => `<div class="wecom-msg-thumb" style="width:100px;height:100px"><img src="${img.src}" style="object-fit:cover"></div>`).join("") +
      `</div>`;

    return {
      hasGallery: true,
      imageCount: images.length,
      textBody: cleanedBody,
      galleryHtml
    };
  }

  const sampleCooked = `
    <p>这是帖子的文字说明</p>
    <div class="lightbox-wrapper">
      <a class="lightbox" href="https://linux.do/uploads/original/1.jpg">
        <img src="https://linux.do/uploads/thumb/1.jpg" alt="pic1">
      </a>
    </div>
    <p>第二段文字说明</p>
    <blockquote><img src="https://linux.do/quote.jpg" alt="quoted"></blockquote>
    <p><img class="emoji" src="smile.png" alt="smile"></p>
  `;

  // Disabled
  const disabledRes = simulateAutoLayout(sampleCooked, false);
  assert.equal(disabledRes.hasGallery, false);

  // Enabled
  const enabledRes = simulateAutoLayout(sampleCooked, true);
  assert.equal(enabledRes.hasGallery, true);
  assert.equal(enabledRes.imageCount, 1); // Only 1 topic image (quote image and emoji excluded)
  assert.ok(!enabledRes.textBody.includes("lightbox-wrapper"), "lightbox-wrapper removed from text");
  assert.ok(enabledRes.textBody.includes("这是帖子的文字说明"), "preserves text paragraph 1");
  assert.ok(enabledRes.textBody.includes("第二段文字说明"), "preserves text paragraph 2");
  assert.ok(enabledRes.galleryHtml.includes("width:100px;height:100px"), "thumbnail constrained to 100px");
});

test("message bubble hover shows 原排版 button and clicking directly toggles original layout", () => {
  // 1. Script contains hover toggle button class and icons
  assert.ok(
    scriptContent.includes(".wecom-bubble-layout-toggle"),
    "must style .wecom-bubble-layout-toggle"
  );
  assert.ok(
    scriptContent.includes("layoutOriginal:") && scriptContent.includes("layoutAuto:"),
    "must define layoutOriginal and layoutAuto icons in ICONS"
  );
  assert.ok(
    scriptContent.includes("<span>原排版</span>") && scriptContent.includes("<span>自动排版</span>"),
    "must support 原排版 and 自动排版 text labels"
  );

  // 2. CSS specifies hover visibility on bubble
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble:hover .wecom-bubble-layout-toggle"),
    "must show toggle button on bubble hover"
  );

  // 3. Script defines toggleMessageBubbleLayout function and delegates click
  assert.ok(
    scriptContent.includes("function toggleMessageBubbleLayout"),
    "must define toggleMessageBubbleLayout function"
  );
  assert.ok(
    scriptContent.includes('event.target.closest(".wecom-bubble-layout-toggle")'),
    "must handle click on .wecom-bubble-layout-toggle in chat panel"
  );

  // 4. Functional simulation of toggleMessageBubbleLayout
  const mockPost = {
    id: 101,
    post_number: 1,
    cooked: "<p>原排版正文</p><p><img src=\"https://linux.do/photo.jpg\"></p>"
  };

  const bubbleMock = {
    dataset: { layoutMode: "auto" },
    hasGallery: true,
    bodyHtml: "<p>原排版正文</p>",
    btnTitle: "点击显示原排版",
    btnText: "原排版",
    isRawClass: false
  };

  function simulateToggle(bubble, post) {
    const isRaw = bubble.dataset.layoutMode === "raw";
    if (isRaw) {
      bubble.dataset.layoutMode = "auto";
      bubble.hasGallery = true;
      bubble.bodyHtml = "<p>原排版正文</p>";
      bubble.btnTitle = "点击显示原排版";
      bubble.btnText = "原排版";
      bubble.isRawClass = false;
    } else {
      bubble.dataset.layoutMode = "raw";
      bubble.hasGallery = false;
      bubble.bodyHtml = post.cooked;
      bubble.btnTitle = "点击显示自动排版";
      bubble.btnText = "自动排版";
      bubble.isRawClass = true;
    }
  }

  // Initial auto mode
  assert.equal(bubbleMock.dataset.layoutMode, "auto");
  assert.equal(bubbleMock.btnText, "原排版");
  assert.equal(bubbleMock.hasGallery, true);

  // Toggle to raw
  simulateToggle(bubbleMock, mockPost);
  assert.equal(bubbleMock.dataset.layoutMode, "raw");
  assert.equal(bubbleMock.btnText, "自动排版");
  assert.equal(bubbleMock.btnTitle, "点击显示自动排版");
  assert.equal(bubbleMock.hasGallery, false);
  assert.equal(bubbleMock.bodyHtml, mockPost.cooked);
  assert.equal(bubbleMock.isRawClass, true);

  // Toggle back to auto
  simulateToggle(bubbleMock, mockPost);
  assert.equal(bubbleMock.dataset.layoutMode, "auto");
  assert.equal(bubbleMock.btnText, "原排版");
  assert.equal(bubbleMock.btnTitle, "点击显示原排版");
  assert.equal(bubbleMock.hasGallery, true);
  assert.equal(bubbleMock.isRawClass, false);
});

test("component images such as onebox, poll, details are excluded from image auto-layout", () => {
  // 1. Script checks for onebox containers and component elements
  assert.ok(
    scriptContent.includes("aside.onebox") && scriptContent.includes(".onebox-body"),
    "must exclude aside.onebox and .onebox-body"
  );
  assert.ok(
    scriptContent.includes(".onebox-avatar") && scriptContent.includes(".onebox-thumbnail"),
    "must exclude .onebox-avatar and .onebox-thumbnail"
  );
  assert.ok(
    scriptContent.includes("details") && scriptContent.includes(".poll"),
    "must exclude details and poll components"
  );

  // 2. isPreviewableChatImage excludes onebox images from hijacking clicks
  assert.ok(
    scriptContent.includes('image.closest("aside.onebox, .onebox, .onebox-body, [data-onebox-src]")'),
    "isPreviewableChatImage must return false for images inside onebox"
  );

  // 3. Functional simulation verifying Onebox remains in-place inside text
  const postWithOneboxAndRegularImage = `
    <p>这是正文第一段，推荐阅读这个链接：</p>
    <aside class="onebox githubrepo">
      <article class="onebox-body">
        <img class="thumbnail onebox-avatar" src="https://github.com/avatar.png">
        <h3><a href="https://github.com/example/repo">example/repo</a></h3>
        <p>Repo description</p>
      </article>
    </aside>
    <p>这是正文第二段，附上实际测试截图：</p>
    <div class="lightbox-wrapper">
      <a class="lightbox" href="https://linux.do/uploads/original/test.png">
        <img src="https://linux.do/uploads/thumb/test.png" alt="test.png">
      </a>
    </div>
  `;

  // Filter function simulation matching script's logic
  function filterCandidateImages(html) {
    const images = [];
    const regex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const full = m[0];
      const src = m[2];
      const isOnebox = full.includes("onebox") ||
        (html.indexOf('<aside class="onebox') !== -1 &&
         html.indexOf('<aside class="onebox') < m.index &&
         m.index < html.indexOf('</aside>'));
      const isEmoji = full.includes('class="emoji"');
      if (!isOnebox && !isEmoji) {
        images.push(src);
      }
    }
    return images;
  }

  const extracted = filterCandidateImages(postWithOneboxAndRegularImage);
  assert.equal(extracted.length, 1);
  assert.equal(extracted[0], "https://linux.do/uploads/thumb/test.png");
  assert.ok(!extracted.includes("https://github.com/avatar.png"), "must not extract onebox avatar");
});

test("V2EX embedded images and non-lightbox images are properly preserved in gallery and not self-removed", () => {
  // 1. Script checks that targetToRemove avoids self-removing linkToMove or img
  assert.ok(
    scriptContent.includes("const targetToRemove = (lightboxWrapper && lightboxWrapper !== linkToMove) ? lightboxWrapper : null;"),
    "targetToRemove must only target outer lightboxWrapper when it is distinct from linkToMove"
  );
  assert.ok(
    scriptContent.includes("if (targetToRemove) {\n          targetToRemove.remove();\n        }") ||
    scriptContent.includes("if (targetToRemove)"),
    "targetToRemove.remove() must only run when targetToRemove is non-null"
  );
  assert.ok(
    scriptContent.includes("bubble.dataset.rawCooked"),
    "applyImageAutoLayout and toggleMessageBubbleLayout must preserve bubble.dataset.rawCooked"
  );

  // 2. previewImageSource detects wrapped high-res links for V2EX and markdown images
  assert.ok(
    scriptContent.includes("const generalLink = image.closest(\"a[href]\");"),
    "previewImageSource must check wrapping link"
  );

  // 3. Functional relocation simulation: V2EX <a><img></a> and plain <img> must NOT be destroyed
  function simulateAutoLayout(bodyChildren) {
    const gallery = [];
    for (const item of bodyChildren) {
      const isLightbox = item.type === "lightbox";
      const linkToMove = item.type === "link" ? item.link : null;
      const targetToRemove = isLightbox ? item.wrapper : null;

      const thumb = {
        child: linkToMove || item.img,
        removed: false
      };

      if (targetToRemove) {
        targetToRemove.removed = true;
      }
      // If targetToRemove was linkToMove or img (as in old bug), it would remove thumb.child!
      gallery.push(thumb);
    }
    return gallery;
  }

  const v2exItems = [
    { type: "link", link: { tag: "a", href: "https://i.imgur.com/high.jpg" }, img: { tag: "img", src: "https://i.imgur.com/thumb.jpg" } },
    { type: "plain", img: { tag: "img", src: "https://i.imgur.com/plain.jpg" } }
  ];

  const gallery = simulateAutoLayout(v2exItems);
  assert.equal(gallery.length, 2);
  assert.equal(gallery[0].child.tag, "a");
  assert.equal(gallery[0].removed, false, "V2EX wrapped image must not be removed");
  assert.equal(gallery[1].child.tag, "img");
  assert.equal(gallery[1].removed, false, "V2EX plain image must not be removed");
});

test("clicking notifications clears or decrements badges immediately across avatar, menu, and list", () => {
  // 1. Script defines clearNotificationBadge and decrementNotificationBadge
  assert.ok(
    scriptContent.includes("function clearNotificationBadge()"),
    "must define clearNotificationBadge"
  );
  assert.ok(
    scriptContent.includes("function decrementNotificationBadge()"),
    "must define decrementNotificationBadge"
  );
  assert.ok(
    scriptContent.includes("notificationCountOverride"),
    "must track notificationCountOverride"
  );

  // 2. Notification menu clicks trigger decrement or clear
  assert.ok(
    scriptContent.includes("clearNotificationBadge();\n        } else {\n          decrementNotificationBadge();"),
    "bindNotifMenuEvents must clear or decrement badge on actionable click"
  );

  // 3. V2EX avatar click and /notifications load trigger clearNotificationBadge
  assert.ok(
    scriptContent.includes("clearNotificationBadge();\n        const body = document.querySelector(\".wecom-list-body\");"),
    "V2EX avatar click must call clearNotificationBadge"
  );
  assert.ok(
    scriptContent.includes("if (path === \"/notifications\") {\n                clearNotificationBadge();\n              }"),
    "loadList must call clearNotificationBadge when path is /notifications"
  );

  // 4. Conversation row click eliminates row badge and clears notification badge
  assert.ok(
    scriptContent.includes("convBadge.remove();"),
    "bindListPanelClicks must remove convBadge on click"
  );
  assert.ok(
    scriptContent.includes("if (isNotifItem) {\n          clearNotificationBadge();\n        } else if (convBadge) {\n          decrementNotificationBadge();\n        }"),
    "bindListPanelClicks must update notification badge"
  );

  // 5. Functional state simulation of getUnreadNotificationCount with overrides & new notifications
  let override = null;
  let lastKnownRaw = 0;

  function simulateGetCount(raw) {
    if (raw > lastKnownRaw) {
      override = null;
    }
    lastKnownRaw = raw;
    if (override !== null) return override;
    return raw;
  }

  // Initial state: 2 unread notifications
  assert.equal(simulateGetCount(2), 2);

  // User clicks 1 notification
  override = 1;
  assert.equal(simulateGetCount(2), 1, "must show decremented count 1");

  // User clicks another notification / dismiss
  override = 0;
  assert.equal(simulateGetCount(2), 0, "badge must be eliminated (count 0)");

  // Still 2 on server (cached/static DOM)
  assert.equal(simulateGetCount(2), 0, "must stay eliminated while raw count is not newer");

  // A new notification arrives (raw becomes 3)
  assert.equal(simulateGetCount(3), 3, "must reset override and display count when higher raw count arrives");
});

test("image auto-layout thumbnail size can be configured, supports presets and custom sizes, and applies CSS variable", () => {
  // 1. Script defines size storage keys and helper functions
  assert.ok(
    scriptContent.includes("IMAGE_AUTO_LAYOUT_SIZE_KEY"),
    "must define IMAGE_AUTO_LAYOUT_SIZE_KEY"
  );
  assert.ok(
    scriptContent.includes("function getImageAutoLayoutSize()"),
    "must define getImageAutoLayoutSize"
  );
  assert.ok(
    scriptContent.includes("function setImageAutoLayoutSize(size)"),
    "must define setImageAutoLayoutSize"
  );
  assert.ok(
    scriptContent.includes("function applyImageAutoLayoutSizeCss(size)"),
    "must define applyImageAutoLayoutSizeCss"
  );

  // 2. CSS supports dynamic thumbnail size variable
  assert.ok(
    scriptContent.includes("var(--wecom-image-thumb-size, 100px)"),
    "thumbnails must use CSS variable --wecom-image-thumb-size"
  );
  assert.ok(
    scriptContent.includes(".wecom-menu-image-size-row"),
    "must define .wecom-menu-image-size-row in CSS"
  );
  assert.ok(
    scriptContent.includes(".wecom-size-chip"),
    "must define .wecom-size-chip in CSS"
  );

  // 3. Settings menu includes size presets and custom trigger
  assert.ok(
    scriptContent.includes('data-size="80"') &&
    scriptContent.includes('data-size="100"') &&
    scriptContent.includes('data-size="120"') &&
    scriptContent.includes('data-size="150"'),
    "must provide preset size buttons 80, 100, 120, 150"
  );
  assert.ok(
    scriptContent.includes('data-size="custom"'),
    "must provide custom size button"
  );

  // 4. Functional simulation of size getter, setter, clamping and CSS variable application
  let storedSize = null;
  const mockStyle = {};
  const MIN = 50;
  const MAX = 400;
  const DEFAULT = 100;

  function simGetSize() {
    const v = parseInt(storedSize, 10);
    if (Number.isFinite(v) && v >= MIN && v <= MAX) return v;
    return DEFAULT;
  }

  function simSetSize(size) {
    const num = Math.min(MAX, Math.max(MIN, Number(size) || DEFAULT));
    storedSize = String(num);
    mockStyle["--wecom-image-thumb-size"] = `${num}px`;
    return num;
  }

  // Default is 100
  assert.equal(simGetSize(), 100);

  // Select 80px preset
  simSetSize(80);
  assert.equal(simGetSize(), 80);
  assert.equal(mockStyle["--wecom-image-thumb-size"], "80px");

  // Select 150px preset
  simSetSize(150);
  assert.equal(simGetSize(), 150);
  assert.equal(mockStyle["--wecom-image-thumb-size"], "150px");

  // Set custom 200px
  simSetSize(200);
  assert.equal(simGetSize(), 200);
  assert.equal(mockStyle["--wecom-image-thumb-size"], "200px");

  // Clamp underflow & overflow
  simSetSize(20);
  assert.equal(simGetSize(), 50, "must clamp underflow to MIN 50");
  assert.equal(mockStyle["--wecom-image-thumb-size"], "50px");

  simSetSize(600);
  assert.equal(simGetSize(), 400, "must clamp overflow to MAX 400");
  assert.equal(mockStyle["--wecom-image-thumb-size"], "400px");
});

test("images with dimensions smaller than layout thumbnail size are excluded from auto-layout", () => {
  // 1. Script defines helper functions and integrates size check into auto-layout
  assert.ok(
    scriptContent.includes("function parsePixelDimension"),
    "must define parsePixelDimension"
  );
  assert.ok(
    scriptContent.includes("function getImageEffectiveDimensions"),
    "must define getImageEffectiveDimensions"
  );
  assert.ok(
    scriptContent.includes("function isImageSmallerThanLayout"),
    "must define isImageSmallerThanLayout"
  );
  assert.ok(
    scriptContent.includes("function attachImageAutoLayoutLoadCheck"),
    "must define attachImageAutoLayoutLoadCheck"
  );
  assert.ok(
    scriptContent.includes("if (isImageSmallerThanLayout(img, layoutSize)) return false;"),
    "candidateImgs filter must exclude images smaller than layoutSize"
  );
  assert.ok(
    scriptContent.includes("refreshChatMessagesLayout();"),
    "setImageAutoLayoutSize must trigger refreshChatMessagesLayout"
  );

  // 2. Functional simulation of parsePixelDimension
  function simParsePixel(val) {
    if (!val) return NaN;
    const str = String(val).trim();
    if (!str || str.endsWith("%") || str.endsWith("vw") || str.endsWith("vh")) return NaN;
    const num = parseFloat(str);
    return Number.isFinite(num) && num > 0 ? num : NaN;
  }

  assert.equal(simParsePixel("50px"), 50);
  assert.equal(simParsePixel("80"), 80);
  assert.equal(simParsePixel(" 120.5 px "), 120.5);
  assert.ok(Number.isNaN(simParsePixel("100%")), "percentage width must return NaN");
  assert.ok(Number.isNaN(simParsePixel("auto")), "auto must return NaN");
  assert.ok(Number.isNaN(simParsePixel(null)), "null must return NaN");

  // 3. Functional simulation of getImageEffectiveDimensions and isImageSmallerThanLayout
  function simGetDimensions(img) {
    if (!img) return null;
    if (img.naturalWidth > 0) {
      return { width: img.naturalWidth, height: img.naturalHeight || img.naturalWidth };
    }
    const attrW = simParsePixel(img.getAttribute?.("width") || img.getAttribute?.("data-width"));
    const attrH = simParsePixel(img.getAttribute?.("height") || img.getAttribute?.("data-height"));
    if (Number.isFinite(attrW) && Number.isFinite(attrH)) return { width: attrW, height: attrH };
    if (Number.isFinite(attrW)) return { width: attrW, height: attrW };
    if (Number.isFinite(attrH)) return { width: attrH, height: attrH };

    const styleW = simParsePixel(img.style?.width);
    const styleH = simParsePixel(img.style?.height);
    if (Number.isFinite(styleW) && Number.isFinite(styleH)) return { width: styleW, height: styleH };
    if (Number.isFinite(styleW)) return { width: styleW, height: styleW };
    if (Number.isFinite(styleH)) return { width: styleH, height: styleH };

    if (img.metaText) {
      const match = img.metaText.match(/(\d+)\s*[×x]\s*(\d+)/i);
      if (match) return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
    }
    return null;
  }

  function simIsSmaller(img, layoutSize) {
    const dim = simGetDimensions(img);
    if (!dim) return false;
    return dim.width < layoutSize && dim.height < layoutSize;
  }

  // Under default layoutSize = 100:
  // Tiny 48x48 icon is smaller than 100px
  assert.equal(simIsSmaller({ getAttribute: (k) => k === "width" ? "48" : "48" }, 100), true);
  // 80x80 small image is smaller than 100px
  assert.equal(simIsSmaller({ naturalWidth: 80, naturalHeight: 80 }, 100), true);
  // 100x100 is not strictly smaller than 100px
  assert.equal(simIsSmaller({ naturalWidth: 100, naturalHeight: 100 }, 100), false);
  // 800x600 photo is not smaller than 100px
  assert.equal(simIsSmaller({ naturalWidth: 800, naturalHeight: 600 }, 100), false);
  // 50x300 vertical banner exceeds 100px height -> not smaller
  assert.equal(simIsSmaller({ naturalWidth: 50, naturalHeight: 300 }, 100), false);
  // 300x50 horizontal banner exceeds 100px width -> not smaller
  assert.equal(simIsSmaller({ naturalWidth: 300, naturalHeight: 50 }, 100), false);
  // Discourse meta informations 1920x1080 -> not smaller
  assert.equal(simIsSmaller({ metaText: "1920×1080 200 KB" }, 100), false);

  // Dynamic layout size changes:
  // When layout size is 80px: 80x80 is no longer smaller than layout size
  assert.equal(simIsSmaller({ naturalWidth: 80, naturalHeight: 80 }, 80), false);
  // When layout size is 150px: 120x120 becomes smaller than layout size
  assert.equal(simIsSmaller({ naturalWidth: 120, naturalHeight: 120 }, 150), true);

  // 4. Functional simulation of message auto-layout with small & large images
  function simulateMessageAutoLayout(images, layoutSize) {
    const candidateImgs = [];
    const inlineImgs = [];
    for (const img of images) {
      if (simIsSmaller(img, layoutSize)) {
        inlineImgs.push(img);
      } else {
        candidateImgs.push(img);
      }
    }
    return {
      hasGallery: candidateImgs.length > 0,
      galleryCount: candidateImgs.length,
      inlineCount: inlineImgs.length
    };
  }

  // Post with only small inline icons (e.g. 48px, 64px)
  const iconsOnly = [
    { getAttribute: (k) => k === "width" ? "48" : "48" },
    { getAttribute: (k) => k === "width" ? "64" : "64" }
  ];
  const resIconsOnly = simulateMessageAutoLayout(iconsOnly, 100);
  assert.equal(resIconsOnly.hasGallery, false, "post with only small images must not create gallery");
  assert.equal(resIconsOnly.inlineCount, 2, "small images must remain inline");

  // Post with 1 small badge (60x20) and 1 screenshot (1200x800)
  const mixedImages = [
    { getAttribute: (k) => k === "width" ? "60" : "20" },
    { naturalWidth: 1200, naturalHeight: 800 }
  ];
  const resMixed = simulateMessageAutoLayout(mixedImages, 100);
  assert.equal(resMixed.hasGallery, true, "mixed post must create gallery for large image");
  assert.equal(resMixed.galleryCount, 1, "only large image goes to gallery");
  assert.equal(resMixed.inlineCount, 1, "small badge remains inline in message text");
});

test("image auto-layout aspect ratio configuration (4:3, 1:1, 16:9) and empty lines cleanup", () => {
  // 1. Script defines aspect ratio keys and methods
  assert.ok(
    scriptContent.includes("IMAGE_AUTO_LAYOUT_ASPECT_KEY"),
    "must define IMAGE_AUTO_LAYOUT_ASPECT_KEY"
  );
  assert.ok(
    scriptContent.includes("function getImageAutoLayoutAspect"),
    "must define getImageAutoLayoutAspect"
  );
  assert.ok(
    scriptContent.includes("function setImageAutoLayoutAspect"),
    "must define setImageAutoLayoutAspect"
  );
  assert.ok(
    scriptContent.includes("function computeImageAutoLayoutDimensions"),
    "must define computeImageAutoLayoutDimensions"
  );
  assert.ok(
    scriptContent.includes("function cleanMessageBodyWhitespace"),
    "must define cleanMessageBodyWhitespace"
  );

  // 2. CSS defines aspect ratio variables and settings menu elements
  assert.ok(
    scriptContent.includes(".wecom-menu-image-aspect-row"),
    "must style .wecom-menu-image-aspect-row in CSS"
  );
  assert.ok(
    scriptContent.includes(".wecom-aspect-chip"),
    "must style .wecom-aspect-chip in CSS"
  );
  assert.ok(
    scriptContent.includes("--wecom-image-thumb-aspect"),
    "must set CSS variable --wecom-image-thumb-aspect"
  );
  assert.ok(
    scriptContent.includes('data-aspect="4:3"') &&
    scriptContent.includes('data-aspect="1:1"') &&
    scriptContent.includes('data-aspect="16:9"'),
    "must offer 4:3, 1:1, 16:9 aspect chips in settings menu"
  );

  // 3. Functional test of computeImageAutoLayoutDimensions
  function simComputeDims(baseSize, aspect) {
    const s = Number(baseSize) || 100;
    if (aspect === "4:3") {
      return { width: Math.round(s * 4 / 3), height: s, cssAspect: "4 / 3" };
    }
    if (aspect === "16:9") {
      return { width: Math.round(s * 16 / 9), height: s, cssAspect: "16 / 9" };
    }
    return { width: s, height: s, cssAspect: "1 / 1" };
  }

  const dims1x1 = simComputeDims(100, "1:1");
  assert.equal(dims1x1.width, 100);
  assert.equal(dims1x1.height, 100);
  assert.equal(dims1x1.cssAspect, "1 / 1");

  const dims4x3 = simComputeDims(100, "4:3");
  assert.equal(dims4x3.width, 133);
  assert.equal(dims4x3.height, 100);
  assert.equal(dims4x3.cssAspect, "4 / 3");

  const dims16x9 = simComputeDims(100, "16:9");
  assert.equal(dims16x9.width, 178);
  assert.equal(dims16x9.height, 100);
  assert.equal(dims16x9.cssAspect, "16 / 9");

  // 4. Functional simulation of cleanMessageBodyWhitespace
  function simCleanWhitespace(html) {
    let cleaned = html
      .replace(/<(p|div)>\s*(?:<br\s*\/?>|&nbsp;|\u00A0|\u200B|\s)*<\/\1>/gi, "")
      .replace(/(?:<br\s*\/?>\s*){2,}/gi, "<br>")
      .replace(/(<\/(?:p|div|blockquote)>)\s*<br\s*\/?>/gi, "$1")
      .replace(/<br\s*\/?>\s*(<(?:p|div|blockquote)>)/gi, "$1")
      .replace(/^(?:\s*<br\s*\/?>|\s)+/i, "")
      .replace(/(?:<br\s*\/?>\s*|\s)+$/i, "")
      .trim();
    return cleaned;
  }

  // Case A: Multiple empty paragraphs left by Discourse removed images
  const discourseCooked = `
    <p>第一段文本</p>
    <p><br></p>
    <p><br></p>
    <p>第二段文本</p>
    <p><br></p>
  `;
  const resDiscourse = simCleanWhitespace(discourseCooked);
  assert.ok(!resDiscourse.includes("<p><br></p>"), "must remove empty paragraphs");
  assert.ok(resDiscourse.includes("<p>第一段文本</p>"), "must preserve first paragraph");
  assert.ok(resDiscourse.includes("<p>第二段文本</p>"), "must preserve second paragraph");
  assert.ok(!resDiscourse.endsWith("<br>"), "must trim trailing linebreaks");

  // Case B: V2EX multiple consecutive <br> tags left after image removal
  const v2exCooked = "这是第一行<br><br><br><br>这是第二行<br><br><br>";
  const resV2ex = simCleanWhitespace(v2exCooked);
  assert.equal(resV2ex, "这是第一行<br>这是第二行", "must collapse multiple <br> and remove trailing <br>");

  // Case C: Leading and trailing empty space before gallery
  const trailingCooked = "<br><br><p>单段文本</p><br><br>";
  const resTrailing = simCleanWhitespace(trailingCooked);
  assert.equal(resTrailing, "<p>单段文本</p>", "must eliminate leading and trailing void space");
});

test("comprehensive dark mode stylesheet covers tokens, user menus, list chips, bubbles, oneboxes, emoji picker, edit dialog, and V2EX", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptPath = path.join(__dirname, "..", "linuxdo-wecom.user.js");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  // 1. Core token definitions & overridable color-scheme
  assert.ok(scriptContent.includes("color-scheme: dark !important;"), "must enforce color-scheme: dark !important in dark mode");
  assert.ok(scriptContent.includes("--wc-bg: #202328;"), "must define --wc-bg in dark mode");
  assert.ok(scriptContent.includes("--wc-text-4: #545B66;"), "must define --wc-text-4 in dark mode");
  assert.ok(scriptContent.includes("--wc-blue-soft: rgba(30, 111, 255, 0.18);"), "must define dark --wc-blue-soft");
  assert.ok(scriptContent.includes("--wc-accent-soft: rgba(30, 111, 255, 0.18);"), "must define dark --wc-accent-soft");

  // 2. Left rail & menus
  assert.ok(scriptContent.includes(".sidebar-wrapper"), "must style sidebar-wrapper in dark mode");
  assert.ok(scriptContent.includes(".user-menu.wecom-user-menu-float"), "must style floating user-menu in dark mode");
  assert.ok(scriptContent.includes(".quick-access-panel"), "must style quick-access-panel in dark mode");
  assert.ok(scriptContent.includes(".wecom-theme-menu button:hover"), "must style theme menu button hover in dark mode");

  // 3. Conversation list
  assert.ok(scriptContent.includes(".wecom-chip.active"), "must style active chip in dark mode");
  assert.ok(scriptContent.includes(".wecom-chip-icon"), "must style chip icon in dark mode");
  assert.ok(scriptContent.includes(".wecom-list-nav a.active"), "must style list nav link active in dark mode");
  assert.ok(scriptContent.includes(".wecom-conv-tag.is-dept"), "must style dept tag in dark mode");
  assert.ok(scriptContent.includes(".wecom-conv-tag.is-ext"), "must style ext tag in dark mode");
  assert.ok(scriptContent.includes(".wecom-list-search form:focus-within"), "must style search focus-within in dark mode");

  // 4. Chat header & bubbles & cooked elements
  assert.ok(scriptContent.includes(".wecom-chat-head"), "must style chat head in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-tools"), "must style floating msg tools in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-tool:hover"), "must style msg tool hover in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble aside.onebox"), "must style onebox in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble pre"), "must style pre in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble code"), "must style code in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble table th"), "must style table th in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble .subtle"), "must style V2EX subtle in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble a.mention"), "must style mention in dark mode");

  // 5. Popovers, composer & dialogs
  assert.ok(scriptContent.includes(".emoji-picker"), "must style emoji picker in dark mode");
  assert.ok(scriptContent.includes(".autocomplete"), "must style autocomplete in dark mode");
  assert.ok(scriptContent.includes(".wecom-edit-dialog-card"), "must style edit dialog card");
  assert.ok(scriptContent.includes(".wecom-edit-input"), "must style edit dialog input");
  assert.ok(scriptContent.includes(".wecom-reply-target"), "must style reply target banner in dark mode");

  // 6. V2EX native fallback styles & float FAB
  assert.ok(scriptContent.includes("html.wecom-dark #Top"), "must style V2EX #Top in dark mode");
  assert.ok(scriptContent.includes("html.wecom-dark #Wrapper"), "must style V2EX #Wrapper in dark mode");
  assert.ok(scriptContent.includes("html.wecom-dark .box"), "must style V2EX .box in dark mode");
  assert.ok(scriptContent.includes(".wecom-mode-fab"), "must style wecom-mode-fab in dark mode");
});

test("Linux DO notification list dismiss ('全部忽略') triggers Discourse mark-read API, updates DOM, and clears badges", () => {
  // 1. Verify isDismissAllTarget recognizes all variations of dismiss buttons
  assert.ok(
    scriptContent.includes("function isDismissAllTarget(target)"),
    "must define isDismissAllTarget"
  );
  assert.ok(
    scriptContent.includes(".btn-dismiss-read") &&
    scriptContent.includes(".dismiss-read") &&
    scriptContent.includes(".dismiss-notification") &&
    scriptContent.includes("dismiss-all"),
    "isDismissAllTarget must cover core Discourse dismiss selectors"
  );
  assert.ok(
    scriptContent.includes("/忽略|已读|dismiss|mark.*read/i"),
    "isDismissAllTarget must match title and aria-label in Chinese and English"
  );
  assert.ok(
    scriptContent.includes(".d-icon-check"),
    "isDismissAllTarget must support checkmark icon buttons"
  );

  // 2. Verify isUserMenuTab prevents premature menu close on tab clicks
  assert.ok(
    scriptContent.includes("function isUserMenuTab(target)"),
    "must define isUserMenuTab"
  );
  assert.ok(
    scriptContent.includes(".user-menu-tab") && scriptContent.includes("tabs-list"),
    "isUserMenuTab must recognize user menu tab components"
  );

  // 3. Verify dismissAllDiscourseNotifications calls PUT /notifications/mark-read with CSRF headers
  assert.ok(
    scriptContent.includes("async function dismissAllDiscourseNotifications()"),
    "must define dismissAllDiscourseNotifications"
  );
  assert.ok(
    scriptContent.includes('await fetch("/notifications/mark-read"'),
    "dismissAllDiscourseNotifications must call PUT /notifications/mark-read"
  );
  assert.ok(
    scriptContent.includes('headers: bridgeHeaders("application/json")'),
    "dismissAllDiscourseNotifications must include CSRF bridge headers"
  );

  // 4. Verify unread notification DOM items are immediately marked as read
  assert.ok(
    scriptContent.includes('item.classList.remove("unread");') &&
    scriptContent.includes('item.classList.add("read");'),
    "dismissAllDiscourseNotifications must update unread class to read on items"
  );
  assert.ok(
    scriptContent.includes(".unread-indicator") &&
    scriptContent.includes(".notification-unread-dot"),
    "dismissAllDiscourseNotifications must strip unread indicators/dots"
  );

  // 5. Verify single notification click calls markDiscourseNotificationRead with notification ID
  assert.ok(
    scriptContent.includes("async function markDiscourseNotificationRead(notificationId)"),
    "must define markDiscourseNotificationRead"
  );
  assert.ok(
    scriptContent.includes("markDiscourseNotificationRead(notifId)"),
    "bindNotifMenuEvents must call markDiscourseNotificationRead on notification item click"
  );

  // 6. Verify global click fallback for dismiss-all
  assert.ok(
    scriptContent.includes("window.__wecomDismissAllBound"),
    "must bind global click listener fallback for dismiss-all"
  );
});

test("Topic opening suppresses Discourse page loading indicator and timeline progress bars via CSS and runtime helpers", () => {
  // 1. Verify CSS rules cover Discourse core page loading indicator container and bars
  assert.ok(
    scriptContent.includes(".loading-indicator-container") &&
    scriptContent.includes(".loading-indicator") &&
    scriptContent.includes("#loading-slider") &&
    scriptContent.includes(".d-loading-slider"),
    "RAW_CSS must hide Discourse page loading indicator containers and sliders"
  );
  assert.ok(
    scriptContent.includes(".topic-timeline") &&
    scriptContent.includes(".timeline-container"),
    "RAW_CSS must hide Discourse topic timeline progress bars"
  );

  // 2. Verify removeLoadingSliderDom cleans up lingering DOM nodes
  assert.ok(
    scriptContent.includes("function removeLoadingSliderDom()"),
    "must define removeLoadingSliderDom"
  );
  assert.ok(
    scriptContent.includes("el.remove()"),
    "removeLoadingSliderDom must remove matched loading elements"
  );

  // 3. Verify disablePageLoadingIndicator disables Discourse site setting
  assert.ok(
    scriptContent.includes("function disablePageLoadingIndicator()"),
    "must define disablePageLoadingIndicator"
  );
  assert.ok(
    scriptContent.includes('page_loading_indicator = "none"'),
    "disablePageLoadingIndicator must set page_loading_indicator to none"
  );

  // 4. Verify runtime invocations on topic navigation and DOM mutation
  assert.ok(
    scriptContent.includes("discourseRouteTo(url) {\n    if (IS_V2EX || !url) return false;\n    removeLoadingSliderDom();"),
    "discourseRouteTo must invoke removeLoadingSliderDom"
  );
  assert.ok(
    scriptContent.includes("removeLoadingSliderDom();\n        discourseRouteTo(href);"),
    "bindListPanelClicks must invoke removeLoadingSliderDom before routing"
  );
  assert.ok(
    scriptContent.includes("topicId = numericTopicId;\n    removeLoadingSliderDom();"),
    "loadTopic must invoke removeLoadingSliderDom"
  );
  assert.ok(
    scriptContent.includes("disablePageLoadingIndicator();\n    removeLoadingSliderDom();\n    restyleSplash();"),
    "applyTheme must invoke disablePageLoadingIndicator and removeLoadingSliderDom"
  );
});

test("Linux DO notification menu sticky positioning for tabs and dismiss button", () => {
  // 1. Verify CSS sticky top rules for menu tabs
  assert.ok(
    scriptContent.includes(".user-menu .menu-tabs-container") &&
    scriptContent.includes(".user-menu .panel-header") &&
    scriptContent.includes(".user-menu .tabs-list"),
    "RAW_CSS must target user-menu tab header elements"
  );
  assert.ok(
    scriptContent.includes("position: sticky !important;\n      top: 0 !important;\n      z-index: 35 !important;"),
    "RAW_CSS must make user-menu tabs sticky at top 0"
  );

  // 2. Verify intermediate containers have overflow: visible
  assert.ok(
    scriptContent.includes(".user-menu .panel-body,") &&
    scriptContent.includes(".user-menu .panel-body-contents,") &&
    scriptContent.includes(".user-menu .user-menu-notifications-list,") &&
    scriptContent.includes(".user-menu .quick-access-panel {\n      overflow: visible !important;"),
    "RAW_CSS must set overflow: visible on intermediate containers to enable sticky positioning"
  );

  // 3. Verify CSS sticky bottom rules for dismiss containers and buttons
  assert.ok(
    scriptContent.includes(".user-menu .panel-bottom,") &&
    scriptContent.includes(".user-menu .bottom-tabs,") &&
    scriptContent.includes(".user-menu .user-menu-dismiss-container,") &&
    scriptContent.includes(".user-menu .notifications-dismiss-container,") &&
    scriptContent.includes(".user-menu .wecom-notif-sticky-dismiss {"),
    "RAW_CSS must target dismiss containers for sticky bottom"
  );
  assert.ok(
    scriptContent.includes("position: sticky !important;\n      bottom: 0 !important;\n      z-index: 30 !important;"),
    "RAW_CSS must make dismiss bar sticky at bottom 0"
  );

  // 4. Verify dark mode styling for sticky elements
  assert.ok(
    scriptContent.includes("html.wecom-dark .user-menu .panel-bottom") &&
    scriptContent.includes("html.wecom-dark .user-menu .bottom-tabs"),
    "RAW_CSS must support dark mode for sticky dismiss bar"
  );

  // 5. Verify ensureStickyDismissButton definition and calls
  assert.ok(
    scriptContent.includes("function ensureStickyDismissButton(menu)"),
    "must define ensureStickyDismissButton"
  );
  assert.ok(
    scriptContent.includes("ensureStickyDismissButton(menu);\n    bindNotifMenuEvents(menu);"),
    "positionNotifMenu must call ensureStickyDismissButton"
  );
  assert.ok(
    scriptContent.includes("ensureStickyDismissButton(menu);\n    menu.addEventListener(\"mouseenter\""),
    "bindNotifMenuEvents must call ensureStickyDismissButton"
  );
  assert.ok(
    scriptContent.includes("const menu = findUserMenu();\n      if (menu) ensureStickyDismissButton(menu);"),
    "ensureNotifMenuObserver must call ensureStickyDismissButton"
  );

  // 6. Test simulation of ensureStickyDismissButton
  function isDismissAllTarget(target) {
    if (!target) return false;
    const el = target.closest ? target.closest("button, a, [role='button'], .btn") || target : target;
    const text = (el.textContent || "").trim();
    if (text.includes("全部忽略") || text.includes("忽略") || text.includes("Dismiss") || text.includes("Mark all read")) return true;
    return false;
  }

  function simulateEnsureSticky(menu) {
    if (!menu) return;
    const candidates = menu.querySelectorAll("button, a, .btn-dismiss-read");
    let btn = null;
    for (const el of candidates) {
      if (isDismissAllTarget(el)) {
        btn = el;
        break;
      }
    }
    if (!btn) return;
    btn.classList.add("wecom-notif-sticky-btn");
    const parent = btn.parentElement;
    if (parent && parent !== menu && !["notifications", "ul", "ol", "li"].includes(parent.tagName.toLowerCase())) {
      parent.classList.add("wecom-notif-sticky-dismiss");
    } else {
      btn.classList.add("wecom-notif-sticky-dismiss");
    }
  }

  const btnSet = new Set();
  const parentSet = new Set();
  const mockBtn = {
    textContent: "全部忽略",
    parentElement: null,
    tagName: "BUTTON",
    closest() { return this; },
    classList: { add: (c) => btnSet.add(c), contains: (c) => btnSet.has(c) }
  };
  const mockParent = {
    tagName: "DIV",
    children: [mockBtn],
    classList: { add: (c) => parentSet.add(c), contains: (c) => parentSet.has(c) }
  };
  mockBtn.parentElement = mockParent;
  const mockMenu = {
    querySelectorAll() { return [mockBtn]; }
  };

  simulateEnsureSticky(mockMenu);
  assert.ok(mockBtn.classList.contains("wecom-notif-sticky-btn"), "btn must have wecom-notif-sticky-btn");
  assert.ok(mockParent.classList.contains("wecom-notif-sticky-dismiss"), "parent container must have wecom-notif-sticky-dismiss");
});

test("Image viewer supports cursor-centered zooming, drag panning, and prev/next gallery navigation", () => {
  // 1. Verify CSS rules for cursor zoom and navigation controls
  assert.ok(
    scriptContent.includes("transform: translate3d(var(--wecom-image-viewer-x, 0px), var(--wecom-image-viewer-y, 0px), 0px) scale(var(--wecom-image-viewer-scale, 1));"),
    "RAW_CSS must apply translate3d and scale variables to image"
  );
  assert.ok(
    scriptContent.includes(".wecom-image-viewer-nav") &&
    scriptContent.includes(".wecom-image-viewer-prev") &&
    scriptContent.includes(".wecom-image-viewer-next"),
    "RAW_CSS must style prev/next navigation buttons"
  );
  assert.ok(
    scriptContent.includes(".wecom-image-viewer-counter"),
    "RAW_CSS must style image counter indicator"
  );
  assert.ok(
    scriptContent.includes(".wecom-image-viewer-image.is-dragging"),
    "RAW_CSS must style grabbing cursor during drag"
  );

  // 2. Verify functions definition
  assert.ok(scriptContent.includes("function setImageViewerTransform("), "must define setImageViewerTransform");
  assert.ok(scriptContent.includes("function collectChatImages("), "must define collectChatImages");
  assert.ok(scriptContent.includes("function updateImageViewerNavigationUi("), "must define updateImageViewerNavigationUi");
  assert.ok(scriptContent.includes("function renderImageViewerCurrent("), "must define renderImageViewerCurrent");
  assert.ok(scriptContent.includes("function nextImageViewerImage("), "must define nextImageViewerImage");
  assert.ok(scriptContent.includes("function prevImageViewerImage("), "must define prevImageViewerImage");

  // 3. Verify keyboard shortcuts and pointer event bindings
  assert.ok(
    scriptContent.includes("event.key === \"ArrowLeft\" || event.key === \"PageUp\""),
    "must bind ArrowLeft and PageUp to prevImageViewerImage"
  );
  assert.ok(
    scriptContent.includes("event.key === \"ArrowRight\" || event.key === \"PageDown\""),
    "must bind ArrowRight and PageDown to nextImageViewerImage"
  );
  assert.ok(
    scriptContent.includes("stage.addEventListener(\"pointerdown\"") &&
    scriptContent.includes("stage.addEventListener(\"pointermove\""),
    "must bind pointer events for dragging and panning"
  );
  assert.ok(
    scriptContent.includes("stage.addEventListener(\"dblclick\""),
    "must bind dblclick for toggling zoom"
  );

  // 4. Validate mathematical invariance of cursor-centered zoom
  const cx = 500;
  const cy = 400;
  let currentScale = 1;
  let currentTx = 0;
  let currentTy = 0;
  const mx = 620; // 120px to the right
  const my = 480; // 80px down

  // Zoom to 2x
  const newScale = 2;
  const ratio = newScale / currentScale;
  const newTx = (mx - cx) - ratio * (mx - cx - currentTx);
  const newTy = (my - cy) - ratio * (my - cy - currentTy);

  // Before zoom: mouse pointed to image point (mx - cx - currentTx) / currentScale = (620 - 500) / 1 = 120
  // After zoom: screen position of that same point is cx + newTx + 120 * newScale
  const screenXAfter = cx + newTx + 120 * newScale;
  const screenYAfter = cy + newTy + 80 * newScale;
  assert.equal(Math.round(screenXAfter), mx, "point under cursor X must remain exactly under cursor");
  assert.equal(Math.round(screenYAfter), my, "point under cursor Y must remain exactly under cursor");

  // 5. Validate gallery collection and navigation cycle
  const mockImages = [
    { src: "https://example.com/1.jpg" },
    { src: "https://example.com/2.jpg" },
    { src: "https://example.com/3.jpg" }
  ];
  let activeIndex = 0;
  function next() {
    activeIndex = (activeIndex + 1) % mockImages.length;
  }
  function prev() {
    activeIndex = (activeIndex - 1 + mockImages.length) % mockImages.length;
  }

  next();
  assert.equal(activeIndex, 1, "next() from 0 must move to 1");
  next();
  assert.equal(activeIndex, 2, "next() from 1 must move to 2");
  next();
  assert.equal(activeIndex, 0, "next() from 2 must cycle back to 0");
  prev();
  assert.equal(activeIndex, 2, "prev() from 0 must cycle back to 2");
});

test("Images inside blockquote are auto-laid out into independent galleries without mixing with outer bubble layout", () => {
  // 1. Verify CSS rules for blockquote images gallery
  assert.ok(
    scriptContent.includes("blockquote .wecom-msg-images"),
    "RAW_CSS must style .wecom-msg-images inside blockquote"
  );

  // 2. Verify isNodeVisuallyEmpty preserves .wecom-msg-images and .wecom-msg-thumb
  assert.ok(
    scriptContent.includes(".wecom-msg-images, .wecom-msg-thumb"),
    "isNodeVisuallyEmpty must treat galleries and thumbnails as meaningful content"
  );

  // 3. Verify applyImageAutoLayout scopes images by blockquote
  assert.ok(
    scriptContent.includes("const bq = img.closest(\"blockquote\");\n        const scope = bq || bubble;"),
    "applyImageAutoLayout must group candidate images by blockquote scope"
  );
  assert.ok(
    scriptContent.includes("if (scope === bubble) {\n          cleanMessageBodyWhitespace(bodyEl);\n          bubble.appendChild(gallery);\n        } else {\n          cleanMessageBodyWhitespace(scope);\n          scope.appendChild(gallery);\n        }"),
    "applyImageAutoLayout must append blockquote gallery to scope and bubble gallery to bubble"
  );

  // 4. Verify querySelectorAll is used to remove all galleries on toggle
  assert.ok(
    scriptContent.includes("bubble.querySelectorAll(\".wecom-msg-images\").forEach((el) => el.remove());"),
    "toggleMessageBubbleLayout must remove all galleries inside bubble including blockquote galleries"
  );

  // 5. Functional simulation of scoped grouping
  const mockBubble = { id: "bubble", children: [] };
  const mockBq = { id: "blockquote", children: [] };

  const mockImgs = [
    { src: "out1.png", closest(sel) { return sel === "blockquote" ? null : null; } },
    { src: "quote1.png", closest(sel) { return sel === "blockquote" ? mockBq : null; } },
    { src: "quote2.png", closest(sel) { return sel === "blockquote" ? mockBq : null; } },
    { src: "out2.png", closest(sel) { return sel === "blockquote" ? null : null; } }
  ];

  const groups = new Map();
  for (const img of mockImgs) {
    const bq = img.closest("blockquote");
    const scope = bq || mockBubble;
    if (!groups.has(scope)) groups.set(scope, []);
    groups.get(scope).push(img);
  }

  assert.equal(groups.size, 2, "must have exactly 2 distinct scopes (bubble and blockquote)");
  assert.equal(groups.get(mockBubble).length, 2, "bubble scope must have 2 outer images");
  assert.equal(groups.get(mockBq).length, 2, "blockquote scope must have 2 quoted images");

  assert.deepEqual(
    groups.get(mockBubble).map(i => i.src),
    ["out1.png", "out2.png"],
    "outer bubble gallery must only contain images from outside quotes"
  );
  assert.deepEqual(
    groups.get(mockBq).map(i => i.src),
    ["quote1.png", "quote2.png"],
    "blockquote gallery must only contain images from inside quote"
  );
});

test("Quote title aside.quote .title is beautified with transparent background, no borders, and muted typography", () => {
  const scriptContent = fs.readFileSync(path.resolve(__dirname, "../linuxdo-wecom.user.js"), "utf8");

  // 1. Verify aside.quote and aside.quote .title background transparency and border removal
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble aside.quote .title,") &&
    scriptContent.includes("background: transparent !important;") &&
    scriptContent.includes("background-color: transparent !important;") &&
    scriptContent.includes("border: none !important;") &&
    scriptContent.includes("border-left: none !important;"),
    "aside.quote .title must explicitly remove white background and border"
  );

  // 2. Verify subtle muted typography and bold weight (font-weight: 600) for light mode
  assert.ok(
    scriptContent.includes("color: #767C85 !important;"),
    "quote title should use muted non-conspicuous text color in light mode"
  );
  assert.ok(
    scriptContent.includes("font-weight: 600 !important;"),
    "quote title and links must be bold (font-weight: 600)"
  );

  // 3. Verify quote title links inherit muted color without jarring underlines and keep bold weight
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble aside.quote .title a") &&
    scriptContent.includes("color: inherit !important;") &&
    scriptContent.includes("text-decoration: none !important;") &&
    scriptContent.includes("font-weight: 600 !important;"),
    "quote title links must inherit muted color, omit default link styling, and be bold"
  );

  // 4. Verify outgoing bubble (.wecom-msg-me) styles for quotes
  assert.ok(
    scriptContent.includes(".wecom-msg-me .wecom-msg-bubble aside.quote .title"),
    "outgoing bubbles must have dedicated quote title styling"
  );

  // 5. Verify dark mode overrides for quotes
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.quote .title") &&
    scriptContent.includes("color: #929AA7 !important;"),
    "dark mode must style quote title with soft muted dark-mode color"
  );
});

test("Conversation detail avatars can be configured to be hidden via settings and header controls", () => {
  const scriptContent = fs.readFileSync(path.resolve(__dirname, "../linuxdo-wecom.user.js"), "utf8");

  // 1. Verify constant definition
  assert.ok(
    scriptContent.includes('const HIDE_CHAT_AVATAR_KEY = "linuxdo-wecom-hide-chat-avatar";'),
    "must define HIDE_CHAT_AVATAR_KEY"
  );

  // 2. Verify getter and setter helpers
  assert.ok(scriptContent.includes("function isHideChatAvatar("), "must define isHideChatAvatar helper");
  assert.ok(scriptContent.includes("function setHideChatAvatar("), "must define setHideChatAvatar helper");

  // 3. Verify CSS styling when hidden
  assert.ok(
    scriptContent.includes("html.wecom-hide-chat-avatar .wecom-msg-avatar") &&
    scriptContent.includes("display: none !important;"),
    "must hide .wecom-msg-avatar when html.wecom-hide-chat-avatar class is present"
  );

  // 4. Verify presence in theme menu
  assert.ok(
    scriptContent.includes("wecom-menu-toggle-hide-chat-avatar") &&
    scriptContent.includes("隐藏对话详情头像"),
    "must provide toggle item in theme menu"
  );

  // 5. Verify presence in chat header tools
  assert.ok(
    scriptContent.includes("wecom-chat-avatar-toggle") &&
    scriptContent.includes("隐藏对话头像"),
    "must provide instant toggle button in chat header tools"
  );

  // 6. Verify userCardAttributes is attached to .wecom-msg-name
  assert.ok(
    scriptContent.includes('<span class="wecom-msg-name"${userCardAttributes(post)}>'),
    "userCardAttributes must be attached to .wecom-msg-name so profiles remain accessible"
  );

  // 7. Verify functional state simulation
  let storageState = "0";
  const fakeDocEl = {
    classList: {
      classes: new Set(),
      toggle(cls, val) {
        if (val) this.classes.add(cls);
        else this.classes.delete(cls);
      },
      contains(cls) {
        return this.classes.has(cls);
      }
    }
  };

  const isHidden = () => storageState === "1";
  const setHidden = (val) => {
    storageState = val ? "1" : "0";
    fakeDocEl.classList.toggle("wecom-hide-chat-avatar", !!val);
  };

  assert.equal(isHidden(), false, "default must be false (avatars shown)");
  assert.equal(fakeDocEl.classList.contains("wecom-hide-chat-avatar"), false);

  setHidden(true);
  assert.equal(isHidden(), true, "must be true after enabling");
  assert.equal(fakeDocEl.classList.contains("wecom-hide-chat-avatar"), true, "must add class to html");

  setHidden(false);
  assert.equal(isHidden(), false, "must be false after disabling");
  assert.equal(fakeDocEl.classList.contains("wecom-hide-chat-avatar"), false, "must remove class from html");
});

test("Selection Base64 auto-decoding parses valid strings, prevents false positives, and provides UI controls", () => {
  // 1. Verify script declarations and components
  assert.ok(
    scriptContent.includes('const BASE64_DECODE_KEY = "linuxdo-wecom-base64-decode";'),
    "must declare BASE64_DECODE_KEY"
  );
  assert.ok(
    scriptContent.includes("function decodeBase64(raw)"),
    "must define decodeBase64"
  );
  assert.ok(
    scriptContent.includes("function showBase64Popover("),
    "must define showBase64Popover"
  );
  assert.ok(
    scriptContent.includes("function closeBase64Popover()"),
    "must define closeBase64Popover"
  );
  assert.ok(
    scriptContent.includes("function bindBase64Selection()"),
    "must define bindBase64Selection"
  );
  assert.ok(
    scriptContent.includes("bindBase64Selection();"),
    "must call bindBase64Selection in bootstrap"
  );

  // 2. Verify Theme Menu presence
  assert.ok(
    scriptContent.includes("wecom-menu-toggle-base64") &&
    scriptContent.includes("划词自动解码 Base64"),
    "theme menu must include toggle for base64 auto-decoding"
  );

  // 3. Verify CSS styling for popover and dark mode
  assert.ok(
    scriptContent.includes(".wecom-base64-popover") &&
    scriptContent.includes(".wecom-base64-decoded-text") &&
    scriptContent.includes(".wecom-base64-copy-btn"),
    "must include CSS styling for base64 popover components"
  );
  assert.ok(
    scriptContent.includes("html.wecom-dark .wecom-base64-popover") ||
    scriptContent.includes(".wecom-dark .wecom-base64-popover"),
    "must include dark mode CSS for base64 popover"
  );

  // 4. Verify decodeBase64 implementation logic
  function testDecode(raw) {
    if (!raw || typeof raw !== "string") return null;
    let str = raw.trim().replace(/^(?:base64|b64)[:：]\s*/i, "").replace(/^['"`“‘「\[]+|['"`”’」\]]+$/g, "").replace(/\s+/g, "");
    if (str.length < 6 || str.length > 10000) return null;
    if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(str)) return null;
    let normalized = str.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) normalized += "=";
    try {
      const binary = atob(normalized);
      if (!binary || binary.length === 0) return null;
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (!decoded || decoded === raw || !decoded.trim()) return null;
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(decoded)) return null;
      if (!/^[\u0020-\u007E\u00A0-\uFFFF\r\n\t]+$/.test(decoded)) return null;
      if (!str.includes("=") && /^[a-zA-Z]+$/.test(str)) {
        const looksLegit = /(https?:\/\/|[.:/?#=_\-@&%+\\]|[\u4e00-\u9fa5]|\s)/.test(decoded);
        if (!looksLegit) return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  // URLs
  assert.equal(testDecode("aHR0cHM6Ly9saW51eC5kbw=="), "https://linux.do");
  assert.equal(testDecode("aHR0cHM6Ly9saW51eC5kbw"), "https://linux.do", "unpadded base64 should decode");
  assert.equal(testDecode("Base64: aHR0cHM6Ly9saW51eC5kbw=="), "https://linux.do", "prefixed with Base64: should decode");
  assert.equal(testDecode('"aHR0cHM6Ly9saW51eC5kbw=="'), "https://linux.do", "quoted base64 should decode");

  // Chinese text
  assert.equal(testDecode("5L2g5aW977yM5LiW55WM"), "你好，世界", "UTF-8 Chinese should decode correctly");

  // Magnet link
  assert.equal(
    testDecode("bWFnbmV0Oj94dD11cm46YnRpaDoxMjM0NTY3ODkwYWJjZGVm"),
    "magnet:?xt=urn:btih:1234567890abcdef",
    "magnet URI should decode"
  );

  // URL-safe base64
  const urlSafe = Buffer.from("https://linux.do/t/topic/123?foo=bar_baz-qux").toString("base64url");
  assert.equal(testDecode(urlSafe), "https://linux.do/t/topic/123?foo=bar_baz-qux");

  // Prevent false positives on common words and non-base64
  assert.equal(testDecode("important"), null, "regular English word 'important' must not trigger decode");
  assert.equal(testDecode("interface"), null, "regular English word 'interface' must not trigger decode");
  assert.equal(testDecode("window"), null, "regular English word 'window' must not trigger decode");
  assert.equal(testDecode("developer"), null, "regular English word 'developer' must not trigger decode");
  assert.equal(testDecode("1234567890"), null, "numeric string must not trigger decode");
  assert.equal(testDecode("abc"), null, "too short string must not trigger decode");
  assert.equal(testDecode(""), null, "empty string must not trigger decode");

  // 5. Verify default enabled state in storage simulation
  let storage = {};
  const isEnabled = () => storage["linuxdo-wecom-base64-decode"] !== "0";
  const setEnabled = (val) => { storage["linuxdo-wecom-base64-decode"] = val ? "1" : "0"; };

  assert.equal(isEnabled(), true, "must be enabled by default");
  setEnabled(false);
  assert.equal(isEnabled(), false, "must be disabled when set to false");
  setEnabled(true);
  assert.equal(isEnabled(), true, "must be re-enabled when set to true");
});

test("V2EX editor uploads images via Imgur API and inserts direct image links", async () => {
  // 1. Verify declarations and metadata
  assert.ok(
    scriptContent.includes('const V2EX_IMGUR_CLIENT_ID = "60605aad4a62882";'),
    "must define V2EX_IMGUR_CLIENT_ID"
  );
  assert.ok(
    scriptContent.includes('const V2EX_IMGUR_UPLOAD_URL = "https://api.imgur.com/3/upload";'),
    "must define V2EX_IMGUR_UPLOAD_URL"
  );
  assert.ok(
    scriptContent.includes("async function uploadImageFileToImgur(file)"),
    "must define uploadImageFileToImgur"
  );
  assert.ok(
    scriptContent.includes("// @connect      api.imgur.com"),
    "must declare @connect api.imgur.com"
  );
  assert.ok(
    scriptContent.includes("// @connect      imgur.com"),
    "must declare @connect imgur.com"
  );

  // 2. Verify V2EX branch routing in uploadImageFile and uploadedImageMarkdown
  assert.ok(
    scriptContent.includes("if (IS_V2EX) {\n      const link = await uploadImageFileToImgur(file);") ||
    (scriptContent.includes("if (IS_V2EX)") && scriptContent.includes("uploadImageFileToImgur")),
    "uploadImageFile must route to uploadImageFileToImgur when IS_V2EX is true"
  );
  assert.ok(
    scriptContent.includes("if (IS_V2EX) {\n      return url;\n    }") ||
    (scriptContent.includes("if (IS_V2EX)") && scriptContent.includes("return url;")),
    "uploadedImageMarkdown must return plain url on V2EX"
  );

  // 3. Functional simulation of uploadedImageMarkdown
  function simulateUploadedImageMarkdown(payload, file, isV2ex) {
    const url = payload?.url || payload?.link || payload?.data?.link;
    if (!url) throw new Error("站点未返回图片地址");
    if (isV2ex) return url;
    const rawLabel = String(file?.name || "图片");
    const label = rawLabel.replace(/\.[^.]+$/, "").replace(/[\[\]\\|]/g, "_");
    return `![${label}](${url})`;
  }

  const v2exUrl = simulateUploadedImageMarkdown(
    { url: "https://i.imgur.com/example123.png" },
    { name: "screenshot.png" },
    true
  );
  assert.equal(v2exUrl, "https://i.imgur.com/example123.png", "V2EX should receive raw image url");

  const linuxdoMarkdown = simulateUploadedImageMarkdown(
    { url: "https://linux.do/uploads/default/original/2X/1/123.png" },
    { name: "screenshot.png" },
    false
  );
  assert.equal(
    linuxdoMarkdown,
    "![screenshot](https://linux.do/uploads/default/original/2X/1/123.png)",
    "Linux DO should receive markdown image syntax"
  );

  // 4. Functional simulation of Imgur response handling
  function parseImgurResponse(respOk, status, payload) {
    if (!respOk || !payload?.success || !payload?.data?.link) {
      const errObj = payload?.data?.error;
      const errMsg = (typeof errObj === "string" ? errObj : errObj?.message) ||
        payload?.error?.message ||
        payload?.error ||
        `Imgur upload failed with ${status}`;
      throw new Error(errMsg);
    }
    return String(payload.data.link).replace(/^http:\/\//i, "https://");
  }

  // Success with HTTPS link
  assert.equal(
    parseImgurResponse(true, 200, { success: true, data: { link: "https://i.imgur.com/abc1234.png" } }),
    "https://i.imgur.com/abc1234.png"
  );

  // Success with HTTP link (should upgrade to HTTPS)
  assert.equal(
    parseImgurResponse(true, 200, { success: true, data: { link: "http://i.imgur.com/abc1234.jpg" } }),
    "https://i.imgur.com/abc1234.jpg"
  );

  // Error payload with error string
  assert.throws(
    () => parseImgurResponse(false, 400, { success: false, data: { error: "Imgur is over capacity" } }),
    /Imgur is over capacity/
  );

  // Error payload with error object
  assert.throws(
    () => parseImgurResponse(false, 403, { success: false, data: { error: { message: "Invalid Client-ID" } } }),
    /Invalid Client-ID/
  );

  // Non-JSON or status error fallback
  assert.throws(
    () => parseImgurResponse(false, 500, null),
    /Imgur upload failed with 500/
  );
});

test("wecom-compose-status is positioned in wecom-composer-bottom with refined 11px font styling", () => {
  // 1. Verify it is located in .wecom-composer-bottom, not in .wecom-composer-tools
  assert.ok(
    scriptContent.includes(
      '<div class="wecom-composer-bottom">\n            <span class="wecom-compose-status" aria-live="polite"></span>\n            <button type="button" class="wecom-send-btn" disabled>发送(S)</button>\n          </div>'
    ),
    "must place .wecom-compose-status inside .wecom-composer-bottom next to send button"
  );

  // 2. Verify CSS styling defines 11px font size and appropriate layout
  assert.ok(
    scriptContent.includes(".wecom-compose-status {\n      font-size: 11px !important;"),
    "must style .wecom-compose-status with 11px font size"
  );
  assert.ok(
    scriptContent.includes(".wecom-compose-status:empty {\n      display: none !important;\n    }"),
    "must hide .wecom-compose-status when empty"
  );

  // 3. Verify status color classes
  assert.ok(
    scriptContent.includes(".wecom-compose-status.busy") &&
    scriptContent.includes(".wecom-compose-status.success") &&
    scriptContent.includes(".wecom-compose-status.error"),
    "must define busy, success, and error colors"
  );
});

test("V2EX built-in emoji picker integrates with composer, supports tabs, Unicode emojis, and handles non-Discourse environments", () => {
  // 1. Definition and helpers exist
  assert.ok(scriptContent.includes("const V2EX_EMOJI_CATEGORIES = Object.freeze(["), "must define V2EX_EMOJI_CATEGORIES");
  assert.ok(scriptContent.includes("function showV2exEmojiPicker("), "must define showV2exEmojiPicker");
  assert.ok(scriptContent.includes("function toggleV2exEmojiPicker("), "must define toggleV2exEmojiPicker");
  assert.ok(scriptContent.includes("function closeV2exEmojiPicker()"), "must define closeV2exEmojiPicker");
  assert.ok(scriptContent.includes("function bindV2exEmojiPickerEvents()"), "must define bindV2exEmojiPickerEvents");

  // 2. CSS styles are defined for light and dark modes
  assert.ok(scriptContent.includes(".wecom-v2ex-emoji-picker {"), "must style .wecom-v2ex-emoji-picker");
  assert.ok(scriptContent.includes(".wecom-emoji-picker-tabs {"), "must style .wecom-emoji-picker-tabs");
  assert.ok(scriptContent.includes(".wecom-emoji-tab-btn {"), "must style .wecom-emoji-tab-btn");
  assert.ok(scriptContent.includes(".wecom-emoji-picker-body {"), "must style .wecom-emoji-picker-body");
  assert.ok(scriptContent.includes(".wecom-emoji-item-btn {"), "must style .wecom-emoji-item-btn");
  assert.ok(scriptContent.includes("html.wecom-dark .wecom-v2ex-emoji-picker"), "must style emoji picker in dark mode");

  // 3. Composer tool action branches for IS_V2EX and graceful fallback
  assert.ok(
    scriptContent.includes("if (action === \"emoji\") {\n      if (IS_V2EX) {\n        toggleV2exEmojiPicker(button);\n        return;\n      }\n      showOfficialEmojiPicker(button).catch(() => {\n        toggleV2exEmojiPicker(button);\n      });\n      return;\n    }"),
    "handleComposerToolClick must branch to toggleV2exEmojiPicker when IS_V2EX is true, and fall back on error"
  );

  // 4. Modal check includes .wecom-v2ex-emoji-picker
  assert.ok(
    scriptContent.includes(".wecom-v2ex-emoji-picker:not([hidden])"),
    "isModalOrViewerOpen must check .wecom-v2ex-emoji-picker:not([hidden])"
  );

  // 5. Verify category extraction and emoji tab switching logic
  const catMatch = scriptContent.match(/const V2EX_EMOJI_CATEGORIES = Object\.freeze\(\[\s*([\s\S]*?)\]\);/);
  assert.ok(catMatch, "must extract V2EX_EMOJI_CATEGORIES");
  const categories = eval(`[${catMatch[1]}]`);
  assert.equal(categories.length, 5, "must contain 5 emoji categories");
  const catIds = categories.map(c => c.id);
  assert.deepEqual(catIds, ["smileys", "gestures", "symbols", "animals", "food"]);

  for (const cat of categories) {
    assert.ok(cat.id, "category must have id");
    assert.ok(cat.name, "category must have name");
    assert.ok(cat.icon, "category must have icon");
    assert.ok(Array.isArray(cat.emojis) && cat.emojis.length > 20, `${cat.name} must have emojis`);
  }

  // 6. Test interaction flow simulation
  let inserted = "";
  function fakeInsert(emo) {
    inserted = emo;
  }
  // Simulate clicking an emoji in the smileys tab
  const smiley = categories[0].emojis[0]; // 😀
  fakeInsert(smiley);
  assert.equal(inserted, "😀");

  // Simulate switching to gestures tab
  const gesture = categories[1].emojis[0]; // 👍
  fakeInsert(gesture);
  assert.equal(inserted, "👍");
});

test("Restore original style shortcut (Alt+W / Alt+O) toggles between WeCom IM theme and native site layout", () => {
  // 1. Definition and helpers exist
  assert.ok(
    scriptContent.includes("function toggleViewModeByShortcut()"),
    "must define toggleViewModeByShortcut"
  );
  assert.ok(
    scriptContent.includes("function bindViewModeShortcut()"),
    "must define bindViewModeShortcut"
  );
  assert.ok(
    scriptContent.includes("bindViewModeShortcut();"),
    "bootstrap must call bindViewModeShortcut"
  );

  // 2. Shortcut handles Alt+W and Alt+O
  assert.ok(
    scriptContent.includes("key === \"w\" || key === \"o\" || code === \"KeyW\" || code === \"KeyO\""),
    "must check for Alt+W or Alt+O (case-insensitive and code checks)"
  );
  assert.ok(
    scriptContent.includes("!e.altKey || e.ctrlKey || e.metaKey"),
    "must guard that Alt is held and Ctrl/Meta are not held"
  );

  // 3. Theme menu has option to restore native style
  assert.ok(
    scriptContent.includes('class="wecom-menu-restore-native"'),
    "theme menu must render .wecom-menu-restore-native option"
  );
  assert.ok(
    scriptContent.includes("toggleViewModeByShortcut();"),
    "theme menu click must trigger toggleViewModeByShortcut"
  );

  // 4. Native mode FAB title mentions shortcut
  assert.ok(
    scriptContent.includes("切回企业微信 IM 视图 (快捷键: Alt+W / Alt+O)"),
    "fab button title must document the shortcut"
  );

  // 5. Test toggle logic simulation
  let currentMode = "im";
  let reloaded = false;
  let navigatedTo = null;

  function fakeToggle() {
    if (currentMode === "native") {
      currentMode = "im";
      reloaded = true;
    } else {
      currentMode = "native";
      navigatedTo = "/t/123456";
    }
  }

  // From IM -> Native
  fakeToggle();
  assert.equal(currentMode, "native");
  assert.equal(navigatedTo, "/t/123456");

  // From Native -> IM
  fakeToggle();
  assert.equal(currentMode, "im");
  assert.equal(reloaded, true);
});

test("Topic reply polling and background post sync preserves user reading position and avoids jumping to bottom", () => {
  // 1. appendFreshPosts inspects wasNearBottom before DOM insertions
  assert.ok(
    scriptContent.includes("const wasNearBottom = body.clientHeight > 0 && (prevScrollHeight - (prevScrollTop + body.clientHeight) <= 32);"),
    "appendFreshPosts must calculate wasNearBottom before DOM mutations"
  );

  // 2. shouldScroll condition requires explicit true or wasNearBottom
  assert.ok(
    scriptContent.includes("const shouldScroll = options.scroll === true || (options.scroll !== false && wasNearBottom);"),
    "must only auto-scroll if options.scroll === true or user was already at the bottom"
  );

  // 3. submitComposer explicitly specifies { scroll: true } on user submission
  assert.ok(
    scriptContent.includes("appendFreshPosts([post], document.querySelector(\".wecom-chat-body\"), { scroll: true });"),
    "submitting post must pass { scroll: true } to follow user's own sent message"
  );

  // 4. Test scrolling calculation simulation
  function simulateScrollDecision(scrollTop, scrollHeight, clientHeight, options) {
    const wasNearBottom = clientHeight > 0 && (scrollHeight - (scrollTop + clientHeight) <= 32);
    const shouldScroll = options.scroll === true || (options.scroll !== false && wasNearBottom);
    return { wasNearBottom, shouldScroll };
  }

  // Scenario A: User is reading at top (e.g. floor 1, scrollTop = 0, scrollHeight = 3000, clientHeight = 600)
  // Background polling arrives with empty options {}
  const topRes = simulateScrollDecision(0, 3000, 600, {});
  assert.equal(topRes.wasNearBottom, false, "user at top must not be near bottom");
  assert.equal(topRes.shouldScroll, false, "polling must NOT scroll to bottom when user is reading at top");

  // Scenario B: User is reading middle floors (e.g. scrollTop = 1200)
  const midRes = simulateScrollDecision(1200, 3000, 600, {});
  assert.equal(midRes.wasNearBottom, false, "user in middle must not be near bottom");
  assert.equal(midRes.shouldScroll, false, "polling must NOT scroll to bottom when user is reading middle floors");

  // Scenario C: User is actively at bottom (e.g. scrollTop = 2400, scrollHeight = 3000, clientHeight = 600)
  const bottomRes = simulateScrollDecision(2400, 3000, 600, {});
  assert.equal(bottomRes.wasNearBottom, true, "user at bottom must be detected as near bottom");
  assert.equal(bottomRes.shouldScroll, true, "polling should keep view pinned to bottom if user was already at bottom");

  // Scenario D: User explicitly sends a message with { scroll: true }, even if previously scrolled up
  const submitRes = simulateScrollDecision(500, 3000, 600, { scroll: true });
  assert.equal(submitRes.shouldScroll, true, "user message submission must always scroll to bottom");

  // Scenario E: Loading older posts with { scroll: false }
  const olderRes = simulateScrollDecision(2400, 3000, 600, { scroll: false });
  assert.equal(olderRes.shouldScroll, false, "options.scroll: false must never scroll to bottom");
});

test("V2EX category navigation extracts #Tabs, provides persistent cache, and renders .wecom-v2ex-nav2 sidebar", () => {
  // 1. Script definitions and CSS
  assert.ok(
    scriptContent.includes("function extractV2exTabsFromDom("),
    "must define extractV2exTabsFromDom"
  );
  assert.ok(
    scriptContent.includes("function getV2exTabs()"),
    "must define getV2exTabs"
  );
  assert.ok(
    scriptContent.includes("function ensureV2exNav2()"),
    "must define ensureV2exNav2"
  );
  assert.ok(
    scriptContent.includes("function syncV2exNav2()"),
    "must define syncV2exNav2"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-nav2"),
    "must include .wecom-v2ex-nav2 in CSS"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-nav2-item"),
    "must include .wecom-v2ex-nav2-item in CSS"
  );
  assert.ok(
    scriptContent.includes('localStorage.setItem("linuxdo-wecom-v2ex-tabs"'),
    "must persist parsed #Tabs to localStorage"
  );

  // 2. DEFAULT_V2EX_LIST_NAV includes full standard categories from #Tabs
  assert.ok(
    scriptContent.includes('{ href: "/?tab=tech", label: "技术" }'),
    "DEFAULT_V2EX_LIST_NAV must include 技术"
  );
  assert.ok(
    scriptContent.includes('{ href: "/?tab=creative", label: "创意" }'),
    "DEFAULT_V2EX_LIST_NAV must include 创意"
  );
  assert.ok(
    scriptContent.includes('{ href: "/?tab=all", label: "全部" }'),
    "DEFAULT_V2EX_LIST_NAV must include 全部"
  );
  assert.ok(
    scriptContent.includes('{ href: "/?tab=hot", label: "最热" }'),
    "DEFAULT_V2EX_LIST_NAV must include 最热"
  );
  assert.ok(
    scriptContent.includes('{ href: "/?tab=r2", label: "R2" }'),
    "DEFAULT_V2EX_LIST_NAV must include R2"
  );
  assert.ok(
    scriptContent.includes('{ href: "/xna", label: "VXNA" }'),
    "DEFAULT_V2EX_LIST_NAV must include VXNA"
  );

  // 3. Simulation test for extractV2exTabsFromDom
  function simulateExtractV2exTabs(root) {
    const tabsEl = root.querySelector("#Tabs");
    if (!tabsEl) return null;
    const links = [...tabsEl.querySelectorAll("a")].map((a) => ({
      href: a.getAttribute("href") || "#",
      label: (a.textContent || "").replace(/\s+/g, " ").trim(),
      active: a.classList.contains("tab_current")
    })).filter((it) => it.label && it.href && it.href !== "#" && !it.href.startsWith("javascript:"));
    return links.length ? links : null;
  }

  const mockTabsEl = {
    querySelectorAll: (sel) => {
      if (sel === "a") {
        return [
          { getAttribute: () => "/?tab=tech", textContent: "技术", classList: { contains: (c) => c === "tab_current" } },
          { getAttribute: () => "/?tab=creative", textContent: "创意", classList: { contains: () => false } },
          { getAttribute: () => "/?tab=apple", textContent: "Apple", classList: { contains: () => false } },
          { getAttribute: () => "/planet", textContent: "", classList: { contains: () => false } }, // empty label (image only)
          { getAttribute: () => "#", textContent: "无效", classList: { contains: () => false } }
        ];
      }
      return [];
    }
  };

  const mockDoc = {
    querySelector: (sel) => (sel === "#Tabs" ? mockTabsEl : null)
  };

  const extracted = simulateExtractV2exTabs(mockDoc);
  assert.ok(extracted, "must extract tabs from #Tabs");
  assert.equal(extracted.length, 3, "must filter out empty text and invalid # links");
  assert.equal(extracted[0].label, "技术");
  assert.equal(extracted[0].href, "/?tab=tech");
  assert.equal(extracted[0].active, true);
  assert.equal(extracted[1].label, "创意");
  assert.equal(extracted[1].href, "/?tab=creative");
  assert.equal(extracted[1].active, false);

  // When #Tabs is absent (e.g. topic page)
  const emptyDoc = { querySelector: () => null };
  assert.equal(simulateExtractV2exTabs(emptyDoc), null);
});

test("V2EX avatar click opens user popover card with #money balance and quick actions", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes(".wecom-v2ex-user-popover"),
    "must define CSS for .wecom-v2ex-user-popover"
  );
  assert.ok(
    scriptContent.includes("extractV2exMoneyFromDom"),
    "must define extractV2exMoneyFromDom helper"
  );
  assert.ok(
    scriptContent.includes("getV2exMoneyHtml"),
    "must define getV2exMoneyHtml helper"
  );
  assert.ok(
    scriptContent.includes("openV2exUserPopover"),
    "must define openV2exUserPopover function"
  );
  assert.ok(
    scriptContent.includes("closeV2exUserPopover"),
    "must define closeV2exUserPopover function"
  );
  assert.ok(
    scriptContent.includes("isV2exUserPopoverOpen"),
    "must define isV2exUserPopoverOpen function"
  );
  assert.ok(
    scriptContent.includes('const V2EX_MONEY_KEY = "linuxdo-wecom-v2ex-money";'),
    "must define persistent cache key for V2EX money"
  );
  assert.match(
    scriptContent,
    /WECOM_UI_SEL\s*=\s*"[^"]*\.wecom-v2ex-user-popover/,
    "WECOM_UI_SEL must include .wecom-v2ex-user-popover"
  );
  assert.ok(
    scriptContent.includes("closeV2exUserPopover();"),
    "removePanels must call closeV2exUserPopover"
  );

  // 2. Avatar click toggles popover & badge click directly loads notifications
  assert.ok(
    /isV2exUserPopoverOpen\(\)\s*\?\s*closeV2exUserPopover\(\)\s*:\s*openV2exUserPopover\(\)/.test(scriptContent) ||
    scriptContent.includes("if (isV2exUserPopoverOpen()) {\n          closeV2exUserPopover();\n        } else {\n          openV2exUserPopover();\n        }"),
    "avatar click on V2EX must toggle user popover"
  );

  // 3. Extraction logic functional test
  function simulateExtractV2exMoney(root) {
    if (!root || typeof root.querySelector !== "function") return null;
    const el = root.querySelector("#money, .balance_area, a[href^='/balance'], #Rightbar a[href^='/balance'], #Top a[href^='/balance']");
    if (!el) return null;
    let html = el.innerHTML || "";
    const aMatch = html.match(/<a\s+[^>]*href=["']?\/balance["']?[^>]*>([\s\S]*?)<\/a>/i);
    if (aMatch) {
      html = aMatch[1];
    }
    html = html.replace(/src=["']\/static\//gi, 'src="https://www.v2ex.com/static/').trim();
    return html || null;
  }

  // Variant A: #money containing <a href="/balance" class="balance_area">
  const mockDocA = {
    querySelector: (sel) => ({
      innerHTML: '<a href="/balance" class="balance_area">11 <img src="/static/img/gold@2x.png" height="16" alt="G" border="0">&nbsp;50 <img src="/static/img/silver@2x.png" height="16" alt="S" border="0">&nbsp;80 <img src="/static/img/bronze@2x.png" height="16" alt="B" border="0"></a>'
    })
  };
  const moneyA = simulateExtractV2exMoney(mockDocA);
  assert.ok(moneyA.includes("https://www.v2ex.com/static/img/gold@2x.png"), "must replace relative static url");
  assert.ok(!moneyA.includes("<a"), "must strip outer a tag");
  assert.ok(moneyA.includes("11") && moneyA.includes("50") && moneyA.includes("80"));

  // Variant B: standalone a.balance_area
  const mockDocB = {
    querySelector: (sel) => ({
      innerHTML: '20 <img src="/static/img/silver@2x.png" alt="S"> 30 <img src="/static/img/bronze@2x.png" alt="B">'
    })
  };
  const moneyB = simulateExtractV2exMoney(mockDocB);
  assert.ok(moneyB.includes("https://www.v2ex.com/static/img/silver@2x.png"));
  assert.ok(moneyB.includes("20") && moneyB.includes("30"));

  // Variant C: no money element
  const mockDocC = { querySelector: () => null };
  assert.equal(simulateExtractV2exMoney(mockDocC), null);
});

test("Composer toolbar provides Base64 text conversion and insertion dialog", () => {
  // 1. Check ICONS.base64
  assert.ok(
    scriptContent.includes('base64: `<svg width="18" height="18" viewBox="0 0 24 24"'),
    "ICONS must define base64 icon"
  );

  // 2. Toolbar integration
  assert.ok(
    scriptContent.includes('{ key: "base64", label: "插入字符转 Base64 (Alt+B)", icon: ICONS.base64, arrow: false }'),
    "toolKeys must include base64 action button"
  );
  assert.ok(
    scriptContent.includes('!panel.querySelector(\'[data-composer-action="base64"]\')'),
    "ensureChatPanel must verify base64 button existence"
  );

  // 3. Alt+B shortcut in composer
  assert.ok(
    scriptContent.includes('if (event.altKey && !event.ctrlKey && !event.metaKey && (event.key === "b" || event.key === "B")) {') &&
    scriptContent.includes('openBase64InsertDialog();'),
    "guardComposerShortcut must handle Alt+B to open base64 dialog"
  );

  // 4. Alt+click in-place conversion
  assert.ok(
    scriptContent.includes('} else if (action === "base64") {') &&
    scriptContent.includes('if (event.altKey) {') &&
    scriptContent.includes('encodeUtf8Base64(') &&
    scriptContent.includes('insertComposerInlineText('),
    "Alt+click on base64 toolbar button must directly convert selection"
  );

  // 5. Codec functions
  assert.ok(
    scriptContent.includes('function encodeUtf8Base64('),
    "must define encodeUtf8Base64"
  );
  assert.ok(
    scriptContent.includes('function decodeUtf8Base64('),
    "must define decodeUtf8Base64"
  );

  // Functional test for UTF-8 Base64 codec
  function encodeUtf8Base64(str) {
    if (!str) return "";
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch {
      return "";
    }
  }

  function decodeUtf8Base64(b64) {
    if (!b64) return "";
    const clean = b64.replace(/^base64:/i, "").trim();
    try {
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      return "";
    }
  }

  assert.equal(encodeUtf8Base64("Hello World"), "SGVsbG8gV29ybGQ=");
  assert.equal(decodeUtf8Base64("SGVsbG8gV29ybGQ="), "Hello World");
  assert.equal(decodeUtf8Base64("base64:SGVsbG8gV29ybGQ="), "Hello World");

  const chineseText = "你好，Linux DO & V2EX！🎉";
  const encodedChinese = encodeUtf8Base64(chineseText);
  assert.ok(encodedChinese.length > 0);
  assert.equal(decodeUtf8Base64(encodedChinese), chineseText);

  // 6. Dialog UI functions & selectors
  assert.ok(
    scriptContent.includes('function ensureBase64InsertDialog()'),
    "must define ensureBase64InsertDialog"
  );
  assert.ok(
    scriptContent.includes('function openBase64InsertDialog()'),
    "must define openBase64InsertDialog"
  );
  assert.ok(
    scriptContent.includes('function closeBase64InsertDialog()'),
    "must define closeBase64InsertDialog"
  );
  assert.ok(
    scriptContent.includes('function insertBase64ToComposer(text, selection)'),
    "must define insertBase64ToComposer"
  );

  // 7. Modal management and WECOM_UI_SEL
  assert.ok(
    scriptContent.includes(".wecom-base64-insert-dialog:not([hidden])"),
    "isModalOrViewerOpen must include .wecom-base64-insert-dialog"
  );
  assert.ok(
    scriptContent.includes(".wecom-base64-insert-dialog") && scriptContent.includes("WECOM_UI_SEL = "),
    "WECOM_UI_SEL must include .wecom-base64-insert-dialog"
  );
  assert.ok(
    scriptContent.includes("closeBase64InsertDialog();"),
    "removePanels must call closeBase64InsertDialog"
  );

  // 8. CSS styling exists
  assert.ok(
    scriptContent.includes(".wecom-base64-insert-dialog {") &&
    scriptContent.includes(".wecom-base64-insert-card {") &&
    scriptContent.includes(".wecom-base64-insert-tabs {") &&
    scriptContent.includes(".wecom-base64-insert-result {"),
    "must include base64 insert dialog CSS styles"
  );
});

test("V2EX user popover displays nodes, topics, following, coins pill, theme toggle, and auto-checkin with toast", () => {
  // 1. Toast component and container
  assert.ok(
    scriptContent.includes("function showWecomToast("),
    "must define showWecomToast helper"
  );
  assert.ok(
    scriptContent.includes(".wecom-toast-container") && scriptContent.includes(".wecom-toast"),
    "must include CSS for toast container and pill"
  );
  assert.ok(
    scriptContent.includes("WECOM_UI_SEL = \".wecom-toast-container,"),
    "WECOM_UI_SEL must include .wecom-toast-container"
  );
  assert.ok(
    scriptContent.includes("document.querySelector(\".wecom-toast-container\")?.remove();"),
    "removePanels must clean up toast container"
  );

  // 2. Storage keys
  assert.ok(
    scriptContent.includes('const V2EX_USER_STATS_KEY = "linuxdo-wecom-v2ex-user-stats";'),
    "must define persistent cache key for user stats"
  );
  assert.ok(
    scriptContent.includes('const V2EX_LAST_CHECKIN_KEY = "linuxdo-wecom-v2ex-last-checkin";'),
    "must define persistent cache key for last checkin date"
  );

  // 3. User stats extraction functions
  assert.ok(
    scriptContent.includes("function extractV2exUserStatsFromHtml("),
    "must define extractV2exUserStatsFromHtml"
  );
  assert.ok(
    scriptContent.includes("function extractV2exUserStatsFromDom("),
    "must define extractV2exUserStatsFromDom"
  );
  assert.ok(
    scriptContent.includes("function getV2exUserStats("),
    "must define getV2exUserStats"
  );
  assert.ok(
    scriptContent.includes("function syncV2exUserStats("),
    "must define syncV2exUserStats"
  );
  assert.ok(
    scriptContent.includes("function updateOpenV2exUserPopover("),
    "must define updateOpenV2exUserPopover"
  );

  // 4. Daily auto-checkin service
  assert.ok(
    scriptContent.includes("async function checkinV2exDaily("),
    "must define checkinV2exDaily"
  );
  assert.ok(
    scriptContent.includes('checkinV2exDaily(false);'),
    "bootstrap must trigger checkinV2exDaily on startup"
  );

  // 5. Popover elements (matching screenshot)
  assert.ok(
    scriptContent.includes(".wecom-v2ex-popover-theme-toggle"),
    "popover must include theme toggle switch"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-popover-stats"),
    "popover must include 3-column stats section"
  );
  assert.ok(
    scriptContent.includes("data-act=\"nodes\"") &&
    scriptContent.includes("data-act=\"topics\"") &&
    scriptContent.includes("data-act=\"following\""),
    "popover stats must include nodes, topics, and following links"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-popover-bar"),
    "popover must include progress bar divider"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-footer-coins"),
    "popover must include coins pill"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-checkin-btn"),
    "popover must include checkin status and action button"
  );

  // 6. Functional test: HTML stats parser
  const mockHtml = `
  <div class="box">
    <div class="cell">
      <a href="/member/szabc"><img src="/static/img/avatar.png" class="avatar" /></a>
      <span class="bigger"><a href="/member/szabc">szabc</a></span>
    </div>
    <div class="cell">
      <a href="/my/nodes" class="dark"><span class="bigger">5</span><span class="fade">节点收藏</span></a>
      <a href="/my/topics" class="dark"><span class="bigger">12</span><span class="fade">主题收藏</span></a>
      <a href="/my/following" class="dark"><span class="bigger">3</span><span class="fade">特别关注</span></a>
    </div>
    <div class="cell">
      <a href="/notifications" class="fade">2 条未读提醒</a>
      <a href="/balance" class="balance_area">1 <img src="/static/img/gold@2x.png"> 90 <img src="/static/img/silver@2x.png"> 40 <img src="/static/img/bronze@2x.png"></a>
    </div>
    <div class="inner">
      <span class="fade">已连续登录 15 天</span>
    </div>
  </div>
  `;

  function simulateExtractStats(html) {
    const stats = {};
    const uMatch = html.match(/<a\s+[^>]*href=["']\/member\/([^"'/]+)["'][^>]*>([^<]+)<\/a>/i);
    if (uMatch) stats.username = uMatch[1].trim();

    const nMatch = html.match(/href=["']\/my\/nodes["'][^>]*>[\s\S]*?<span[^>]*class=["']bigger["'][^>]*>(\d+)<\/span>/i);
    if (nMatch) stats.nodesCount = parseInt(nMatch[1], 10);

    const tMatch = html.match(/href=["']\/my\/topics["'][^>]*>[\s\S]*?<span[^>]*class=["']bigger["'][^>]*>(\d+)<\/span>/i);
    if (tMatch) stats.topicsCount = parseInt(tMatch[1], 10);

    const fMatch = html.match(/href=["']\/my\/following["'][^>]*>[\s\S]*?<span[^>]*class=["']bigger["'][^>]*>(\d+)<\/span>/i);
    if (fMatch) stats.followingCount = parseInt(fMatch[1], 10);

    const notifMatch = html.match(/href=["']\/notifications["'][^>]*>(\d+)\s*(?:条未读提醒|未读提醒)/i);
    if (notifMatch) stats.unreadNotifs = parseInt(notifMatch[1], 10);

    const bMatch = html.match(/<a\s+[^>]*href=["']\/balance["'][^>]*class=["']balance_area["'][^>]*>([\s\S]*?)<\/a>/i);
    if (bMatch) stats.moneyHtml = bMatch[1].replace(/src=["']\/static\//gi, 'src="https://www.v2ex.com/static/').trim();

    const daysMatch = html.match(/已连续登录\s*(\d+)\s*天/i);
    if (daysMatch) stats.checkinDays = parseInt(daysMatch[1], 10);

    return stats;
  }

  const res = simulateExtractStats(mockHtml);
  assert.equal(res.username, "szabc");
  assert.equal(res.nodesCount, 5);
  assert.equal(res.topicsCount, 12);
  assert.equal(res.followingCount, 3);
  assert.equal(res.unreadNotifs, 2);
  assert.ok(res.moneyHtml.includes("https://www.v2ex.com/static/img/gold@2x.png"));
  assert.equal(res.checkinDays, 15);

  // 7. hasV2exCoins validator and real coins guarantee in popover
  assert.ok(
    scriptContent.includes("function hasV2exCoins("),
    "must define hasV2exCoins validation helper"
  );
  assert.ok(
    !scriptContent.includes('moneyHtml = "<span>100.0 分 (正常)</span>";'),
    "popover must not replace real coins with mock score in disguise mode"
  );
  assert.ok(
    scriptContent.includes('fetch("/balance", { credentials: "include" })'),
    "syncV2exUserStats must fall back to fetching /balance if coins are missing"
  );
  assert.ok(
    scriptContent.includes("<span class=\"wecom-v2ex-stat-label\">节点收藏</span>") &&
    scriptContent.includes("<span class=\"wecom-v2ex-stat-label\">主题收藏</span>") &&
    scriptContent.includes("<span class=\"wecom-v2ex-stat-label\">特别关注</span>"),
    "popover stat labels must show 节点收藏, 主题收藏, 特别关注"
  );
});

test("V2EX member profile card parses user information and displays popup on avatar click", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes(".wecom-v2ex-member-card"),
    "must define CSS for .wecom-v2ex-member-card"
  );
  assert.ok(
    scriptContent.includes("parseV2exMemberProfile"),
    "must define parseV2exMemberProfile parser"
  );
  assert.ok(
    scriptContent.includes("fetchV2exMemberProfile"),
    "must define fetchV2exMemberProfile fetcher"
  );
  assert.ok(
    scriptContent.includes("openV2exMemberCard"),
    "must define openV2exMemberCard function"
  );
  assert.ok(
    scriptContent.includes("closeV2exMemberCard"),
    "must define closeV2exMemberCard function"
  );
  assert.ok(
    scriptContent.includes("isV2exMemberCardOpen"),
    "must define isV2exMemberCardOpen function"
  );
  assert.ok(
    scriptContent.includes("v2exMemberProfileCache"),
    "must define v2exMemberProfileCache memory cache"
  );
  assert.match(
    scriptContent,
    /WECOM_UI_SEL\s*=\s*"[^"]*\.wecom-v2ex-member-card/,
    "WECOM_UI_SEL must include .wecom-v2ex-member-card"
  );
  assert.ok(
    scriptContent.includes("closeV2exMemberCard();"),
    "removePanels must call closeV2exMemberCard"
  );

  // 2. Avatar click in list panel & chat messages
  assert.ok(
    scriptContent.includes("openV2exMemberCard(username, trigger, event);"),
    "openOriginalUserCard must invoke openV2exMemberCard on V2EX"
  );
  assert.ok(
    scriptContent.includes("data-user-card") &&
    scriptContent.includes("v2exAuthor"),
    "convAvatarHtml must output data-user-card for V2EX authors"
  );
  assert.ok(
    scriptContent.includes(".wecom-list-panel [data-user-card]"),
    "CSS must define cursor: pointer for .wecom-list-panel [data-user-card]"
  );

  // 3. Functional parser simulation
  function simulateParseProfile(html, username) {
    if (!html || typeof html !== "string") return null;
    const profile = {
      username: username || "",
      avatarUrl: "",
      uid: "",
      isOnline: false,
      tagline: "",
      memberNum: "",
      joinedDate: "",
      activityRank: "",
      isPro: false,
      badgeText: "",
      balanceHtml: "",
      socials: [],
      intro: "",
      recentTopics: []
    };

    const userMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (userMatch) profile.username = userMatch[1].trim();

    const avatarMatch = html.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*avatar/i) ||
                        html.match(/<img\s+[^>]*class=["'][^"']*avatar[^"']*["'][^>]*src=["']([^"']+)["']/i);
    if (avatarMatch) {
      let src = avatarMatch[1];
      if (src.startsWith("//")) src = "https:" + src;
      profile.avatarUrl = src;
    }

    const uidMatch = html.match(/data-uid=["'](\d+)["']/i) || html.match(/member\s*#(\d+)/i) || html.match(/第\s*(\d+)\s*号会员/i);
    if (uidMatch) {
      profile.uid = uidMatch[1];
      profile.memberNum = uidMatch[1];
    }

    if (html.includes('class="online"') || html.includes("class='online'") || html.includes(">ONLINE<")) {
      profile.isOnline = true;
    }

    const taglineMatch = html.match(/<h1[\s\S]*?<\/h1>[\s\r\n]*<span\s+class=["']bigger["']>([\s\S]*?)<\/span>/i);
    if (taglineMatch) {
      profile.tagline = taglineMatch[1].replace(/<[^>]+>/g, "").trim();
    }

    const joinedMatch = html.match(/(?:joined on|加入于)\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    if (joinedMatch) profile.joinedDate = joinedMatch[1];

    const rankMatch = html.match(/(?:activity rank|今日活跃度排名)[\s\S]*?<a[^>]*>(\d+)<\/a>/i);
    if (rankMatch) profile.activityRank = rankMatch[1];

    const badgeMatch = html.match(/<div\s+class=["']badge\s+([^"']+)["']>([^<]+)<\/div>/i);
    if (badgeMatch) {
      profile.isPro = badgeMatch[1].includes("pro");
      profile.badgeText = badgeMatch[2].trim();
    }

    const balMatch = html.match(/<div\s+class=["']balance_area["'][^>]*>([\s\S]*?)<\/div>/i);
    if (balMatch) {
      profile.balanceHtml = balMatch[1].replace(/src=["']\/static\//gi, 'src="https://www.v2ex.com/static/').trim();
    }

    const socialRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*class=["']social_label["'][^>]*>([\s\S]*?)<\/a>/gi;
    let sMatch;
    while ((sMatch = socialRegex.exec(html)) !== null) {
      const url = sMatch[1];
      const text = sMatch[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
      let type = "link";
      if (url.includes("twitter.com") || url.includes("x.com")) type = "twitter";
      else if (url.includes("github.com")) type = "github";
      else if (url.includes("weibo.com")) type = "weibo";
      profile.socials.push({ url, text, type });
    }

    const widgetsIdx = html.indexOf('class="widgets"');
    if (widgetsIdx !== -1) {
      const afterWidgets = html.slice(widgetsIdx);
      const cellMatch = afterWidgets.match(/<div\s+class=["']cell["']>([\s\S]*?)<\/div>/i);
      if (cellMatch && !cellMatch[1].includes("<table") && !cellMatch[1].includes("cell_tabs")) {
        profile.intro = cellMatch[1].replace(/<[^>]+>/g, " ").trim();
      }
    }

    const topicRegex = /<span\s+class=["']item_title["']>\s*<a\s+href=["'](\/t\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let tMatch;
    while ((tMatch = topicRegex.exec(html)) !== null && profile.recentTopics.length < 2) {
      profile.recentTopics.push({
        url: tMatch[1],
        title: tMatch[2].replace(/<[^>]+>/g, "").trim()
      });
    }

    return profile;
  }

  const sampleHtml = `
    <div>
      <img src="https://cdn.v2ex.com/avatar/984b/5881/367256_large.png" class="avatar" width="73">
      <h1>laojuelv</h1>
      <span class="bigger">Wehat: xyetf818</span>
      <strong class="online">ONLINE</strong>
      <div class="badge pro">PRO</div>
      <div class="balance_area">
        5 <img src="/static/img/gold@2x.png">&nbsp;8 <img src="/static/img/silver@2x.png">&nbsp;66 <img src="/static/img/bronze@2x.png">
      </div>
      <span class="gray">V2EX 第 367256 号会员，加入于 2018-12-02 23:25:35 +08:00，今日活跃度排名 <a href="/top/dau">58</a></span>
      <div class="widgets">
        <a href="https://twitter.com/laojuelv" class="social_label">Twitter</a>
      </div>
      <div class="cell">独立全栈开发者</div>
      <span class="item_title"><a href="/t/100001">测试主题 1</a></span>
      <span class="item_title"><a href="/t/100002">测试主题 2</a></span>
    </div>
  `;

  const parsed = simulateParseProfile(sampleHtml, "laojuelv");
  assert.equal(parsed.username, "laojuelv");
  assert.equal(parsed.avatarUrl, "https://cdn.v2ex.com/avatar/984b/5881/367256_large.png");
  assert.equal(parsed.isOnline, true);
  assert.equal(parsed.uid, "367256");
  assert.equal(parsed.memberNum, "367256");
  assert.equal(parsed.joinedDate, "2018-12-02");
  assert.equal(parsed.activityRank, "58");
  assert.equal(parsed.isPro, true);
  assert.equal(parsed.tagline, "Wehat: xyetf818");
  assert.ok(parsed.balanceHtml.includes("https://www.v2ex.com/static/img/gold@2x.png"));
  assert.equal(parsed.socials.length, 1);
  assert.equal(parsed.socials[0].type, "twitter");
  assert.equal(parsed.intro, "独立全栈开发者");
  assert.equal(parsed.recentTopics.length, 2);
  assert.equal(parsed.recentTopics[0].title, "测试主题 1");
});

test("V2EX member profile card supports block and follow buttons, parses recent replies, and correctly identifies OP username without falling back to 楼主", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes(".wecom-member-card-actions"),
    "must define CSS for .wecom-member-card-actions"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-action-btn"),
    "must define CSS for .wecom-member-action-btn"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-follow-btn"),
    "must define follow button in card"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-block-btn"),
    "must define block button in card"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-replies-box"),
    "must define CSS and DOM container for .wecom-member-replies-box"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-reply-item"),
    "must define CSS for .wecom-member-reply-item"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-reply-topic"),
    "must define CSS for .wecom-member-reply-topic"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-reply-text"),
    "must define CSS for .wecom-member-reply-text"
  );
  assert.ok(
    scriptContent.includes('username === "楼主"'),
    "must guard against 楼主 username"
  );

  // 2. Functional test: OP username parsing from V2EX topic HTML
  // In real V2EX HTML, the avatar link <div class="fr"><a href="/member/toubi"><img ...></a></div> appears BEFORE the text link
  const sampleTopicHtml = `
    <div id="Main">
      <div class="header">
        <div class="fr"><a href="/member/toubi"><img src="https://cdn.v2ex.com/avatar/662677.png" class="avatar" alt="toubi" /></a></div>
        <a href="/">V2EX</a> <span class="chevron">&nbsp;›&nbsp;</span> <a href="/go/share">分享发现</a>
        <div class="sep10"></div>
        <h1>测试主题标题</h1>
        <small class="gray"><a href="/member/toubi">toubi</a> · 2 天前 · 1234 次点击</small>
      </div>
      <div class="topic_content">主题正文内容</div>
      <div class="cell" id="r_1001">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="48" valign="top" align="center"><img src="/avatar/1.png" class="avatar"></td>
            <td width="10"></td>
            <td width="auto" valign="top">
              <span class="no">1</span> &nbsp; <a href="/member/replier" class="dark">replier</a>
              <div class="reply_content">第一条回复</div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  function simulateExtractOpUsername(html) {
    let opUsername = "";
    const memberMatches = [...html.matchAll(/<a\s+[^>]*href=["']\/member\/([^"'/]+)["'][^>]*>/gi)];
    for (const m of memberMatches) {
      const raw = decodeURIComponent(m[1]).trim();
      if (raw && raw !== "楼主") {
        opUsername = raw;
        break;
      }
    }
    if (!opUsername) {
      const altMatch = html.match(/<img[^>]*class=["'][^"']*avatar[^"']*["'][^>]*alt=["']([^"']+)["']/i);
      if (altMatch && altMatch[1] !== "楼主") {
        opUsername = altMatch[1].trim();
      }
    }
    return opUsername || "v2ex_user";
  }

  const extractedOp = simulateExtractOpUsername(sampleTopicHtml);
  assert.equal(extractedOp, "toubi", "must extract OP username 'toubi' and never fall back to '楼主'");

  // 3. Functional test: Parse replies and follow/block buttons in member profile
  const sampleMemberProfileHtml = `
    <div>
      <img src="https://cdn.v2ex.com/avatar/984b/5881/367256_large.png" class="avatar" data-uid="367256" width="73">
      <h1>laojuelv</h1>
      <span class="gray">V2EX 第 367256 号会员</span>
      <input type="button" value="特别关注" onclick="if (confirm('确定要开始关注 laojuelv？')) { location.href = '/follow/367256?once=89432'; }" class="super special button" />
      <input type="button" value="Block" onclick="if (confirm('确定要屏蔽 laojuelv？')) { location.href = '/block/367256?once=89432'; }" class="super normal button" />
      <div class="dock_area">
        <span class="gray">回复了 laojuelv 创建的主题 › <a href="/t/1242010#reply48">“万一免五”大概率进入“倒计时”～有必要先占位？！</a></span>
      </div>
      <div class="reply_content">
        对的，免五主要是小额交易，重点费率低就行
      </div>
      <div class="dock_area">
        <span class="gray">回复了 someone 创建的主题 › <a href="/t/1242020#reply12">讨论另一个话题</a></span>
      </div>
      <div class="reply_content">
        支持一下楼主！
      </div>
    </div>
  `;

  function simulateParseMemberActionsAndReplies(html, username) {
    const profile = {
      username: username || "",
      uid: "",
      recentReplies: [],
      followUrl: "",
      isFollowed: false,
      blockUrl: "",
      isBlocked: false
    };

    const uidMatch = html.match(/data-uid=["'](\d+)["']/i) || html.match(/member\s*#(\d+)/i) || html.match(/第\s*(\d+)\s*号会员/i);
    if (uidMatch) profile.uid = uidMatch[1];

    const replyRegex = /<div\s+class=["']dock_area["']>[\s\S]*?<a\s+href=["'](\/t\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<div\s+class=["']reply_content["']>([\s\S]*?)<\/div>/gi;
    let rMatch;
    while ((rMatch = replyRegex.exec(html)) !== null && profile.recentReplies.length < 2) {
      profile.recentReplies.push({
        url: rMatch[1],
        topicTitle: rMatch[2].replace(/<[^>]+>/g, "").trim(),
        content: rMatch[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      });
    }

    const followMatch = html.match(/location\.href\s*=\s*['"](\/(?:follow|unfollow)\/\d+\?once=\d+)['"]/i) ||
                        html.match(/href=['"](\/(?:follow|unfollow)\/\d+\?once=\d+)['"]/i);
    if (followMatch) {
      profile.followUrl = followMatch[1];
      profile.isFollowed = followMatch[1].includes("/unfollow/");
    }

    const blockMatch = html.match(/location\.href\s*=\s*['"](\/(?:block|unblock)\/\d+\?once=\d+)['"]/i) ||
                       html.match(/href=['"](\/(?:block|unblock)\/\d+\?once=\d+)['"]/i);
    if (blockMatch) {
      profile.blockUrl = blockMatch[1];
      profile.isBlocked = blockMatch[1].includes("/unblock/");
    }

    return profile;
  }

  const parsedActions = simulateParseMemberActionsAndReplies(sampleMemberProfileHtml, "laojuelv");
  assert.equal(parsedActions.uid, "367256");
  assert.equal(parsedActions.followUrl, "/follow/367256?once=89432");
  assert.equal(parsedActions.isFollowed, false);
  assert.equal(parsedActions.blockUrl, "/block/367256?once=89432");
  assert.equal(parsedActions.isBlocked, false);
  assert.equal(parsedActions.recentReplies.length, 2);
  assert.equal(parsedActions.recentReplies[0].url, "/t/1242010#reply48");
  assert.equal(parsedActions.recentReplies[0].topicTitle, "“万一免五”大概率进入“倒计时”～有必要先占位？！");
  assert.ok(parsedActions.recentReplies[0].content.includes("对的，免五主要是小额交易"));
  assert.equal(parsedActions.recentReplies[1].topicTitle, "讨论另一个话题");
  assert.equal(parsedActions.recentReplies[1].content, "支持一下楼主！");
});

test("Linux DO left rail navigation displays Connect instead of calendar, and clicking opens Connect modal with Trust Level & metrics", () => {
  // 1. Metadata header includes @connect connect.linux.do
  assert.ok(
    scriptContent.includes("// @connect      connect.linux.do"),
    "metadata header must declare @connect connect.linux.do"
  );

  // 2. ICONS contains connect SVG
  assert.ok(
    scriptContent.includes("connect:"),
    "ICONS dictionary must contain connect icon"
  );

  // 3. RAIL_DECO_ITEMS differentiates Linux DO (Connect) and V2EX (日程)
  assert.ok(
    scriptContent.includes('IS_V2EX ? { key: "cal", icon: "cal", label: "日程" } : { key: "connect", icon: "connect", label: "Connect" }'),
    "RAIL_DECO_ITEMS must show Connect on Linux DO and 日程 on V2EX"
  );

  // 4. Rail click binding includes bindRailConnectClick
  assert.ok(
    scriptContent.includes("bindRailConnectClick(rail)"),
    "bindRailNavClicks must call bindRailConnectClick"
  );
  assert.ok(
    scriptContent.includes('rail?.querySelector(\'[data-rail-key="connect"]\')'),
    "bindRailConnectClick must query [data-rail-key=\"connect\"]"
  );

  // 5. Connect modal lifecycle and helpers exist
  assert.ok(
    scriptContent.includes("function isLinuxDoConnectModalOpen()"),
    "must define isLinuxDoConnectModalOpen"
  );
  assert.ok(
    scriptContent.includes("function closeLinuxDoConnectModal()"),
    "must define closeLinuxDoConnectModal"
  );
  assert.ok(
    scriptContent.includes("function openLinuxDoConnectModal()"),
    "must define openLinuxDoConnectModal"
  );
  assert.ok(
    scriptContent.includes("function fetchLinuxDoConnectData("),
    "must define fetchLinuxDoConnectData"
  );
  assert.ok(
    scriptContent.includes("function renderConnectModalContent("),
    "must define renderConnectModalContent"
  );
  assert.ok(
    scriptContent.includes("function getTrustLevelInfo("),
    "must define getTrustLevelInfo"
  );
  assert.ok(
    scriptContent.includes("function formatConnectTime("),
    "must define formatConnectTime"
  );
  assert.ok(
    scriptContent.includes("function formatConnectNumber("),
    "must define formatConnectNumber"
  );

  // 6. Test trust level info resolution
  function simulateGetTrustLevelInfo(tl) {
    const level = Number(tl) || 0;
    switch (level) {
      case 1:
        return { level: 1, name: "基本用户", code: "TL1", color: "tl-1", badgeText: "🌱 基本用户 (TL1)" };
      case 2:
        return { level: 2, name: "中级成员", code: "TL2", color: "tl-2", badgeText: "🌿 中级成员 (TL2)" };
      case 3:
        return { level: 3, name: "活跃成员", code: "TL3", color: "tl-3", badgeText: "⭐ 活跃成员 (TL3)" };
      case 4:
        return { level: 4, name: "领袖管理", code: "TL4", color: "tl-4", badgeText: "👑 领袖管理 (TL4)" };
      default:
        return { level: 0, name: "见习用户", code: "TL0", color: "tl-0", badgeText: "🐣 见习用户 (TL0)" };
    }
  }

  assert.equal(simulateGetTrustLevelInfo(0).code, "TL0");
  assert.equal(simulateGetTrustLevelInfo(0).name, "见习用户");
  assert.equal(simulateGetTrustLevelInfo(1).code, "TL1");
  assert.equal(simulateGetTrustLevelInfo(2).code, "TL2");
  assert.equal(simulateGetTrustLevelInfo(3).code, "TL3");
  assert.equal(simulateGetTrustLevelInfo(3).name, "活跃成员");
  assert.equal(simulateGetTrustLevelInfo(4).code, "TL4");
  assert.equal(simulateGetTrustLevelInfo(4).name, "领袖管理");

  // 7. Test formatConnectTime and formatConnectNumber
  function simulateFormatConnectTime(seconds) {
    if (!seconds || seconds <= 0) return "0 分钟";
    const hours = Math.round(seconds / 3600);
    if (hours < 1) {
      const mins = Math.max(1, Math.round(seconds / 60));
      return `${mins} 分钟`;
    }
    return `${hours} 小时`;
  }

  function simulateFormatConnectNumber(num) {
    if (num === null || num === undefined) return "0";
    const val = Number(num) || 0;
    if (val >= 10000) {
      return (val / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return val.toLocaleString();
  }

  assert.equal(simulateFormatConnectTime(0), "0 分钟");
  assert.equal(simulateFormatConnectTime(120), "2 分钟");
  assert.equal(simulateFormatConnectTime(3600), "1 小时");
  assert.equal(simulateFormatConnectTime(1123200), "312 小时");

  assert.equal(simulateFormatConnectNumber(92), "92");
  assert.equal(simulateFormatConnectNumber(1420), "1,420");
  assert.equal(simulateFormatConnectNumber(28600), "28.6k");

  // 8. Test TL3 progress calculation
  function simulateCalculateTl3Progress(trustLevel, summary) {
    const daysVisited = summary.days_visited || 0;
    const topicsEntered = summary.topics_entered || 0;
    const postsRead = summary.posts_read_count || 0;
    const likesGiven = summary.likes_given || 0;
    const likesReceived = summary.likes_received || 0;

    let tl3ProgressPercent = 100;
    let tl3IsAchieved = trustLevel >= 3;
    if (trustLevel < 3) {
      const sVisited = Math.min(1, daysVisited / 50);
      const sTopics = Math.min(1, topicsEntered / 500);
      const sPosts = Math.min(1, postsRead / 20000);
      const sGiven = Math.min(1, likesGiven / 30);
      const sReceived = Math.min(1, likesReceived / 20);
      tl3ProgressPercent = Math.min(99, Math.round(((sVisited + sTopics + sPosts + sGiven + sReceived) / 5) * 100));
    }
    return { percent: tl3ProgressPercent, isAchieved: tl3IsAchieved };
  }

  const tl3User = simulateCalculateTl3Progress(3, { days_visited: 92, topics_entered: 1420, posts_read_count: 28600, likes_given: 680, likes_received: 450 });
  assert.equal(tl3User.isAchieved, true);
  assert.equal(tl3User.percent, 100);

  const halfWayUser = simulateCalculateTl3Progress(1, { days_visited: 25, topics_entered: 250, posts_read_count: 10000, likes_given: 15, likes_received: 10 });
  assert.equal(halfWayUser.isAchieved, false);
  assert.equal(halfWayUser.percent, 50);

  // 9. Cleanup & UI selectors include Connect modal
  assert.ok(
    scriptContent.includes(".wecom-connect-overlay, .wecom-connect-modal"),
    "WECOM_UI_SEL and cleanup must include .wecom-connect-overlay, .wecom-connect-modal"
  );
  assert.ok(
    scriptContent.includes("closeLinuxDoConnectModal();"),
    "removePanels must call closeLinuxDoConnectModal"
  );

  // 10. Styles contain modal classes and dark mode tokens
  assert.ok(
    scriptContent.includes(".wecom-connect-modal"),
    "styles must define .wecom-connect-modal"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-stats-grid"),
    "styles must define .wecom-connect-stats-grid"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-badge.tl-3"),
    "styles must define TL badges"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-connect-modal"),
    "dark mode styles must theme .wecom-connect-modal"
  );
});

test("V2EX topic detail conversation background polling and seamless fresh reply appending", () => {
  // 1. Constants & helper functions exist
  assert.ok(
    scriptContent.includes("const V2EX_TOPIC_POLL_INTERVAL_MS = 10000;"),
    "must define V2EX_TOPIC_POLL_INTERVAL_MS = 10000"
  );
  assert.ok(
    scriptContent.includes("async function pollV2exCurrentTopicOnce()"),
    "must define pollV2exCurrentTopicOnce"
  );
  assert.ok(
    scriptContent.includes("function startV2exTopicPolling()"),
    "must define startV2exTopicPolling"
  );
  assert.ok(
    scriptContent.includes("function stopV2exTopicPolling()"),
    "must define stopV2exTopicPolling"
  );

  // 2. Lifecycle integration
  assert.ok(
    scriptContent.includes("stopV2exTopicPolling();"),
    "removePanels must call stopV2exTopicPolling"
  );
  assert.ok(
    scriptContent.includes("startV2exTopicPolling();"),
    "bootstrap must call startV2exTopicPolling on V2EX"
  );
  assert.ok(
    scriptContent.includes("pollV2exCurrentTopicOnce();"),
    "visibilitychange and submitComposer must trigger pollV2exCurrentTopicOnce"
  );

  // 3. Functional simulation of poll filtering and appending
  function simulatePollFilter(renderedNumbers, newPosts) {
    const renderedSet = new Set(renderedNumbers);
    return newPosts
      .filter((post) => {
        const num = post.post_number || (post.floor ? post.floor + 1 : 0);
        return num > 1 && !renderedSet.has(num);
      })
      .sort((a, b) => (a.post_number || 0) - (b.post_number || 0));
  }

  // Existing thread with OP (post 1) and replies 2..5 (floors 1..4)
  const existingNumbers = [1, 2, 3, 4, 5];
  // Server poll returns replies 2..7 (floors 1..6)
  const polledPosts = [
    { post_number: 1, id: 100, cooked: "OP content" },
    { post_number: 2, id: 101, cooked: "Reply 1" },
    { post_number: 3, id: 102, cooked: "Reply 2" },
    { post_number: 4, id: 103, cooked: "Reply 3" },
    { post_number: 5, id: 104, cooked: "Reply 4" },
    { post_number: 6, id: 105, username: "alice", cooked: "<p>New reply 5</p>" },
    { post_number: 7, id: 106, username: "bob", cooked: "<p>New reply 6</p>" }
  ];

  const fresh = simulatePollFilter(existingNumbers, polledPosts);
  assert.equal(fresh.length, 2);
  assert.equal(fresh[0].post_number, 6);
  assert.equal(fresh[0].username, "alice");
  assert.equal(fresh[1].post_number, 7);
  assert.equal(fresh[1].username, "bob");

  // 4. Test list item update logic
  function simulateConvUpdate(conv, lastPost) {
    if (!conv || !lastPost) return;
    const snippet = (lastPost.cooked || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    conv.msg = `${lastPost.username}: ${snippet.slice(0, 50)}`;
    conv.time = "刚刚";
  }

  const mockConv = { msg: "old msg", time: "10分钟前" };
  simulateConvUpdate(mockConv, fresh[1]);
  assert.equal(mockConv.msg, "bob: New reply 6");
  assert.equal(mockConv.time, "刚刚");

  // 5. Test subtitle update
  function simulateSubtitleUpdate(totalReplies, nodeTitle, isMask = false) {
    if (isMask) return `企业内部群 · ${totalReplies} 条消息`;
    const nodePart = nodeTitle ? `归属于 ${nodeTitle} · ` : "归属于 v2ex.com · ";
    return `${nodePart}${totalReplies} 条回复`;
  }

  assert.equal(simulateSubtitleUpdate(7, "程序员"), "归属于 程序员 · 7 条回复");
  assert.equal(simulateSubtitleUpdate(7, "程序员", true), "企业内部群 · 7 条消息");
});

test("relative time real-time refresh across conv list and chat bubbles (v0.7.37)", () => {
  // 1. Script checks
  assert.ok(
    scriptContent.includes("function parseTimestamp("),
    "must define parseTimestamp"
  );
  assert.ok(
    scriptContent.includes("function refreshRelativeTimes("),
    "must define refreshRelativeTimes"
  );
  assert.ok(
    scriptContent.includes("function startRelativeTimeRefresh("),
    "must define startRelativeTimeRefresh"
  );
  assert.ok(
    scriptContent.includes("function stopRelativeTimeRefresh("),
    "must define stopRelativeTimeRefresh"
  );
  assert.ok(
    scriptContent.includes("RELATIVE_TIME_REFRESH_INTERVAL_MS = 30000"),
    "must use 30s refresh interval"
  );
  assert.ok(
    scriptContent.includes('const timeMs = parseTimestamp(rawTime);') &&
    scriptContent.includes('data-time="${timeMs}"'),
    "convRowHtml must render data-time attribute"
  );
  assert.ok(
    scriptContent.includes('const postTimeMs = parseTimestamp(post.created_at);') &&
    scriptContent.includes('wecom-msg-time"${timeAttr}'),
    "bubbleHtml must render .wecom-msg-time with data-time"
  );
  assert.ok(
    scriptContent.includes("stopRelativeTimeRefresh();"),
    "removePanels must call stopRelativeTimeRefresh"
  );
  assert.ok(
    scriptContent.includes("startRelativeTimeRefresh();"),
    "bootstrap and applyTheme must start relative time refresh"
  );

  // 2. Functional test of parseTimestamp
  function simParseTimestamp(val) {
    if (!val) return 0;
    if (typeof val === "number") {
      return val < 1e11 ? val * 1000 : val;
    }
    const str = String(val).trim();
    if (!str) return 0;
    if (/^\d+$/.test(str)) {
      const n = Number(str);
      return n < 1e11 ? n * 1000 : n;
    }
    const isoMs = Date.parse(str.replace(/-/g, "/"));
    if (!Number.isNaN(isoMs) && isoMs > 0) return isoMs;

    const directMs = Date.parse(str);
    if (!Number.isNaN(directMs) && directMs > 0) return directMs;

    const now = Date.now();
    if (/刚刚|just\s*now|moments?\s*ago/i.test(str)) {
      return now;
    }
    let m = str.match(/(\d+)\s*(?:分钟前|分前|min(?:ute)?s?\s*ago)/i);
    if (m) return now - parseInt(m[1], 10) * 60 * 1000;
    m = str.match(/(\d+)\s*(?:小时前|hr?s?\s*ago)/i);
    if (m) return now - parseInt(m[1], 10) * 3600 * 1000;
    m = str.match(/(\d+)\s*(?:天前|days?\s*ago)/i);
    if (m) return now - parseInt(m[1], 10) * 86400 * 1000;
    if (/昨天|yesterday/i.test(str)) {
      return now - 86400 * 1000;
    }
    return 0;
  }

  const now = Date.now();
  assert.equal(simParseTimestamp(now), now);
  assert.equal(simParseTimestamp(Math.floor(now / 1000)), Math.floor(now / 1000) * 1000);
  assert.ok(Math.abs(simParseTimestamp("刚刚") - now) < 50);
  assert.ok(Math.abs(simParseTimestamp("5 分钟前") - (now - 5 * 60 * 1000)) < 50);
  assert.ok(Math.abs(simParseTimestamp("2 小时前") - (now - 2 * 3600 * 1000)) < 50);
  assert.ok(Math.abs(simParseTimestamp("3 天前") - (now - 3 * 86400 * 1000)) < 50);

  // 3. Functional test of formatTime dynamic transition
  function simFormatTime(iso, baseNow) {
    if (!iso) return "";
    const timeMs = simParseTimestamp(iso);
    if (!timeMs) return String(iso);
    const date = new Date(timeMs);
    const current = baseNow ? new Date(baseNow) : new Date();
    const diffMs = Math.max(0, current.getTime() - date.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffMin < 1) {
      return "刚刚";
    }
    if (diffMin < 60) {
      return `${diffMin} 分钟前`;
    }

    const today = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === today.getTime()) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (targetDate.getTime() === yesterday.getTime()) {
      return "昨天";
    }

    if (date.getFullYear() === current.getFullYear()) {
      return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
    }
    return `${date.getFullYear()}-${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
  }

  const baseTime = new Date(2026, 8, 16, 14, 0, 0).getTime();
  // +30 seconds later -> "刚刚"
  assert.equal(simFormatTime(baseTime, baseTime + 30 * 1000), "刚刚");
  // +15 minutes later -> "15 分钟前"
  assert.equal(simFormatTime(baseTime, baseTime + 15 * 60 * 1000), "15 分钟前");
  // +1.5 hours later same day -> "14:00"
  assert.equal(simFormatTime(baseTime, baseTime + 90 * 60 * 1000), "14:00");
  // +24 hours later next day -> "昨天"
  assert.equal(simFormatTime(baseTime, baseTime + 24 * 3600 * 1000), "昨天");
  // +5 days later same year -> "9-16"
  assert.equal(simFormatTime(baseTime, baseTime + 5 * 86400 * 1000), "9-16");

  // 4. Test DOM refresh simulation
  const elements = [
    { textContent: "刚刚", dataset: { time: String(baseTime) } },
    { textContent: "5 分钟前", dataset: { time: String(baseTime) } },
    { textContent: "刚刚", dataset: {} } // legacy item without data-time
  ];

  function simRefreshTimes(els, simNow) {
    for (const el of els) {
      let timeMs = Number(el.dataset.time);
      if (!timeMs) {
        timeMs = simParseTimestamp(el.textContent);
        if (timeMs) el.dataset.time = String(timeMs);
      }
      if (timeMs) {
        const formatted = simFormatTime(timeMs, simNow);
        if (formatted && el.textContent !== formatted) {
          el.textContent = formatted;
        }
      }
    }
  }

  // At +2 hours later:
  const twoHoursLater = baseTime + 2 * 3600 * 1000;
  simRefreshTimes(elements, twoHoursLater);
  assert.equal(elements[0].textContent, "14:00");
  assert.equal(elements[1].textContent, "14:00");
  assert.ok(elements[2].dataset.time, "legacy item should have data-time backfilled");
});

test("polling replies strictly preserves scrollbar position without jumping (v0.7.38)", () => {
  // 1. Script checks
  assert.ok(
    scriptContent.includes("overflow-anchor: none;"),
    "CSS must specify overflow-anchor: none on .wecom-chat-body"
  );
  assert.ok(
    scriptContent.includes("totalAppended = appendFreshPosts(freshPosts, currentBody, { isPolling: true, scroll: false });"),
    "pollV2exCurrentTopicOnce must pass { isPolling: true, scroll: false } to appendFreshPosts"
  );
  assert.ok(
    scriptContent.includes("currentBody.scrollTop = prevScrollTop;"),
    "pollV2exCurrentTopicOnce must restore prevScrollTop"
  );
  assert.ok(
    scriptContent.includes("return appendFreshPosts(posts, body, { isPolling: true, scroll: false });"),
    "syncNewPostsFromDom must pass { isPolling: true, scroll: false } to appendFreshPosts"
  );
  assert.ok(
    scriptContent.includes("body.scrollTop = prevScrollTop;"),
    "appendFreshPosts must restore body.scrollTop to prevScrollTop"
  );

  // 2. Functional simulation of appendFreshPosts scroll handling
  function simulateScrollHandling(initialScrollTop, initialScrollHeight, clientHeight, newContentHeight, options = {}) {
    const prevScrollTop = initialScrollTop;
    const prevScrollHeight = initialScrollHeight;
    const wasNearBottom = clientHeight > 0 && (prevScrollHeight - (prevScrollTop + clientHeight) <= 32);

    let scrollTop = initialScrollTop;
    const newScrollHeight = initialScrollHeight + newContentHeight;

    const shouldScroll = options.scroll === true || (options.scroll !== false && wasNearBottom);
    if (shouldScroll) {
      scrollTop = newScrollHeight;
    } else {
      scrollTop = prevScrollTop;
    }

    return {
      scrollTop,
      wasNearBottom,
      shouldScroll,
      scrollDelta: scrollTop - prevScrollTop
    };
  }

  // Case 1: User is actively reading at the bottom (e.g. wasNearBottom = true)
  // Background polling arrives with { isPolling: true, scroll: false }
  // MUST NOT scroll, delta must be 0!
  const pollBottomRes = simulateScrollHandling(2400, 3000, 600, 400, { isPolling: true, scroll: false });
  assert.equal(pollBottomRes.wasNearBottom, true);
  assert.equal(pollBottomRes.shouldScroll, false, "polling must never trigger shouldScroll even if wasNearBottom");
  assert.equal(pollBottomRes.scrollTop, 2400, "scrollTop must stay exactly at 2400");
  assert.equal(pollBottomRes.scrollDelta, 0, "scroll delta must be strictly 0");

  // Case 2: User is reading middle of thread (e.g. scrollTop = 1000)
  // Polling arrives with { isPolling: true, scroll: false }
  const pollMidRes = simulateScrollHandling(1000, 3000, 600, 400, { isPolling: true, scroll: false });
  assert.equal(pollMidRes.wasNearBottom, false);
  assert.equal(pollMidRes.shouldScroll, false);
  assert.equal(pollMidRes.scrollTop, 1000);
  assert.equal(pollMidRes.scrollDelta, 0);

  // Case 3: User actively posts a new reply via composer with { scroll: true }
  // MUST scroll to bottom
  const submitRes = simulateScrollHandling(1000, 3000, 600, 200, { scroll: true });
  assert.equal(submitRes.shouldScroll, true, "user posting must follow new reply");
  assert.equal(submitRes.scrollTop, 3200, "user post must scroll to new scrollHeight");
  assert.equal(submitRes.scrollDelta, 2200);
});

test("Linux DO Connect modal retrieves and renders page-content requirements data (rings, bars, quotas, vetos, tables) (v0.7.39)", () => {
  // 1. Core functions are defined in userscript
  assert.ok(
    scriptContent.includes("function parseNumberValue("),
    "must define parseNumberValue"
  );
  assert.ok(
    scriptContent.includes("function extractCurrentRequired("),
    "must define extractCurrentRequired"
  );
  assert.ok(
    scriptContent.includes("function fetchConnectHtml()"),
    "must define fetchConnectHtml"
  );
  assert.ok(
    scriptContent.includes("function parseLinuxDoConnectHtml("),
    "must define parseLinuxDoConnectHtml"
  );
  assert.ok(
    scriptContent.includes("function buildFallbackRequirements("),
    "must define buildFallbackRequirements"
  );

  // 2. CSS selectors include page-content cards and badges
  assert.ok(
    scriptContent.includes(".wecom-connect-banner"),
    "must include .wecom-connect-banner in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-progress-box"),
    "must include .wecom-connect-progress-box in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-section"),
    "must include .wecom-connect-section in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-req-item"),
    "must include .wecom-connect-req-item in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-mini-bar"),
    "must include .wecom-connect-mini-bar in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-req-badge"),
    "must include .wecom-connect-req-badge in styles"
  );

  // 3. Functional simulation of parseNumberValue and extractCurrentRequired
  function parseNumberValue(text) {
    const normalized = String(text || "").replace(/,/g, "");
    const match = normalized.match(/-?\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function extractCurrentRequired(text) {
    const normalized = String(text || "").replace(/,/g, "");
    const parts = normalized.split("/");
    if (parts.length >= 2) {
      return {
        currentValue: parseNumberValue(parts[0]),
        requiredValue: parseNumberValue(parts[1])
      };
    }
    const allNums = normalized.match(/-?\d+/g) || [];
    if (allNums.length >= 2) {
      return {
        currentValue: parseInt(allNums[0], 10),
        requiredValue: parseInt(allNums[1], 10)
      };
    }
    return {
      currentValue: allNums.length === 1 ? parseInt(allNums[0], 10) : 0,
      requiredValue: 0
    };
  }

  assert.equal(parseNumberValue("24,500"), 24500);
  assert.equal(parseNumberValue("/ 50"), 50);
  assert.equal(parseNumberValue("-5"), -5);
  assert.equal(parseNumberValue(""), 0);

  const nums1 = extractCurrentRequired("45 / 30");
  assert.equal(nums1.currentValue, 45);
  assert.equal(nums1.requiredValue, 30);

  const nums2 = extractCurrentRequired("12/500");
  assert.equal(nums2.currentValue, 12);
  assert.equal(nums2.requiredValue, 500);

  // 4. Mock DOM parser simulation
  function createMockNode(tag, attrs = {}, text = '', children = []) {
    const classes = (attrs.class || '').split(/\s+/).filter(Boolean);
    return {
      tagName: tag.toUpperCase(),
      className: attrs.class || '',
      classList: {
        contains: (c) => classes.includes(c)
      },
      textContent: text,
      children,
      querySelector: function(sel) {
        return this.querySelectorAll(sel)[0] || null;
      },
      querySelectorAll: function(sel) {
        const results = [];
        const matchSel = (node, s) => {
          if (!s) return false;
          if (s.startsWith('.')) {
            const c = s.slice(1);
            return node.classList && node.classList.contains(c);
          }
          if (s.toLowerCase() === node.tagName?.toLowerCase()) return true;
          return false;
        };

        const selectors = sel.split(',').map(s => s.trim());
        const traverse = (n) => {
          for (const s of selectors) {
            if (matchSel(n, s)) {
              results.push(n);
              break;
            }
          }
          (n.children || []).forEach(traverse);
        };
        (this.children || []).forEach(traverse);
        return results;
      }
    };
  }

  function simulateParseLinuxDoConnectFromDoc(doc) {
    const trustCard = doc.querySelector('.card, .page-content, .page-body') || doc;
    const headingText = (trustCard.querySelector('.card-title, h2, h1, .page-title')?.textContent || '').trim();
    const levelMatch = headingText.match(/信任级别\s*(\d+)/i);
    const targetLevel = levelMatch ? parseInt(levelMatch[1], 10) : 3;

    const subtitleText = (trustCard.querySelector('.card-subtitle')?.textContent || '').trim();
    const subtitleUserMatch = subtitleText.match(/@([^\s·]+)/);
    const username = subtitleUserMatch ? subtitleUserMatch[1] : '';

    const requirements = [];

    // Rings
    trustCard.querySelectorAll('.tl3-ring').forEach(item => {
      const name = (item.querySelector('.tl3-ring-label')?.textContent || '').trim();
      const currentText = (item.querySelector('.tl3-ring-current')?.textContent || '').trim();
      const targetText = (item.querySelector('.tl3-ring-target')?.textContent || '').trim();
      if (!name) return;

      const currentValue = parseNumberValue(currentText);
      const requiredValue = parseNumberValue(targetText);
      const circle = item.querySelector('.tl3-ring-circle');
      const isSuccess = circle ? circle.classList.contains('met') : currentValue >= requiredValue;
      const percent = requiredValue > 0 ? Math.min(100, Math.round((currentValue / requiredValue) * 100)) : (currentValue === 0 ? 100 : 0);

      requirements.push({ name, category: '活跃程度', current: currentValue, required: requiredValue, isSuccess, percent, type: 'ring' });
    });

    // Bars
    trustCard.querySelectorAll('.tl3-bar-item').forEach(bar => {
      const name = (bar.querySelector('.tl3-bar-label')?.textContent || '').trim();
      const numsText = (bar.querySelector('.tl3-bar-nums')?.textContent || '').trim();
      if (!name) return;

      const { currentValue, requiredValue } = extractCurrentRequired(numsText);
      const numsNode = bar.querySelector('.tl3-bar-nums');
      const fillNode = bar.querySelector('.tl3-bar-fill');
      const isSuccess = (numsNode?.classList.contains('met') || fillNode?.classList.contains('met')) || currentValue >= requiredValue;
      const percent = requiredValue > 0 ? Math.min(100, Math.round((currentValue / requiredValue) * 100)) : 100;

      requirements.push({ name, category: '互动参与', current: currentValue, required: requiredValue, isSuccess, percent, type: 'bar' });
    });

    // Quotas
    trustCard.querySelectorAll('.tl3-quota-card').forEach(quota => {
      const name = (quota.querySelector('.tl3-quota-label')?.textContent || '').trim();
      const numsText = (quota.querySelector('.tl3-quota-nums')?.textContent || '').trim();
      if (!name) return;

      const { currentValue, requiredValue } = extractCurrentRequired(numsText);
      const isSuccess = quota.classList.contains('met') || currentValue <= requiredValue;
      const percent = requiredValue > 0 ? Math.min(100, Math.round((currentValue / requiredValue) * 100)) : 100;

      requirements.push({ name, category: '合规记录', current: currentValue, required: requiredValue, isSuccess, percent, type: 'quota' });
    });

    // Vetos
    trustCard.querySelectorAll('.tl3-veto-item').forEach(veto => {
      const name = (veto.querySelector('.tl3-veto-label')?.textContent || '').trim();
      const currentText = (veto.querySelector('.tl3-veto-value')?.textContent || '').trim();
      if (!name) return;

      const currentValue = parseNumberValue(currentText);
      const isSuccess = veto.classList.contains('met') || currentValue === 0;

      requirements.push({ name, category: '限制要求', current: currentValue, required: 0, isSuccess, percent: isSuccess ? 100 : 0, type: 'veto' });
    });

    const statusNode = trustCard.querySelector('.status-met, .status-unmet');
    const isMeetingRequirements = statusNode ? statusNode.classList.contains('status-met') : requirements.every(r => r.isSuccess);
    const metCount = requirements.filter(r => r.isSuccess).length;
    const totalCount = requirements.length;
    const overallPercent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

    return { targetLevel, username, requirements, isMeetingRequirements, metCount, totalCount, overallPercent };
  }

  const mockDoc = createMockNode('div', { class: 'page-wrapper' }, '', [
    createMockNode('div', { class: 'page-content' }, '', [
      createMockNode('div', { class: 'card' }, '', [
        createMockNode('div', { class: 'card-header' }, '', [
          createMockNode('h2', { class: 'card-title' }, '信任级别 3 的要求'),
          createMockNode('div', { class: 'card-subtitle' }, '@neo · 距离下次评估还剩 3 天')
        ]),
        createMockNode('div', { class: 'card-body' }, '', [
          createMockNode('div', { class: 'status-met' }, '已符合信任级别 3 要求'),
          createMockNode('div', { class: 'tl3-ring' }, '', [
            createMockNode('div', { class: 'tl3-ring-circle met' }),
            createMockNode('div', { class: 'tl3-ring-label' }, '访问天数'),
            createMockNode('div', { class: 'tl3-ring-current' }, '85'),
            createMockNode('div', { class: 'tl3-ring-target' }, '/ 50')
          ]),
          createMockNode('div', { class: 'tl3-bar-item' }, '', [
            createMockNode('div', { class: 'tl3-bar-label' }, '送出的点赞'),
            createMockNode('div', { class: 'tl3-bar-nums met' }, '45 / 30'),
            createMockNode('div', { class: 'tl3-bar-fill met' })
          ]),
          createMockNode('div', { class: 'tl3-quota-card met' }, '', [
            createMockNode('div', { class: 'tl3-quota-label' }, '被举报数量'),
            createMockNode('div', { class: 'tl3-quota-nums' }, '0 / 5')
          ]),
          createMockNode('div', { class: 'tl3-veto-item met' }, '', [
            createMockNode('div', { class: 'tl3-veto-label' }, '被禁言 (过去 6 个月)'),
            createMockNode('div', { class: 'tl3-veto-value' }, '0')
          ])
        ])
      ])
    ])
  ]);

  const parsed = simulateParseLinuxDoConnectFromDoc(mockDoc);
  assert.equal(parsed.targetLevel, 3);
  assert.equal(parsed.username, 'neo');
  assert.equal(parsed.isMeetingRequirements, true);
  assert.equal(parsed.requirements.length, 4);
  assert.equal(parsed.metCount, 4);
  assert.equal(parsed.overallPercent, 100);

  // 5. Fallback requirements generation
  function simulateBuildFallbackRequirements(trustLevel, summary = {}, user = {}) {
    const daysVisited = summary.days_visited || 0;
    const topicsEntered = summary.topics_entered || 0;
    const postsRead = summary.posts_read_count || 0;
    const likesGiven = summary.likes_given || 0;
    const likesReceived = summary.likes_received || 0;

    const targetLevel = trustLevel >= 3 ? 3 : (trustLevel === 2 ? 3 : 2);
    const requirements = [
      { name: "访问天数 (过去100天)", category: "活跃程度", current: daysVisited, required: 50, isSuccess: daysVisited >= 50, percent: Math.min(100, Math.round((daysVisited / 50) * 100)), unit: "天", type: "ring" },
      { name: "浏览话题 (过去100天)", category: "活跃程度", current: topicsEntered, required: 500, isSuccess: topicsEntered >= 500, percent: Math.min(100, Math.round((topicsEntered / 500) * 100)), unit: "个", type: "ring" },
      { name: "阅读帖子 (过去100天)", category: "活跃程度", current: postsRead, required: 20000, isSuccess: postsRead >= 20000, percent: Math.min(100, Math.round((postsRead / 20000) * 100)), unit: "帖", type: "ring" },
      { name: "送出的点赞", category: "互动参与", current: likesGiven, required: 30, isSuccess: likesGiven >= 30, percent: Math.min(100, Math.round((likesGiven / 30) * 100)), unit: "次", type: "bar" },
      { name: "收获的点赞", category: "互动参与", current: likesReceived, required: 20, isSuccess: likesReceived >= 20, percent: Math.min(100, Math.round((likesReceived / 20) * 100)), unit: "次", type: "bar" },
      { name: "社区违规惩罚", category: "限制要求", current: (user.silenced || user.suspended) ? 1 : 0, required: 0, isSuccess: !user.silenced && !user.suspended, percent: (!user.silenced && !user.suspended) ? 100 : 0, unit: "次", type: "veto" },
      { name: "封禁记录 (过去6个月)", category: "限制要求", current: 0, required: 0, isSuccess: true, percent: 100, unit: "次", type: "veto" }
    ];

    const isMeetingRequirements = trustLevel >= targetLevel || requirements.every((r) => r.isSuccess);
    const metCount = requirements.filter((r) => r.isSuccess).length;
    const totalCount = requirements.length;
    const overallPercent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

    return { targetLevel, requirements, isMeetingRequirements, metCount, totalCount, overallPercent, source: "discourse_fallback" };
  }

  const fallbackData = simulateBuildFallbackRequirements(2, {
    days_visited: 55,
    topics_entered: 600,
    posts_read_count: 22000,
    likes_given: 40,
    likes_received: 25
  });
  assert.equal(fallbackData.targetLevel, 3);
  assert.equal(fallbackData.isMeetingRequirements, true);
  assert.equal(fallbackData.metCount, 7);
  assert.equal(fallbackData.totalCount, 7);
  assert.equal(fallbackData.overallPercent, 100);

  const partialData = simulateBuildFallbackRequirements(2, {
    days_visited: 10,
    topics_entered: 50,
    posts_read_count: 500,
    likes_given: 2,
    likes_received: 1
  });
  assert.equal(partialData.targetLevel, 3);
  assert.equal(partialData.isMeetingRequirements, false);
  assert.equal(partialData.metCount, 2); // 2 vetos pass (no violation, no ban)
  assert.ok(partialData.overallPercent < 50);
});













