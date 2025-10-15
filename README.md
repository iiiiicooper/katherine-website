# katherine-website

Katherine Fang 的个人作品集网站，展示 UI/UX 设计项目和联系信息。

## 运行与构建

- 开发启动：`npm run dev`，默认在本地开启 Vite 开发服务器。
- 生产构建：`npm run build`，生成产物到 `dist/` 目录。
- 预览构建：`vite preview` 或在部署平台预览（例如 Vercel）。

## 目录说明

- `src/`：前端源码（React + Tailwind）。
- `public/`：静态资源（图片等）。
- `dist/`：构建产物（已在 `.gitignore` 忽略，不需提交）。

## 部署到 Vercel

- `vercel.json` 已配置：
  - `buildCommand`: `npm run build`
  - `outputDirectory`: `dist`
  - `rewrites`: 将所有路由重写到 `index.html`，用于 SPA。

## 注意事项

- 不要手动编辑 `dist/` 文件，构建会覆盖。
- 修改页面或逻辑请在 `src/` 或 `public/`，然后重新构建。

## 联系方式（Contact）

联系表单支持 Google Forms 集成：

1. 在 Google Forms 创建一个表单，包含三个输入：Name、Email、Message（名称随意）。
2. 打开表单页面，在浏览器开发者工具中检查每个输入框，找到其 `name` 属性，形如 `entry.1234567890`，记录这三个值。
3. 获取提交地址：`https://docs.google.com/forms/d/e/<FORM_ID>/formResponse`（可在页面源代码或网络面板中找到）。
4. 在 `public/app-config.json` 中配置 Google Forms 信息：
   ```json
   {
     "contact": {
       "email": "your-email@example.com",
       "phone": "+1 xxx-xxx-xxxx",
       "linkedin": "https://linkedin.com/in/your-profile",
       "googleForm": {
         "endpoint": "https://docs.google.com/forms/d/e/<FORM_ID>/formResponse",
         "entries": {
           "name": "entry.123456789",
           "email": "entry.987654321",
           "content": "entry.111222333"
         }
       }
     }
   }
   ```
5. 前端联系页会通过隐藏 `form + iframe` 方式跨域提交到 Google Forms，不会跳转离开页面。

## 技术栈

- React 18 + TypeScript
- Tailwind CSS
- Vite
- React Router
- React Helmet Async