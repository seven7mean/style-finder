# 拾色 STYLE FINDER — 报告重设计版 V3

本版本保留原来的首页、问卷布局与品牌视觉，只重做报告呈现方式，参考你提供的 Light Me 截图：结果封面、风格画像、五维观察、标志色、配色指南、分析依据、单品建议和穿搭灵感。

## 本地启动
需要 Node.js 18+ 和已开通视觉模型的 DeepSeek API Key。

macOS / Linux:
```bash
export DEEPSEEK_API_KEY="你的 DeepSeek API Key"
npm start
```

Windows PowerShell:
```powershell
$env:DEEPSEEK_API_KEY="你的 DeepSeek API Key"
npm start
```

打开 http://localhost:3000 。

## 隐私和准确性
- 不要把 API Key 上传到 GitHub，也不要放进 index.html。
- 只有用户勾选照片分析授权，照片才会发送到配置的 AI 服务。
- 问卷模式的色彩只是穿搭灵感；照片分析会受光线、白平衡、滤镜和妆容影响。五维内容是解释报告的观察维度，不是客观的美貌或身材评分。
- 本包尚未部署到公网；公网部署需要设置服务器环境变量和 HTTPS。
