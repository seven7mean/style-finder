// 拾色 STYLE FINDER — DeepSeek vision backend
// Requirements: Node.js 18+
// Start: npm install && DEEPSEEK_API_KEY=your_key npm start
// Windows PowerShell: $env:DEEPSEEK_API_KEY="your_key"; npm start
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";
const ROOT = __dirname;

const server = http.createServer(async (req, res) => {
  const set = (code, type, body) => {
    res.writeHead(code, {
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "same-origin"
    });
    res.end(body);
  };

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    return set(200, "text/html; charset=utf-8", fs.readFileSync(path.join(ROOT, "index.html")));
  }
  if (req.method === "POST" && req.url === "/api/analyze-image") {
    if (!API_KEY) return set(503, "application/json; charset=utf-8", JSON.stringify({error:"服务器尚未配置 DEEPSEEK_API_KEY。"}));
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 24 * 1024 * 1024) req.destroy();
    });
    req.on("end", async () => {
      try {
        const input = JSON.parse(raw || "{}");
        const photos = input.photos || {};
        const answers = input.answers || {};
        const content = [{
          type: "text",
          text: `你是审慎、友善的个人穿搭与色彩顾问。请结合用户上传的照片和问卷偏好，生成中文个人风格建议。
重要限制：
- 只讨论可见的服装、配色搭配与照片条件，不推断身份、健康、性格本质或其他敏感属性。
- 不把照片颜色当成精确肤色测量；光线、白平衡、滤镜、妆容和屏幕会影响判断。
- 仅在照片足够清晰、自然光且面部可见时，给出谨慎的肤色冷暖/明度/柔和度“初步倾向”，否则明确写“照片条件不足，无法判断”。
- 不要武断给出四季型结论；若提到季型，只能是候选方向并说明低/中/高置信度。
- 身材建议只基于可见服装轮廓，避免评价身体好坏、体重或身材价值；不要臆测身高和尺寸。
- 用户的问卷偏好优先于照片推断；建议要具体、实用、不贬低用户。
问卷：${JSON.stringify(answers)}
请只返回 JSON 对象，字段为：
styleTitle(string, 如“日系学院 · 简约复古”),
styleDesc(string),
styleChips(string数组，2-4项),
keywords(string数组，3-6项),
profileText(string，解释结合照片和问卷后的风格画像),
colorTitle(string，谨慎的色彩方向),
colorDesc(string，说明照片条件和判断置信度),
palette(数组，5项，每项{name,hex}，hex必须为#RRGGBB；作为搭配灵感色，不宣称一定衬肤),
bestColors(字符串数组，3项，作为优先尝试的搭配灵感色名称),
supportColors(字符串数组，3项，作为基础/辅助配色名称),
bestColorText(string，如何试穿),
supportColorText(string，如何组合颜色),
evidence(数组，2-4项，每项{title,detail}，解释问卷/照片观察依据与限制),
confidence(string，简短说明分析置信度与局限),
dimensionNotes(数组，最多5项，每项{label,value,note}；value为0-100，仅表示证据支持程度或偏好强度，不表示审美分数；不足时填50并注明待验证),
items(string数组，4-6项),
nextAdvice(string，含最有用的后续建议和照片分析局限)。
不要输出 Markdown 代码围栏。`
        }];
        for (const [key, label] of [["face","正面照片"],["body","全身穿搭照片"]]) {
          const dataUrl = photos[key];
          if (typeof dataUrl === "string" && /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(dataUrl)) {
            content.push({type:"text", text:`以下图片是用户上传的${label}。`});
            content.push({type:"image_url", image_url:{url:dataUrl, detail:"high"}});
          }
        }
        const apiRes = await fetch("https://api.deepseek.com/chat/completions", {
          method:"POST",
          headers:{"Authorization":`Bearer ${API_KEY}`, "Content-Type":"application/json"},
          body:JSON.stringify({
            model:MODEL,
            messages:[
              {role:"system",content:"你是审慎、友善的个人穿搭与色彩顾问。严格按用户要求只返回 JSON 对象。"},
              {role:"user",content}
            ],
            max_tokens:1800,
            response_format:{type:"json_object"}
          })
        });
        const result = await apiRes.json();
        if (!apiRes.ok) {
          console.error("DeepSeek API error", apiRes.status, JSON.stringify(result).slice(0,1000));
          return set(502,"application/json; charset=utf-8",JSON.stringify({error:"AI 服务暂时不可用，请检查 API 额度、模型权限或服务器日志。"}));
        }
        const output = result.choices?.[0]?.message?.content;
        if (typeof output !== "string") throw new Error("DeepSeek returned no text");
        const cleaned = output.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
        const parsed = JSON.parse(cleaned);
        return set(200,"application/json; charset=utf-8",JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
        return set(500,"application/json; charset=utf-8",JSON.stringify({error:"分析失败，请检查图片格式并重试。"}));
      }
    });
    return;
  }
  return set(404, "text/plain; charset=utf-8", "Not found");
});

server.listen(PORT, () => console.log(`拾色 STYLE FINDER running at http://localhost:${PORT}`));
