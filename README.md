# TimePulse Memory

<p align="center">
  <img src="./public/logo.png" width="112" alt="TimePulse Memory logo" />
</p>

<p align="center">
  一款以纪念日为核心，同时支持倒计时、秒表和世界时钟的个人时间记录工具。
</p>

TimePulse Memory 基于 [RavelloH/TimePulse](https://github.com/RavelloH/TimePulse) 进行个性化开发。这个分支保留了原项目的玻璃态界面、多计时器与分享能力，并重点补充了更接近 Days Matter 使用习惯的纪念日管理体验，以及基于 Supabase 的跨设备公开发布能力。

> 感谢 [RavelloH](https://github.com/RavelloH) 创建并开源 TimePulse。上游项目及在线预览请访问 [RavelloH/TimePulse](https://github.com/RavelloH/TimePulse) 与 [TimePulse 在线预览](https://timepulse.ravelloh.top/)。

## 本分支新增功能

### 纪念日

- 从任意过去的日期与具体时间开始记录，不再把长期纪念日与可暂停的秒表混为一类。
- 支持两种显示方式：`累计天数`、`年月日时分秒`。
- 长周期精确展示年、月、日、时、分、秒；前导值为 `0` 的时间块自动隐藏，出现数值后再显示。
- 支持三种计日规则：满 24 小时计一天、按自然日、包含开始日。
- 周年日期可按公历或农历计算。
- 支持周年提醒，可选择当天或提前 1、3、7 天提醒。
- 支持自定义累计天数提醒，例如第 100、500、1000 天。
- 可记录人生里程碑，为每个节点填写名称、日期和备注，并随时删除。
- 可填写一条自定义句子替代底部默认的“正在计时中”文案；留空时使用默认状态文案。

### 时间总览

- 在一个面板中查看并快速进入所有纪念日、倒计时、秒表和世界时钟。
- 支持为计时器设置标签、置顶或取消置顶。
- 支持按置顶优先、最近周年、名称排序，并按标签筛选。
- 纪念日卡片直接显示累计天数、开始日期和距离下一周年的天数。

### 秒表体验

- 保留暂停与继续功能，适合运动、学习或工作等真正需要中断的计时场景。
- 分段记录可以添加或修改标签，也可以单独删除。
- 点击停止并清零按钮后，需要完成滑块确认，降低误触清空计时和分段记录的风险。
- 为 `0` 的时间单位不占用显示空间，达到相应时长后自动出现。
- 秒表同样支持自定义底部状态句子。

### 体验与性能

- 计时刷新与自然秒边界对齐，避免原有高频轮询带来的无效渲染和资源消耗。
- 动画会尊重系统的“减少动态效果”设置。
- 移除了页面底部的 GitHub 详情区域与下滑提示，让主界面更专注于计时内容。
- 优化了离线状态提示、分享数据与纪念日通知的数据处理。

### 跨设备公开发布

- 使用 Supabase 保存站点所有者主动发布的计时器，同一个 Vercel 地址在电脑、手机和访客设备上显示相同内容。
- 访客匿名只读，无需注册或登录；新增、编辑、删除和管理入口仅对管理员开放。
- 管理员的修改先保存为本机草稿，确认无误后再显式发布，避免编辑过程中直接影响公开页面。
- 支持把升级前保存在浏览器 `localStorage` 中的计时器手动导入为草稿，不会自动覆盖云端。
- 发布采用版本检查，发现云端已被更新时会阻止旧页面覆盖新数据。
- Supabase 暂时不可用时可展示上一次公共缓存，并在页面恢复可见时重新检查。

## 功能一览

| 类型 | 适用场景 | 主要能力 |
| --- | --- | --- |
| 纪念日 | 相识、生日、入职、习惯养成 | 历史日期起算、累计天数、年月日时分秒、公历/农历周年、提醒、人生里程碑 |
| 倒计时 | 考试、假期、发布日 | 目标时间倒计时、节假日识别、到期提醒 |
| 秒表 | 运动、学习、任务计时 | 暂停/继续、分段、分段标签、滑块确认清零 |
| 世界时钟 | 异地协作、旅行 | 多时区时间查看与管理 |

除此之外，项目还保留了以下上游能力：

- 多计时器创建、编辑、切换与删除
- 本地草稿与 Supabase 公开发布
- 分享链接与二维码
- 全屏展示和自定义背景
- 亮色、暗色主题与响应式布局
- 中英文界面
- PWA 安装与离线访问

## 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- pnpm（推荐，也可根据项目锁文件自行配置兼容的包管理器）

### 本地运行

```bash
git clone https://github.com/menoking/TimePulse-memory.git
cd TimePulse-memory
pnpm install
pnpm dev
```

打开 `http://localhost:3000` 即可访问开发环境。

未配置 Supabase 时，项目会保持原有的本地模式，计时器仅保存在当前浏览器。若要让 Vercel 页面在不同设备上共享同一份内容，请按照 [Supabase 免费版部署指南](./docs/SUPABASE_SETUP.md) 完成数据表、管理员账号和环境变量配置。

### 构建静态版本

```bash
pnpm build
```

项目使用 Next.js 静态导出，构建产物位于 `out/`，可以部署到 GitHub Pages、Cloudflare Pages、Vercel 或其他静态托管服务。

## 使用提示

1. 点击顶部的添加按钮，选择纪念日、倒计时、秒表或世界时钟。
2. 创建纪念日时填写名称和过去的开始时间，再选择计日规则、周年历法与显示方式。
3. 使用顶部总览按钮集中管理标签、置顶状态、排序和筛选。
4. 浏览器通知需要用户授权；纪念日和倒计时提醒依赖浏览器能力及应用可用状态。
5. 未配置 Supabase 时，数据只保存在当前浏览器；配置后，管理员需要在发布中心点击“发布给访客”才会更新公开版本。
6. 清理管理员浏览器的站点数据前，请先发布重要改动；未发布草稿不会自动上传。

## 技术栈

- [Next.js 14](https://nextjs.org/) 与 React 18
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [date-fns](https://date-fns.org/) 与 [solarlunar](https://www.npmjs.com/package/solarlunar)
- [Supabase JavaScript](https://supabase.com/docs/reference/javascript/introduction)、Postgres RLS 与 localStorage 草稿缓存

## 与上游同步

本仓库保留原项目作为上游来源。克隆本仓库后，可按需添加并获取上游更新：

```bash
git remote add upstream https://github.com/RavelloH/TimePulse.git
git fetch upstream
```

合并上游前请先检查差异；本分支对计时器数据结构、主界面和通知逻辑做了扩展，可能需要手动解决冲突。

## 浏览器兼容性

推荐使用最新版本的 Chrome、Edge、Safari 或 Firefox。项目支持主流现代桌面和移动浏览器，不支持 IE 11 及更早版本。

## 贡献

欢迎通过 [Issues](https://github.com/menoking/TimePulse-memory/issues) 提交问题或建议，也欢迎发起 Pull Request。与上游通用功能相关的改进，也可以反馈到 [RavelloH/TimePulse](https://github.com/RavelloH/TimePulse)。

## 许可与致谢

本项目是 [RavelloH/TimePulse](https://github.com/RavelloH/TimePulse) 的衍生版本，并沿用上游 README 标注的 MIT License。二次分发或修改时，请保留原项目来源、作者署名及相应许可信息。
