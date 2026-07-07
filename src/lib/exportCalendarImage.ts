export async function waitForExportAssets(root: HTMLElement) {
  // Esperamos a que todas las fuentes estén cargadas
  try {
    if (document.fonts) {
      await document.fonts.ready;
      // Forzamos un pequeño delay extra para renderizado de fuentes cursivas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (e) {
    console.warn("Error esperando fuentes:", e);
  }

  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => {
      image.crossOrigin = "anonymous";
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();

      return new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    })
  );
}

interface ExportElementOptions {
  backgroundElement?: HTMLElement | null;
  frameWidth?: number;
  padding?: number;
}

function toExportImageUrl(src: string) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;

  try {
    const url = new URL(src, window.location.origin);
    if (url.origin === window.location.origin) return url.pathname + url.search;
    return `/api/export-image?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return src;
  }
}

async function imageUrlToDataUrl(src: string) {
  if (!src || src.startsWith("data:")) return src;

  const response = await fetch(toExportImageUrl(src), { cache: "force-cache" });
  if (!response.ok) throw new Error(`No se pudo cargar la imagen: ${src}`);

  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function normalizeCanvasColorProp(prop: string, value: string) {
  if (!/(oklab|oklch|color-mix)/i.test(value)) return value;
  if (/background/i.test(prop)) return "transparent";
  if (/border|outline|decoration/i.test(prop)) return "rgba(0, 0, 0, 0)";
  return "#4A4238";
}

function sanitizeCssValue(prop: string, value: string) {
  if (!value) return value;
  // Permitimos URLs externas ya que inlineExternalImages las convertirá a DataURLs antes
  if (/url\(/i.test(value)) return value;
  if (/box-shadow|text-shadow|filter/i.test(prop)) return "none";
  if (!/(oklab|oklch|color-mix)/i.test(value)) return value;
  return normalizeCanvasColorProp(prop, value);
}

async function inlineExternalImages(sourceRoot: HTMLElement, cloneRoot: HTMLElement) {
  const cache = new Map<string, Promise<string>>();
  const read = (src: string) => {
    if (!cache.has(src)) cache.set(src, imageUrlToDataUrl(src));
    return cache.get(src)!;
  };

  const sourceImages = Array.from(sourceRoot.querySelectorAll("img"));
  const cloneImages = Array.from(cloneRoot.querySelectorAll("img"));

  await Promise.all(
    cloneImages.map(async (image, index) => {
      const source = sourceImages[index];
      const src = source?.currentSrc || source?.src || image.currentSrc || image.src;
      if (!src) return;

      image.removeAttribute("crossorigin");
      image.src = await read(src);
    })
  );

  const sourceNodes = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll<HTMLElement>("*"))];
  const cloneNodes = [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>("*"))];

  for (let index = 0; index < sourceNodes.length; index += 1) {
    const source = sourceNodes[index];
    const clone = cloneNodes[index];
    if (!clone) continue;

    const backgroundImage = window.getComputedStyle(source).backgroundImage;
    if (!backgroundImage || backgroundImage === "none") continue;

    let inlinedBackground = backgroundImage;
    const matches = Array.from(backgroundImage.matchAll(/url\((['"]?)(.*?)\1\)/g));

    for (const match of matches) {
      const rawUrl = match[2];
      const dataUrl = await read(rawUrl);
      inlinedBackground = inlinedBackground.replace(match[0], `url("${dataUrl}")`);
    }

    clone.style.backgroundImage = inlinedBackground;
  }
}

function hideExportControls(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".no-export").forEach((node) => {
    node.style.display = "none";
  });
}

function sanitizeUnsupportedStyles(root: HTMLElement) {
  const colorProps = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "textDecorationColor",
    "fill",
    "stroke",
  ] as const;

  [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))].forEach((node) => {
    const styles = window.getComputedStyle(node);

    colorProps.forEach((prop) => {
      const value = styles[prop];
      if (value && /(oklab|oklch|color-mix)/i.test(value)) {
        node.style[prop] = normalizeCanvasColorProp(prop, value);
      }
    });

    node.style.boxShadow = "none";
    node.style.textShadow = "none";
    node.style.filter = "none";

    for (const prop of Array.from(node.style)) {
      const value = node.style.getPropertyValue(prop);
      if (/(oklab|oklch|color-mix)/i.test(value) || (/url\(/i.test(value) && /(https?:|\/\/)/i.test(value))) {
        node.style.setProperty(prop, sanitizeCssValue(prop, value), node.style.getPropertyPriority(prop));
      }
    }
  });
}

function canvasToPngDataUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/png");
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo renderizar el SVG de exportacion."));
    image.src = src;
  });
}

async function renderCloneWithSvg(clone: HTMLElement, scale: number) {
  const width = Math.ceil(clone.scrollWidth || clone.offsetWidth || 1200);
  const height = Math.ceil(clone.scrollHeight || clone.offsetHeight || 1800);
  const xhtml = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject width="100%" height="100%">
        ${xhtml}
      </foreignObject>
    </svg>
  `;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar el canvas de exportacion.");

    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function renderCloneWithHtml2Canvas(clone: HTMLElement, scale: number) {
  const { default: html2canvas } = await import("html2canvas");

  return html2canvas(clone, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    imageTimeout: 15000,
    logging: true,
    windowWidth: Math.max(clone.scrollWidth + 100, 1400),
    windowHeight: Math.max(clone.scrollHeight + 100, 1800),
    onclone: (doc) => {
      sanitizeUnsupportedStyles(doc.body);
    },
  });
}

function createExportFrame(clone: HTMLElement, options: ExportElementOptions, dimensions: { width: number, height: number }) {
  if (!options.backgroundElement) return clone;

  const backgroundStyles = window.getComputedStyle(options.backgroundElement);
  const sourceWidth = dimensions.width;
  const sourceHeight = dimensions.height;
  const frameWidth = options.frameWidth || 1200;
  const padding = options.padding ?? 80;
  const scale = Math.min((frameWidth - padding * 2) / sourceWidth, 1);
  const frameHeight = Math.ceil(sourceHeight * scale + padding * 2);
  const frame = document.createElement("div");

  frame.style.width = `${frameWidth}px`;
  frame.style.height = `${frameHeight}px`;
  frame.style.padding = `${padding}px`;
  frame.style.boxSizing = "border-box";
  frame.style.display = "flex";
  frame.style.alignItems = "flex-start";
  frame.style.justifyContent = "center";
  frame.style.position = "fixed";
  frame.style.top = "-10000px";
  frame.style.left = "0";
  frame.style.overflow = "hidden";
  frame.style.backgroundColor = normalizeCanvasColorProp("backgroundColor", backgroundStyles.backgroundColor || "#F5F2EB");
  frame.style.backgroundImage = backgroundStyles.backgroundImage === "none" ? "none" : backgroundStyles.backgroundImage;
  frame.style.backgroundSize = backgroundStyles.backgroundSize;
  frame.style.backgroundPosition = backgroundStyles.backgroundPosition;

  clone.style.transform = `scale(${scale})`;
  clone.style.transformOrigin = "top center";
  clone.style.position = "relative";
  clone.style.margin = "0 auto";
  clone.style.maxWidth = "none";
  clone.style.width = `${sourceWidth}px`;
  clone.style.flexShrink = "0";

  frame.appendChild(clone);

  return frame;
}

export function normalizeExportFilename(value: string) {
  const clean = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || "calendario";
}

export async function exportElementAsPng(element: HTMLElement, filename: string, options: ExportElementOptions = {}) {
  const clone = element.cloneNode(true) as HTMLElement;

  await inlineExternalImages(element, clone);
  hideExportControls(clone);

  const dimensions = {
    width: element.scrollWidth || element.offsetWidth || 2400,
    height: element.scrollHeight || element.offsetHeight || 3200
  };

  clone.style.width = `${dimensions.width}px`;
  clone.style.maxWidth = "none";
  clone.style.pointerEvents = "none";
  clone.style.transition = "none";
  clone.style.animation = "none";

  const exportRoot = createExportFrame(clone, options, dimensions);
  if (exportRoot === clone) {
    clone.style.transform = "none";
    clone.style.transformOrigin = "top left";
    clone.style.position = "fixed";
    clone.style.top = "-10000px";
    clone.style.left = "0";
  }

  document.body.appendChild(exportRoot);

  try {
    sanitizeUnsupportedStyles(exportRoot);
    await waitForExportAssets(exportRoot);
    const scale = 2;
    let dataUrl: string;

    try {
      const svgCanvas = await renderCloneWithSvg(exportRoot, scale);
      dataUrl = canvasToPngDataUrl(svgCanvas);
    } catch (svgError) {
      console.warn("Exportacion SVG fallo, usando html2canvas.", svgError);
      const htmlCanvas = await renderCloneWithHtml2Canvas(exportRoot, scale);
      dataUrl = canvasToPngDataUrl(htmlCanvas);
    }

    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    exportRoot.remove();
  }
}

export async function generateElementBlob(element: HTMLElement, options: ExportElementOptions = {}) {
  const clone = element.cloneNode(true) as HTMLElement;

  await inlineExternalImages(element, clone);
  hideExportControls(clone);

  const dimensions = {
    width: element.scrollWidth || element.offsetWidth || 2400,
    height: element.scrollHeight || element.offsetHeight || 3200
  };

  clone.style.width = `${dimensions.width}px`;
  clone.style.maxWidth = "none";
  clone.style.pointerEvents = "none";
  clone.style.transition = "none";
  clone.style.animation = "none";

  const exportRoot = createExportFrame(clone, options, dimensions);
  if (exportRoot === clone) {
    clone.style.transform = "none";
    clone.style.transformOrigin = "top left";
    clone.style.position = "fixed";
    clone.style.top = "-10000px";
    clone.style.left = "0";
  }

  document.body.appendChild(exportRoot);

  try {
    sanitizeUnsupportedStyles(exportRoot);
    await waitForExportAssets(exportRoot);
    const scale = 1.5; // Escala un poco menor para miniaturas para ahorrar espacio
    let canvas: HTMLCanvasElement;

    try {
      canvas = await renderCloneWithSvg(exportRoot, scale);
    } catch (svgError) {
      canvas = await renderCloneWithHtml2Canvas(exportRoot, scale);
    }

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  } finally {
    exportRoot.remove();
  }
}
