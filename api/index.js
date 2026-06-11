// api/index.js
// ═══════════════════════════════════════════════════════════
// إضافة Stremio / Forward لموقع عرب سيد المحدثة بالكامل
// تعمل بنظام AJAX الهجين المباشر لمنع الحظر التام
// ═══════════════════════════════════════════════════════════

const { addonBuilder } = require("stremio-addon-sdk");
const cheerio = require("cheerio");
const querystring = require("querystring");

// ════════════════════════════════════════════════════════════
// 1. الإعدادات الأساسية والبوابات الفعالة لعرب سيد
// ════════════════════════════════════════════════════════════
const BASE_URL = "https://asdnet2.arabseed.net"; 
const VIPER_SOLVER_URL = "https://test-1-eight-zeta.vercel.app/solve";

// خريطة الأقسام والكتالوجات الرسمية للموقع
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
    "as_egyptian_series": "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%85%d8%b5%d8%b1%d9%8a%d9%8ه/",
    "as_foreign_series":  "/category/foreign-series-3/",
    "as_netflix_series":  "/category/netfilx/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-netfilx-1/",
    "as_turkish_series":  "/category/turkish-series-2/",
    "as_indian_series":   "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%a5%d9%86%d8%af%d9%8a%d9%8e%d8%a9/",
    "as_korean_series":   "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%8a%d9%8f%d9%80%d9%80%d9%80%d9%8وريه/",
    "as_dubbed_series":   "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%85%d8%af%d8%a8%d9%84%d8%ac%d8%a9/",
    "as_cartoon_series":  "/category/cartoon-series/",
    "as_tv_shows":        "/category/%d8%a8%d8%b1%d8%a7%d9%85%d8%ac-%d8%aa%d9%84%d9%81%d8%b2%d9%8a%d9%88%d9%86%d9%8a%d8%a9/",
    "as_ramadan_2025":    "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d8%b1%d9%85%d8%b6%d8%a7%d9%86/ramadan-series-2025/"
};

// ════════════════════════════════════════════════════════════
// 2. بناء المانيفست المتوافق كلياً مع Forward و Stremio SDK
// ════════════════════════════════════════════════════════════
const manifest = {
    id: "org.dexworld.arabseed.premium.max.vercel",
    name: "ArabSeed Premium Max Vercel",
    version: "1.6.0",
    description: "نسخة مصلحة بالكامل بنظام الجلب الهجين وكسر حظر البوسترات للأبد",
    logo: "https://asdnet2.arabseed.net/wp-content/uploads/2023/01/cropped-Untitled-1-1-192x192.png",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt", "as_"],
    catalogs: Object.keys(CATALOG_MAP).map(key => ({
        type: key.includes("series") ? "series" : "movie",
        id: key,
        name: key.replace("as_", "").replace("_", " ").toUpperCase(),
        extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }]
    }))
};

const builder = new addonBuilder(manifest);

// ════════════════════════════════════════════════════════════
// 3. دوال المساعدة وفك حزم المشغلات المشفرة (GameHub Unpacker)
// ════════════════════════════════════════════════════════════
function unpackJs(packed) {
    try {
        const match = packed.match(/eval\(function\(p,a,c,k,e,[dr]\).*?\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)/s);
        if (!match) return packed;
        let [ , payload, radixStr, countStr, symtabStr] = match;
        let radix = parseInt(radixStr), symtab = symtabStr.split("|");
        const unbase = (str) => {
            let alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let res = 0;
            for (let i = 0; i < str.length; i++) res = res * radix + alphabet.indexOf(str[i]);
            return res;
        };
        return payload.replace(/\b\w+\b/g, (word) => {
            let idx = unbase(word);
            return (symtab[idx] && symtab[idx] !== "") ? symtab[idx] : word;
        });
    } catch (e) { return packed; }
}

async function fetchHtmlViaViper(targetUrl) {
    try {
        const res = await fetch(VIPER_SOLVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl })
        });
        if (res.ok) {
            const data = await res.json();
            return data.html || "";
        }
    } catch (e) {}
    return "";
}

async function postDataViaViper(targetUrl, payload, referer) {
    try {
        const res = await fetch(VIPER_SOLVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: targetUrl,
                method: "POST",
                data: querystring.stringify(payload),
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": referer,
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                }
            })
        });
        if (res.ok) {
            const data = await res.json();
            return data.html || JSON.stringify(data);
        }
    } catch (e) {}
    return "";
}

// ════════════════════════════════════════════════════════════
// 4. معالج الكتالوجات (قراءة البوسترات وتطهير الدومينات المحجوبة)
// ════════════════════════════════════════════════════════════
async function catalogHandler({ type, id, extra }) {
    const skip = parseInt(extra.skip) || 0;
    const search = extra.search || "";
    const page = Math.floor(skip / 30) + 1;

    let targetUrl = search 
        ? `${BASE_URL}/find/?q=${encodeURIComponent(search)}`
        : `${BASE_URL}${CATALOG_MAP[id] || "/category/arabic-movies-6/"}`;
    
    if (!search && page > 1) targetUrl += `page/${page}/`;

    const html = await fetchHtmlViaViper(targetUrl);
    if (!html) return { metas: [] };

    const $ = cheerio.load(html);
    const metas = [];

    $(".MovieBlock, .Block--Item, article, .Small--Box, .movie__block, a.movie__block").each((i, el) => {
        const $el = $(el);
        let link = $el.attr("href") || $el.find("a").first().attr("href");
        let title = $el.attr("title") || $el.find("h3, h4, .BlockTitle, .Title, p").first().text().trim() || $el.find("img").first().attr("alt");
        let poster = $el.find("img").first().attr("data-src") || $el.find("img").first().attr("src");

        if (link && title) {
            if (!link.startsWith("http")) link = new URL(link, BASE_URL).href;
            if (poster) {
                if (!poster.startsWith("http")) poster = new URL(poster, BASE_URL).href;
                // تصفية وتطهير الدومينات المحجوبة لتشتغل الصور فوراً في Forward
                poster = poster.replace(/https?:\/\/[^/]+/g, "https://m1.arabseed.lol");
            }
            metas.push({
                id: "as_" + Buffer.from(link).toString("base64url"),
                type: type,
                name: title,
                poster: poster || "",
                posterShape: "poster"
            });
        }
    });
    return { metas };
}

// ════════════════════════════════════════════════════════════
// 5. معالج الميتا (الحلقات والمواسم)
// ════════════════════════════════════════════════════════════
async function metaHandler({ type, id }) {
    if (!id.startsWith("as_")) return { meta: {} };
    try {
        const pageUrl = Buffer.from(id.replace("as_", ""), "base64url").toString();
        const html = await fetchHtmlViaViper(pageUrl);
        if (!html) return { meta: {} };

        const $ = cheerio.load(html);
        const name = $("h1").first().text().trim() || $("title").text().trim();
        let poster = $(".Poster img, .single-thumb img, .movie-poster img, .post__image img").first().attr("src") || $(".post__image img").first().attr("data-src");
        if (poster) poster = poster.replace(/https?:\/\/[^/]+/g, "https://m1.arabseed.lol");
        
        const description = $(".descrip, .StoryLine, .story").first().text().trim();
        const meta = { id, type, name, poster, background: poster, description, genres: [] };

        if (type === "series") {
            const videos = [];
            $(".EpisodesList a, .episodes-list a, .EpsList a").each((i, el) => {
                const epUrl = $(el).attr("href");
                const epTitle = $(el).text().trim() || `الحلقة ${i + 1}`;
                if (epUrl) {
                    videos.push({
                        id: "as_" + Buffer.from(epUrl).toString("base64url"),
                        title: epTitle,
                        season: 1,
                        episode: parseInt(epTitle.match(/\d+/)?.[0]) || (i + 1),
                        released: new Date().toISOString()
                    });
                }
            });
            if (videos.length > 0) meta.videos = videos.reverse();
        }
        return { meta };
    } catch (err) { return { meta: {} }; }
}

// ════════════════════════════════════════════════════════════
// 6. معالج البث الأسطوري (محاكاة بروتوكول الأياكس AJAX وجلب الروابط)
// ════════════════════════════════════════════════════════════
async function streamHandler({ type, id }) {
    const streams = [];
    try {
        if (!id.startsWith("as_")) return { streams: [] };
        const pageUrl = Buffer.from(id.replace("as_", ""), "base64url").toString();
        const watchUrl = pageUrl.endsWith("/watch/") ? pageUrl : pageUrl.replace(/\/$/, "") + "/watch/";

        const watchHtml = await fetchHtmlViaViper(watchUrl);
        if (!watchHtml) return { streams: [] };

        // اقتناص مفتاح الأمان والـ ID كما في بروتوكول الكلاودستريم
        let csrfToken = (watchHtml.match(/['\"_]csrf__token['\"]?\s*:\s*['\"]([^'\"]+)/) || [])[1] || "";
        let $w = cheerio.load(watchHtml);
        let postId = $w(".servers__list li").first().attr("data-post") || $w("[data-post]").first().attr("data-post") || "";

        if (csrfToken && postId) {
            for (let quality of ["1080", "720", "480"]) {
                let ajaxUrl = `${BASE_URL}/get__quality__servers/`;
                let payload = { post_id: postId, quality: quality, csrf_token: csrfToken };
                let ajaxRes = await postDataViaViper(ajaxUrl, payload, watchUrl);

                if (ajaxRes) {
                    let htmlContent = ajaxRes;
                    try { htmlContent = JSON.parse(ajaxRes).html || ajaxRes; } catch(e){}

                    let $ajax = cheerio.load(htmlContent);
                    let serverElements = $ajax("li").toArray();

                    for (let el of serverElements) {
                        let serverId = $ajax(el).attr("data-server");
                        if (!serverId) continue;

                        let serverUrl = `${BASE_URL}/get__watch__server/`;
                        let serverPayload = { post_id: postId, quality: quality, server: serverId, csrf_token: csrfToken };
                        let serverRes = await postDataViaViper(serverUrl, serverPayload, watchUrl);

                        if (serverRes) {
                            let iframeUrl = "";
                            try { iframeUrl = JSON.parse(serverRes).server || ""; } catch(e){
                                iframeUrl = (serverRes.match(/['\"]server['\"]\s*:\s*['\"]([^'\"]+)/) || [])[1] || "";
                            }

                            if (iframeUrl && iframeUrl.startsWith("http")) {
                                let serverHtml = await fetchHtmlViaViper(iframeUrl);
                                if (serverHtml) {
                                    if (serverHtml.includes("eval(function(p,a,c,k,e,")) serverHtml = unpackJs(serverHtml);

                                    let m3u8Matches = serverHtml.match(/https?:\/\/[^\s"'<>\\)]+\.m3u8[^\s"'<>\\)]*/gi);
                                    if (m3u8Matches) {
                                        [...new Set(m3u8Matches)].forEach(videoUrl => {
                                            streams.push({
                                                title: `▶️ سيرفر عرب سيد تلقائي [M3U8] [${quality}p]`,
                                                url: videoUrl.replace(/\\\//g, "/"),
                                                behaviorHints: { notWebReady: false, proxyHeaders: { request: { "Referer": iframeUrl, "User-Agent": "Mozilla/5.0" } } }
                                            });
                                        });
                                    }
                                    let mp4Matches = serverHtml.match(/https?:\/\/[^\s"'<>\\)]+\.mp4[^\s"'<>\\)]*/gi);
                                    if (mp4Matches) {
                                        [...new Set(mp4Matches)].forEach(videoUrl => {
                                            streams.push({
                                                title: `⚡ سورس مباشر عرب سيد [MP4] [${quality}p]`,
                                                url: videoUrl.replace(/\\\//g, "/"),
                                                behaviorHints: { notWebReady: false, proxyHeaders: { request: { "Referer": iframeUrl, "User-Agent": "Mozilla/5.0" } } }
                                            });
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // خط حماية احتياطي تقليدي في حال فشل طلب الأياكس لأي سبب عابر
        if (streams.length === 0) {
            let b64Regex = /play\.php\?url=([a-zA-Z0-9+/=]+)/g, match;
            while ((match = b64Regex.exec(watchHtml)) !== null) {
                try {
                    let decoded = Buffer.from(match[1], "base64").toString("utf-8");
                    if (decoded.startsWith("http")) streams.push({ title: "🎬 مشغل مباشر احتياطي", url: decoded });
                } catch (e) {}
            }
            $w("iframe").each((i, elem) => {
                let src = $w(elem).attr("src");
                if (src && src.startsWith("http")) streams.push({ title: `سيرفر خارجي ${i + 1}`, url: src });
            });
        }
        if (streams.length === 0) streams.push({ name: "عرب سيد ويب", title: "🌐 فتح صفحة المشاهدة الخارجية المباشرة", externalUrl: watchUrl });
        return { streams };
    } catch (err) { return { streams: [] }; }
}

builder.defineCatalogHandler(catalogHandler);
builder.defineMetaHandler(metaHandler);
builder.defineStreamHandler(streamHandler);

const addonInterface = builder.getInterface();

// ════════════════════════════════════════════════════════════
// 7. الدالة المتكاملة والمسؤولة عن الاستضافة على Vercel
// ════════════════════════════════════════════════════════════
export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") return res.status(200).end();

    const url = req.url;
    if (url === "/" || url === "/manifest.json") return res.status(200).json(addonInterface.manifest);

    const catalogMatch = url.match(/^\/catalog\/([^/]+)\/([^/]+)(?:\/(.+))?\.json$/);
    if (catalogMatch) {
        const [ , type, id, extraStr] = catalogMatch;
        const extra = extraStr ? querystring.parse(extraStr) : {};
        const result = await catalogHandler({ type, id, extra });
        return res.status(200).json(result);
    }

    const metaMatch = url.match(/^\/meta\/([^/]+)\/(.+)\.json$/);
    if (metaMatch) {
        const [ , type, id] = metaMatch;
        const result = await metaHandler({ type, id: decodeURIComponent(id) });
        return res.status(200).json(result);
    }

    const streamMatch = url.match(/^\/stream\/([^/]+)\/(.+)\.json$/);
    if (streamMatch) {
        const [ , type, id] = streamMatch;
        const result = await streamHandler({ type, id: decodeURIComponent(id) });
        return res.status(200).json(result);
    }
    return res.status(404).json({ error: "Not found" });
}
