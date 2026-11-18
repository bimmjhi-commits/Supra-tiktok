// DAPP - AIO V4 - Bisa Buka Link Pendek vt.tiktok.com
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: false, creator: "DAPP", message: "Masukkan ?url=" });

  const headers = { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15', 'Accept': 'application/json' };

  async function safeFetch(apiUrl) {
    try {
      const r = await fetch(apiUrl, { headers });
      const text = await r.text();
      if (!text || text.trim().startsWith("<")) return null;
      return JSON.parse(text);
    } catch { return null; }
  }

  // INI KUNCINYA: Buka link pendek vt.tiktok.com -> jadi link panjang
  async function resolveUrl(shortUrl) {
    try {
      const r = await fetch(shortUrl, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      return r.url || shortUrl; // r.url itu link panjangnya
    } catch { return shortUrl; }
  }

  try {
    let finalUrl = url;
    // Kalo link-nya pendek, buka dulu
    if (url.includes("vt.tiktok.com") || url.includes("vm.tiktok.com") || url.includes("tiktok.com/t/")) {
      finalUrl = await resolveUrl(url);
    }

    let platform = "unknown";
    if (finalUrl.includes("tiktok.com") || url.includes("tiktok")) platform = "tiktok";
    else if (finalUrl.includes("instagram.com") || url.includes("instagram")) platform = "instagram";
    else if (finalUrl.includes("facebook.com") || url.includes("fb.watch")) platform = "facebook";
    else if (finalUrl.includes("youtube.com") || finalUrl.includes("youtu.be")) platform = "youtube";
    else if (finalUrl.includes("twitter.com") || finalUrl.includes("x.com")) platform = "twitter";
    else return res.status(400).json({ status: false, creator: "DAPP", message: "Platform belum didukung" });

    // === TIKTOK - Coba 2 API ===
    if (platform === "tiktok") {
      // Coba pake link panjang hasil buka bungkus
      let j = await safeFetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1&count=12&cursor=0&web=1`);
      // Kalo gagal, coba pake link asli
      if (!j?.data) j = await safeFetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);

      if (j?.data) {
        return res.status(200).json({ status: true, creator: "DAPP", platform, result: { title: j.data.title, author: j.data.author?.nickname, cover: j.data.cover, video: j.data.play, audio: j.data.music, original_url: finalUrl } });
      }
      throw new Error("TikTok gagal. Linknya: " + finalUrl + " - Coba buka link vt itu di browser, copy link panjang tiktok.com-nya, baru paste ke sini.");
    }

    // === INSTAGRAM ===
    if (platform === "instagram") {
      let j = await safeFetch(`https://www.tikwm.com/api/instagram?url=${encodeURIComponent(finalUrl)}`);
      let video = j?.data?.video || j?.data?.medias?.[0]?.url;
      let cover = j?.data?.cover || "";
      if (!video) {
        let j2 = await safeFetch(`https://api.ddinstagram.com/api?url=${encodeURIComponent(finalUrl)}`);
        video = j2?.download || j2?.url;
      }
      if (!video) return res.status(404).json({ status: false, creator: "DAPP", platform, message: "IG gagal, kemungkinan private / login only. Coba Reels publik lain." });
      return res.status(200).json({ status: true, creator: "DAPP", platform, result: { title: j?.data?.title || "Instagram Reels", cover, video } });
    }

    // === LAINNYA ===
    let j = await safeFetch(`https://www.tikwm.com/api/${platform}?url=${encodeURIComponent(finalUrl)}`);
    let video = j?.data?.video || j?.data?.play || j?.data?.url || "";
    if (!video) return res.status(404).json({ status: false, creator: "DAPP", platform, message: "Media tidak ketemu, pastikan publik" });
    return res.status(200).json({ status: true, creator: "DAPP", platform, result: { title: j.data?.title || "DAPP Media", cover: j.data?.thumbnail || "", video } });

  } catch (e) {
    return res.status(500).json({ status: false, creator: "DAPP", message: "Server error: " + e.message });
  }
}
