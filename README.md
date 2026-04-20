# QR Code Scanner

> Chrome 扩展：一键扫描网页中所有二维码图片，汇总内容，支持去重、过滤、复制和导出 CSV。

## 功能

- **全页扫描** — 自动识别页面中 `<img>`、CSS 背景图、`<canvas>`、SVG image 等所有图片中的二维码
- **多策略解码** — BarcodeDetector（原生） → jsQR → 灰度二值化多阈值 → 高对比度增强，层层回退
- **跨域支持** — 通过 Service Worker 代理获取跨域图片
- **内容去重** — 默认开启，可通过开关关闭
- **关键字过滤** — 实时搜索筛选结果
- **批量选择** — 全选/单选控制保留哪些结果
- **复制列表** — 一键复制选中内容到剪贴板
- **导出 CSV** — 导出选中项为 CSV 文件（含序号、内容、来源类型、URL）
- **URL 识别** — 二维码内容为网址时自动渲染为可点击链接

## 技术栈

- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Vite 构建
- Chrome Manifest V3
- jsQR + BarcodeDetector API

## 安装

### 从源码构建

```bash
git clone https://github.com/overtrue/qr-scanner-extension.git
cd qr-scanner-extension
npm install
npm run build
```

然后在 Chrome 中加载：

1. 打开 `chrome://extensions`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择项目的 `dist/` 目录

## 使用

1. 访问任意包含二维码图片的网页
2. 点击浏览器工具栏中的扩展图标
3. 点击「扫描当前页面」
4. 查看识别结果，按需过滤、选择、复制或导出

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
