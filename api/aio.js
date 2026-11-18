// DAPP - AIO Downloader
// Endpoint: /api/aio?url=LINK
// Support: TikTok, Instagram, Facebook, Twitter/X, Pinterest

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({
      status: false,
      creator: "DAPP",
      message: "Masukkan parameter ?url="
    });
  }

  try {
    let result = null;
    let platform = "unknown";

    if (url.includes("tiktok.com")) {
      platform = "tiktok";
      // Pakai API tikwm yang udah lu pakai sebelumnya
      const r = await fetch(`https://api.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
      const j = await r.json();
      if (j.data) {
        result = {
          title: j.data.title,
          author: j.data.author?.nickname,
          username: j.data.author?.unique_id,
          avatar: j.data.author?.avatar,
          cover: j.data.cover,
          video: j.data.play, // no watermark
          video_wm: j.data.wmplay,
          audio: j.data.music,
          duration: j.data.duration
        };
      }
    }
    else if (url.includes("instagram.com")) {
      platform = "instagram";
      // Pakai API publik ddinstagram
      const r = await fetch(`https://api.ddinstagram.com/api?url=${encodeURIComponent(url)}`);
      const j = await r.json();
      result = {
        title: j.title || "Instagram Media",
        author: j.author || "",
        cover: j.thumbnail || "",
        video: j.download || j.url || "",
        image: j.image || j.url || ""
      };
    }
    else if (url.includes("facebook.com") || url.includes("fb.watch")) {
      platform = "facebook";
      const r = await fetch(`https://api.tikwm.com/api/fb?url=${encodeURIComponent(url)}`);
      const j = await r.json();
      result = {
        title: j.title || "Facebook Video",
        video: j.video || j.data?.video || "",
        cover: j.thumbnail || ""
      };
    }
    else if (url.includes("twitter.com") || url.includes("x.com")) {
      platform = "twitter";
      const r = await fetch(`https://api.tikwm.com/api/twitter?url=${encodeURIComponent(url)}`);
      const j = await r.json();
      result = {
        title: j.text || "Twitter Video",
        author: j.author || "",
        video: j.video || j.data?.video || "",
        cover: j.thumbnail || ""
      };
    }
    else if (url.includes("pinterest.com") || url.includes("pin.it")) {
      platform = "pinterest";
      const r = await fetch(`https://api.tikwm.com/api/pinterest?url=${encodeURIComponent(url)}`);
      const j = await r.json();
      result = {
        title: j.title || "Pinterest",
        video: j.video || "",
        image: j.image || j.data?.image || "",
        cover: j.thumbnail || ""
      };
    }
    else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      platform = "youtube";
      // YouTube paling gampang via y2mate API publik
      // Note: Kadang limit, tapi masih jalan
      result = {
        title: "YouTube - Gunakan link di bawah",
        note: "Untuk YouTube, buka link ini untuk download",
        video: `https://www.y2mate.com/youtube/${encodeURIComponent(url)}`
      };
    }
    else {
      return res.status(400).json({
        status: false,
        creator: "DAPP",
        message: "Platform belum didukung. Coba TikTok / IG / FB / Twitter / Pinterest"
      });
    }

    if (!result || !result.video) {
      return res.status(404).json({
        status: false,
        creator: "DAPP",
        platform,
        message: "Gagal ambil media, coba link lain atau link publik (bukan private)"
      });
    }

    return res.status(200).json({
      status: true,
      creator: "DAPP",
      platform,
      result
    });

  } catch (e) {
    return res.status(500).json({
      status: false,
      creator: "DAPP",
      message: "Server error: " + e.message
    });
  }
}
