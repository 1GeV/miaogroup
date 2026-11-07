# 发布应急开关

网站使用同一套 Astro 代码、样式和内容，不通过简化版 Jekyll 页面替换原站。网址仍为 https://1gev.github.io/miaogroup/ 。

## 给以后接手的 AI

开关在根目录 `publishing.json` 的 `mode` 字段：

- `"github"`：恢复原 GitHub Actions 构建和发布，在线修改 Markdown 后自动更新。
- `"local"`：本机运行原 Astro 构建，将 `dist` 上传到 `gh-pages`，再由 GitHub 内置 Pages 发布。原 Actions 工作流会停用，避免继续触发当前的 billing lock。

修改开关后运行 `npm run publish`，才会实际切换发布设置。Windows 也可双击根目录 `publish.cmd`。当前因账号账单锁定，使用 `local`。

本地模式仍有构建，只是构建在本机完成。组员继续在线修改 Markdown 后，需要由维护者或 AI 执行一次发布；不需要每个成员安装环境。

## 操作约定

1. 先读 `publishing.json`，再运行 `npm run publish:check`，核对线上来源和原工作流状态。
2. 保存本地修改并同步 `main`，保留他人的内容。发布脚本会检查未提交源码，读取远端最新提交，并只允许快进同步；不会强行覆盖或自动解决冲突。
3. 按需要设置 `mode` 后执行 `npm run publish`。本地模式会刷新日历订阅，上传生成文件，核对线上发布标记。失败时检查报错及 GitHub 上的 Pages 运行记录。
4. 切回 `github` 会恢复原工作流并启动一次发布。若账号仍被 billing lock，切回 `local` 再发布；这是手动应急开关，不是自动故障切换。

脚本使用 Git Credential Manager 中已有的 GitHub 登录，不需要把 token 写进项目。换电脑时需 Node.js 22 或以上、Git 和仓库管理员的 GitHub 登录；缺少网站依赖时脚本自动安装。

不要编辑 `gh-pages` 中生成的 HTML；应修改 `main` 中的源码。不要改正式站的页面布局、样式、时间判断逻辑来绕过账单锁定。

## 时间与更新

两种方式都生成相同的静态网页。现有倒计时和首页 seminar 切换由浏览器继续执行；日历和学期状态仍按现有逻辑判断。新增或修改内容后都需要成功构建发布，线上才会更新。

`calendar.ics` 及其未来 12 个月的范围在构建时生成；本地模式下每次发布都会刷新。它不会仅因日期变化或订阅软件刷新就重新生成，这与原 Actions 方式相同。

## GitHub 上的版本备份

备份使用 GitHub 版本标签，不依赖维护者电脑上的备份文件：

- 正式仓库 `1GeV/miaogroup`：`v2026.11.07-before-emergency-publishing`，加入应急开关前的完整源码，包括 11 月 10 日活动。
- 正式仓库 `1GeV/miaogroup`：`v2026.11.07-emergency-publishing`，应急开关完成后的版本。
- 测试仓库 `1GeV/miaogroup-deploy-test-20261107`：`v2026.11.07-jekyll-publishing-checkpoint`，此前验证可发布的简化版实验。它不具有原站全部布局及功能，不应直接替代正式版。

需要回滚时，先在 GitHub 查看对应标签内容，在新分支中恢复，保留之后新增的活动，再按本文件选择发布方式。标签保存源码，不会自行恢复 Pages 设置；设置由发布脚本应用。恢复旧版原发布方式还需要在 Pages 选择 GitHub Actions 并重新启用 `deploy.yml`。
