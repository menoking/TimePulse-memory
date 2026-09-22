# Supabase 免费版部署指南

TimePulse Memory 使用一个公开可读、仅所有者可写的 Supabase 数据表，让同一个 Vercel 地址在电脑、手机和其他访客设备上显示相同的计时器。

数据流程如下：

- 访客无需账号，只读取已发布版本。
- 管理员登录后才会显示新增、编辑、删除和背景管理入口。
- 管理员的修改先保存在当前浏览器的草稿中，不会立即影响访客。
- 点击“发布给访客”后，完整计时器列表才会写入 Supabase。
- 浏览器原有 `localStorage` 计时器不会自动覆盖云端，可在发布中心手动导入。

## 1. 创建数据表与安全策略

进入 Supabase 项目的 **SQL Editor**，新建查询，将 [`supabase/migrations/001_timepulse_pages.sql`](../supabase/migrations/001_timepulse_pages.sql) 的全部内容粘贴并运行。

该迁移会创建 `public.timepulse_pages` 表并启用 Row Level Security（RLS）：

- 匿名用户只能读取 `is_public = true` 的页面；
- 已登录用户只能创建自己的页面；
- 只有页面的 `owner_id` 对应用户才能更新或删除它。

## 2. 创建唯一的管理员账号

在 Supabase 控制台进入 **Authentication → Users**，创建一个仅自己使用的邮箱密码账号。

随后在 Authentication 的登录设置中关闭公开注册（Disable new user sign-ups）。本项目没有注册界面，但关闭服务端公开注册可以避免陌生人自行创建账号。

不要把管理员密码、数据库密码或 `service_role` Secret Key 写入代码、GitHub 或 Vercel 的公开变量。

## 3. 配置本地环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

填写 Supabase 项目连接页提供的 Project URL 和 Publishable Key：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
NEXT_PUBLIC_TIMEPULSE_PAGE_SLUG=main
```

`Publishable Key` 的设计用途就是浏览器客户端访问；真正的数据权限由 SQL 中的 RLS 策略控制。不要改用 `service_role` Key。

`NEXT_PUBLIC_TIMEPULSE_PAGE_SLUG` 可保持为 `main`。如果以后用同一个 Supabase 项目部署多个独立页面，再为每个站点设置不同 slug。

## 4. 本地首次发布

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3000`：

1. 点击顶部用户图标进入“Supabase 发布中心”。
2. 使用第 2 步创建的管理员邮箱和密码登录。
3. 如果页面提示发现本机旧数据，点击两次“导入本机数据”。
4. 检查计时器内容，点击“发布给访客”。
5. 使用无痕窗口打开同一地址，确认未登录状态下可以查看、但不能编辑。

第一次发布会自动创建 slug 为 `main` 的公开页面，后续发布会递增版本号。若另一个管理员页面已更新云端，当前页面会阻止旧版本覆盖，并要求先重新加载。

## 5. 配置 Vercel

在 Vercel 项目中进入 **Settings → Environment Variables**，添加以下三个变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TIMEPULSE_PAGE_SLUG`（通常为 `main`）

保存后重新部署。Next.js 的 `NEXT_PUBLIC_*` 变量会在构建时写入前端产物，因此仅修改变量但不重新部署不会生效。

## 6. 验收清单

完成迁移后，可以先运行只读自检：

```bash
pnpm verify:supabase
```

它会检查项目连接、数据表、匿名读取 RLS 和公开页面数据结构，不会写入或删除云端数据。若还要验证管理员账号，可临时设置 `TIMEPULSE_ADMIN_EMAIL` 与 `TIMEPULSE_ADMIN_PASSWORD` 后再次执行；这两个变量不要写入 `NEXT_PUBLIC_*`，也不要提交到仓库。

- 电脑端登录管理员，创建或修改计时器后出现“有未发布的更改”。
- 未点击发布时，手机端仍显示旧版本。
- 点击发布并刷新手机端后，新计时器出现。
- 手机端未登录时看不到新增、删除、管理和背景设置入口。
- 手机端仍可在不同计时器间切换，也可切换纪念日的两种只读显示方式。
- 管理员退出后，页面回到已发布版本。
- 无痕窗口能够读取内容，且无法直接通过数据库接口修改记录。

## 故障排查

### 页面显示“公开页面尚未发布”

管理员尚未完成首次发布，或者 Vercel 与本地使用了不同的 `NEXT_PUBLIC_TIMEPULSE_PAGE_SLUG`。

### 登录成功但发布失败

确认已运行迁移、账号由 Supabase Authentication 创建，并检查浏览器控制台中的 RLS 错误。若该 slug 已由另一个账号首次发布，只有原 `owner_id` 对应的账号可以继续更新。

### 本地能访问，Vercel 不能访问

确认 Vercel 三个环境变量的作用环境包含 Production，并在配置后触发了新的部署。

### 云端临时不可用

访客浏览器会显示上一次成功读取的公共缓存，并在页面重新可见时再次尝试刷新。缓存只用于临时展示，不具备写入云端的能力。
