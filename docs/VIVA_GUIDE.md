# PoultryDetect — Viva Guide

## 1. Project Title

**Transfer Learning-Based Classification of Poultry Diseases for Enhanced Health Management**

## 2. One-Line Explanation

PoultryDetect is a web application that classifies a poultry sample image into **Healthy, Coccidiosis, Salmonella, or Newcastle** using a MobileNetV2 transfer-learning model and stores the screening result in MongoDB for later review.

## 3. Problem Statement

Poultry diseases can spread quickly and expert screening may not always be immediately available. This project explores whether deep-learning image classification can provide an early screening signal from poultry images.

The system is an academic screening tool, **not a replacement for a veterinarian or laboratory diagnosis**.

## 4. Technologies Used

- React 18 + Vite
- JavaScript
- TensorFlow.js
- MobileNetV2 Transfer Learning
- Node.js + Express
- MongoDB Atlas + Mongoose
- bcrypt password hashing
- JWT authentication
- GitHub Actions
- Vercel

## 5. Main Workflow

```text
Register / Login
      ↓
Express API + MongoDB authentication
      ↓
Upload or capture poultry image
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
Save result + symptoms + environment + compressed preview through Express API
      ↓
MongoDB Atlas history
      ↓
View / filter / delete / download report
```

If MobileNetV2 cannot load, the application can use a lightweight fallback classifier and clearly identifies the fallback in the result.

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

MobileNetV2 is useful here because it offers a strong accuracy/size trade-off and is designed to be computationally efficient.

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

TensorFlow.js runs the model directly in the user's browser. The Node/Express backend stores authentication and prediction-history data; it does not perform the main browser inference.

## 9. Did We Train the Exact Production MobileNetV2 Checkpoint?

No. The current production checkpoint is an **attributed MIT-licensed reference checkpoint** from an upstream poultry-disease project.

The repository keeps its provenance and upstream license beside the converted model. We do not falsely claim that this exact checkpoint was trained by our team.

The project also contains MobileNetV2 training/evaluation code so the reference checkpoint can later be replaced by a project-owned checkpoint.

## 10. Why TensorFlow.js?

TensorFlow.js allows deep-learning inference directly inside the browser.

Benefits:

- no separate GPU inference server is required for the live demo
- image inference occurs locally in the browser
- easy Vercel deployment
- converted Keras models can run in JavaScript

The ML runtime is lazy-loaded only when a scan is requested, which keeps normal application pages faster.

## 11. What Does Confidence Mean?

Confidence is the highest probability in the model's four-class Softmax output.

It shows how strongly the model prefers one class relative to the others for that image. It is **not medical certainty** and not a guarantee that the bird has that disease.

## 12. Why Softmax?

Softmax converts four class scores into values between 0 and 1 that sum approximately to 1. The deployed checkpoint already ends with a Softmax layer, so the application uses its output directly instead of applying Softmax twice.

## 13. Current Performance Numbers

### MobileNetV2 reference checkpoint

The upstream project reports:

- Validation accuracy: **90%**
- Test accuracy: **93%**
- Test F1 score: **0.90**
- Parameters: **2,263,108**
- Approximate model size reported upstream: **9.13 MB**

These are **upstream-reported experimental metrics**, not a new independent PoultryDetect evaluation.

### Lightweight fallback classifier

The earlier independently checked fallback classifier achieved approximately **87.4% validation accuracy** on the project validation subset.

Do not say “MobileNetV2 accuracy is 87.4%.”

## 14. How Can We Independently Evaluate MobileNetV2?

The repository contains:

```text
ml/evaluation/evaluate_mobilenet.py
```

It can calculate accuracy, precision, recall, F1, per-class metrics and a confusion matrix. The exact dataset split must be recorded whenever those results are reported.

## 15. What Is the Fallback Classifier?

The fallback uses handcrafted RGB/HSV statistics, histograms, grayscale/gradient information and spatial color blocks, followed by a learned multiclass linear classifier.

It is used only if the TensorFlow.js MobileNetV2 path fails on a device.

## 16. What Is MongoDB Used For?

MongoDB Atlas is the **current live production database**. It stores:

- registered users
- prediction history
- class probabilities and confidence
- model metadata and inference time
- reported symptoms
- environmental context
- compressed scan preview
- legacy migration metadata where needed

Mongoose provides the application schemas and database access layer.

## 17. How Does Authentication Work?

Registration sends name, email and password to the Express API. The server validates the input and hashes the password with bcrypt before storing it in MongoDB.

On login, bcrypt verifies the password and the server issues a signed JWT. Protected API requests send that token in the `Authorization: Bearer ...` header.

The password hash is excluded from normal Mongoose queries.

## 18. How Do You Stop One User Seeing Another User's History?

The JWT identifies the authenticated MongoDB user. History queries use that user ID as part of the database filter.

For deletion, the server searches using both the prediction ID and authenticated user ID. Automated tests also verify that a second user cannot delete another user's prediction.

## 19. What Is Stored in History?

A new scan can store:

- authenticated user ID
- predicted class
- confidence
- class probabilities
- compressed image preview
- reported symptoms
- environment context
- model name/version
- inference time
- suggested next step
- date/time

## 20. Why Save Symptoms and Environment If They Do Not Change the Score?

They provide screening context for later review, but the current prediction score is produced by the image classifier only. The UI explicitly says this so the system does not pretend those form fields are trained ML features.

## 21. What Happened to Supabase?

Supabase was used in an earlier development stage for authentication, PostgreSQL history and image storage.

The final production application now uses **Express + MongoDB Atlas** for authentication and history. Old Supabase prediction metadata was preserved in a MongoDB legacy migration queue. A matching-email MongoDB account can claim those old records. Supabase is not required by the final frontend at runtime.

## 22. How Is the API Secured?

The project uses:

- bcrypt password hashing
- signed JWT authentication
- HS256-pinned JWT verification
- authentication rate limiting
- general API rate limiting
- Helmet security headers
- CORS allowlisting
- body-size limits
- email/name/password validation
- prediction-payload validation
- per-user MongoDB authorization
- deployment secrets through environment variables

## 23. How Is the Project Tested?

GitHub Actions automatically checks:

- React production build
- Express + temporary MongoDB smoke test
- invalid registration rejection
- duplicate registration rejection
- wrong-password rejection
- login and session verification
- unauthorized history rejection
- valid history create/read/delete
- cross-user delete protection
- MobileNetV2 model input/output contract
- model shards, provenance and license
- Python evaluator syntax

The latest security-hardened CI run passed.

## 24. Important Limitations

- image screening cannot confirm a disease
- real-farm data may differ from training data
- lighting, blur and background can affect predictions
- out-of-distribution images can still receive confident predictions
- Newcastle is comparatively underrepresented in the source data
- upstream metrics do not guarantee field accuracy
- symptoms/environment do not currently change the ML score
- JWT is currently stored client-side for the academic web app; an HttpOnly-cookie session would be a stronger future production-hardening option
- veterinary/laboratory confirmation is required for real treatment decisions

## 25. Future Scope

- train a project-owned MobileNetV2/EfficientNet checkpoint on the full declared dataset
- independently evaluate it on a held-out test set
- add out-of-distribution/reject detection
- calibrate confidence scores
- improve Newcastle class balance
- add multilingual farmer guidance
- add flock-level trend analytics
- move JWT session handling to secure HttpOnly cookies for stronger web security

## 26. Common Viva Questions

### Q: Why did you choose MobileNetV2?

MobileNetV2 is efficient and relatively small compared with many CNN architectures, making it practical for web/mobile-oriented inference while still supporting transfer learning.

### Q: Why run inference in the browser?

It avoids a separate GPU inference server for the academic demo, reduces backend ML infrastructure, and works well with Vercel-hosted static model assets.

### Q: What happens if MobileNetV2 cannot load?

The application catches the failure and uses the lightweight browser classifier. The UI identifies which engine produced the result.

### Q: Is confidence the same as accuracy?

No. Confidence belongs to one prediction. Accuracy measures performance over many labeled samples.

### Q: Is 93% your own test accuracy?

No. 93% is the upstream project's reported test accuracy for the reference MobileNetV2 checkpoint. The repository contains an evaluator for independent testing.

### Q: Where is user data stored now?

The final live application stores users and prediction history in MongoDB Atlas through the Express API.

### Q: Why use JWT?

JWT lets the backend verify authenticated API requests without trusting a user ID sent directly by the frontend. The token is signed by the server and used to scope MongoDB queries to the logged-in user.

### Q: Is MongoDB actually live or just sample code?

It is live. The Vercel API is configured with MongoDB Atlas, and `/api/health` reports MongoDB and JWT readiness. The protected history endpoint rejects unauthenticated requests.

### Q: What was Supabase used for?

It was the earlier cloud backend. Its old scan metadata was preserved for migration, but the final frontend/backend flow uses Express and MongoDB Atlas.

## 27. Best Demo Order

```text
1. Open PoultryDetect
2. Register / Login
3. Show Dashboard
4. Open Detect
5. Upload/capture a clear poultry sample
6. Select optional symptoms/environment
7. Click Detect Disease
8. Show prediction, confidence and probability bars
9. Point out MobileNetV2 name and inference time
10. Explain the veterinary disclaimer
11. Open History and show the saved MongoDB record
12. Delete/filter a history item if needed
13. Download the screening report
14. Logout and log in again to show persistence
```
