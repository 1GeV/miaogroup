# 发布应急开关

网站使用同一套 Astro 代码、样式和内容，不通过简化版 Jekyll 页面替换原站。网址仍为 https://1gev.github.io/miaogroup/ 。

## 给以后接手的 AI

开关在根目录 `publishing.json` 的 `mode` 字段：

- `"github"`：恢复原 GitHub Actions 构建和发布，在线修改 Markdown 后自动更新。
- `"local"`：本机运行原 Astro 构建，将 `dist` 上传到 `gh-pages`，再由 GitHub 内置 Pages 发布。原 Actions 工作流会停用，避免继续触发当前的 billing lock。

修改开关后运行 `npm run publish`，才会实际切换发布设置。Windows 也可双击根目录 `publish.cmd`。当前因账号账单锁定，使用 `local`。

本地模式仍有构建，只是构建在本机完成。组员继续在线修改 Markdown 后，需要由维护者或 AI 执行一次发布；不需要每个成员安装环境。

## 你平时怎样发布

当前已经设为 `local`，不必每次修改开关。网站发布成功后可以关机，网站仍由 GitHub 托管。

1. 在 GitHub 的 `main` 分支新增或修改活动 Markdown，然后提交。也可以让 AI 在本机修改并保存提交。不要在 `gh-pages` 修改生成的页面。
2. 打开本机文件夹 `D:\Document\github\miaogroup`，双击 `publish.cmd`；或让 AI 在该文件夹执行 `npm run publish`。
3. 等待它同步最新源码、构建、上传和确认线上更新。窗口出现“发布成功”及原网站地址，才表示完成。若出现未提交修改或分支冲突，让 AI 先处理，不要直接覆盖文件。
4. 在浏览器打开原网站，必要时按 `Ctrl+F5` 刷新；核对新活动、时间和链接。日历订阅软件会按它自己的周期读取更新。
5. 可以关掉窗口和电脑。组员下次修改内容后，再执行一次上述发布。

你也可以直接对 AI 说：“阅读 PUBLISHING.md，按当前开关同步最新活动并发布，保留现有页面布局，不覆盖他人修改，确认线上已更新。”

## 怎样切回原发布方式

1. 让 AI 将 `publishing.json` 中的 `"mode": "local"` 改为 `"mode": "github"`，保存提交并同步到 GitHub。
2. 执行一次 `npm run publish`，脚本会将 Pages 改回 GitHub Actions，重新启用原工作流，并请求发布。
3. 确认 Actions 发布成功。若仍然出现 billing lock，把 `mode` 改回 `local` 并执行发布。不要只改文件就以为 GitHub 设置已经切换。

## 出错时

- **网络中断**：保留修改，切换校园网或手机热点后重试 `publish.cmd`。浏览器 `github.com`、上传接口 `api.github.com` 和网页托管 `1gev.github.io` 是不同入口，可能只有其中一部分可访问。此方案没有设置 VPN、代理或修改 DNS。
- **文件已上传，但未确认线上更新**：让 AI 先运行 `npm run publish:check` 并检查 Pages 发布记录；可能只是确认连接断了，避免直接判断内容丢失。
- **同步失败/有未提交修改**：让 AI 保存并合并最新内容，再发布，不要强推或重置掉活动。
- **本地构建成功，但 GitHub Pages 也拒绝发布**：保留错误，交给 AI 检查；本方案绕开的是普通 Actions 构建的当前锁定，不保证 GitHub 将来所有账号限制都能绕开。

## 操作约定

1. 先读 `publishing.json`，再运行 `npm run publish:check`，核对线上来源和原工作流状态。
2. 保存本地修改并同步 `main`，保留他人的内容。发布脚本会检查未提交源码，读取远端最新提交，并只允许快进同步；不会强行覆盖或自动解决冲突。
3. 按需要设置 `mode` 后执行 `npm run publish`。本地模式会刷新日历订阅，上传生成文件，核对线上发布标记。失败时检查报错及 GitHub 上的 Pages 运行记录。
4. 切回 `github` 会恢复原工作流并启动一次发布。若账号仍被 billing lock，切回 `local` 再发布；这是手动应急开关，不是自动故障切换。

脚本使用 Git Credential Manager 中已有的 GitHub 登录，不需要把 token 写进项目。换电脑时需 Node.js 22 或以上、Git 和仓库管理员的 GitHub 登录；缺少网站依赖时脚本自动安装。

不要编辑 `gh-pages` 中生成的 HTML；应修改 `main` 中的源码。不要改正式站的页面布局、样式、时间判断逻辑来绕过账单锁定。

## 时间与更新

两种方式都生成相同的静态网页。现有倒计时和首页 seminar 切换由浏览器继续执行；日历和学期状态仍按现有逻辑判断。新增或修改内容后都需要成功构建发布，线上才会更新。

学期状态与日历“今天”在打开页面时计算，长期不刷新且跨天打开时，仍有原来页面自身的刷新边界；本次没有改动这些逻辑。访客设备时间也需准确。

`calendar.ics` 及其未来 12 个月的范围在构建时生成；本地模式下每次发布都会刷新。它不会仅因日期变化或订阅软件刷新就重新生成，这与原 Actions 方式相同。

## GitHub 上的版本备份

备份使用 GitHub 版本标签，不依赖维护者电脑上的备份文件：

- 正式仓库 `1GeV/miaogroup`：`v2026.11.07-before-emergency-publishing`，加入应急开关前的完整源码，包括 11 月 10 日活动。
- 正式仓库 `1GeV/miaogroup`：`v2026.11.07-emergency-publishing`，应急开关完成后的版本。
- 正式仓库 `1GeV/miaogroup`：`v2026.11.07-emergency-publishing-ready`，包含完整操作步骤和断网处理的最终版本。
- 测试仓库 `1GeV/miaogroup-deploy-test-20261107`：`v2026.11.07-jekyll-publishing-checkpoint`，此前验证可发布的简化版实验。它不具有原站全部布局及功能，不应直接替代正式版。

需要回滚时，先在 GitHub 查看对应标签内容，在新分支中恢复，保留之后新增的活动，再按本文件选择发布方式。标签保存源码，不会自行恢复 Pages 设置；设置由发布脚本应用。恢复旧版原发布方式还需要在 Pages 选择 GitHub Actions 并重新启用 `deploy.yml`。
