// Content Script: 扫描页面中所有二维码图片
// 使用三层解码策略：BarcodeDetector → jsQR 多阈值预处理 → html5-qrcode
(async function scanPageQRCodes() {
  // 避免重复注入
  if (window.__qrScannerRunning) {
    return;
  }
  window.__qrScannerRunning = true;

  const results = [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // 检测 BarcodeDetector 可用性
  const hasBarcodeDetector =
    typeof BarcodeDetector !== "undefined" &&
    (await BarcodeDetector.getSupportedFormats().catch(() => [])).includes(
      "qr_code"
    );
  const barcodeDetector = hasBarcodeDetector
    ? new BarcodeDetector({ formats: ["qr_code"] })
    : null;

  // 收集所有可能包含二维码的图片 URL
  const imageEntries = collectImageEntries();

  // 通知 popup 开始扫描
  chrome.runtime.sendMessage({
    type: "SCAN_PROGRESS",
    data: {
      total: imageEntries.length,
      scanned: 0,
      found: 0,
      decoder: barcodeDetector ? "BarcodeDetector + jsQR" : "jsQR",
    },
  });

  let scanned = 0;

  for (const entry of imageEntries) {
    try {
      const decoded = await decodeQR(entry.url, canvas, ctx, barcodeDetector);
      if (decoded && decoded.length > 0) {
        for (const content of decoded) {
          results.push({
            content,
            sourceUrl: entry.url,
            sourceType: entry.type,
            pageUrl: window.location.href,
          });
        }
      }
    } catch (e) {
      // 解码失败，跳过
    }

    scanned++;
    if (scanned % 3 === 0 || scanned === imageEntries.length) {
      chrome.runtime.sendMessage({
        type: "SCAN_PROGRESS",
        data: {
          total: imageEntries.length,
          scanned,
          found: results.length,
        },
      });
    }
  }

  // 发送最终结果
  chrome.runtime.sendMessage({
    type: "SCAN_COMPLETE",
    data: { results, total: imageEntries.length },
  });

  window.__qrScannerRunning = false;
})();

/**
 * 收集页面中所有图片来源
 */
function collectImageEntries() {
  const entries = [];
  const seenUrls = new Set();

  function addEntry(url, type) {
    if (!url || seenUrls.has(url)) return;
    if (url.startsWith("data:image/svg")) return;
    seenUrls.add(url);
    entries.push({ url, type });
  }

  // 1. <img> 元素
  document.querySelectorAll("img").forEach((img) => {
    if (img.src) addEntry(img.src, "img");
    if (img.srcset) {
      img.srcset.split(",").forEach((s) => {
        const url = s.trim().split(/\s+/)[0];
        if (url) addEntry(url, "img-srcset");
      });
    }
  });

  // 2. <picture> > <source>
  document.querySelectorAll("picture source").forEach((source) => {
    if (source.srcset) {
      source.srcset.split(",").forEach((s) => {
        const url = s.trim().split(/\s+/)[0];
        if (url) addEntry(url, "picture-source");
      });
    }
  });

  // 3. CSS background-image
  document.querySelectorAll("*").forEach((el) => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundImage;
    if (bg && bg !== "none") {
      const matches = bg.matchAll(/url\(["']?(.+?)["']?\)/g);
      for (const match of matches) {
        addEntry(match[1], "css-bg");
      }
    }
  });

  // 4. <canvas> 元素
  document.querySelectorAll("canvas").forEach((c) => {
    try {
      const dataUrl = c.toDataURL("image/png");
      if (dataUrl && dataUrl !== "data:,") {
        addEntry(dataUrl, "canvas");
      }
    } catch (e) {
      // tainted canvas
    }
  });

  // 5. SVG 中的 <image>
  document.querySelectorAll("svg image").forEach((img) => {
    const href =
      img.getAttribute("href") ||
      img.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if (href) addEntry(href, "svg-image");
  });

  return entries;
}

/**
 * 解码二维码 — 多策略
 * 返回内容数组（一张图可能包含多个二维码）
 */
async function decodeQR(url, canvas, ctx, barcodeDetector) {
  const img = await loadImage(url);
  if (!img || img.width === 0 || img.height === 0) return null;

  // 限制最大尺寸
  const maxDim = 1024;
  let width = img.width;
  let height = img.height;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  if (width < 20 || height < 20) return null;

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // ===== 策略1：BarcodeDetector（原生，支持美化码） =====
  if (barcodeDetector) {
    try {
      const barcodes = await barcodeDetector.detect(canvas);
      if (barcodes.length > 0) {
        const contents = barcodes
          .map((b) => b.rawValue)
          .filter((v) => v && v.length > 0);
        if (contents.length > 0) return contents;
      }
    } catch (e) {
      // BarcodeDetector 失败，继续回退
    }
  }

  // ===== 策略2：jsQR 原始图像 =====
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imageData.data, width, height, {
      inversionAttempts: "attemptBoth",
    });
    if (code && code.data && code.data.length > 0) {
      return [code.data];
    }
  } catch (e) {
    // 继续
  }

  // ===== 策略3：jsQR + 灰度二值化（多阈值） =====
  const originalData = ctx.getImageData(0, 0, width, height);
  for (const threshold of [140, 160, 180, 200]) {
    try {
      const processed = new Uint8ClampedArray(originalData.data);
      for (let i = 0; i < processed.length; i += 4) {
        const gray =
          0.299 * processed[i] +
          0.587 * processed[i + 1] +
          0.114 * processed[i + 2];
        const bw = gray < threshold ? 0 : 255;
        processed[i] = bw;
        processed[i + 1] = bw;
        processed[i + 2] = bw;
        // alpha 保持不变
      }
      const code = jsQR(processed, width, height, {
        inversionAttempts: "attemptBoth",
      });
      if (code && code.data && code.data.length > 0) {
        return [code.data];
      }
    } catch (e) {
      // 继续下一个阈值
    }
  }

  // ===== 策略4：jsQR + 高对比度增强 =====
  try {
    const enhanced = new Uint8ClampedArray(originalData.data);
    for (let i = 0; i < enhanced.length; i += 4) {
      const gray =
        0.299 * enhanced[i] +
        0.587 * enhanced[i + 1] +
        0.114 * enhanced[i + 2];
      // 增强对比度（factor 2.5）
      const c = ((gray / 255 - 0.5) * 2.5 + 0.5) * 255;
      const v = Math.max(0, Math.min(255, Math.round(c)));
      enhanced[i] = v;
      enhanced[i + 1] = v;
      enhanced[i + 2] = v;
    }
    const code = jsQR(enhanced, width, height, {
      inversionAttempts: "attemptBoth",
    });
    if (code && code.data && code.data.length > 0) {
      return [code.data];
    }
  } catch (e) {
    // 放弃
  }

  return null;
}

/**
 * 加载图片，支持跨域回退
 */
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = () => {
      if (!url.startsWith("data:")) {
        chrome.runtime.sendMessage(
          { type: "FETCH_IMAGE", url },
          (response) => {
            if (response && response.success) {
              const retryImg = new Image();
              retryImg.onload = () => resolve(retryImg);
              retryImg.onerror = () => resolve(null);
              retryImg.src = response.dataUrl;
            } else {
              resolve(null);
            }
          }
        );
      } else {
        resolve(null);
      }
    };

    img.src = url;
  });
}
