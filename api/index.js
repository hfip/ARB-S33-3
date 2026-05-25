// api/index.js
const { addonBuilder } = require("stremio-addon-sdk");
const cheerio = require("cheerio");
const querystring = require("querystring");

// ============ 1. الإعدادات السحابية ورابط البروكسي ============
const VIPER_SOLVER_URL = "https://test-1-eight-zeta.vercel.app/solve"; 
const GOOGLE_PROXY_URL = "https://script.google.com/macros/s/AKfycbwzwsaeYrNMVo39ot5D2ah72SWsN1NaKa-_0yagRowbZNnByWwBiu94mO6mAUjwVGhSrQ/exec";
const BASE_URL = "https://m.asd.ink";

// ============ 2. الـ Manifest المطور كـ محرك بث عام ============
const manifest = {
    id: "org.dexworld.arabseed.universal.v22", // تصفير الكاش بالكامل لإطلاق محرك البث العام
    name: "DexWorld ArabSeed Universal Premium v22",
    version: "22.0.0",
    description: "محرك البث العام والذكي لعرب سيد - يدعم بث الأفلام والمسلسلات من أي كتالوج خارجي أو عالمي داخل ستريميو",
    logo: "https://m.asd.ink/wp-content/uploads/2023/01/cropped-Untitled-1-1-192x192.png",
    resources: ["stream"], // نكتفي برصيد الستريم ليعمل كمحرك بث خلفي عام ومستقر للأبد
    types: ["movie", "series"],
    idPrefixes: ["tt", "as_"]
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

// ============ 4. محرك سحب وتفكيك الروابط الذكي العام من أي كتالوج ============
async function getDirectLinks(stremioId, type) {
    const streams = [];
    try {
        let watchUrl = "";

        // أ) إذا كان الطلب محلي من المعرفات السابقة الخاصة بنا
        if (stremioId.startsWith('as_')) {
            watchUrl = Buffer.from(stremioId.replace('as_', ''), 'base64url').toString();
        } 
        // ب) الفكرة العبقرية: إذا كان الطلب قادم من أي كتالوج خارجي أو عالمي يحمل معرف IMDb (tt...)
        else if (stremioId.startsWith('tt')) {
            const parts = stremioId.split(':');
            const imdbId = parts[0];
            const isSeries = type === 'series' || parts.length > 1;

            // 1. جلب اسم المادة الفعلي من API سينيميتا العالمي لمعرفته باللغة العربية والإنجليزية
            const metaResponse = await fetch(`https://v3-cinemeta.stremio.com/meta/${type}/${imdbId}.json`);
            const metaData = await metaResponse.json();
            if (!metaData || !metaData.meta) return [];

            const mediaTitle = metaData.meta.name;
            let searchQuery = mediaTitle;

            // 2. إذا كان مسلسلاً خارجيّاً، نقوم بصياغة نص البحث بذكاء للوصول لصفحة الحلقة الدقيقة مباشرة في عرب سيد
            if (isSeries && parts.length > 2) {
                const seasonNum = parseInt(parts[1]);
                const episodeNum = parseInt(parts[2]);
                // هندسة البحث العكسي: "اسم المسلسل الموسم 1 الحلقة 3"
                searchQuery = `${mediaTitle} الموسم ${seasonNum} الحلقة ${episodeNum}`;
            }

            console.log(`[Universal] جاري البحث العكسي في عرب سيد عن: ${searchQuery}`);
            const searchHtml = await getHtmlSmartly('search', '', searchQuery);
            if (!searchHtml) return [];
            
            const $s = cheerio.load(searchHtml);
            // قراءة رابط أول نتيجة بحث مطابقة تظهر في الشبكة
            let targetPageUrl = $s('a.movie__block, .MovieBlock a, .Block--Item a, article a').first().attr('href');
            if (!targetPageUrl) return [];

            watchUrl = targetPageUrl;
        }

        if (!watchUrl) return [];

        // 3. جلب الـ HTML لصفحة العرض المفكوكة لقراءة المشغلات
        const watchHtml = await getHtmlSmartly('get_links', watchUrl);
        if (!watchHtml) return [];
        
        const servers = [];
        // فك شفرات روابط play.php?url=BASE64 القياسية للموقع
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

        // سحب مشغلات الـ iframes والـ GameHub
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

        // 4. فك روابط الفيديو المباشرة الساخنة (.mp4 / .m3u8) بالتوازي بالتزوير السحابي
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
                        title: `▶️ [ArabSeed Universal]\n🔗 المصدر: جودة تلقائية HLS`,
                        url: videoUrl.replace(/\\\//g, '/'),
                        behaviorHints: { notWebReady: false, proxyHeaders: { request: { "Referer": server.link, "User-Agent": "Mozilla/5.0" } } }
                    });
                });
            }

            const mp4Matches = serverHtml.match(/https?:\/\/[^\s"'<>\\)]+\.mp4[^\s"'<>\\)]*/gi);
            if (mp4Matches) {
                [...new Set(mp4Matches)].forEach(videoUrl => {
                    streams.push({
                        title: `▶️ [ArabSeed Universal]\n🔗 المصدر: سورس مباشر MP4`,
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

// ربط معالج البث الموحد العام بـ SDK
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

    // راوتر معالجة البث العام الذكي الذي يستقبل الطلبات من أي إضافة أو كتالوج في الواجهة
    const streamMatch = url.match(/^\/stream\/([^/]+)\/(.+)\.json$/);
    if (streamMatch) {
        const [, type, encodedId] = streamMatch;
        const fullId = decodeURIComponent(encodedId);
        const result = await getDirectLinks(fullId, type);
        return res.status(200).json({ streams: result });
    }

    return res.status(404).json({ error: 'Not found' });
}
