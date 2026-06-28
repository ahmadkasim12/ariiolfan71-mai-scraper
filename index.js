(function () {
  function text(el) {
    return el ? el.innerText.trim() : null;
  }

  const path = location.pathname;
  let pageType = null;
  let stats = {};

  if (path === "/maimai-mobile/playerData/") {
    pageType = "playerData";
    stats = scrapePlayerData();
  } else if (path === "/maimai-mobile/circle/") {
    pageType = "circle";
    stats = scrapeCircle();
  } else if (path === "/maimai-mobile/collection/partner/") {
    pageType = "partner";
    stats = scrapePartners();
  } else {
    console.warn("No scraper defined for this page:", path);
    return;
  }

  const result = {
    page: pageType,
    url: location.href,
    scrapedAt: new Date().toISOString(),
    data: stats,
  };

  const json = JSON.stringify(result, null, 2);
  console.log(json);
  window.__maimaiStats = result;

  downloadJson(json, `maimai_${pageType}_${Date.now()}.json`);

  return json;

  // ---- per-page scrapers ----

  function scrapePlayerData() {
    const playerName = text(document.querySelector(".name_block"));

    const ratingEl = document.querySelector(".rating_block");
    const rating = ratingEl ? parseInt(ratingEl.innerText.trim(), 10) : null;

    const starCount = (function () {
      const starImg = document.querySelector('img[src*="icon_star.png"]');
      if (!starImg) return null;
      const container = starImg.parentElement;
      const lastNode = container.childNodes[container.childNodes.length - 1];
      const raw = lastNode && lastNode.nodeType === Node.TEXT_NODE
        ? lastNode.textContent
        : container.innerText;
      const match = raw.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    })();

    const trophyTitles = Array.from(document.querySelectorAll(".trophy_inner_block span"))
      .map(span => span.innerText.trim());

    const playCounts = (function () {
      const block = document.querySelector(".m_5.m_b_5.t_r.f_12");
      if (!block) return { currentVersion: null, total: null };
      const lines = block.innerText.split("\n").map(l => l.trim());
      const currentVersion = lines[0]?.match(/(\d+)/)?.[1];
      const total = lines[1]?.match(/(\d+)/)?.[1];
      return {
        currentVersion: currentVersion ? parseInt(currentVersion, 10) : null,
        total: total ? parseInt(total, 10) : null,
      };
    })();

    const iconUrl = (function () {
      const img = document.querySelector("img.w_112.f_l");
      return img ? img.src : null;
    })();

    return {
      playerName,
      rating,
      starCount,
      trophyTitles,
      playCountCurrentVersion: playCounts.currentVersion,
      playCountTotal: playCounts.total,
      iconUrl,
    };
  }

  function scrapeCircle() {
    const circleName = text(document.querySelector(".circle_profile_circle_name span"));
    return { circleName };
  }

  function scrapePartners() {
    const names = Array.from(document.querySelectorAll(".f_14.break"))
      .map(el => el.innerText.trim());
    const intimacyValues = Array.from(document.querySelectorAll(".intimate_block"))
      .map(el => parseInt(el.innerText.trim(), 10));

    const partners = names.map((name, i) => ({
      name,
      intimacy: intimacyValues[i] ?? null,
    }));

    return { partners };
  }

  // ---- shared helpers ----

  function downloadJson(jsonString, filename) {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
})();