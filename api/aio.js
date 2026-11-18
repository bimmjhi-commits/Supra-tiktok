// DAPP - AIO V3 - Anti Gagal, Ada Fallback
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: false, creator: "DAPP", message: "Masukkan ?url=" });

  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/json' };

  // Fungsi aman: kalo server ngasih HTML, jangan crash, balikin null aja
  async function safeFetch(apiUrl) {
    try {
      const r = await fetch(apiUrl, { headers });
      const text = await r.text();
      if (!text || text.trim().startsWith("<")) return null; // ini HTML, bukan JSON -> skip
      return JSON.parse(text);
    } catch { return null; }
  }

  try {
    let platform = "unknown";
    if (url.includes("tiktok.com") || url.includes("vt.tiktok")) platform = "tiktok";
    else if (url.includes("instagram.com")) platform = "instagram";
    else if (url.includes("facebook.com") || url.includes("fb.watch")) platform = "facebook";
    else if (url.includes("twitter.com") || url.includes("x.com")) platform = "twitter";
    else if (url.includes("youtube.com") || url.includes("youtu.be")) platform = "youtube";
    else return res.status(400).json({ status: false, creator: "DAPP", message: "Platform belum didukung" });

    // === TIKTOK ===
    if (platform === "tiktok") {
      const j = await safeFetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
      if (j?.data) {
        return res.status(200).json({ status: true, creator: "DAPP", platform, result: { title: j.data.title, author: j.data.author?.nickname, cover: j.data.cover, video: j.data.play, audio: j.data.music } });
      }
      throw new Error("TikTok gagal, coba link tiktok.com yang panjang, bukan vt.tiktok.com");
    }

    // === INSTAGRAM - Coba 3 API ===
    if (platform === "instagram") {
      // Coba 1: tikwm instagram
      let j = await safeFetch(`https://www.tikwm.com/api/instagram?url=${encodeURIComponent(url)}`);
      let video = j?.data?.video || j?.data?.medias?.[0]?.url || j?.data?.play;
      let cover = j?.data?.cover || j?.data?.thumbnail || "";
      let title = j?.data?.title || "";

      // Coba 2: kalo gagal, pake ddinstagram
      if (!video) {
        let j2 = await safeFetch(`https://api.ddinstagram.com/api?url=${encodeURIComponent(url)}`);
        video = j2?.download || j2?.url || j2?.video;
        cover = j2?.thumbnail || cover;
        title = j2?.title || title;
      }

      // Coba 3: kalo masih gagal, pake saveig API publik
      if (!video) {
        let j3 = await safeFetch(`https://v3.saveig.app/api/instagram?url=${encodeURIComponent(url)}`);
        video = j3?.data?.[0]?.url || j3?.url;
      }

      if (!video) return res.status(404).json({ status: false, creator: "DAPP", platform, message: "IG gagal diambil, IG ini mungkin private / login only. Coba Reels publik lain." });
      return res.status(200).json({ status: true, creator: "DAPP", platform, result: { title: title || "Instagram Reels", cover, video } });
    }

    // === FB / TWITTER / YOUTUBE - Pakai tikwm umum ===
    let j = await safeFetch(`https://www.tikwm.com/api/${platform}?url=${encodeURIComponent(url)}`);
    let video = j?.data?.video || j?.data?.play || j?.data?.url || j?.video || "";
    if (!video) return res.status(404).json({ status: false, creator: "DAPP", platform, message: "Media tidak ketemu, pastikan link publik" });
    return res.status(200).json({ status: true, creator: "DAPP", platform, result: { title: j.data?.title || "DAPP Media", cover: j.data?.thumbnail || "", video } });

  } catch (e) {
    return res.status(500).json({ status: false, creator: "DAPP", message: "Server error: " + e.message });
  }
}
