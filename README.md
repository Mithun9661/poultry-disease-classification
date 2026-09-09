# FlockCheck — Poultry Disease Classification (Full-Stack)

A full-stack web app that classifies chicken fecal images into **Healthy, Coccidiosis, Salmonella, or Newcastle disease** using transfer learning, with user accounts and scan history.

Built for the project lifecycle described in `Poultry_Disease_Project_Lifecycle_Documentation.docx` (ideation → requirements → design → implementation → testing → deployment).

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌───────────────────────┐
│   React     │─────▶│  Node/Express    │─────▶│  FastAPI ML service   │
│  (client)   │ REST │  + MongoDB       │ REST │  (TensorFlow model)   │
│  Login/Scan │◀─────│  Auth, history   │◀─────│  Image → prediction   │
└─────────────┘      └──────────────────┘      └───────────────────────┘
```

- **client/** — React (Vite) frontend: login/register, drag-and-drop image scan, result view, scan history
- **server/** — Node.js + Express + MongoDB (Mongoose) backend: JWT auth, stores predictions, forwards images to the ML service
- **ml/** — Python: `training/train.py` (transfer learning with MobileNetV2) and `inference_service/main.py` (FastAPI service that serves the trained model)

## Features

- User registration/login (JWT-based auth, bcrypt password hashing)
- Upload a fecal image and get a disease prediction with confidence score
- Per-class probability breakdown
- Treatment/next-step suggestion per predicted disease
- Scan history per user (MongoDB-backed)
- Transfer learning model (MobileNetV2)

## Important deployment note

The React frontend can be deployed on Vercel. The Express API requires MongoDB Atlas and the FastAPI inference service requires a trained TensorFlow model (`poultry_disease_model.keras` + `class_indices.json`). For a complete working prediction flow, deploy the ML service and backend separately (for example Render/Railway) and point the frontend API URL to the backend.

## Disclaimer

This is an academic/portfolio project, not a validated veterinary diagnostic tool. Real disease-management decisions should involve a qualified veterinarian.
