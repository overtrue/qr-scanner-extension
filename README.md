# QR Code Scanner

> Chrome 扩展：一键扫描网页中所有二维码图片，汇总内容，支持去重、过滤、复制和导出 CSV。

## 功能

- **全页扫描** — 自动识别页面中 `<img>`、CSS 背景图、`<canvas>`、SVG image 等所有图片中的二维码
- **多策略解码** — BarcodeDetector（原生） → jsQR → 灰度二值化多阈值 → 高对比度增强，层层回退
- **跨域支持** — 通过 Service Worker 代理获取跨域图片
- **跨页累积** — 结果在会话期间持久保存，支持分页场景：扫描第 1 页 → 翻页 → 扫描第 2 页，结果自动合并（关闭浏览器后清空）
- **Data URL 支持** — 直接打开 `data:image/...` 地址的图片也能识别
- **内容去重** — 默认开启，可通过开关关闭
- **内容折叠** — 长文本默认单行截断，可通过开关展开完整内容
- **关键字过滤** — 实时搜索筛选结果
- **批量选择** — 全选/单选控制保留哪些结果
- **复制列表** — 一键复制选中内容到剪贴板
- **导出 CSV** — 导出选中项为 CSV 文件（含序号、内容、来源类型、URL）
- **URL 识别** — 二维码内容为网址时自动渲染为可点击链接

## 技术栈

- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Vite 构建
- Chrome / Firefox Manifest V3
- jsQR + BarcodeDetector API

## 安装

### 从源码构建

```bash
git clone https://github.com/overtrue/qr-scanner-extension.git
cd qr-scanner-extension
npm install

# Chrome 构建
npm run build

# Firefox 构建
npm run build:firefox
```

#### Chrome 安装

1. 打开 `chrome://extensions`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择项目的 `dist/` 目录

#### Firefox 安装

1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「临时载入附加组件」
3. 选择 `dist/` 目录下的任意文件（`manifest.json` 或 `background.js`）
4. 扩展即加载，图标出现在工具栏

## 使用

1. 访问任意包含二维码图片的网页
2. 点击浏览器工具栏中的扩展图标
3. 点击「扫描当前页面」
4. 查看识别结果，按需过滤、选择、复制或导出

### 分页扫描

对于有分页的图片列表：

1. 扫描当前页
2. 关闭扩展弹窗，点击「下一页」
3. 再次打开扩展，之前的结果仍在，点击「继续扫描」
4. 新结果自动追加合并，重复内容由去重开关过滤
5. 全部扫完后，一次性复制或导出 CSV
6. 点击「清空」按钮重置

## 兼容性说明

- **Chrome**: 使用 `chrome.storage.session` 存储扫描结果（关闭浏览器后清空）
- **Firefox**: 回退使用 `chrome.storage.local`（Firefox 不支持 session storage），功能完全一致

## 项目结构

```
src/
├── popup/                  # React 弹出窗口
│   ├── App.tsx             # 主组件（状态管理）
│   ├── components/         # 业务组件
│   │   ├── Header.tsx
│   │   ├── StatusBar.tsx
│   │   ├── Toolbar.tsx
│   │   ├── ResultList.tsx
│   │   ├── ResultItem.tsx
│   │   ├── EmptyState.tsx
│   │   └── ui/             # shadcn/ui 组件
│   ├── globals.css         # Tailwind + 主题变量
│   └── main.tsx            # 入口
├── content/
│   └── scanner.js          # Content Script（页面扫描）
├── background.js           # Service Worker（跨域代理）
└── lib/
    └── jsQR.js             # QR 解码库
```

## License

MIT

## Author

[overtrue](https://github.com/overtrue)
