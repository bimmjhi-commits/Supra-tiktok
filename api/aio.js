// DAPP - AIO Downloader V2 (FIX)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ status: false, creator: "DAPP", message: "Masukkan ?url=" });
  }

  // Headers ini WAJIB biar ga fetch failed di Vercel
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
  };

  try {
    let platform = "unknown";
    let apiUrl = "";

    if (url.includes("tiktok.com")) {
      platform = "tiktok";
      apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
    } 
    else if (url.includes("instagram.com")) {
      platform = "instagram";
      // IG pake tikwm juga, ini endpoint yang bener
      apiUrl = `https://www.tikwm.com/api/ig/post?url=${encodeURIComponent(url)}`;
    }
    else if (url.includes("facebook.com") || url.includes("fb.watch")) {
      platform = "facebook";
      apiUrl = `https://www.tikwm.com/api/fb?url=${encodeURIComponent(url)}`;
    }
    else if (url.includes("twitter.com") || url.includes("x.com")) {
      platform = "twitter";
      apiUrl = `https://www.tikwm.com/api/twitter?url=${encodeURIComponent(url)}`;
    }
    else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      platform = "youtube";
      apiUrl = `https://www.tikwm.com/api/yt?url=${encodeURIComponent(url)}`;
    }
    else {
      return res.status(400).json({ status: false, creator: "DAPP", message: "Platform belum didukung" });
    }

    const r = await fetch(apiUrl, { headers });
    const j = await r.json();

    // TikTok format beda sendiri
    if (platform === "tiktok") {
      if (!j.data) throw new Error("TikTok gagal, coba link lain");
      return res.status(200).json({
        status: true, creator: "DAPP", platform,
        result: {
          title: j.data.title,
          author: j.data.author?.nickname,
          cover: j.data.cover,
          video: j.data.play,
          audio: j.data.music
        }
      });
    }

    // IG / FB / dll formatnya mirip
    // Coba ambil dari semua kemungkinan field
    const data = j.data || j;
    const video = data.video || data.play || data.download || data.url || data.medias?.[0]?.url || "";
    const image = data.image || data.images?.[0] || data.cover || "";

    if (!video && !image) {
      return res.status(404).json({ status: false, creator: "DAPP", platform, message: "Media tidak ketemu, pastikan link-nya publik / bukan private", raw: j });
    }

    return res.status(200).json({
      status: true, creator: "DAPP", platform,
      result: {
        title: data.title || data.text || "DAPP Media",
        author: data.author || "",
        cover: data.thumbnail || data.cover || image,
        video: video,
        image: image
      }
    });

  } catch (e) {
    return res.status(500).json({ status: false, creator: "DAPP", message: "Server error: " + e.message });
  }
}
