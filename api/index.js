// api/index.js
const { addonBuilder } = require("stremio-addon-sdk");
const cheerio = require("cheerio");
const querystring = require("querystring");

// ============ 1. الإعدادات السحابية ورابط ViperTLS المحصن ============
const VIPER_SOLVER_URL = "https://test-1-eight-zeta.vercel.app/solve"; 
const GOOGLE_PROXY_URL = "https://script.google.com/macros/s/AKfycbwzwsaeYrNMVo39ot5D2ah72SWsN1NaKa-_0yagRowbZNnByWwBiu94mO6mAUjwVGhSrQ/exec";
const BASE_URL = "https://m.asd.ink";

const CATALOG_MAP = {
    "as_arabic_movies": "/category/arabic-movies-6/",
    "as_foreign_movies": "/category/foreign-movies-6/",
    "as_netflix_movies": "/category/netfilx/%d8%a7%d9%81%d9%84%d8%a7%d9%85-netfilx/",
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

// ============ 2. الـ Manifest الرسمي القياسي الثابت ============
const manifest = {
    id: "org.dexworld.arabseed.premium.max.v7", // تصفير كاش ستريميو إجبارياً الحين
    name: "ArabSeed Premium Max v7 - Test",
    version: "7.0.0",
    description: "تجميع المسلسلات القسري بالسيليكتور الموحد وحاوية مواسم عرب سيد المستقرة",
    logo: "https://m.asd.ink/wp-content/uploads/2023/01/cropped-Untitled-1-1-192x192.png",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt", "as_"], // العودة للمعرفات القياسية لعدم تضارب ستريميو
    catalogs: [
        { type: "movie", id: "as_arabic_movies", name: "عرب سيد - أفلام عربية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_foreign_movies", name: "عرب سيد - أفلام أجنبية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_netflix_movies", name: "عرب سيد - أفلام Netflix", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_indian_movies", name: "عرب سيد - أفلام هندية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_turkish_movies", name: "عرب سيد - أفلام تركية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "movie", id: "as_animation_movies", name: "عرب سيد - أنيميشن كرتون", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_arabic_series", name: "عرب سيد - مسلسلات عربية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_egyptian_series", name: "عرب سيد - مسلسلات مصرية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_foreign_series", name: "عرب سيد - مسلسلات أجنبية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_netflix_series", name: "عرب سيد - مسلسلات Netflix", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_turkish_series", name: "عرب سيد - مسلسلات تركية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_indian_series", name: "عرب سيد - مسلسلات هندية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_korean_series", name: "عرب سيد - مسلسلات آسيوية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_cartoon_series", name: "عرب سيد - مسلسلات كرتون", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_ramadan_2025", name: "عرب سيد - مسلسلات رمضان", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] }
    ]
};

const builder = new addonBuilder(manifest);

// ============ 3. محرك الجلب الذكي الهجين السحابي ============
async function getHtmlSmartly(action, targetUrl = '', searchQuery = '') {
    let finalTargetUrl = targetUrl;
    if (action === 'search') {
        finalTargetUrl = `${BASE_URL}/find/?q=${encodeURIComponent(searchQuery)}`;
    }

    try {
        const response = await fetch(VIPER_SOLVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: finalTargetUrl, preset: "edge_133", timeout: 15 })
        });
        if (response.ok) {
            const data = await response.json();
            if (data && data.html && !data.html.includes("Just a moment...") && data.html.length > 5000) {
                return data.html;
            }
        }
    } catch (e) {}

    try {
        let proxyUrl = `${GOOGLE_PROXY_URL}?action=${action}`;
        if (action === 'search') proxyUrl += `&q=${encodeURIComponent(searchQuery)}`;
        else if (action === 'get_links') proxyUrl += `&url=${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl, { method: 'GET' });
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            const text = new TextDecoder('utf-8').decode(buffer);
            if (text && !text.includes("Just a moment...") && text.length > 5000) {
                return text;
            }
        }
    } catch (err) {}
    return null;
}

// دالة لتطهير العناوين ودمج الحلقات في الكتالوج الرئيسي قسرياً
function cleanSeriesTitle(title) {
    return title.replace(/الحلقة\s+\d+/g, '')
                .replace(/والأخيرة/g, '')
                .replace(/حلقة\s+\d+/g, '')
                .replace(/الموسم\s+\d+/g, '')
                .replace(/موسم\s+\d+/g, '')
                .replace(/كامل/g, '')
                .replace(/\s+-\s+$/g, '')
                .replace(/\s+/g, ' ')
                .trim();
}

// ============ 4. معالج الكتالوجات (قفل الحلقات المكررة قسرياً) ============
async function catalogHandler({ type, id, extra }) {
    const skip = parseInt(extra.skip) || 0;
    const search = extra.search || '';
    const page = Math.floor(skip / 30) + 1;

    const categoryPath = CATALOG_MAP[id] || "/category/arabic-movies-6/";
    const targetUrl = page > 1 ? `${BASE_URL}${categoryPath}page/${page}/` : `${BASE_URL}${categoryPath}`;

    let htmlData = await getHtmlSmartly(search ? 'search' : 'get_links', targetUrl, search);
    if (!htmlData) return { metas: [] };

    const $ = cheerio.load(htmlData);
    const metas = [];
    const seenSeries = new Set();

    $('.MovieBlock, .Block--Item, article, .Small--Box, .movie__block, .post-list, a.movie__block').each((i, el) => {
        const $el = $(el);
        let link = $el.attr('href') || $el.find('a').first().attr('href');
        let title = $el.attr('title') || $el.find('h3, h4, .BlockTitle, .Title, p').first().text().trim() || $el.find('img').first().attr('alt');
        let poster = $el.find('img').first().attr('data-src') || $el.find('img').first().attr('src');

        if (link && title) {
            if (!link.startsWith('http')) link = new URL(link, BASE_URL).href;
            if (poster) {
                if (!poster.startsWith('http')) poster = new URL(poster, BASE_URL).href;
                poster = poster.replace(/https?:\/\/[^/]+/g, BASE_URL);
            }

            let isSeriesItem = type === "series" || id.includes("series") || title.includes("مسلسل") || title.includes("الحلقة") || title.includes("حلقة");

            if (isSeriesItem) {
                const cleanName = cleanSeriesTitle(title);
                if (seenSeries.has(cleanName)) return; // كبح التكرار نهائياً في الواجهة الزرقاء لستريميو
                seenSeries.add(cleanName);

                metas.push({
                    id: 'as_' + Buffer.from(link).toString('base64url'), // المعرف قياسي وصافي لتجنب تعارض النظام
                    type: "series",
                    name: cleanName, // الاسم الموحد النظيف بدون أرقام الحلقات
                    poster: poster || '',
                    posterShape: 'poster'
                });
            } else {
                metas.push({
                    id: 'as_' + Buffer.from(link).toString('base64url'),
                    type: "movie",
                    name: title,
                    poster: poster || '',
                    posterShape: 'poster'
                });
            }
        }
    });

    return { metas };
}

// ============ 5. معالج الميتا (استخراج شبكة الحلقات والمواسم بالكامل) ============
async function metaHandler({ type, id }) {
    if (!id.startsWith('as_')) return { meta: {} };
    try {
        const pageUrl = Buffer.from(id.replace('as_', ''), 'base64url').toString();
        const htmlData = await getHtmlSmartly('get_links', pageUrl);
        if (!htmlData) return { meta: {} };

        const $ = cheerio.load(htmlData);
        let name = $('h1').first().text().trim() || $('title').text().trim();
        let poster = $('.Poster img, .single-thumb img, .movie-poster img').first().attr('src') || $('.post__image img').first().attr('data-src');
        const description = $('.descrip, .StoryLine, .story').first().text().trim();

        if (poster) poster = poster.replace(/https?:\/\/[^/]+/g, BASE_URL);

        let cleanName = cleanSeriesTitle(name);

        const meta = { id, type, name: cleanName, poster, background: poster, description, genres: ["عرب سيد"] };
        $('.Genre a, .genres a').each((i, el) => meta.genres.push($(el).text().trim()));

        if (type === 'series') {
            const videos = [];
            
            // قراءة أزرار الحلقات والمواسم من داخل الصفحة مباشرة
            const epSelectors = '.EpisodesList a, .episodes-list a, .EpsList a, .Sub_EpsList a, .post_episodes a, ul.episodes-list li a, .episodes__grid a';
            
            $(epSelectors).each((i, el) => {
                const epUrl = $(el).attr('href');
                let epTitle = $(el).text().trim() || `الحلقة ${i + 1}`;
                if (epUrl && epUrl.startsWith('http')) {
                    const epMatch = epTitle.match(/(\d+)/);
                    const epNumber = epMatch ? parseInt(epMatch[1]) : (i + 1);

                    videos.push({
                        id: 'as_' + Buffer.from(epUrl).toString('base64url'),
                        title: epTitle.includes("الحلقة") ? epTitle : `الحلقة ${epTitle}`,
                        season: 1, 
                        episode: epNumber,
                        released: new Date(Date.now() - (i * 60000)).toISOString()
                    });
                }
            });

            if (videos.length > 0) {
                const uniqueVideos = [];
                const seenEps = new Set();
                videos.reverse().forEach(v => {
                    if (!seenEps.has(v.episode)) {
                        seenEps.add(v.episode);
                        uniqueVideos.push(v);
                    }
                });
                meta.videos = uniqueVideos.sort((a, b) => a.episode - b.episode);
            } else {
                // إذا لم يجد أزرار (صفحة مستقلة)، يعرضها كحلقة أولى منفردة داخل المسلسل لضمان التشغيل
                meta.videos = [{
                    id: id,
                    title: name,
                    season: 1,
                    episode: 1,
                    released: new Date().toISOString()
                }];
            }
        }
        return { meta };
    } catch (err) { return { meta: {} }; }
}

// ============ 6. معالج البث والمصادر المباشرة ============
async function streamHandler({ type, id }) {
    const streams = [];
    try {
        let watchUrl = "";
        if (id.startsWith('as_')) {
            const pageUrl = Buffer.from(id.replace('as_', ''), 'base64url').toString();
            watchUrl = pageUrl.endsWith('/watch/') ? pageUrl : pageUrl.replace(/\/$/, '') + '/watch/';
        } 
        else if (id.startsWith('tt')) {
            const metaResponse = await fetch(`https://v3-cinemeta.stremio.com/meta/${type}/${id}.json`);
            const metaData = await metaResponse.json();
            const mediaTitle = metaData.meta ? metaData.meta.name : "";
            if (!mediaTitle) return { streams: [] };

            const searchHtml = await getHtmlSmartly('search', '', mediaTitle);
            if (!searchHtml) return { streams: [] };
            
            const $s = cheerio.load(searchHtml);
            let targetPageUrl = $s('.MovieBlock a, .Block--Item a, article a, .movie__block a, a.movie__block').first().attr('href');
            if (!targetPageUrl) return { streams: [] };

            watchUrl = targetPageUrl.endsWith('/watch/') ? targetPageUrl : targetPageUrl.replace(/\/$/, '') + '/watch/';
        }

        const watchHtml = await getHtmlSmartly('get_links', watchUrl);
        if (!watchHtml) return { streams: [] };
        
        const servers = [];
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

        const $w = cheerio.load(watchHtml);
        $w('iframe').each((i, elem) => {
            const src = $w(elem).attr('src');
            if (src && src.startsWith('http') && !servers.some(s => s.link === src)) {
                servers.push({ name: `سيرفر بث ${i + 1}`, link: src });
            }
        });

        const optimizedServers = servers.slice(0, 3);
        for (const server of optimizedServers) {
            let serverHtml = await getHtmlSmartly('get_links', server.link);
            if (!serverHtml) continue;

            if (serverHtml.includes("eval(function(p,a,c,k,e,")) {
                const matchJS = /eval\(function\(p,a,c,k,e,[dr]\).*?\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)/s.exec(serverHtml);
                if (matchJS) {
                    try {
                        let payload = matchJS[1]; const radix = parseInt(matchJS[2]); const symtab = matchJS[4].split('|');
                        const unbase = (str) => { let res = 0; for (let i = 0; i < str.length; i++) { const c = str[i]; const v = /[0-9]/.test(c) ? parseInt(c) : c.charCodeAt(0) - 87; res = res * radix + v; } return res; };
                        const unpacked = payload.replace(/\b\w+\b/g, (word) => { const idx = unbase(word); return (symtab[idx] && symtab[idx] !== '') ? symtab[idx] : word; });
                        serverHtml += "\n" + unpacked;
                    } catch (e) {}
                }
            }

            const m3u8Matches = serverHtml.match(/https?:\/\/[^\s"'<>\\)]+\.m3u8[^\s"'<>\\)]*/gi);
            if (m3u8Matches) {
                [...new Set(m3u8Matches)].forEach(videoUrl => {
                    streams.push({
                        title: `▶️ ${server.name}\n🔗 الجودة: تلقائية HLS`,
                        url: videoUrl.replace(/\\\//g, '/'),
                        behaviorHints: { notWebReady: false, proxyHeaders: { request: { "Referer": server.link, "User-Agent": "Mozilla/5.0" } } }
                    });
                });
            }

            const mp4Matches = serverHtml.match(/https?:\/\/[^\s"'<>\\)]+\.mp4[^\s"'<>\\)]*/gi);
            if (mp4Matches) {
                [...new Set(mp4Matches)].forEach(videoUrl => {
                    streams.push({
                        title: `▶️ ${server.name}\n🔗 الجودة: سورس مباشر MP4`,
                        url: videoUrl.replace(/\\\//g, '/'),
                        behaviorHints: { notWebReady: false, proxyHeaders: { request: { "Referer": server.link, "User-Agent": "Mozilla/5.0" } } }
                    });
                });
            }
        }

        if (streams.length === 0) {
            streams.push({ name: "ArabSeed Web", title: "🌐 فتح صفحة المشاهدة الخارجية المباشرة", externalUrl: watchUrl });
        }

        return { streams };
    } catch (err) { return { streams: [] }; }
}

builder.defineCatalogHandler(catalogHandler);
builder.defineMetaHandler(metaHandler);
builder.defineStreamHandler(streamHandler);

const addonInterface = builder.getInterface();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

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
