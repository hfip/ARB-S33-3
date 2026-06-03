// api/index.js
const { addonBuilder } = require("stremio-addon-sdk");
const cheerio = require("cheerio");
const querystring = require("querystring");

// ============ 1. إعدادات الروابط ============
const VIPER_SOLVER_URL = "https://test-1-eight-zeta.vercel.app/solve";
const SCRAPLING_SOLVER_URL = "https://hfip-universal-scrapling-solver.hf.space/solve";
const SCRAPLING_SEARCH_URL = "https://hfip-universal-scrapling-solver.hf.space/search_reverse";
const GOOGLE_PROXY_URL = "https://script.google.com/macros/s/AKfycbwzwsaeYrNMVo39ot5D2ah72SWsN1NaKa-_0yagRowbZNnByWwBiu94mO6mAUjwVGhSrQ/exec";
const BASE_URL = "https://m.asd.ink";

// ============ خريطة الكتالوجات ============
const CATALOG_MAP = {
    "as_arabic_movies": "/category/arabic-movies-6/",
    "as_foreign_movies": "/category/foreign-movies-6/",
    "as_netflix_movies": "/category/netfilx/%d8%a7%d9%8فلام-netfilx/",
    "as_indian_movies": "/category/indian-movies/",
    "as_asian_movies": "/category/asian-movies/",
    "as_turkish_movies": "/category/turkish-movies/",
    "as_dubbed_movies": "/category/%d8%a7%d9%81%d9%84%d8%a7%d9%85-%d9%85%d8%af%d8%a8%d9%84%d8%ac%d8%a9-1/",
    "as_animation_movies": "/category/%d8%a7%d9%81%d9%84%d8%a7%d9%85-%d8%a7%d9%86%d9%8a%d9%85%d9%8a%d8%b4%d9%86/",
    "as_wrestling": "/category/wwe-shows/",
    "as_plays": "/category/%d9%85%d8%b3%d8%b1%d8%ad%d9%8a%d8%a7%d8%aa-%d8%b9%d8%b1%d8%a8%d9%8a/",
    "as_arabic_series": "/category/arabic-series-6/",
    "as_egyptian_series": "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%85%d8%b5%d8%b1%d9%8a%d9%87/",
    "as_foreign_series": "/category/foreign-series-3/",
    "as_netflix_series": "/category/netfilx/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-netfilx-1/",
    "as_turkish_series": "/category/turkish-series-2/",
    "as_indian_series": "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%8e%d9%86%d8%af%d9%8a%d8%a9/",
    "as_korean_series": "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%8a%d9%8f%d9%88%d8%b1%d9%8a%d9%8eh/",
    "as_dubbed_series": "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d9%85%d8%af%d8%a8%d9%84%d8%ac%d8%a9/",
    "as_cartoon_series": "/category/cartoon-series/",
    "as_tv_shows": "/category/%d8%a8%d8%b1%d8%a7%d9%85%d8%ac-%d8%aa%d9%84%d9%81%d8%b2%d9%8a%d9%88%d9%86%d9%8a%d8%a9/",
    "as_ramadan_2025": "/category/%d9%85%d8%b3%d9%84%d8%b3%d9%84%d8%a7%d8%aa-%d8%b1%d9%85%d8%b6%d8%a7%d9%86/ramadan-series-2025/"
};

// ============ 2. Manifest ============
const manifest = {
    id: "org.dexworld.arabseed.premium.max",
    name: "ArabSeed Premium Max v4",
    version: "4.0.0",
    description: "نظام كشط مدعوم بـ ViperTLS + Scrapling لتخطي الحماية الكاملة",
    logo: "https://m.asd.ink/wp-content/uploads/2023/01/cropped-Untitled-1-1-192x192.png",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt", "as_"],
    catalogs: [
        { type: "movie", id: "as_arabic_movies", name: "عرب سيد - أفلام عربية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_foreign_movies", name: "عرب سيد - أفلام أجنبية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_netflix_movies", name: "عرب سيد - أفلام Netflix", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_indian_movies", name: "عرب سيد - أفلام هندية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_turkish_movies", name: "عرب سيد - أفلام تركية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_animation_movies", name: "عرب سيد - أنيميشن كرتون", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_wrestling", name: "عرب سيد - مصارعة حرة", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_plays", name: "عرب سيد - مسرحيات عربية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_arabic_series", name: "عرب سيد - مسلسلات عربية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_egyptian_series", name: "عرب سيد - مسلسلات مصرية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_foreign_series", name: "عرب سيد - مسلسلات أجنبية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_netflix_series", name: "عرب سيد - مسلسلات Netflix", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_turkish_series", name: "عرب سيد - مسلسلات تركية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_korean_series", name: "عرب سيد - مسلسلات كورية / آسيوية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_cartoon_series", name: "عرب سيد - مسلسلات كرتون", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_tv_shows", name: "عرب سيد - برامج تلفزيونية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_ramadan_2025", name: "عرب سيد - مسلسلات رمضان", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] }
    ]
};

const builder = new addonBuilder(manifest);

// ============ 3. دالة التحقق من صحة HTML ============
// مرنة - لا تشترط كلمة محددة، فقط تتأكد أن HTML حقيقي وليس صفحة حجب
function isValidHtml(html) {
    if (!html || html.length < 500) return false;
    if (html.includes("Just a moment...")) return false;
    if (html.includes("cf-browser-verification")) return false;
    if (html.includes("Enable JavaScript and cookies to continue")) return false;
    // يكفي أن يحتوي على أي محتوى من الموقع
    return html.includes("asd.ink") || html.includes("href=") || html.includes("<article") || html.includes("movie");
}

// ============ 4. محرك الجلب الثلاثي (ViperTLS → Scrapling → Google Proxy) ============
async function fetchUrl(targetUrl) {
    // --- المحاولة 1: ViperTLS ---
    try {
        console.log(`[1/3] ViperTLS: ${targetUrl}`);
        const res = await fetch(VIPER_SOLVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl, preset: "edge_133", timeout: 20 }),
            signal: AbortSignal.timeout(25000)
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.html && isValidHtml(data.html)) {
                console.log("✓ ViperTLS نجح");
                return data.html;
            }
        }
    } catch (e) {
        console.log(`✗ ViperTLS فشل: ${e.message}`);
    }

    // --- المحاولة 2: Scrapling (Playwright) ---
    try {
        console.log(`[2/3] Scrapling: ${targetUrl}`);
        const res = await fetch(SCRAPLING_SOLVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl }),
            signal: AbortSignal.timeout(60000) // Playwright يحتاج وقت أطول
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.html && isValidHtml(data.html)) {
                console.log("✓ Scrapling نجح");
                return data.html;
            }
        }
    } catch (e) {
        console.log(`✗ Scrapling فشل: ${e.message}`);
    }

    // --- المحاولة 3: Google Proxy (خط الدفاع الأخير) ---
    try {
        console.log(`[3/3] Google Proxy: ${targetUrl}`);
        const proxyUrl = `${GOOGLE_PROXY_URL}?action=get_links&url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl, { 
            method: 'GET',
            signal: AbortSignal.timeout(20000)
        });
        if (res.ok) {
            const buffer = await res.arrayBuffer();
            const text = new TextDecoder('utf-8').decode(buffer);
            if (isValidHtml(text)) {
                console.log("✓ Google Proxy نجح");
                return text;
            }
        }
    } catch (e) {
        console.log(`✗ Google Proxy فشل: ${e.message}`);
    }

    console.log("✗ كل المحاولات فشلت");
    return null;
}

// ============ دالة بحث مخصصة تستخدم Scrapling /search_reverse ============
async function searchContent(query) {
    // --- المحاولة 1: Scrapling search_reverse (الأقوى للبحث) ---
    try {
        console.log(`[بحث Scrapling] "${query}"`);
        const res = await fetch(SCRAPLING_SEARCH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base_url: BASE_URL, query: query }),
            signal: AbortSignal.timeout(60000)
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.target_url) {
                console.log(`✓ Scrapling Search وجد: ${data.target_url}`);
                // الآن اجلب صفحة النتيجة
                return await fetchUrl(data.target_url);
            }
        }
    } catch (e) {
        console.log(`✗ Scrapling Search فشل: ${e.message}`);
    }

    // --- المحاولة 2: بحث عادي عبر fetchUrl ---
    const searchUrl = `${BASE_URL}/find/?q=${encodeURIComponent(query)}`;
    return await fetchUrl(searchUrl);
}

// ============ 5. معالج الكتالوجات ============
async function catalogHandler({ type, id, extra }) {
    const skip = parseInt(extra.skip) || 0;
    const search = extra.search || '';
    const page = Math.floor(skip / 30) + 1;

    let htmlData;
    if (search) {
        htmlData = await searchContent(search);
    } else {
        const categoryPath = CATALOG_MAP[id] || "/category/arabic-movies-6/";
        const targetUrl = page > 1
            ? `${BASE_URL}${categoryPath}page/${page}/`
            : `${BASE_URL}${categoryPath}`;
        htmlData = await fetchUrl(targetUrl);
    }

    if (!htmlData) return { metas: [] };

    const $ = cheerio.load(htmlData);
    const metas = [];

    // selectors متعددة لأي تغيير في بنية الموقع
    $('article, .MovieBlock, .Block--Item, .Small--Box, .movie__block, a[href*="' + BASE_URL + '"]').each((i, el) => {
        const $el = $(el);
        let link = $el.attr('href') || $el.find('a').first().attr('href');
        let title = $el.attr('title')
            || $el.find('h1, h2, h3, h4, .BlockTitle, .Title, .entry-title').first().text().trim()
            || $el.find('img').first().attr('alt');
        let poster = $el.find('img').first().attr('data-src')
            || $el.find('img').first().attr('src')
            || $el.find('img').first().attr('data-lazy-src');

        if (!link || !title || title.length < 2) return;
        if (link.includes('/category/') || link.includes('/find/') || link === BASE_URL + '/') return;

        if (!link.startsWith('http')) link = new URL(link, BASE_URL).href;
        if (poster) {
            if (!poster.startsWith('http')) poster = new URL(poster, BASE_URL).href;
            poster = poster.replace(/https?:\/\/[^/]+/g, BASE_URL);
        }

        let finalType = type;
        if (title.includes("الحلقة") || title.includes("حلقة")) finalType = "movie";

        const itemId = 'as_' + Buffer.from(link).toString('base64url');
        if (!metas.find(m => m.id === itemId)) {
            metas.push({
                id: itemId,
                type: finalType,
                name: title,
                poster: poster || '',
                posterShape: 'poster'
            });
        }
    });

    return { metas };
}

// ============ 6. معالج الميتا ============
async function metaHandler({ type, id }) {
    if (!id.startsWith('as_')) return { meta: {} };
    try {
        const pageUrl = Buffer.from(id.replace('as_', ''), 'base64url').toString();
        const htmlData = await fetchUrl(pageUrl);
        if (!htmlData) return { meta: {} };

        const $ = cheerio.load(htmlData);
        const name = $('h1').first().text().trim() || $('title').text().trim();
        let poster = $('.Poster img, .single-thumb img, .movie-poster img, .post__image img').first().attr('src')
            || $('.Poster img, .single-thumb img, .movie-poster img, .post__image img').first().attr('data-src');
        const description = $('.descrip, .StoryLine, .story, .entry-content p').first().text().trim();

        if (poster) poster = poster.replace(/https?:\/\/[^/]+/g, BASE_URL);

        const meta = { id, type, name, poster, background: poster, description, genres: [] };
        $('.Genre a, .genres a, .cats a').each((i, el) => meta.genres.push($(el).text().trim()));

        if (type === 'series') {
            const videos = [];
            $('.EpisodesList a, .episodes-list a, .EpsList a, .ep-list a, ul.episodesList a').each((i, el) => {
                const epUrl = $(el).attr('href');
                const epTitle = $(el).text().trim() || `الحلقة ${i + 1}`;
                if (epUrl) {
                    videos.push({
                        id: 'as_' + Buffer.from(epUrl.startsWith('http') ? epUrl : new URL(epUrl, BASE_URL).href).toString('base64url'),
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
    } catch (err) {
        console.error('metaHandler error:', err.message);
        return { meta: {} };
    }
}

// ============ 7. معالج البث ============
async function streamHandler({ type, id }) {
    const streams = [];
    try {
        let watchUrl = "";

        if (id.startsWith('as_')) {
            const pageUrl = Buffer.from(id.replace('as_', ''), 'base64url').toString();
            watchUrl = pageUrl.endsWith('/watch/') ? pageUrl : pageUrl.replace(/\/$/, '') + '/watch/';
        } else if (id.startsWith('tt')) {
            const metaResponse = await fetch(`https://v3-cinemeta.stremio.com/meta/${type}/${id}.json`, {
                signal: AbortSignal.timeout(10000)
            });
            const metaData = await metaResponse.json();
            const mediaTitle = metaData.meta?.name;
            if (!mediaTitle) return { streams: [] };

            const searchHtml = await searchContent(mediaTitle);
            if (!searchHtml) return { streams: [] };

            const $s = cheerio.load(searchHtml);
            let targetPageUrl = $s('article a, .MovieBlock a, .movie__block a, a[href*="' + BASE_URL + '"]').first().attr('href');
            if (!targetPageUrl) return { streams: [] };
            if (!targetPageUrl.startsWith('http')) targetPageUrl = new URL(targetPageUrl, BASE_URL).href;

            watchUrl = targetPageUrl.endsWith('/watch/') ? targetPageUrl : targetPageUrl.replace(/\/$/, '') + '/watch/';
        }

        if (!watchUrl) return { streams: [] };

        const watchHtml = await fetchUrl(watchUrl);
        if (!watchHtml) {
            // إذا فشل الجلب، أعطِ رابط خارجي مباشر
            streams.push({ name: "ArabSeed", title: "🌐 فتح صفحة المشاهدة", externalUrl: watchUrl });
            return { streams };
        }

        const servers = [];

        // استخراج روابط Base64
        const b64Regex = /play\.php\?url=([a-zA-Z0-9+/=]+)/g;
        let match;
        while ((match = b64Regex.exec(watchHtml)) !== null) {
            try {
                let b64Str = match[1];
                const padding = 4 - (b64Str.length % 4);
                if (padding !== 4) b64Str += '='.repeat(padding);
                const decoded = Buffer.from(b64Str, 'base64').toString('utf-8');
                if (decoded.startsWith('http') && !servers.some(s => s.link === decoded)) {
                    servers.push({ name: 'عرب سيد مباشر ⚡', link: decoded });
                }
            } catch (e) {}
        }

        // استخراج iframes
        const $w = cheerio.load(watchHtml);
        $w('iframe[src]').each((i, elem) => {
            const src = $w(elem).attr('src');
            if (src && src.startsWith('http') && !servers.some(s => s.link === src)) {
                servers.push({ name: `سيرفر ${i + 1}`, link: src });
            }
        });

        // استخراج روابط data-src أو data-link
        $w('[data-src], [data-link], [data-url]').each((i, elem) => {
            const src = $w(elem).attr('data-src') || $w(elem).attr('data-link') || $w(elem).attr('data-url');
            if (src && src.startsWith('http') && !servers.some(s => s.link === src)) {
                servers.push({ name: `سيرفر data ${i + 1}`, link: src });
            }
        });

        console.log(`وجدنا ${servers.length} سيرفر في صفحة المشاهدة`);

        // جلب روابط البث من كل سيرفر (أقصى 4 سيرفرات)
        const optimizedServers = servers.slice(0, 4);
        for (const server of optimizedServers) {
            let serverHtml = await fetchUrl(server.link);
            if (!serverHtml) continue;

            // فك تشفير eval/packer
            if (serverHtml.includes("eval(function(p,a,c,k,e,")) {
                const matchJS = /eval\(function\(p,a,c,k,e,[dr]\).*?\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)/s.exec(serverHtml);
                if (matchJS) {
                    try {
                        let payload = matchJS[1];
                        const radix = parseInt(matchJS[2]);
                        const symtab = matchJS[4].split('|');
                        const unbase = (str) => {
                            let res = 0;
                            for (let i = 0; i < str.length; i++) {
                                const c = str[i];
                                const v = /[0-9]/.test(c) ? parseInt(c) : c.charCodeAt(0) - 87;
                                res = res * radix + v;
                            }
                            return res;
                        };
                        const unpacked = payload.replace(/\b\w+\b/g, (word) => {
                            const idx = unbase(word);
                            return (symtab[idx] && symtab[idx] !== '') ? symtab[idx] : word;
                        });
                        serverHtml += "\n" + unpacked;
                    } catch (e) {}
                }
            }

            // البحث عن روابط m3u8
            const m3u8Matches = serverHtml.match(/https?:\/\/[^\s"'<>\\)]+\.m3u8[^\s"'<>\\)]*/gi);
            if (m3u8Matches) {
                [...new Set(m3u8Matches)].forEach(videoUrl => {
                    streams.push({
                        title: `▶️ ${server.name}\n🔗 HLS`,
                        url: videoUrl.replace(/\\\//g, '/'),
                        behaviorHints: {
                            notWebReady: false,
                            proxyHeaders: {
                                request: { "Referer": server.link, "User-Agent": "Mozilla/5.0" }
                            }
                        }
                    });
                });
            }

            // البحث عن روابط mp4
            const mp4Matches = serverHtml.match(/https?:\/\/[^\s"'<>\\)]+\.mp4[^\s"'<>\\)]*/gi);
            if (mp4Matches) {
                [...new Set(mp4Matches)].forEach(videoUrl => {
                    streams.push({
                        title: `▶ ${server.name}\n🔗 MP4`,
                        url: videoUrl.replace(/\\\//g, '/'),
                        behaviorHints: {
                            notWebReady: false,
                            proxyHeaders: {
                                request: { "Referer": server.link, "User-Agent": "Mozilla/5.0" }
                            }
                        }
                    });
                });
            }
        }

        // fallback إذا ما لقينا روابط
        if (streams.length === 0) {
            streams.push({
                name: "ArabSeed Web",
                title: "🌐 فتح صفحة المشاهدة الخارجية",
                externalUrl: watchUrl
            });
        }

        return { streams };
    } catch (err) {
        console.error('streamHandler error:', err.message);
        return { streams: [] };
    }
}

builder.defineCatalogHandler(catalogHandler);
builder.defineMetaHandler(metaHandler);
builder.defineStreamHandler(streamHandler);

const addonInterface = builder.getInterface();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const url = req.url;
    if (url === '/' || url === '/manifest.json') {
        return res.status(200).json(addonInterface.manifest);
    }

    const catalogMatch = url.match(/^\/catalog\/([^/]+)\/([^/]+)(?:\/(.+))?\.json$/);
    if (catalogMatch) {
        const [, type, id, extraStr] = catalogMatch;
        const extra = extraStr ? querystring.parse(extraStr) : {};
        const result = await catalogHandler({ type, id, extra });
        return res.status(200).json(result);
    }

    const metaMatch = url.match(/^\/meta\/([^/]+)\/(.+)\.json$/);
    if (metaMatch) {
        const [, type, id] = metaMatch;
        const result = await metaHandler({ type, id: decodeURIComponent(id) });
        return res.status(200).json(result);
    }

    const streamMatch = url.match(/^\/stream\/([^/]+)\/(.+)\.json$/);
    if (streamMatch) {
        const [, type, id] = streamMatch;
        const result = await streamHandler({ type, id: decodeURIComponent(id) });
        return res.status(200).json(result);
    }

    return res.status(404).json({ error: 'Not found' });
}
