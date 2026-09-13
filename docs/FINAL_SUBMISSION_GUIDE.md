# PoultryDetect — Final Submission Guide

## Project Title

**Transfer Learning-Based Classification of Poultry Diseases for Enhanced Health Management**

## Live Project

- Production: https://poultry-disease-classification.vercel.app
- Repository: `Mithun9661/poultry-disease-classification`

## Final Production Architecture

```text
User
  ↓
React + Vite Frontend
  ├─ Register / Login
  │      ↓
  │   Express API
  │      ↓
  │   bcrypt + JWT
  │      ↓
  │   MongoDB Atlas
  │
  └─ Upload / Capture Poultry Sample
         ↓
     TensorFlow.js
         ↓
     MobileNetV2 Transfer Learning
         ↓
     Disease + Confidence + Probabilities
         ↓
     Express API
         ↓
     MongoDB Atlas History
```

Primary production stack:

- Frontend: React 18, Vite, React Router
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- Authentication: bcrypt password hashing + JWT
- Primary ML: MobileNetV2 Transfer Learning
- ML Runtime: TensorFlow.js in the browser
- Fallback ML: lightweight browser classifier
- Deployment: Vercel
- Source Control / CI: GitHub + GitHub Actions

## Disease Classes

1. Healthy
2. Coccidiosis
3. Salmonella
4. Newcastle

The deployed MobileNetV2 checkpoint output order is:

```text
Coccidiosis, Healthy, Newcastle, Salmonella
```

## Main Features Implemented

- User registration, login and logout
- JWT-protected application routes
- Persistent MongoDB-backed user accounts
- Image upload and mobile camera capture
- JPG/PNG and image-size validation
- Basic image-quality warning
- MobileNetV2 TensorFlow.js inference
- Lightweight fallback classifier
- Four-class probabilities and confidence
- Model name/version and inference-time display
- Optional poultry symptoms and environmental context
- Prevention and next-step guidance
- User-specific MongoDB prediction history
- Dashboard statistics and recent scans
- History filtering/details/delete
- Downloadable HTML screening report
- Responsive UI
- Vercel production deployment
- GitHub Actions automated checks
- Legacy Supabase prediction migration queue

## ML Model Statement for Report and Viva

The live website uses an **attributed MobileNetV2 transfer-learning checkpoint** as the primary classifier. The exact deployed checkpoint was not trained inside this repository.

The upstream project reports approximately:

- Validation accuracy: **90%**
- Test accuracy: **93%**
- Test F1: **0.90**

These values must always be described as **upstream-reported metrics**.

The project's earlier independently evaluated lightweight fallback classifier achieved approximately **87.4% validation accuracy** on 713 validation images. This number belongs to the fallback model, not MobileNetV2.

## Prediction Workflow

```text
Login
  ↓
Open Detect page
  ↓
Upload / capture poultry fecal sample
  ↓
Optional symptoms + environment
  ↓
Image validation
  ↓
TensorFlow.js loads MobileNetV2
  ↓
128 × 128 RGB preprocessing
  ↓
Pixel normalization to [0,1]
  ↓
4-class Softmax inference
  ↓
Prediction + confidence + probabilities
  ↓
Save result/context to MongoDB
  ↓
Dashboard / History
```

Symptoms and environmental fields are stored as supplementary screening context. They **do not modify the ML confidence score**.

## Security Implemented

- bcrypt password hashing
- signed JWT sessions
- JWT verification pinned to HS256
- authenticated history APIs
- user-scoped read/delete operations
- password excluded from normal database queries
- auth and API rate limiting
- Helmet security headers
- CORS restrictions
- request-size limits
- auth input validation
- prediction payload validation
- security headers on Vercel
- `.env` and secret files excluded from Git

Production health endpoint confirms MongoDB and JWT configuration. Protected history endpoints return `401 Unauthorized` without a valid token.

## Automated Testing

GitHub Actions checks:

1. React/Vite production build
2. Express + MongoDB smoke test
3. MobileNetV2 TensorFlow.js deployment contract
4. Model provenance/license files
5. Python MobileNetV2 evaluator syntax

The backend smoke test covers authentication and prediction-history behavior, including unauthorized access and user isolation checks.

## Recommended Demo Sequence

```text
1. Open the production website
2. Register a new test account
3. Login
4. Show Dashboard
5. Open Detect Disease
6. Upload a clear poultry fecal image
7. Select optional symptoms/environment
8. Run detection
9. Show predicted class and confidence
10. Show all four probability values
11. Point out MobileNetV2 model name and inference time
12. Explain that symptoms do not change the ML score
13. Open History
14. Show saved scan and details
15. Delete a test history entry if required
16. Logout
```

## Short Viva Explanation

**What does the project do?**

PoultryDetect is an AI-assisted web application that screens poultry fecal images into Healthy, Coccidiosis, Salmonella or Newcastle classes. MobileNetV2 runs in the browser through TensorFlow.js, while Express, JWT and MongoDB Atlas handle user accounts and prediction history.

**Why MobileNetV2?**

MobileNetV2 is computationally efficient and suitable for browser/mobile-oriented inference while still supporting transfer learning.

**What is confidence?**

Confidence is the highest Softmax output for one prediction. It is not the same as model accuracy and is not veterinary certainty.

**Where is user data stored?**

Production accounts and prediction history are stored in MongoDB Atlas through the Node/Express API. Passwords are stored only as bcrypt hashes.

**Is this a veterinary diagnosis?**

No. It is an academic screening aid. Veterinary examination and laboratory confirmation are required for real diagnosis and treatment decisions.

## Final Submission Checklist

- [x] Working production URL
- [x] GitHub repository
- [x] React frontend
- [x] Node/Express backend
- [x] MongoDB Atlas production database
- [x] Register/Login/JWT
- [x] MobileNetV2 transfer-learning inference
- [x] Four disease classes
- [x] Symptoms/environment context
- [x] Dashboard and prediction history
- [x] Automated CI checks
- [x] Model provenance and license
- [x] Architecture documentation
- [x] Validation documentation
- [x] Viva guide
- [x] Final submission guide

## Important Limitations

- The system is an academic screening tool, not a medical/veterinary diagnostic system.
- The production checkpoint is an attributed reference checkpoint rather than a team-trained checkpoint.
- Upstream accuracy does not guarantee the same performance on every farm or camera image.
- Unrelated or out-of-distribution images may still produce confident Softmax predictions.
- Lighting, blur, crop and background can affect prediction quality.
- Real disease diagnosis should be confirmed by a qualified poultry veterinarian and laboratory testing where appropriate.

## Related Documentation

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/MODEL_CARD.md`
- `docs/VALIDATION_AND_TESTING.md`
- `docs/VIVA_GUIDE.md`

---

**Final project status:** production-ready academic demonstration with React, Node/Express, MongoDB Atlas, JWT authentication and browser-based MobileNetV2 classification.
