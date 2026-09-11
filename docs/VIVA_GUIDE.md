# PoultryDetect — Viva Guide

## 1. Project Title

**Transfer Learning-Based Classification of Poultry Diseases for Enhanced Health Management**

## 2. One-Line Explanation

PoultryDetect is a web application that classifies a poultry fecal sample image into **Healthy, Coccidiosis, Salmonella, or Newcastle** using a MobileNetV2 transfer-learning model and stores the screening result for later review.

## 3. Problem Statement

Poultry diseases can spread quickly and expert screening may not always be immediately available. This project explores whether deep-learning image classification can provide an early screening signal from poultry fecal images.

The system is an academic screening tool, **not a replacement for a veterinarian or laboratory diagnosis**.

## 4. Technologies Used

- React 18 + Vite
- JavaScript
- TensorFlow.js
- MobileNetV2 Transfer Learning
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Row Level Security
- Node.js + Express
- MongoDB + Mongoose reference backend
- GitHub Actions
- Vercel

## 5. Main Workflow

```text
Register / Login
      ↓
Upload or capture fecal image
      ↓
Validate image type and size
      ↓
Lazy-load TensorFlow.js
      ↓
Resize image to 128 × 128 RGB
      ↓
Normalize pixels to [0,1]
      ↓
MobileNetV2 inference
      ↓
4-class Softmax output
      ↓
Prediction + confidence + probabilities
      ↓
Save image + metadata to private cloud history
      ↓
View / filter / delete / download report
```

If the MobileNetV2 model cannot load, the application can use a lightweight fallback classifier and clearly identifies that fallback in the result.

## 6. Disease Classes

1. Healthy
2. Coccidiosis
3. Salmonella
4. Newcastle

The MobileNetV2 checkpoint output order is:

```text
Coccidiosis, Healthy, Newcastle, Salmonella
```

## 7. What Is Transfer Learning?

Transfer learning starts from a neural network that has already learned useful visual features from a large dataset, then adapts it to a new classification task.

MobileNetV2 is suitable because it gives a strong accuracy/size trade-off and is designed to be computationally efficient.

## 8. What Model Runs in the Live Website?

The **primary live model is MobileNetV2 Transfer Learning**, converted from a Keras H5 checkpoint into TensorFlow.js Layers format.

Input:

```text
128 × 128 × 3 RGB
```

Output:

```text
4-class Softmax probabilities
```

TensorFlow.js runs the model directly in the user's browser. No Python inference server is required for the main production prediction flow.

## 9. Did We Train the Exact Production MobileNetV2 Checkpoint?

No. The current production checkpoint is an **attributed MIT-licensed reference checkpoint** from an upstream poultry-disease project.

The repository keeps its provenance and upstream license beside the converted model. We do not falsely claim that this exact checkpoint was trained by our team.

The project also contains its own MobileNetV2 training/evaluation pipeline so the reference checkpoint can later be replaced by a newly trained project checkpoint.

## 10. Why TensorFlow.js?

TensorFlow.js allows deep-learning inference directly inside the browser.

Benefits:

- no separate GPU/ML server required for the demo
- prediction data can remain in the browser during inference
- easy Vercel deployment
- works with converted Keras models

The ML runtime is lazy-loaded only when a scan is requested, which keeps normal application pages faster.

## 11. What Does Confidence Mean?

Confidence is the highest probability in the model's four-class Softmax output.

It tells us how strongly the model prefers one class relative to the others for that image. It is **not medical certainty** and it is not a calibrated probability that the bird definitely has that disease.

## 12. Why Softmax?

Softmax converts four class scores into values between 0 and 1 that sum approximately to 1. This lets the UI display a probability distribution for all four classes.

The deployed checkpoint already ends with a Softmax Dense layer, so the application uses the model output directly rather than applying Softmax a second time.

## 13. Current Performance Numbers

Be precise about which model each number belongs to.

### MobileNetV2 reference checkpoint

The upstream project reports:

- Validation accuracy: **0.90 / 90%**
- Test accuracy: **0.93 / 93%**
- Test F1 score: **0.90**
- Parameters: **2,263,108**
- Approximate model size reported upstream: **9.13 MB**

These are **upstream-reported experimental metrics**, not a new independent PoultryDetect evaluation.

### Lightweight fallback classifier

Our earlier independently checked fallback classifier achieved approximately **87.4% validation accuracy** on the project validation subset.

Do not say “MobileNetV2 accuracy is 87.4%.”

## 14. How Can We Independently Evaluate MobileNetV2?

The repository contains:

```text
ml/evaluation/evaluate_mobilenet.py
```

It can calculate:

- accuracy
- precision
- recall
- F1 score
- per-class metrics
- confusion matrix

The exact dataset split must be recorded whenever those results are reported.

## 15. What Is the Fallback Classifier?

The fallback model uses handcrafted image features such as RGB/HSV statistics, histograms, grayscale/gradient information and spatial color blocks, followed by a learned multiclass linear classifier.

It is used only if the TensorFlow.js MobileNetV2 path fails on a device.

## 16. What Is Supabase Used For?

Production Supabase services provide:

- registration/login/logout
- persistent session
- PostgreSQL prediction history
- private image storage
- Row Level Security

## 17. What Is Row Level Security?

Row Level Security restricts database operations according to the authenticated user.

In PoultryDetect, users can normally read, insert and delete only their own prediction rows and their own storage objects.

## 18. What Is Stored in History?

A new scan can store:

- user ID
- predicted class
- confidence
- probabilities
- private image path
- reported symptoms
- farm/environment context
- model name
- model version
- inference time
- date/time

## 19. Why Save Symptoms and Environment If They Do Not Change the Score?

They provide useful screening context for later review, but the current prediction score is produced by the image classifier only.

This is intentionally stated in the UI so the system does not pretend that symptom selections are part of the trained model when they are not.

## 20. What Is the Node/Express + MongoDB Part?

The `server/` folder contains a complete MERN-compatible backend path using:

- Node.js
- Express
- MongoDB
- Mongoose
- JWT

It supports registration/login plus authenticated prediction-history create/read/delete APIs and an optional external ML-service endpoint.

It is automatically tested using a temporary MongoDB instance.

The **current public production database is Supabase PostgreSQL**, not MongoDB, because a production MongoDB Atlas URI has not been configured. Say this clearly if asked; do not claim MongoDB is live when it is not.

## 21. How Is the Project Tested?

GitHub Actions automatically checks:

- React production build
- Express + MongoDB smoke test
- MobileNetV2 model input/output contract
- presence of model shards, provenance and license
- Python evaluator syntax

The backend smoke test performs register → login → save history → read history → delete history.

## 22. Important Limitations

- image-only screening cannot confirm a disease
- real-farm data may differ from training data
- lighting, blur and background can affect predictions
- out-of-distribution images can still receive confident predictions
- Newcastle is comparatively underrepresented in the source data
- upstream metrics do not guarantee field accuracy
- veterinary/laboratory confirmation is needed for real treatment decisions

## 23. Future Scope

- train a new project-owned MobileNetV2/EfficientNet checkpoint on the full declared dataset
- independently evaluate on a held-out test set
- add out-of-distribution/reject detection
- add calibrated confidence
- improve Newcastle class data balance
- add multilingual farmer guidance
- add flock-level trend analytics
- connect the MongoDB backend to a production Atlas cluster if MERN deployment is required

## 24. Common Viva Questions

### Q: Why did you choose MobileNetV2?

MobileNetV2 is efficient and relatively small compared with many CNN architectures, which makes it practical for web/mobile-oriented inference while still supporting transfer learning.

### Q: Why run inference in the browser?

It avoids a separate ML server for the live academic demo, reduces backend complexity, and lets us deploy the frontend and converted model through Vercel.

### Q: What happens if MobileNetV2 cannot load?

The application catches the failure and uses the lightweight browser classifier as a fallback. The result identifies which engine actually produced the prediction.

### Q: Is confidence the same as accuracy?

No. Confidence belongs to one prediction. Accuracy measures performance over a labeled dataset containing many samples.

### Q: Is 93% your own test accuracy?

No. 93% is the upstream project's reported test accuracy for the reference MobileNetV2 model. Our repository includes an evaluator for independent testing, and any independently generated result must name the exact dataset split.

### Q: Where is user data stored?

In the current live application, authentication is handled by Supabase Auth, prediction metadata is stored in Supabase PostgreSQL, and uploaded images are kept in a private Supabase Storage bucket.

### Q: How do you prevent one user seeing another user's scans?

Supabase Row Level Security and user-specific storage paths use the authenticated user ID to restrict access.

### Q: Why keep a MongoDB backend if production uses Supabase?

It fulfills and preserves the Node/Express/MongoDB architecture path, is independently smoke-tested, and can be deployed when a production MongoDB connection is configured. Supabase currently provides the already-operational production auth/storage/history infrastructure.

## 25. Best Demo Order

```text
1. Open PoultryDetect
2. Register / Login
3. Open Detect
4. Upload a clear poultry fecal sample
5. Select optional symptoms/environment
6. Click Detect Disease
7. Show prediction, confidence and 4 probability bars
8. Point out “MobileNetV2 Transfer Learning” and inference time
9. Explain the veterinary disclaimer
10. Open History and show saved scan/context
11. Download report
12. Logout
```
