# Lumi 网页部署版

这是 Lumi 的静态网页，可部署到 Cloudflare Pages。日程、计时、库存、菜谱和财务记录继续保存在现有 Supabase 项目中。

## Cloudflare Pages 设置

- 连接这个仓库。
- 构建命令留空。
- 构建输出目录填写 `.`（如果本文件夹是仓库根目录）。
- 部署完成后，将新域名加入 Supabase Authentication → URL Configuration → Redirect URLs。
- 在新网址用原邮箱登录一次；浏览器登录状态与旧网址分开保存。

网页源码中只允许放 Supabase publishable key。不要把数据库密码、service role key 或 DeepSeek API key 放进仓库。

部署前检查 `magician_state` 的 RLS 是否只允许本人读取和修改自己的记录。
