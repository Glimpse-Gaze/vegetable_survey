const WIDTH = 1080;
const HEIGHT = 1440;
const SCALE = WIDTH / 260;

function cardPx(px) {
  return px * SCALE;
}
const INK = '#1d2a1c';
const PAPER = '#f3eee3';
const CREAM = '#fffaf2';
const DISPLAY_FALLBACK = '600 16px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

const fonts = {
  name: DISPLAY_FALLBACK,
  text: DISPLAY_FALLBACK,
  cta: DISPLAY_FALLBACK,
  title: '700 16px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
  url: '400 16px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
};

function fontAt(role, size) {
  const source = fonts[role] || fonts.name;
  const sized = source.replace(/(\d+(?:\.\d+)?)px\s*\/\s*[\d.]+px/, `${size}px`);
  if (sized !== source) return sized;
  return source.replace(/(\d+(?:\.\d+)?)px/, `${size}px`);
}

function readFonts() {
  const take = (selector, fallback) => {
    const node = document.querySelector(selector);
    return node ? getComputedStyle(node).font : fallback;
  };
  fonts.name = take('.result-card-name', fonts.name);
  fonts.text = take('.result-card-seam, .result-card-kicker', fonts.text);
  fonts.cta = take('.result-card-cta', fonts.cta);
  fonts.title = take('.result-card-survey', fonts.title);
  fonts.url = take('.result-card-url', fonts.url);
}

const TINTS = {
  green: { fill: '#2c6f3a', text: CREAM, wash: 'rgba(44, 111, 58, 0.55)' },
  carrot: { fill: '#d1790d', text: INK, wash: 'rgba(209, 121, 13, 0.5)' },
  tomato: { fill: '#cf4024', text: CREAM, wash: 'rgba(207, 64, 36, 0.52)' },
  cabbage: { fill: '#912062', text: CREAM, wash: 'rgba(145, 32, 98, 0.58)' },
  beige: { fill: PAPER, text: INK, wash: 'rgba(243, 238, 227, 0.4)' },
};

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function cover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

function textWidth(ctx, text, trackingPx = 0) {
  if (!trackingPx) return ctx.measureText(text).width;
  const chars = Array.from(text);
  return chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0)
    + trackingPx * Math.max(chars.length - 1, 0);
}

function wrap(ctx, text, maxWidth, trackingPx = 0) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = words[0];
  for (const word of words.slice(1)) {
    const next = `${line} ${word}`;
    if (textWidth(ctx, next, trackingPx) <= maxWidth) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

function drawTracked(ctx, text, x, y, trackingPx) {
  if (!trackingPx) {
    ctx.fillText(text, x, y);
    return;
  }
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((sum, width) => sum + width, 0)
    + trackingPx * Math.max(chars.length - 1, 0);
  const align = ctx.textAlign;
  ctx.textAlign = 'left';
  let cursor = x - (align === 'center' ? total / 2 : align === 'right' ? total : 0);
  chars.forEach((ch, index) => {
    ctx.fillText(ch, cursor, y);
    cursor += widths[index] + trackingPx;
  });
  ctx.textAlign = align;
}

function paintLine(ctx, text, x, y, color, shadow, trackingPx = 0) {
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.save();
  if (shadow) {
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = cardPx(3);
    ctx.shadowBlur = cardPx(10);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  }
  drawTracked(ctx, text, x, y, trackingPx);
  ctx.restore();
}

function fitSize(ctx, text, maxWidth, start, min) {
  const trackingOf = (size) => size * -0.03;
  let size = start;
  while (size > min) {
    ctx.font = fontAt('name', size);
    const tracking = trackingOf(size);
    const lines = wrap(ctx, text, maxWidth, tracking);
    const widest = Math.max(...lines.map((line) => textWidth(ctx, line, tracking)));
    if (widest <= maxWidth && lines.length <= 3) return { size, lines };
    size -= 2;
  }
  ctx.font = fontAt('name', min);
  return { size: min, lines: wrap(ctx, text, maxWidth, trackingOf(min)) };
}

function drawText(ctx, text, x, y, maxWidth, size, color, shadow, lineHeight) {
  ctx.font = fontAt('text', size);
  ctx.textBaseline = 'top';
  const lines = wrap(ctx, text, maxWidth);
  lines.forEach((line, index) => {
    paintLine(ctx, line, x, y + index * lineHeight, color, shadow);
  });
  return Math.max(lines.length, 1) * lineHeight;
}

function drawName(ctx, text, x, y, maxWidth, start, color, shadow) {
  const upper = String(text).toLocaleUpperCase();
  const { size, lines } = fitSize(ctx, upper, maxWidth, start, cardPx(12));
  const step = size * 0.95;
  const tracking = size * -0.03;
  ctx.font = fontAt('name', size);
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    paintLine(ctx, line, x, y + index * step, color, shadow, tracking);
  });
  return lines.length * step;
}

function titleSize(ctx, title) {
  const scale = WIDTH / 260;
  const maxWidth = WIDTH - 32 * scale;
  let size = 32 * scale;
  const min = 8 * scale;
  while (size > min) {
    ctx.font = fontAt('title', size);
    if (textWidth(ctx, title, size * 0.06) <= maxWidth) return size;
    size -= scale * 0.5;
  }
  return min;
}

function headerHeight(ctx, survey) {
  const title = String(survey || 'The Great Vegetable Survey').toLocaleUpperCase();
  const size = titleSize(ctx, title);
  return cardPx(12) + size * 1.25 + cardPx(9.28) * 1.3;
}

function drawMasthead(ctx, copy, color, shadow) {
  const title = String(copy.survey || 'The Great Vegetable Survey').toLocaleUpperCase();
  const size = titleSize(ctx, title);
  const lineH = size * 1.25;
  const y = cardPx(12);
  const urlSize = cardPx(9.28);
  ctx.font = fontAt('title', size);
  ctx.textBaseline = 'top';
  paintLine(ctx, title, WIDTH / 2, y, color, shadow, size * 0.06);
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.font = fontAt('url', urlSize);
  ctx.textBaseline = 'top';
  paintLine(ctx, 'vegetable.glimpsegaze.com', WIDTH / 2, y + lineH, color, shadow);
  ctx.restore();
  return headerHeight(ctx, copy.survey);
}

function drawFooter(ctx, logo, copy, color, shadow) {
  const scale = WIDTH / 260;
  const logoSize = 26 * scale;
  const inset = 12 * scale;
  const fontSize = 14.72 * scale;
  const padX = 12 * scale;
  const padY = 3 * scale;
  const border = 1.5 * scale;
  const sideGap = inset + logoSize + 16;
  ctx.font = fontAt('cta', fontSize);
  const lines = wrap(ctx, copy.cta, WIDTH - sideGap * 2 - padX * 2);
  const lineH = fontSize * 1.25;
  const textW = Math.max(...lines.map((line) => ctx.measureText(line).width), 0);
  const pillW = Math.min(WIDTH - sideGap * 2, textW + padX * 2);
  const pillH = lines.length * lineH + padY * 2;
  const pillY = HEIGHT - 12 * scale - pillH;
  const mid = pillY + pillH / 2;
  roundRect(ctx, (WIDTH - pillW) / 2, pillY, pillW, pillH, pillH / 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = border;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  if (shadow) {
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = cardPx(3);
    ctx.shadowBlur = cardPx(10);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  }
  lines.forEach((line, index) => {
    ctx.font = fontAt('cta', fontSize);
    ctx.fillText(line, WIDTH / 2, pillY + padY + lineH * (index + 0.5));
  });
  ctx.restore();
  if (logo) ctx.drawImage(logo, inset, mid - logoSize / 2, logoSize, logoSize);
}

function drawScrim(ctx) {
  const shade = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  shade.addColorStop(0, 'rgba(12, 16, 10, 0.68)');
  shade.addColorStop(0.24, 'rgba(12, 16, 10, 0.28)');
  shade.addColorStop(0.58, 'rgba(12, 16, 10, 0.22)');
  shade.addColorStop(1, 'rgba(12, 16, 10, 0.74)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

async function paintPhoto(ctx, src, x, y, width, height) {
  const image = await loadImage(src);
  if (!image) return false;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.filter = 'brightness(0.58) saturate(0.82)';
  cover(ctx, image, x, y, width, height);
  ctx.restore();
  return true;
}

function paintInstinct(ctx, card, copy, logo, color, shadow) {
  const textSize = cardPx(15.2);
  const textStep = textSize * 1.3;
  const nameStart = cardPx(31.2);
  const textWidthPx = cardPx(224);
  const nameWidth = cardPx(224);
  ctx.font = fontAt('text', textSize);
  const leadH = wrap(ctx, copy.before, textWidthPx).length * textStep;
  const nameFit = fitSize(ctx, String(card.name).toLocaleUpperCase(), nameWidth, nameStart, cardPx(12));
  const nameH = nameFit.lines.length * nameFit.size * 0.95;
  const gap = cardPx(8);
  const hero = leadH + gap + nameH;
  const head = headerHeight(ctx, copy.survey);
  const areaTop = head + cardPx(8);
  const areaBottom = HEIGHT - cardPx(56);
  const heroY = areaTop + Math.max(0, areaBottom - areaTop - hero) / 2;
  drawText(ctx, copy.before, WIDTH / 2, heroY, textWidthPx, textSize, color, shadow, textStep);
  drawName(ctx, card.name, WIDTH / 2, heroY + leadH + gap, nameWidth, nameStart, color, shadow);
  drawMasthead(ctx, copy, color, shadow);
  drawFooter(ctx, logo, copy, color, shadow);
}

function paintBetween(ctx, card, copy, logo, color, shadow) {
  const textSize = cardPx(15.2);
  const textStep = textSize * 1.3;
  const nameStart = cardPx(31.2);
  const textWidthPx = cardPx(224);
  const nameWidth = cardPx(224);
  const gap = cardPx(6);
  ctx.font = fontAt('text', textSize);
  const beforeH = wrap(ctx, copy.before, textWidthPx).length * textStep;
  const nameFit = fitSize(ctx, String(card.name).toLocaleUpperCase(), nameWidth, nameStart, cardPx(12));
  const nameH = nameFit.lines.length * nameFit.size * 0.95;
  ctx.font = fontAt('text', textSize);
  const afterH = wrap(ctx, copy.after, textWidthPx).length * textStep;
  const total = beforeH + gap + nameH + gap + afterH;
  const head = headerHeight(ctx, copy.survey);
  const areaTop = head + cardPx(8);
  const areaBottom = HEIGHT - cardPx(56);
  let y = areaTop + Math.max(0, areaBottom - areaTop - total) / 2;
  y += drawText(ctx, copy.before, WIDTH / 2, y, textWidthPx, textSize, color, shadow, textStep) + gap;
  y += drawName(ctx, card.name, WIDTH / 2, y, nameWidth, nameStart, color, shadow) + gap;
  drawText(ctx, copy.after, WIDTH / 2, y, textWidthPx, textSize, color, shadow, textStep);
  drawMasthead(ctx, copy, color, shadow);
  drawFooter(ctx, logo, copy, color, shadow);
}

function paintSpectrum(ctx, card, copy, logo, color, shadow) {
  const split = HEIGHT / 2;
  const seamSize = cardPx(14.72);
  const lineStep = seamSize * 1.15;
  const contentWidth = cardPx(236);
  const seamParts = [copy.middle, copy.after].filter(Boolean);
  ctx.font = fontAt('text', seamSize);
  const rows = seamParts.flatMap((line) => wrap(ctx, line, contentWidth));
  const seamH = Math.max(rows.length, 1) * lineStep;
  const seamY = split - seamH / 2;
  ctx.textBaseline = 'top';
  rows.forEach((line, index) => {
    ctx.font = fontAt('text', seamSize);
    paintLine(ctx, line, WIDTH / 2, seamY + index * lineStep, color, shadow);
  });

  const offset = cardPx(53.6);
  const nameStart = cardPx(26);
  const topFit = fitSize(ctx, String(card.top).toLocaleUpperCase(), contentWidth, nameStart, cardPx(12));
  const topH = topFit.lines.length * topFit.size * 0.95;
  drawName(ctx, card.top, WIDTH / 2, split - offset - topH / 2, contentWidth, nameStart, color, shadow);

  const bottomFit = fitSize(ctx, String(card.bottom).toLocaleUpperCase(), contentWidth, nameStart, cardPx(12));
  const bottomH = bottomFit.lines.length * bottomFit.size * 0.95;
  drawName(ctx, card.bottom, WIDTH / 2, split + offset - bottomH / 2, contentWidth, nameStart, color, shadow);
  drawMasthead(ctx, copy, color, shadow);
  drawFooter(ctx, logo, copy, color, shadow);
}

export async function paintResultCard(card, copy, logoSrc) {
  if (document.fonts?.ready) await document.fonts.ready;
  readFonts();
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const logo = await loadImage(logoSrc);
  const tint = TINTS[card.tint];
  const solid = card.treatment === 'solid' && tint;
  const wash = card.treatment === 'wash' && tint;
  const photo = card.layout === 'spectrum'
    ? Boolean(card.topArt || card.bottomArt)
    : Boolean(card.art);
  const flatTint = tint && (solid || (wash && !photo));

  if (flatTint) {
    ctx.fillStyle = tint.fill;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else if (card.layout === 'spectrum') {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    await paintPhoto(ctx, card.topArt, 0, 0, WIDTH, HEIGHT / 2);
    await paintPhoto(ctx, card.bottomArt, 0, HEIGHT / 2, WIDTH, HEIGHT / 2);
    if (wash) {
      ctx.fillStyle = tint.wash;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    drawScrim(ctx);
  } else {
    const hasPhoto = await paintPhoto(ctx, card.art, 0, 0, WIDTH, HEIGHT);
    if (hasPhoto) {
      if (wash) {
        ctx.fillStyle = tint.wash;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      drawScrim(ctx);
    } else if (wash && tint) {
      ctx.fillStyle = tint.fill;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  const ink = flatTint ? tint.text : (photo || wash ? CREAM : INK);
  const useShadow = !flatTint && ink === CREAM;

  if (card.layout === 'between') paintBetween(ctx, card, copy, logo, ink, useShadow);
  else if (card.layout === 'spectrum') paintSpectrum(ctx, card, copy, logo, ink, useShadow);
  else paintInstinct(ctx, card, copy, logo, ink, useShadow);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
