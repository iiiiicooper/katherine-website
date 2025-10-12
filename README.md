# katherine-website

运行与构建
- 开发启动：`npm run dev`，默认在本地开启 Vite 开发服务器。
- 生产构建：`npm run build`，生成产物到 `dist/` 目录。
- 预览构建：`vite preview` 或在部署平台预览（例如 Vercel）。

目录说明
- `src/`：前端源码（React + Tailwind）。
- `public/`：静态资源（图片等）。
- `api/`：服务端接口（Vercel Serverless Functions）。
- `dist/`：构建产物（已在 `.gitignore` 忽略，不需提交）。

后端接口
- `POST /api/upload`：文件上传到 Vercel Blob，返回 `{ url, pathname }`。
- `GET/PUT /api/config`：读取/写入站点配置（读不到时回退到默认配置）。
- `GET/POST/PATCH/DELETE /api/messages`：留言管理（私有 JSON 持久化）。

简历上传（管理后台）
- 管理后台已接入 `/api/upload`：选择文件后优先上传到后端，成功则将返回的 `url` 写入 `config.resume.fileUrl`，前端下载按钮会优先使用该链接。
- 若后端不可用或上传失败，则回退为本地 `base64`（`config.resume.fileDataUrl`）。

环境变量
- `BLOB_READ_WRITE_TOKEN`：访问 Vercel Blob 所需的读写令牌。
  - 部署到 Vercel：在项目的 Settings → Environment Variables 中设置该变量。
  - 本地调试（若需真实上传）：在终端导出，例如 `export BLOB_READ_WRITE_TOKEN=xxxx`，或在运行环境中注入。

部署到 Vercel
- `vercel.json` 已配置：
  - `buildCommand`: `npm run build`
  - `outputDirectory`: `dist`
  - `rewrites`: 将非 `/api/*` 路由重写到 `index.html`，用于 SPA。

注意事项
- 不要手动编辑 `dist/` 文件，构建会覆盖。
- 修改页面或逻辑请在 `src/` 或 `public/`，然后重新构建。
- 本地开发环境未模拟 `/api/upload` 与 `/api/messages`，仅 `GET/PUT /api/config` 在 Vite 插件中做了简化代理；如需测试上传与留言，请在部署环境或自行在本地提供后端。