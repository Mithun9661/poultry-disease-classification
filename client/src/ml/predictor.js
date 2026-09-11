import { predictPoultryDisease as predictWithLightweightModel } from "./browserModel";
import { predictWithTransferModel } from "./transferModel";

export async function predictPoultryDisease(file) {
  const startedAt = performance.now();

  try {
    const result = await predictWithTransferModel(file);
    return {
      ...result,
      inferenceMs: Math.max(1, Math.round(performance.now() - startedAt)),
      usedFallback: false,
    };
  } catch (transferError) {
    console.warn("MobileNetV2 model unavailable; using lightweight fallback.", transferError);
    const fallback = await predictWithLightweightModel(file);
    return {
      ...fallback,
      modelName: "Lightweight Browser Classifier",
      modelVersion: "browser-feature-v1",
      inferenceEngine: "javascript",
      inferenceMs: Math.max(1, Math.round(performance.now() - startedAt)),
      usedFallback: true,
    };
  }
}
