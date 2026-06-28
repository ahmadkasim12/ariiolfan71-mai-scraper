(function () {
  function text(el) {
    return el ? el.innerText.trim() : null;
  }

  async function fetchDoc(path) {
    const res = await fetch(path, { credentials: "include" });
    const html = await res.text();
    return new DOMParser().parseFromString(html, "text/html");
  }

  function scrapePlayerData(doc) {
    const playerName = text(doc.querySelector(".name_block"));

    const ratingEl = doc.querySelector(".rating_block");
    const rating = ratingEl ? parseInt(ratingEl.innerText.trim(), 10) : null;

    const starCount = (function () {
      const starImg = doc.querySelector('img[src*="icon_star.png"]');
      if (!starImg) return null;
      const container = starImg.parentElement;
      const lastNode = container.childNodes[container.childNodes.length - 1];
      const raw = lastNode && lastNode.nodeType === Node.TEXT_NODE
        ? lastNode.textContent
        : container.innerText;
      const match = raw.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    })();

    const trophyTitles = Array.from(doc.querySelectorAll(".trophy_inner_block span"))
      .map(span => span.innerText.trim());

    const playCounts = (function () {
      const block = doc.querySelector(".m_5.m_b_5.t_r.f_12");
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
      const img = doc.querySelector("img.w_112.f_l");
      return img ? img.src : null;
    })();

    return {
      playerName, rating, starCount, trophyTitles,
      playCountCurrentVersion: playCounts.currentVersion,
      playCountTotal: playCounts.total,
      iconUrl,
    };
  }

  function scrapeCircle(doc) {
    const circleName = text(doc.querySelector(".circle_profile_circle_name span"));
    return { circleName };
  }

  function scrapePartners(doc) {
    const names = Array.from(doc.querySelectorAll(".f_14.break"))
      .map(el => el.innerText.trim());
    const intimacyValues = Array.from(doc.querySelectorAll(".intimate_block"))
      .map(el => parseInt(el.innerText.trim(), 10));
    const partners = names.map((name, i) => ({ name, intimacy: intimacyValues[i] ?? null }));
    return { partners };
  }

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

  async function runAll() {
    const [playerDataDoc, circleDoc, partnerDoc] = await Promise.all([
      fetchDoc("/maimai-mobile/playerData/"),
      fetchDoc("/maimai-mobile/circle/"),
      fetchDoc("/maimai-mobile/collection/partner/"),
    ]);

    const result = {
      scrapedAt: new Date().toISOString(),
      playerData: scrapePlayerData(playerDataDoc),
      circle: scrapeCircle(circleDoc),
      partner: scrapePartners(partnerDoc),
    };

    const json = JSON.stringify(result, null, 2);
    console.log(json);
    window.__maimaiStats = result;
    downloadJson(json, `maimai_all_${Date.now()}.json`);
  }

  runAll();
})();