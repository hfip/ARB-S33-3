// api/index.js
const { addonBuilder } = require("stremio-addon-sdk");
const cheerio = require("cheerio");
const querystring = require("querystring");

// ============ 1. الإعدادات السحابية ورابط ViperTLS المحصن ============
const VIPER_SOLVER_URL = "https://test-1-eight-zeta.vercel.app/solve"; 
const GOOGLE_PROXY_URL = "https://script.google.com/macros/s/AKfycbwzwsaeYrNMVo39ot5D2ah72SWsN1NaKa-_0yagRowbZNnByWwBiu94mO6mAUjwVGhSrQ/exec";
const BASE_URL = "https://m.asd.ink";

// خريطة الأقسام الرسمية المحدثة والمطابقة لترميز المتصفح الأصلي لتدفق الكتالوجات كاملة
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
    "as_plays": "/category/%D9%85%D8%B3%D8%B1%D8%AD%D9%8A%D8%A7%D8%AA-%D8%B9%D8%B1%D8%A8%D9%8A/",
    
    // تصحيح مسارات أقسام المسلسلات بناءً على روابط الدومين المباشرة بالحروف الكبيرة المقروءة في المتصفح
    "as_arabic_series": "/category/arabic-series-14/",
    "as_egyptian_series": "/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D9%85%D8%B5%D8%B1%D9%8A%D9%87/",
    "as_foreign_series": "/category/foreign-series-7/",
    "as_netflix_series": "/category/netflix/netflix-series/",
    "as_turkish_series": "/category/turkish-series-2/",
    "as_indian_series": "/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D9%87%D9%86%D8%AF%D9%8A%D8%A9/",
    "as_korean_series": "/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D9%83%D9%88%D8%B1%D9%8A%D9%87/", 
    "as_dubbed_series": "/category/dubbed-series/",
    "as_cartoon_series": "/category/cartoon-series/",
    "as_tv_shows": "/category/%D8%A8%D8%B1%D8%A7%D9%85%D8%AC-%D8%AA%D9%84%D9%81%D8%B2%D9%8A%D9%88%D9%86%D9%8A%D8%A9/",
    "as_ramadan_2025": "/category/%D9%85%D8%B3%D9%84%D8%B3%D9%84%D8%A7%D8%AA-%D8%b1%D9%85%D8%b6%D8%a7%d9%86/ramadan-series-2025/"
};

// ============ 2. الـ Manifest الـ Premium الموحد المستقر لستريميو ============
const manifest = {
    id: "org.dexworld.arabseed.premium.max.v19", // تصفير كاش ستريميو بالكامل الحين لإقلاع المنظومة الحديثة
    name: "ArabSeed Premium Max v19 - Fixed",
    version: "19.0.0",
    description: "تجميع وتفجير الكتالوجات بالسيليكتور الحديث المستخرج من سورس المتصفح لعرب سيد مع تشغيل البث",
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
            if (data && data.html && !data.html.includes("Just a moment...") && data.html.length > 1500) {
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
            if (text && !text.includes("Just a moment...") && text.length > 1500) {
                return text;
            }
        }
    } catch (err) {}
    return null;
}

// دالة التطهير الفائقة المطورة لحذف كلمات البدايات والنهايات تماماً لبوسترات نظيفة
function cleanSeriesTitle(title) {
    if (!title) return "";
    let cleaned = title.trim();
    cleaned = cleaned.replace(/(الحلقة|حلقة|الموسم|موم|موسم|الموسم\s+الأول|الموسم\s+الثاني|الموسم\s+الثالث|الموسم\s+الرابع|الموسم\s+الخامس|الموسم\s+العاشر|العاشرة|والأخيرة|كامل|مترجم|مدبلج|بجودة|عالية|اون\s+لاين).*/g, '');
    cleaned = cleaned.replace(/^(مسلسل|فيلم|flem|فلم|أفلام|افلام)\s+/g, '');
    return cleaned.replace(/\s+-\s+$/g, '').replace(/\s+/g, ' ').trim();
}

// ============ 4. معالج الكتالوجات (قراءة حاوية البوستر مباشرة وتفجير القوائم كاملة) ============
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

    // السيلكتور المصلح والقاطع: يقرأ عنصر البوستر الرئيسي a.movie__block مباشرة من سورس المتصفح
    // تم تعديل السيلكتور ليشمل العناصر التي تمثل المسلسلات بشكل كامل في صفحات التصنيفات
    $('.Block--Item, article.post, .movie__block, .MovieBlock, .Category--Items .MovieBlock, .Category--Items .Block--Item').each((i, el) => {
        const $el = $(el);
        
        let link = $el.find('a').first().attr('href');
        let title = $el.find('.post__title h3, .MovieBlock--Title, .Block--Item--Title').first().text().trim() || $el.find('img').first().attr('alt');
        let poster = $el.find('img').first().attr('data-src') || $el.find('img').first().attr('src');

        if (link && title) {
            if (!link.startsWith('http')) link = new URL(link, BASE_URL).href;
            if (poster) {
                if (!poster.startsWith('http')) poster = new URL(poster, BASE_URL).href;
                poster = poster.replace(/https?:\/\/[^/]+/g, BASE_URL);
            }

            // التحقق مما إذا كان العنصر هو مسلسل وليس حلقة
            // يمكننا تحسين هذا بالتحقق من وجود كلمة "مسلسل" في الرابط أو العنوان، أو بنية الرابط
            let isSeriesEntry = type === "series" && !link.includes("-eps") && !link.includes("الحلقة");

            if (isSeriesEntry) {
                const cleanName = cleanSeriesTitle(title);
                // نستخدم رابط المسلسل الرئيسي بدلاً من رابط الحلقة
                const seriesLink = link.includes("/selary/") ? link : link.split("/").slice(0, -2).join("/") + "/"; // محاولة استنتاج رابط المسلسل
                
                if (seenSeries.has(cleanName)) return; 
                seenSeries.add(cleanName);

                metas.push({
                    id: 'as_' + Buffer.from(seriesLink).toString('base64url'),
                    type: "series",
                    name: cleanName, 
                    poster: poster || '',
                    posterShape: 'poster'
                });
            } else if (type === "movie") {
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
        // التأكد من أننا نذهب إلى صفحة المسلسل الرئيسية وليس صفحة حلقة
        let seriesPageUrl = pageUrl;
        if (!seriesPageUrl.includes("/selary/")) {
            // محاولة استنتاج رابط صفحة المسلسل من رابط الحلقة
            const parts = seriesPageUrl.split("/");
            // إزالة الجزء الأخير (الحلقة) والجزء الذي يسبقه (s1-eps82)
            seriesPageUrl = parts.slice(0, -2).join("/") + "/";
        }

        const htmlData = await getHtmlSmartly('get_links', seriesPageUrl);
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

// ============ 6. محرك سحب البث وتفكيك التشفير المباشر بـ ViperTLS ============
async function getDirectLinks(idOrImdb, type) {
    const streams = [];
    try {
        let watchUrl = "";
        let finalId = idOrImdb;

        if (!finalId.startsWith('as_') && !finalId.startsWith('tt')) {
            finalId = 'as_' + finalId;
        }

        if (finalId.startsWith('as_')) {
            watchUrl = Buffer.from(finalId.replace('as_', ''), 'base64url').toString();
        } 
        else if (finalId.startsWith('tt')) {
            const metaResponse = await fetch(`https://v3-cinemeta.stremio.com/meta/${type}/${finalId}.json`);
            const metaData = await metaResponse.json();            const mediaTitle = metaData.meta ? m
(Content truncated due to size limit. Use line ranges to read remaining content)
