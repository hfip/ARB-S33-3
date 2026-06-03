// api/index.js
// ═══════════════════════════════════════════════════════════
// إضافة Stremio لموقع عرب سيد
// تتصل بسيرفر Python على Hugging Face لسحب روابط البث
// ═══════════════════════════════════════════════════════════

const { addonBuilder } = require("stremio-addon-sdk");
const cheerio = require("cheerio");
const querystring = require("querystring");

// ════════════════════════════════════════════════════════════
// 1. الإعدادات الأساسية
// ════════════════════════════════════════════════════════════

// رابط موقع عرب سيد
const BASE_URL = "https://m.asd.ink";

// ── روابط سيرفر Python على Hugging Face ──
// غيّر hfip-arabseed-streams لاسم الـ Space اللي سترفعه
const HF_BASE = "https://hfip-arabseed-streams.hf.space";
const HF_SOLVE_URL        = `${HF_BASE}/solve`;           // جلب HTML
const HF_EXTRACT_URL      = `${HF_BASE}/extract_streams`; // سحب روابط البث
const HF_SEARCH_URL       = `${HF_BASE}/search_reverse`;  // البحث بالاسم

// ── رابط بروكسي جوجل (خط دفاع احتياطي) ──
const GOOGLE_PROXY_URL = "https://script.google.com/macros/s/AKfycbwzwsaeYrNMVo39ot5D2ah72SWsN1NaKa-_0yagRowbZNnByWwBiu94mO6mAUjwVGhSrQ/exec";

// ════════════════════════════════════════════════════════════
// 2. خريطة الكتالوجات (أقسام الموقع)
// ════════════════════════════════════════════════════════════
const CATALOG_MAP = {
    "as_arabic_movies":   "/category/arabic-movies-6/",
    "as_foreign_movies":  "/category/foreign-movies-6/",
    "as_netflix_movies":  "/category/netfilx/%d8%a7%d9%81%d9%84%d8%a7%d9%85-netfilx/",
    "as_indian_movies":   "/category/indian-movies/",
    "as_asian_movies":    "/category/asian-movies/",
    "as_turkish_movies":  "/category/turkish-movies/",
    "as_dubbed_movies":   "/category/%d8%a7%d9%81%d9%84%d8%a7%d9%85-%d9%85%d8%af%d8%a8%d9%84%d8%ac%d8%a9-1/",
    "as_animation_movies":"/category/%d8%a7%d9%81%d9%84%d8%a7%d9%85-%d8%a7%d9%86%d9%8a%d9%85%d9%8a%d8%b4%d9%86/",
    "as_wrestling":       "/category/wwe-shows/",
    "as_plays":           "/category/%d9%85%d8%b3%d8%b1%d8%ad%d9%8a%d8%a7%d8%aa-%d8%b9%d8%b1%d8%a8%d9%8a/",
    "as_arabic_series":   "/category/arabic-series-6/",
    "as_egyptian_series": "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%85%d8%b5%d8%b1%d9%8a%d9%87/",
    "as_foreign_series":  "/category/foreign-series-3/",
    "as_netflix_series":  "/category/netfilx/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-netfilx-1/",
    "as_turkish_series":  "/category/turkish-series-2/",
    "as_indian_series":   "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%8e%d9%86%d8%af%d9%8a%d8%a9/",
    "as_korean_series":   "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%8a%d9%8f%d9%88%d8%b1%d9%8a%d9%8eh/",
    "as_dubbed_series":   "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%85%d8%af%d8%a8%d9%84%d8%ac%d8%a9/",
    "as_cartoon_series":  "/category/cartoon-series/",
    "as_tv_shows":        "/category/%d8%a8%d8%b1%d8%a7%d9%85%d8%ac-%d8%aa%d9%84%d9%81%d8%b2%d9%8a%d9%88%d9%86%d9%8a%d8%a9/",
    "as_ramadan_2025":    "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d8%b1%d9%85%d8%b6%d8%a7%d9%86/ramadan-series-2025/"
};

// ════════════════════════════════════════════════════════════
// 3. Manifest - بطاقة تعريف الإضافة لـ Stremio
// ════════════════════════════════════════════════════════════
const manifest = {
    id: "org.arabseed.playwright.v2",
    name: "عرب سيد | Playwright v2",
    version: "2.0.0",
    description: "عرب سيد مع استخراج روابط بث حقيقي عبر Playwright",
    logo: "https://m.asd.ink/wp-content/uploads/2023/01/cropped-Untitled-1-1-192x192.png",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt", "as_"],
    catalogs: [
        { type: "movie",  id: "as_arabic_movies",    name: "عرب سيد - أفلام عربية",           extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie",  id: "as_foreign_movies",   name: "عرب سيد - أفلام أجنبية",          extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie",  id: "as_netflix_movies",   name: "عرب سيد - أفلام Netflix",         extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie",  id: "as_indian_movies",    name: "عرب سيد - أفلام هندية",           extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie",  id: "as_turkish_movies",   name: "عرب سيد - أفلام تركية",           extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie",  id: "as_animation_movies", name: "عرب سيد - أنيميشن وكرتون",        extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie",  id: "as_wrestling",        name: "عرب سيد - مصارعة حرة",            extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie",  id: "as_plays",            name: "عرب سيد - مسرحيات عربية",         extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_arabic_series",    name: "عرب سيد - مسلسلات عربية",         extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_egyptian_series",  name: "عرب سيد - مسلسلات مصرية",         extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_foreign_series",   name: "عرب سيد - مسلسلات أجنبية",        extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_netflix_series",   name: "عرب سيد - مسلسلات Netflix",       extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_turkish_series",   name: "عرب سيد - مسلسلات تركية",         extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_korean_series",    name: "عرب سيد - مسلسلات كورية/آسيوية",  extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_dubbed_series",    name: "عرب سيد - مسلسلات مدبلجة",        extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_cartoon_series",   name: "عرب سيد - مسلسلات كرتون",         extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_tv_shows",         name: "عرب سيد - برامج تلفزيونية",       extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_ramadan_2025",     name: "عرب سيد - مسلسلات رمضان 2025",    extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] }
    ]
};

const builder = new addonBuilder(manifest);

// ════════════════════════════════════════════════════════════
// 4. دوال المساعدة
// ════════════════════════════════════════════════════════════

// ── التحقق من صحة HTML المُرجَع ──────────────────────────
function isValidHtml(html) {
    if (!html || html.length < 500) return false;
    // صفحات الحجب من Cloudflare
    if (html.includes("Just a moment..."))                        return false;
    if (html.includes("cf-browser-verification"))                 return false;
    if (html.includes("Enable JavaScript and cookies"))           return false;
    // يكفي أي محتوى من الموقع
    return (
        html.includes("asd.ink") ||
        html.includes("ArabSeed") ||
        html.includes("عرب سيد") ||
        html.includes("<article") ||
        html.includes("href=")
    );
}

// ── جلب HTML عبر سيرفر Hugging Face ─────────────────────
async function fetchHtml(targetUrl) {
    // المحاولة 1: سيرفر HF (Playwright)
    try {
        console.log(`[HF /solve] ${targetUrl}`);
        const res = await fetch(HF_SOLVE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl }),
            signal: AbortSignal.timeout(45000)
        });
        if (res.ok) {
            const data = await res.json();
            if (data.html && isValidHtml(data.html)) {
                console.log("✓ HF نجح");
                return data.html;
            }
        }
    } catch (e) {
        console.log(`✗ HF فشل: ${e.message}`);
    }

    // المحاولة 2: بروكسي جوجل (احتياطي)
    try {
        console.log(`[Google Proxy] ${targetUrl}`);
        const proxyUrl = `${GOOGLE_PROXY_URL}?action=get_links&url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl, {
            method: "GET",
            signal: AbortSignal.timeout(20000)
        });
        if (res.ok) {
            const buffer = await res.arrayBuffer();
            const text = new TextDecoder("utf-8").decode(buffer);
            if (isValidHtml(text)) {
                console.log("✓ Google Proxy نجح");
                return text;
            }
        }
    } catch (e) {
        console.log(`✗ Google Proxy فشل: ${e.message}`);
    }

    return null;
}

// ── بحث بالاسم عبر سيرفر HF ──────────────────────────────
async function searchByTitle(query) {
    console.log(`[بحث] "${query}"`);

    try {
        const res = await fetch(HF_SEARCH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base_url: BASE_URL, query }),
            signal: AbortSignal.timeout(45000)
        });
        if (res.ok) {
            const data = await res.json();
            if (data.target_url) {
                console.log(`✓ بحث وجد: ${data.target_url}`);
                return data.target_url;
            }
        }
    } catch (e) {
        console.log(`✗ بحث فشل: ${e.message}`);
    }

    // fallback: بحث مباشر عبر fetchHtml
    const searchUrl = `${BASE_URL}/find/?q=${encodeURIComponent(query)}`;
    const html = await fetchHtml(searchUrl);
    if (!html) return null;

    const $ = cheerio.load(html);
    const firstLink = $("article a, .MovieBlock a, .movie__block a").first().attr("href");
    return firstLink || null;
}

// ── استخراج العناصر من HTML ───────────────────────────────
function parseItems($, type, baseUrl) {
    const items = [];
    const seen = new Set();

    // selectors متعددة تغطي أي تعديل في بنية الموقع
    const selectors = [
        "article",
        ".MovieBlock",
        ".Block--Item",
        ".Small--Box",
        ".movie__block",
        ".post-item"
    ];

    for (const sel of selectors) {
        $(sel).each((i, el) => {
            const $el = $(el);

            let link = $el.find("a").first().attr("href") || $el.attr("href");
            let title =
                $el.find("h1,h2,h3,h4,.BlockTitle,.Title,.entry-title").first().text().trim() ||
                $el.find("img").first().attr("alt") ||
                $el.attr("title");
            let poster =
                $el.find("img").first().attr("data-src") ||
                $el.find("img").first().attr("data-lazy-src") ||
                $el.find("img").first().attr("src");

            if (!link || !title || title.length < 2) return;

            // تجاهل روابط الأقسام والصفحات
            const skipPaths = ["/category/", "/tag/", "/page/", "/find/", "wp-", "#"];
            if (skipPaths.some(p => link.includes(p))) return;

            // تأكد الرابط كامل
            if (!link.startsWith("http")) {
                try { link = new URL(link, baseUrl).href; } catch { return; }
            }

            // تصحيح رابط الصورة
            if (poster) {
                if (!poster.startsWith("http")) {
                    try { poster = new URL(poster, baseUrl).href; } catch {}
                }
                poster = poster.replace(/https?:\/\/[^/]+/, baseUrl);
            }

            const id = "as_" + Buffer.from(link).toString("base64url");
            if (seen.has(id)) return;
            seen.add(id);

            // المسلسلات التي تظهر كحلقات - نحولها لـ movie
            let finalType = type;
            if (title.includes("الحلقة") || title.includes("حلقة")) {
                finalType = "movie";
            }

            items.push({
                id,
                type: finalType,
                name: title,
                poster: poster || "",
                posterShape: "poster"
            });
        });

        if (items.length > 0) break; // إذا لقينا نتائج بأول selector نوقف
    }

    return items;
}

// ════════════════════════════════════════════════════════════
// 5. معالج الكتالوج
// يُستدعى عندما يفتح المستخدم قسماً أو يبحث
// ════════════════════════════════════════════════════════════
async function catalogHandler({ type, id, extra }) {
    console.log(`\n[Catalog] type=${type} id=${id}`);

    const skip   = parseInt(extra.skip) || 0;
    const search = extra.search || "";
    const page   = Math.floor(skip / 30) + 1;

    let html = null;

    if (search) {
        // وضع البحث
        const searchUrl = `${BASE_URL}/find/?q=${encodeURIComponent(search)}`;
        html = await fetchHtml(searchUrl);
    } else {
        // وضع التصفح العادي
        const categoryPath = CATALOG_MAP[id] || "/category/arabic-movies-6/";
        const targetUrl = page > 1
            ? `${BASE_URL}${categoryPath}page/${page}/`
            : `${BASE_URL}${categoryPath}`;
        html = await fetchHtml(targetUrl);
    }

    if (!html) {
        console.log("[Catalog] فشل جلب HTML");
        return { metas: [] };
    }

    const $ = cheerio.load(html);
    const metas = parseItems($, type, BASE_URL);

    console.log(`[Catalog] وجدنا ${metas.length} عنصر`);
    return { metas };
}

// ════════════════════════════════════════════════════════════
// 6. معالج الميتا
// يُستدعى عندما يضغط المستخدم على فيلم/مسلسل
// ════════════════════════════════════════════════════════════
async function metaHandler({ type, id }) {
    console.log(`\n[Meta] type=${type} id=${id}`);

    if (!id.startsWith("as_")) return { meta: {} };

    try {
        // فك تشفير الـ id للحصول على الرابط الأصلي
        const pageUrl = Buffer.from(id.replace("as_", ""), "base64url").toString();
        console.log(`[Meta] رابط الصفحة: ${pageUrl}`);

        const html = await fetchHtml(pageUrl);
        if (!html) return { meta: {} };

        const $ = cheerio.load(html);

        // استخراج المعلومات
        const name = $("h1").first().text().trim() || $("title").text().trim();

        let poster =
            $(".Poster img, .single-thumb img, .movie-poster img, .post__image img").first().attr("src") ||
            $(".Poster img, .single-thumb img, .movie-poster img, .post__image img").first().attr("data-src") ||
            $("meta[property='og:image']").attr("content");

        const description =
            $(".descrip, .StoryLine, .story, .entry-content p").first().text().trim() ||
            $("meta[name='description']").attr("content") || "";

        if (poster && !poster.startsWith("http")) {
            try { poster = new URL(poster, BASE_URL).href; } catch {}
        }
        if (poster) poster = poster.replace(/https?:\/\/[^/]+/, BASE_URL);

        const meta = {
            id,
            type,
            name,
            poster:      poster || "",
            background:  poster || "",
            description,
            genres: []
        };

        // استخراج الأنواع/التصنيفات
        $(".Genre a, .genres a, .cats a, .terms a").each((i, el) => {
            const genre = $(el).text().trim();
            if (genre) meta.genres.push(genre);
        });

        // للمسلسلات: استخراج الحلقات
        if (type === "series") {
            const videos = [];
            $(".EpisodesList a, .episodes-list a, .EpsList a, .ep-list a, ul.episodesList a").each((i, el) => {
                const epUrl = $(el).attr("href");
                const epTitle = $(el).text().trim() || `الحلقة ${i + 1}`;

                if (epUrl) {
                    const fullEpUrl = epUrl.startsWith("http")
                        ? epUrl
                        : new URL(epUrl, BASE_URL).href;

                    videos.push({
                        id: "as_" + Buffer.from(fullEpUrl).toString("base64url"),
                        title: epTitle,
                        season:  1,
                        episode: parseInt(epTitle.match(/\d+/)?.[0]) || (i + 1),
                        released: new Date().toISOString()
                    });
                }
            });

            if (videos.length > 0) {
                meta.videos = videos.reverse(); // الحلقات من الأول للأخير
            }
        }

        console.log(`[Meta] ${name} - ${meta.genres.join(", ")}`);
        return { meta };

    } catch (err) {
        console.error("[Meta] خطأ:", err.message);
        return { meta: {} };
    }
}

// ════════════════════════════════════════════════════════════
// 7. معالج البث - الأهم!
// يُستدعى عندما يضغط المستخدم Play
// ════════════════════════════════════════════════════════════
async function streamHandler({ type, id }) {
    console.log(`\n[Stream] type=${type} id=${id}`);
    const streams = [];

    try {
        let pageUrl = "";

        // ── تحديد رابط الصفحة ──────────────────────────
        if (id.startsWith("as_")) {
            // رابط مُشفَّر من الإضافة نفسها
            pageUrl = Buffer.from(id.replace("as_", ""), "base64url").toString();
            console.log(`[Stream] رابط الصفحة: ${pageUrl}`);

        } else if (id.startsWith("tt")) {
            // IMDB ID - نبحث عنه في الموقع
            console.log(`[Stream] IMDB ID: ${id} - جاري البحث...`);

            const cinemataRes = await fetch(
                `https://v3-cinemeta.stremio.com/meta/${type}/${id}.json`,
                { signal: AbortSignal.timeout(10000) }
            );
            const cinemeta = await cinemataRes.json();
            const title = cinemeta.meta?.name;

            if (!title) {
                console.log("[Stream] ما حصلنا على الاسم من Cinemeta");
                return { streams: [] };
            }

            console.log(`[Stream] الاسم: ${title}`);
            pageUrl = await searchByTitle(title);

            if (!pageUrl) {
                console.log("[Stream] ما وجدنا الفيلم بالبحث");
                return { streams: [] };
            }
        }

        if (!pageUrl) return { streams: [] };

        // ── بناء رابط /watch/ ──────────────────────────
        const watchUrl = pageUrl.endsWith("/watch/")
            ? pageUrl
            : pageUrl.replace(/\/$/, "") + "/watch/";

        console.log(`[Stream] رابط المشاهدة: ${watchUrl}`);

        // ════════════════════════════════════════════════
        // الاستدعاء الرئيسي: /extract_streams على HF
        // هذا هو الجزء الذي يفتح المتصفح ويسحب الروابط
        // ════════════════════════════════════════════════
        console.log(`[Stream] جاري الاتصال بـ Playwright...`);

        const extractRes = await fetch(HF_EXTRACT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: watchUrl }),
            signal: AbortSignal.timeout(120000) // دقيقتين - Playwright يحتاج وقت
        });

        if (extractRes.ok) {
            const extractData = await extractRes.json();
            console.log(`[Stream] استلمنا ${extractData.total || 0} رابط من HF`);

            if (extractData.streams && extractData.streams.length > 0) {
                for (const s of extractData.streams) {
                    const isHls = s.type === "hls";
                    streams.push({
                        title: `▶️ عرب سيد\n🔗 ${isHls ? "HLS تلقائي" : "MP4 مباشر"}`,
                        url: s.url,
                        behaviorHints: {
                            notWebReady: false,
                            proxyHeaders: {
                                request: {
                                    "Referer":    "https://m.asd.ink/",
                                    "Origin":     "https://m.asd.ink",
                                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15"
                                }
                            }
                        }
                    });
                }
            }
        } else {
            console.log(`[Stream] HF أرجع: ${extractRes.status}`);
        }

        // ── Fallback: إذا ما سُحبت روابط ──────────────
        // نعطي المستخدم رابط الصفحة الخارجية يفتحها بالمتصفح
        if (streams.length === 0) {
            console.log("[Stream] لا روابط - نعطي رابط خارجي");
            streams.push({
                name:  "عرب سيد",
                title: "🌐 فتح صفحة المشاهدة مباشرة",
                externalUrl: watchUrl
            });
        }

    } catch (err) {
        console.error("[Stream] خطأ:", err.message);
        // حتى لو صار خطأ نعطي رابط خارجي
        streams.push({
            name:  "عرب سيد",
            title: "🌐 فتح الموقع مباشرة",
            externalUrl: BASE_URL
        });
    }

    console.log(`[Stream] النتيجة النهائية: ${streams.length} رابط`);
    return { streams };
}

// ════════════════════════════════════════════════════════════
// 8. ربط المعالجات بالـ Builder
// ════════════════════════════════════════════════════════════
builder.defineCatalogHandler(catalogHandler);
builder.defineMetaHandler(metaHandler);
builder.defineStreamHandler(streamHandler);

const addonInterface = builder.getInterface();

// ════════════════════════════════════════════════════════════
// 9. دالة Handler الرئيسية لـ Vercel
// تستقبل كل الطلبات وتوجهها للمعالج الصحيح
// ════════════════════════════════════════════════════════════
export default async function handler(req, res) {
    // السماح لـ Stremio بالوصول من أي مكان
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "application/json");

    // معالجة طلبات OPTIONS (preflight)
    if (req.method === "OPTIONS") return res.status(200).end();

    const url = req.url;
    console.log(`\n[HTTP] ${req.method} ${url}`);

    // ── Manifest ──────────────────────────────────────
    if (url === "/" || url === "/manifest.json") {
        return res.status(200).json(addonInterface.manifest);
    }

    // ── Catalog ───────────────────────────────────────
    // مثال: /catalog/movie/as_arabic_movies/skip=0.json
    const catalogMatch = url.match(/^\/catalog\/([^/]+)\/([^/]+)(?:\/(.+))?\.json$/);
    if (catalogMatch) {
        const [, type, id, extraStr] = catalogMatch;
        const extra = extraStr ? querystring.parse(extraStr) : {};
        const result = await catalogHandler({ type, id, extra });
        return res.status(200).json(result);
    }

    // ── Meta ──────────────────────────────────────────
    // مثال: /meta/movie/as_XXXX.json
    const metaMatch = url.match(/^\/meta\/([^/]+)\/(.+)\.json$/);
    if (metaMatch) {
        const [, type, id] = metaMatch;
        const result = await metaHandler({ type, id: decodeURIComponent(id) });
        return res.status(200).json(result);
    }

    // ── Stream ────────────────────────────────────────
    // مثال: /stream/movie/as_XXXX.json
    const streamMatch = url.match(/^\/stream\/([^/]+)\/(.+)\.json$/);
    if (streamMatch) {
        const [, type, id] = streamMatch;
        const result = await streamHandler({ type, id: decodeURIComponent(id) });
        return res.status(200).json(result);
    }

    return res.status(404).json({ error: "Not found" });
}
