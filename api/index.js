// api/index.js
const { addonBuilder } = require("stremio-addon-sdk");
const cheerio = require("cheerio");
const querystring = require("querystring");

// ============ 1. الإعدادات السحابية ورابط البروكسي و ViperTLS ============
const VIPER_SOLVER_URL = "https://test-1-eight-zeta.vercel.app/solve"; 
const GOOGLE_PROXY_URL = "https://script.google.com/macros/s/AKfycbwzwsaeYrNMVo39ot5D2ah72SWsN1NaKa-_0yagRowbZNnByWwBiu94mO6mAUjwVGhSrQ/exec";
const BASE_URL = "https://m.asd.ink";

// خريطة الأقسام الرسمية لتدفق البوسترات كاملة وبدون تكرار لعام 2026
const CATALOG_MAP = {
    "as_arabic_movies": "/category/arabic-movies-6/",
    "as_foreign_movies": "/category/foreign-movies-6/",
    "as_netflix_movies": "/category/netfilx/%D8%A7%D9%81%D9%84%D8%A7%D9%85-netfilx/",
    "as_indian_movies": "/category/indian-movies/",
    "as_asian_movies": "/category/asian-movies/",
    "as_turkish_movies": "/category/turkish-movies/",
    "as_dubbed_movies": "/category/%D8%A7%D9%81%D9%84%D8%A7%D9%85-%D9%85%D8%AF%D8%A8%D9%84%D8%AC%D8%A9-1/",
    "as_animation_movies": "/category/animation-movies/",
    "as_wrestling": "/category/wwe-shows/",
    "as_plays": "/category/%D9%85%D8%B3%D8%B1%D8%AD%D9%8A%D8%A7%D8%AA-%D8%B9%D8%B1%D8%A8%D9%8I/",
    
    "as_arabic_series": "/category/arabic-series-14/",
    "as_egyptian_series": "/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D9%85%D8%B5%D8%B1%D9%8A%D9%8ه/",
    "as_foreign_series": "/category/foreign-series-7/",
    "as_netflix_series": "/category/netflix/netflix-series/",
    "as_turkish_series": "/category/turkish-series-2/",
    "as_indian_series": "/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D9%84%D9%86%D8%AF%D9%8A%D8%A9/",
    "as_korean_series": "/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D9%82%D9%88%D8%B1%D9%8A%D9%8ه/", 
    "as_dubbed_series": "/category/dubbed-series/",
    "as_cartoon_series": "/category/cartoon-series/",
    "as_tv_shows": "/category/%D8%A8%D8%B1%D8%A7%D9%85%D8%ac-%D8%AA%D9%84%D9%81%D8%B2%D9%8A%D9%88%D9%86%D9%8ا%D9%8A%D8%A9/",
    "as_ramadan_2025": "/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D8%b1%D9%85%D8%b6%d8%a7%d9%86/ramadan-series-2025/"
};

const manifest = {
    id: "org.dexworld.arabseed.premium.max.v26", // تصفير الكاش بالكامل لإطلاق التعديلات الحديثة
    name: "ArabSeed Premium Max v26 - Universal Stream Fix",
    version: "26.0.0",
    description: "تجميع حديدي للكتالوجات مع تفعيل وإصلاح بث الأفلام والمسلسلات الخارجية من أي إضافة بـ ViperTLS",
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
        { type: "series", id: "as_arabic_series", name: "عرب سيد - مسلسلات عربية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_egyptian_series", name: "عرب سيد - مسلسلات مصرية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_foreign_series", name: "عرب سيد - مسلسلات أجنبية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_netflix_series", name: "عرب سيد - مسلسلات Netflix", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_turkish_series", name: "عرب سيد - مسلسلات تركية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_indian_series", name: "عرب سيد - مسلسلات هندية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_korean_series", name: "عرب سيد - مسلسلات آسيوية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_cartoon_series", name: "عرب سيد - مسلسلات كرتون", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
        { type: "series", id: "as_tv_shows", name: "عرب سيد - برامج تلفزيونية", extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }] },
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
            if (data && data.html && !data.html.includes("Just a moment...") && data.html.length > 1000) {
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
            if (text && !text.includes("Just a moment...") && text.length > 1000) {
                return text;
            }
        }
    } catch (err) {}
    return null;
}

function cleanSeriesTitle(title) {
    if (!title) return "";
    let cleaned = title.trim();
    cleaned = cleaned.replace(/(الحلقة|حلقة|الموسم|موم|موسم|الموسم\s+الأول|الموسم\s+الثاني|الموسم\s+الثالث|الموسم\s+الرابع|الموسم\s+الخامس|الموسم\s+العاشر|العاشرة|والأخيرة|كامل|مترجم|مدبلج|بجودة|عالية|اون\s+لاين).*/g, '');
    cleaned = cleaned.replace(/^(مسلسل|فيلم|flem|فلم|أفلام|افلام)\s+/g, '');
    return cleaned.replace(/\s+-\s+$/g, '').replace(/\s+/g, ' ').trim();
}

// ============ 4. معالج الكتالوجات (التجميع بالاسم لمنع التكرار) ============
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
    const seenSeriesNames = new Set(); 

    const selectors = 'a.movie__block, .Block--Item, article.post, .movie__block, .MovieBlock, a.episode__item';
    
    $(selectors).each((i, el) => {
        const $el = $(el);
        let link = $el.attr('href') || $el.find('a').first().attr('href');
        let title = $el.attr('title') || $el.find('.post__info h3, h3, h4, .BlockTitle, .episode__title span').first().text().trim() || $el.find('img').first().attr('alt');
        let poster = $el.find('img').first().attr('data-src') || $el.find('img').first().attr('src');

        if (link && title) {
            if (!link.startsWith('http')) link = new URL(link, BASE_URL).href;
            if (poster) {
                if (!poster.startsWith('http')) poster = new URL(poster, BASE_URL).href;
                poster = poster.replace(/https?:\/\/[^/]+/g, BASE_URL);
            }

            let isSeriesItem = type === "series" || id.includes("series") || id.includes("shows") || title.includes("مسلسل") || title.includes("الحلقة") || title.includes("حلقة");

            if (isSeriesItem) {
                const cleanName = cleanSeriesTitle(title);
                if (seenSeriesNames.has(cleanName)) return; 
                seenSeriesNames.add(cleanName);

                metas.push({
                    id: 'as_' + Buffer.from(link).toString('base64url'),
                    type: "series",
                    name: cleanName, 
                    poster: poster || '',
                    posterShape: 'poster'
                });
            } else {
                let cleanMovieName = cleanSeriesTitle(title); 
                metas.push({
                    id: 'as_' + Buffer.from(link).toString('base64url'),
                    type: "movie",
                    name: cleanMovieName,
                    poster: poster || '',
                    posterShape: 'poster'
                });
            }
        }
    });

    return { metas };
}

// ============ 5. معالج الميتا (تجميع وقراءة صندوق الحلقات) ============
async function metaHandler({ type, id }) {
    if (!id.startsWith('as_')) return { meta: {} };
    try {
        const pageUrl = Buffer.from(id.replace('as_', ''), 'base64url').toString();
        const htmlData = await getHtmlSmartly('get_links', pageUrl);
        if (!htmlData) return { meta: {} };

        const $ = cheerio.load(htmlData);
        let name = $('.post__title h1').text().trim() || $('h1').first().text().trim() || $('title').text().trim();
        let poster = $('.poster__single img, .Poster img, .single-thumb img').first().attr('src') || $('.poster__single img, .post__image img').first().attr('data-src');
        const description = $('.story__text, .descrip, .StoryLine').first().text().trim();

        if (poster) poster = poster.replace(/https?:\/\/[^/]+/g, BASE_URL);

        let cleanName = cleanSeriesTitle(name);

        const meta = { id, type, name: cleanName, poster, background: poster, description: description || `مسلسل ${cleanName}`, genres: ["عرب سيد"] };
        $('.Genre a, .genres a').each((i, el) => meta.genres.push($(el).text().trim()));

        if (type === 'series') {
            const videos = [];
            const epSelectors = '.episodes__list a, .seasons__list a, .EpisodesList a, .episodes-list a, .EpsList a, .episodes__grid a, .episodes__list li a';
            
            $(epSelectors).each((i, el) => {
                const epUrl = $(el).attr('href');
                let epTitle = $(el).text().trim() || `الحلقة ${i + 1}`;
                if (epUrl) {
                    const epMatch = epTitle.match(/(\d+)/);
                    const epNumber = epMatch ? parseInt(epMatch[1]) : (i + 1);

                    videos.push({
                        id: 'as_' + Buffer.from(epUrl).toString('base64url'),
                        title: `الحلقة ${epNumber}`,
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

// ============ 6. محرك البث العام المصلح والمحمي بالكامل 100% للأفلام والمسلسلات الخارجيّة ============
async function getDirectLinks(stremioId, type) {
    const streams = [];
    try {
        let watchUrl = "";

        // أ) إذا كان الطلب قادم من كتالوج عرب سيد المجمّع الخاص بنا
        if (stremioId.startsWith('as_')) {
            watchUrl = Buffer.from(stremioId.replace('as_', ''), 'base64url').toString();
        } 
        // ب) فكرتك العبقرية: إذا كان الطلب قادم من أي كتالوج خارجي يحمل معرف IMDb صافي (tt...)
        else if (stremioId.startsWith('tt')) {
            const parts = stremioId.split(':');
            const imdbId = parts[0];
            const isSeries = parts.length > 1;

            // جلب الاسم الأصلي للمادة من API سينيميتا العالمي
            const metaResponse = await fetch(`https://v3-cinemeta.stremio.com/meta/${isSeries ? 'series' : 'movie'}/${imdbId}.json`);
            const metaData = await metaResponse.json();
            if (!metaData || !metaData.meta) return [];

            const mediaTitle = metaData.meta.name;
            let searchQuery = mediaTitle;

            // إذا كان مسلسلاً، نصيغ نص البحث بالكامل مع الحلقة والموسم للوصول لصفحة الحلقة في عرب سيد فورا
            if (isSeries && parts.length > 2) {
                const seasonNum = parseInt(parts[1]);
                const episodeNum = parseInt(parts[2]);
                searchQuery = `${mediaTitle} الموسم ${seasonNum} الحلقة ${episodeNum}`;
            }

            console.log(`[Universal Search] جاري البحث العكسي عن المادة: ${searchQuery}`);
            const searchHtml = await getHtmlSmartly('search', '', searchQuery);
            if (!searchHtml) return [];
            
            const $s = cheerio.load(searchHtml);
            let targetPageUrl = $s('a.movie__block, .MovieBlock a, .Block--Item a, article a').first().attr('href');
            if (!targetPageUrl) return [];

            watchUrl = targetPageUrl;
        }

        if (!watchUrl) return [];

        const watchHtml = await getHtmlSmartly('get_links', watchUrl);
        if (!watchHtml) return [];
        
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
            let src = $w(elem).attr('src');
            if (src) {
                if (src.startsWith('//')) src = 'https:' + src;
                if (!servers.some(s => s.link === src)) {
                    servers.push({ name: `سيرفر بث ${i + 1}`, link: src });
                }
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
                        title: `▶️ [ArabSeed Premium]\n🔗 الجودة: تلقائية HLS`,
                        url: videoUrl.replace(/\\\//g, '/'),
                        behaviorHints: { notWebReady: false, proxyHeaders: { request: { "Referer": server.link, "User-Agent": "Mozilla/5.0" } } }
                    });
                });
            }

            const mp4Matches = serverHtml.match(/https?:\/\/[^\s"'<>\\)]+\.mp4[^\s"'<>\\)]*/gi);
            if (mp4Matches) {
                [...new Set(mp4Matches)].forEach(videoUrl => {
                    streams.push({
                        title: `▶️ [ArabSeed Premium]\n🔗 الجودة: سورس مباشر MP4`,
                        url: videoUrl.replace(/\\\//g, '/'),
                        behaviorHints: { notWebReady: false, proxyHeaders: { request: { "Referer": server.link, "User-Agent": "Mozilla/5.0" } } }
                    });
                });
            }
        }

        if (streams.length === 0) {
            streams.push({ name: "ArabSeed Web", title: "🌐 فتح صفحة المشاهدة الخارجية المباشرة", externalUrl: watchUrl });
        }

    } catch (err) { console.error(err); }
    return streams;
}

builder.defineCatalogHandler(catalogHandler);
builder.defineMetaHandler(metaHandler);
builder.defineStreamHandler(async (args) => {
    const streams = await getDirectLinks(args.id, args.type);
    return { streams };
});

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
        const [, type, encodedId] = streamMatch;
        let fullId = decodeURIComponent(encodedId);
        // إصلاح وتوجيه المعرف الممرر بالكامل بالبادئة الصريحة لتشغيل مصادر البث الخارجية والداخلية بنجاح
        if (!fullId.startsWith('as_') && !fullId.startsWith('tt') && fullId.includes('as_')) {
            fullId = fullId.substring(fullId.indexOf('as_'));
        }
        const result = await getDirectLinks(fullId, type);
        return res.status(200).json({ streams: result });
    }

    return res.status(404).json({ error: 'Not found' });
}
