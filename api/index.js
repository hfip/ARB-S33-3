const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

// الرابط الخارق الجديد الخاص بك على Hugging Face لتخطي الحمايات والـ Cloudflare قسرياً
const VIPER_SOLVER_URL = "https://hfip-universal-scrapling-solver.hf.space/solve";

const manifest = {
    id: "community.arabseed.addon",
    version: "1.0.0",
    name: "ArabSeed Viper Solver",
    description: "إضافة عرب سيد المحصنة لتخطي الحمايات وبث الأفلام والمسلسلات العربية والأجنبية",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"],
    catalogs: []
};

const builder = new addonBuilder(manifest);

// دالة الاتصال المباشر بالسيرفر الخارق لتخطي الحماية وجلب الـ HTML الصافي
async function fetchViaViperSolver(targetUrl) {
    try {
        console.log(`[Viper Node] Sending request to Hugging Face Solver for: ${targetUrl}`);
        const response = await axios.post(VIPER_SOLVER_URL, {
            url: targetUrl
        }, {
            headers: { "Content-Type": "application/json" },
            timeout: 25000 // مهلة 25 ثانية لضمان إقلاع الكروميوم المخفي وجلب البيانات
        });

        if (response.data && response.data.html) {
            return response.data.html;
        }
        return null;
    } catch (error) {
        console.error("[Viper Node] Solver Error:", error.message);
        return null;
    }
}

// معالج جلب روابط البث (Stream Handler)
builder.defineStreamHandler(async ({ type, id }) => {
    const streams = [];
    try {
        // تنظيف المعرف واستخراج رقم الـ IMDb
        const imdbId = id.split(":")[0];
        console.log(`[Viper Node] Requested ID: ${imdbId} | Type: ${type}`);

        // 1. بناء رابط البحث الديناميكي في عرب سيد بناءً على معرف الـ IMDb
        const searchUrl = `https://arabseed.show/find/?q=${imdbId}`;
        
        // 2. إرسال رابط البحث للسيرفر الخارق لتخطي الحماية
        const searchHtml = await fetchViaViperSolver(searchUrl);
        if (!searchHtml) return { streams: [] };

        let $ = cheerio.load(searchHtml);
        
        // 3. كشط رابط صفحة المادة من نتائج البحث
        let moviePageUrl = "";
        $(".MovieBlock, .Block--Item, article, .Small--Box").each((i, el) => {
            const href = $(el).find("a").attr("href");
            if (href && href.includes(imdbId)) {
                moviePageUrl = href;
                return false; // إيقاف الحلقة فور العثور على التطابق
            }
        });

        // إذا لم يعثر عليه بالـ IMDb، نأخذ أول رابط متاح كخيار احتياطي
        if (!moviePageUrl) {
            moviePageUrl = $(".MovieBlock a, .Block--Item a, article a").first().attr("href");
        }

        if (!moviePageUrl) {
            console.log("[Viper Node] Media page url not found in search results");
            return { streams: [] };
        }

        // إذا كان الطلب لمسلسل، نقوم بتركيب مسار الحلقة بناءً على الهيكلية الديناميكية
        if (type === "series") {
            const parts = id.split(":");
            const season = parts[1];
            const episode = parts[2];
            // تحويل الرابط تلقائياً ليتوافق مع هيكلية الحلقات (مثال: /season/فصل-1/episode/حلقة-1)
            moviePageUrl = moviePageUrl.replace("/movie/", "/series/")
                           + `season/فصل-${season}/episode/حلقة-${episode}`;
        }

        console.log(`[Viper Node] Fetching Media Page: ${moviePageUrl}`);

        // 4. إرسال رابط صفحة المادة للسيرفر الخارق لجلب سيرفرات المشاهدة
        const mediaHtml = await fetchViaViperSolver(moviePageUrl);
        if (!mediaHtml) return { streams: [] };

        $ = cheerio.load(mediaHtml);

        // 5. كشط روابط مشغل البث (مثل روابط الـ iframe أو الـ جيت ليرز)
        const watchLinks = [];
        $("iframe, [data-url], .watch-server, ul.ServersList li").each((i, el) => {
            let src = $(el).attr("src") || $(el).attr("data-url") || $(el).attr("data-iframe");
            if (src) {
                // تصفية وتنظيف الروابط لضمان نقائها بداخل ستريميو
                if (src.startsWith("//")) src = "https:" + src;
                if (!watchLinks.includes(src)) watchLinks.push(src);
            }
        });

        // 6. تحويل الروابط الميكشوطة إلى صيغة جيت هاب وستريميو القياسية للبث
        watchLinks.forEach((link, index) => {
            streams.push({
                title: `🎬 سيرفر Viper المتطور [${index + 1}]`,
                url: link,
                description: "بث مباشر سريع متخطٍ للحظر التلقائي"
            });
        });

        return { streams: streams };
    } catch (err) {
        console.error("[Viper Node] Global Handler Error:", err.message);
        return { streams: [] };
    }
});

module.exports = async (req, res) => {
    // تشغيل الـ Addon كميكانيكية دالة سحابية Serverless متوافقة مع Vercel
    const addonInterface = builder.getInterface();
    const url = req.url;

    if (url === "/") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(manifest));
    } else if (url === "/manifest.json") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(manifest));
    } else if (url.startsWith("/stream/")) {
        const pathParts = url.split("/");
        const type = pathParts[2];
        const id = pathParts[3].replace(".json", "");

        const result = await addonInterface.handlers.stream({ type, id });
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result));
    } else {
        res.writeHead(404);
        res.end();
    }
};
