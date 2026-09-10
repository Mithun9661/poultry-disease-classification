import model from "./poultryBrowserModel.json";

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function meanStd(values) {
  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / values.length;
  let variance = 0;
  for (const v of values) variance += (v - mean) * (v - mean);
  return [mean, Math.sqrt(variance / values.length)];
}

function hist8(values) {
  const bins = Array(8).fill(0);
  for (const v of values) bins[Math.min(7, Math.floor(v * 8))]++;
  return bins.map((x) => x / values.length);
}

async function loadPixels(file, size = 40) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, size, size);
  bitmap.close?.();
  return ctx.getImageData(0, 0, size, size).data;
}

async function extractFeatures(file) {
  const size = model.inputSize;
  const pixels = await loadPixels(file, size);
  const r = [], g = [], b = [], h = [], s = [], v = [], gray = [];
  const rgb = new Float32Array(size * size * 3);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const R = pixels[i], G = pixels[i + 1], B = pixels[i + 2];
    const rn = R / 255, gn = G / 255, bn = B / 255;
    r.push(rn); g.push(gn); b.push(bn);
    rgb[p * 3] = rn; rgb[p * 3 + 1] = gn; rgb[p * 3 + 2] = bn;
    const hsv = rgbToHsv(R, G, B);
    h.push(hsv[0]); s.push(hsv[1]); v.push(hsv[2]);
    gray.push(0.299 * rn + 0.587 * gn + 0.114 * bn);
  }

  const features = [];
  for (const ch of [r, g, b, h, s, v]) features.push(...meanStd(ch), ...hist8(ch));

  const magnitude = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const dx = x < size - 1 ? gray[idx + 1] - gray[idx] : 0;
      const dy = y < size - 1 ? gray[idx + size] - gray[idx] : 0;
      magnitude.push(Math.hypot(dx, dy));
    }
  }
  features.push(...meanStd(gray), ...meanStd(magnitude));

  const block = size / 4;
  for (let by = 0; by < 4; by++) {
    for (let bx = 0; bx < 4; bx++) {
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let y = by * block; y < (by + 1) * block; y++) {
        for (let x = bx * block; x < (bx + 1) * block; x++) {
          const idx = (y * size + x) * 3;
          sr += rgb[idx]; sg += rgb[idx + 1]; sb += rgb[idx + 2]; n++;
        }
      }
      features.push(sr / n, sg / n, sb / n);
    }
  }
  return features;
}

function softmax(scores) {
  const max = Math.max(...scores);
  const exps = scores.map((x) => Math.exp(x - max));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / total);
}

export async function predictPoultryDisease(file) {
  const features = await extractFeatures(file);
  if (features.length !== model.featureCount) throw new Error("Unexpected feature vector size.");

  const normalized = features.map((x, i) => (x - model.mean[i]) / (model.scale[i] || 1));
  const scores = model.coef.map((row, c) =>
    row.reduce((sum, weight, i) => sum + weight * normalized[i], model.intercept[c])
  );
  const probs = softmax(scores);

  let best = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;

  const probabilities = {};
  model.classes.forEach((cls, i) => { probabilities[cls] = probs[i]; });
  return { predictedClass: model.classes[best], confidence: probs[best], probabilities };
}
