# 立体贡献图浏览器拓展程序

[英文版](https://github.com/jasonlong/isometric-contributions/blob/main/README.md) | 中文版

![Node.js CI](https://github.com/jasonlong/isometric-contributions/workflows/Node.js%20CI/badge.svg)
[![XO 代码样式](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

这是一个为 Chrome / Brave 和 Firefox 而量身打造的浏览器拓展程序，让你能够在 GitHub 用户档案页面的贡献图处，切换显示原生 2D 图与立体像素版贡献图。我们使用了 [obelisk.js](https://github.com/nosir/obelisk.js) 用于绘制立体图像。

立体图像通过柱高显示每天贡献数量的差异。鼠标悬停在可见柱体上时，会出现轻微光晕，并显示与 GitHub 原生 2D 浮窗一致的日期和贡献数。较矮的柱体仍可能被前方较高的柱体遮挡。

在 2D 和 Both 视图中，鼠标悬停或键盘聚焦的日历格子也会显示轻微轮廓与光晕，保留 GitHub 原生的颜色和浮窗。

柱高按当前图中最大的每日贡献数进行线性缩放。如果 GitHub 只提供 `100+`，图表按已知下限 100 计算高度，浮窗保留 `100+`。由这类数据计算的总数和日均值也会带上 `+`，且无法确定精确的最佳日期。这里沿用 GitHub 的贡献统计口径，包含 commit 以外的贡献。

<img src="img/preview.png" width="1052" />

## 安装方式

### Chrome / Brave

[Install from the Chrome Web Store](https://chrome.google.com/webstore/detail/isometric-contributions/mjoedlfflcchnleknnceiplgaeoegien?hl=en&gl=US)

### Firefox

[Install from Mozilla Add-ons site](https://addons.mozilla.org/en-US/firefox/addon/github-isometric-contributions/)

#### GitHub Enterprise

默认情况下，这个拓展程序只会渲染 `github.com` 上的贡献图，而我们可以点击拓展程序图标，选择 `Enable Isometric Contributions on this domain`，手动让拓展程序能够在我们的 Enterprise 版域名上显示。

<img src="img/enterprise.png" width="396" />

## 贡献

如果您想自定义扩展程序，那么你可能需要手动安装它。首先先克隆或分叉此仓库，然后，在 Chrome 扩展程序 页面上，选中 “开发人员模式，点击 “加载已解压缩的扩展程序……” 按钮，然后选定仓库所在的文件夹即可。

<img src="img/dev-mode.png" width="981" />

要自定义该扩展程序，首先需要确保已在开发人员模式下安装了该扩展程序（参见上文）。对扩展程序进行更改后，请返回 “扩展程序” 页面，然后单击扩展程序条目下的 “重新加载” 链接。

<img src="img/reload-link.png" width="410" />

如果你有什么改进的内容，请随时打开一个拉取请求。

## 开源协议

本项目以 [MIT License](http://opensource.org/licenses/MIT) 协议开源。
