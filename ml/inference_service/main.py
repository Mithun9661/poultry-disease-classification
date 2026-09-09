"""
FastAPI microservice that loads the trained transfer-learning model and serves predictions.
The Node.js backend calls this service's /predict endpoint internally.

Run locally: uvicorn main:app --host 0.0.0.0 --port 8000
"""

import io
import json
import os
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title="Poultry Disease Inference Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "poultry_disease_model.keras")
CLASS_INDEX_PATH = os.path.join(BASE_DIR, "class_indices.json")
IMG_SIZE = (224, 224)

model = None
idx_to_class = None


@app.on_event("startup")
def load_model():
    global model, idx_to_class

    if not os.path.exists(MODEL_PATH):
        print(
            f"WARNING: {MODEL_PATH} not found. Train a model first and copy "
            "poultry_disease_model.keras + class_indices.json here."
        )
        return

    import tensorflow as tf
    model = tf.keras.models.load_model(MODEL_PATH)

    with open(CLASS_INDEX_PATH) as f:
        idx_to_class = json.load(f)
    print("Model loaded successfully.")


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Train and place poultry_disease_model.keras + class_indices.json in this folder.",
        )

    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are supported.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB").resize(IMG_SIZE)
        arr = np.expand_dims(np.array(image), axis=0).astype("float32")
        probs = model.predict(arr, verbose=0)[0]

        predicted_idx = int(np.argmax(probs))
        predicted_class = idx_to_class[str(predicted_idx)]
        confidence = float(probs[predicted_idx])
        probabilities = {idx_to_class[str(i)]: float(p) for i, p in enumerate(probs)}

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "probabilities": {k: round(v, 4) for k, v in probabilities.items()},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
