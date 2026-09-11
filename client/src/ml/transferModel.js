const MODEL_URL = "/models/mobilenetv2/model.json";
const CLASS_NAMES = ["Coccidiosis", "Healthy", "Newcastle", "Salmonella"];
const INPUT_SIZE = 128;

let tfPromise = null;
let modelPromise = null;

async function getTf() {
  if (!tfPromise) tfPromise = import("@tensorflow/tfjs");
  const tf = await tfPromise;
  await tf.ready();
  return tf;
}

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await getTf();
      const loaded = await tf.loadLayersModel(MODEL_URL);
      const warmup = tf.zeros([1, INPUT_SIZE, INPUT_SIZE, 3]);
      const output = loaded.predict(warmup);
      if (Array.isArray(output)) output.forEach((tensor) => tensor.dispose());
      else output.dispose();
      warmup.dispose();
      return loaded;
    })().catch((error) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

async function fileToInputTensor(file) {
  const tf = await getTf();
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0, INPUT_SIZE, INPUT_SIZE);
  bitmap.close?.();

  return tf.tidy(() =>
    tf.browser
      .fromPixels(canvas, 3)
      .toFloat()
      .div(255)
      .expandDims(0)
  );
}

export async function predictWithTransferModel(file) {
  const model = await getModel();
  const input = await fileToInputTensor(file);

  try {
    const rawOutput = model.predict(input);
    const predictionTensor = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;
    const values = Array.from(await predictionTensor.data());

    if (Array.isArray(rawOutput)) rawOutput.forEach((tensor) => tensor.dispose());
    else rawOutput.dispose();

    if (values.length !== CLASS_NAMES.length) {
      throw new Error(`Unexpected MobileNetV2 output size: ${values.length}`);
    }

    let bestIndex = 0;
    for (let i = 1; i < values.length; i += 1) {
      if (values[i] > values[bestIndex]) bestIndex = i;
    }

    const probabilities = {};
    CLASS_NAMES.forEach((label, index) => {
      probabilities[label] = values[index];
    });

    return {
      predictedClass: CLASS_NAMES[bestIndex],
      confidence: values[bestIndex],
      probabilities,
      modelName: "MobileNetV2 Transfer Learning",
      modelVersion: "reference-mobilenetv2-tl-v1",
      inferenceEngine: "TensorFlow.js",
    };
  } finally {
    input.dispose();
  }
}

export async function isTransferModelAvailable() {
  try {
    await getModel();
    return true;
  } catch {
    return false;
  }
}
