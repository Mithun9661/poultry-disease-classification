"""Evaluate the PoultryDetect MobileNetV2 Keras checkpoint on an image folder.

Expected folder layout (use --split-dir to point at val/ or test/):

split/
  Coccidiosis/
  Healthy/
  Newcastle/
  Salmonella/

The upstream checkpoint uses output order:
Coccidiosis, Healthy, NewCastleDisease, Salmonella.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)

CLASS_NAMES = ["Coccidiosis", "Healthy", "Newcastle", "Salmonella"]
CLASS_DIR_ALIASES = {
    "Coccidiosis": ["Coccidiosis", "coccidiosis"],
    "Healthy": ["Healthy", "healthy"],
    "Newcastle": ["Newcastle", "NewCastleDisease", "NewcastleDisease", "newcastle"],
    "Salmonella": ["Salmonella", "salmonella"],
}
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
INPUT_SIZE = (128, 128)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate PoultryDetect MobileNetV2 checkpoint.")
    parser.add_argument("--model", required=True, help="Path to mobilenetv2.h5")
    parser.add_argument("--split-dir", required=True, help="Path to validation or test split directory")
    parser.add_argument("--output-dir", default="ml/evaluation/results", help="Directory for JSON/CSV results")
    parser.add_argument("--batch-size", type=int, default=32)
    return parser.parse_args()


def find_class_dir(root: Path, class_name: str) -> Path:
    for alias in CLASS_DIR_ALIASES[class_name]:
        candidate = root / alias
        if candidate.is_dir():
            return candidate
    raise FileNotFoundError(f"Could not find directory for {class_name} under {root}")


def collect_samples(root: Path) -> tuple[list[str], list[int], dict[str, int]]:
    paths: list[str] = []
    labels: list[int] = []
    counts: dict[str, int] = {}

    for label_index, class_name in enumerate(CLASS_NAMES):
        class_dir = find_class_dir(root, class_name)
        files = sorted(
            path
            for path in class_dir.rglob("*")
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
        )
        if not files:
            raise RuntimeError(f"No supported images found for {class_name} in {class_dir}")
        counts[class_name] = len(files)
        paths.extend(str(path) for path in files)
        labels.extend([label_index] * len(files))

    return paths, labels, counts


def decode_image(path: tf.Tensor, label: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
    data = tf.io.read_file(path)
    image = tf.io.decode_image(data, channels=3, expand_animations=False)
    image.set_shape([None, None, 3])
    image = tf.image.resize(image, INPUT_SIZE, antialias=True)
    image = tf.cast(image, tf.float32) / 255.0
    return image, label


def evaluate(model_path: Path, split_dir: Path, output_dir: Path, batch_size: int) -> dict:
    paths, labels, class_counts = collect_samples(split_dir)
    label_array = np.asarray(labels, dtype=np.int64)

    dataset = tf.data.Dataset.from_tensor_slices((paths, label_array))
    dataset = dataset.map(decode_image, num_parallel_calls=tf.data.AUTOTUNE)
    dataset = dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    model = tf.keras.models.load_model(model_path, compile=False)
    output_shape = model.output_shape
    if isinstance(output_shape, list) or int(output_shape[-1]) != len(CLASS_NAMES):
        raise RuntimeError(f"Expected a 4-class model, got output shape {output_shape}")

    probabilities = model.predict(dataset, verbose=1)
    probabilities = np.asarray(probabilities)
    if probabilities.ndim != 2 or probabilities.shape[1] != len(CLASS_NAMES):
        raise RuntimeError(f"Unexpected prediction shape: {probabilities.shape}")

    predicted = probabilities.argmax(axis=1)
    accuracy = float(accuracy_score(label_array, predicted))
    macro_precision, macro_recall, macro_f1, _ = precision_recall_fscore_support(
        label_array, predicted, average="macro", zero_division=0
    )
    weighted_precision, weighted_recall, weighted_f1, _ = precision_recall_fscore_support(
        label_array, predicted, average="weighted", zero_division=0
    )
    report = classification_report(
        label_array,
        predicted,
        labels=list(range(len(CLASS_NAMES))),
        target_names=CLASS_NAMES,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(label_array, predicted, labels=list(range(len(CLASS_NAMES))))

    result = {
        "model": str(model_path),
        "split_dir": str(split_dir),
        "input_size": [128, 128, 3],
        "class_order": CLASS_NAMES,
        "sample_count": len(paths),
        "class_counts": class_counts,
        "accuracy": accuracy,
        "macro_precision": float(macro_precision),
        "macro_recall": float(macro_recall),
        "macro_f1": float(macro_f1),
        "weighted_precision": float(weighted_precision),
        "weighted_recall": float(weighted_recall),
        "weighted_f1": float(weighted_f1),
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
        "note": "Independent metrics for the exact checkpoint and dataset split supplied to this script.",
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "mobilenetv2_evaluation.json"
    json_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    csv_path = output_dir / "mobilenetv2_confusion_matrix.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["actual/predicted", *CLASS_NAMES])
        for class_name, row in zip(CLASS_NAMES, matrix.tolist()):
            writer.writerow([class_name, *row])

    print(json.dumps({
        "sample_count": len(paths),
        "accuracy": round(accuracy, 4),
        "macro_f1": round(float(macro_f1), 4),
        "json": str(json_path),
        "confusion_matrix_csv": str(csv_path),
    }, indent=2))
    return result


def main() -> None:
    args = parse_args()
    model_path = Path(args.model).expanduser().resolve()
    split_dir = Path(args.split_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()

    if not model_path.is_file():
        raise FileNotFoundError(model_path)
    if not split_dir.is_dir():
        raise NotADirectoryError(split_dir)
    if args.batch_size < 1:
        raise ValueError("--batch-size must be at least 1")

    evaluate(model_path, split_dir, output_dir, args.batch_size)


if __name__ == "__main__":
    main()
