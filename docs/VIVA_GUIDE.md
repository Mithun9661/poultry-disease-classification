# PoultryDetect — Viva Guide

## 1. Project Title

**Poultry Disease Classification using AI / Machine Learning**

If your college title specifically mentions transfer learning, explain clearly that the repository contains a MobileNetV2 transfer-learning training module, while the current live demo uses a lightweight browser classifier for fast deployment.

## 2. One-Line Explanation

PoultryDetect is a web application that allows a user to upload a poultry fecal sample image and receive an AI-assisted classification among Healthy, Coccidiosis, Salmonella, and Newcastle classes.

## 3. Problem Statement

Poultry farmers may not always have immediate access to expert screening. The project explores whether image classification can provide an early screening signal from poultry fecal sample images.

## 4. Main Technologies

- React + Vite
- JavaScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Row Level Security
- Browser-side ML inference
- TensorFlow/Keras MobileNetV2 training module
- GitHub
- Vercel

## 5. Main Workflow

```text
Register/Login
    ↓
Upload image
    ↓
Validate image
    ↓
Extract image features
    ↓
Classify into 4 classes
    ↓
Show confidence + probabilities
    ↓
Save result and image
    ↓
Show scan in History
```

## 6. What Are the Four Classes?

1. Healthy
2. Coccidiosis
3. Salmonella
4. Newcastle

## 7. What Does Confidence Mean?

Confidence is the highest Softmax probability returned by the classifier. It represents how strongly the model prefers one class compared with the other classes for that input.

It is **not** the same as medical certainty.

## 8. Why Use Softmax?

Softmax converts model scores into values between 0 and 1 that sum to 1, so they can be displayed as probabilities for the four classes.

## 9. What Features Does the Live Model Use?

The live browser model extracts:

- RGB statistics
- HSV statistics
- color histograms
- grayscale information
- edge information
- block-wise spatial color features

The extracted feature vector is standardized and then passed to learned linear class weights.

## 10. What Is Transfer Learning?

Transfer learning reuses a model that was already trained on a large dataset and adapts it to a new task.

In this project, the repository includes a MobileNetV2 pipeline initialized with ImageNet weights. The convolutional base is first frozen, a new classification head is trained, and later some upper layers are fine-tuned using a lower learning rate.

## 11. Why MobileNetV2?

MobileNetV2 is lightweight, efficient, and suitable for image-classification applications where computation and deployment size matter.

## 12. Why Is the Live Model Different?

The current production demo uses a smaller browser classifier because it can run directly inside the browser without deploying a heavy TensorFlow server.

This reduces hosting complexity and response latency for an academic demonstration.

## 13. What Is Supabase Used For?

Supabase provides:

- user authentication
- persistent sessions
- PostgreSQL database
- private image storage
- Row Level Security

## 14. What Is Row Level Security?

Row Level Security controls which database rows a logged-in user is allowed to read, insert, or delete.

In this project, each user is restricted to their own prediction history.

## 15. How Are Images Protected?

Prediction images are stored in a private Supabase Storage bucket. The History page uses temporary signed URLs to display them.

## 16. What Is Stored in Prediction History?

Each history record contains:

- user ID
- predicted class
- confidence
- probabilities
- image path
- date/time

## 17. Why Vercel?

Vercel is used to host the React/Vite frontend and automatically deploy new versions from GitHub.

## 18. Current Accuracy

The current deployed lightweight classifier is reported in the project UI at approximately **87.4% validation accuracy**.

Say clearly that this is validation-set performance for the project dataset and not veterinary field validation.

## 19. Limitations

Important limitations to mention in viva:

- image-only classification cannot confirm disease
- performance may change on unseen farm conditions
- lighting and camera quality affect images
- similar diseases can have similar visual appearance
- current system does not replace veterinary testing
- the live classifier and MobileNetV2 training module are currently separate implementations

## 20. Future Scope

- deploy the trained MobileNetV2 model
- compare MobileNetV2, EfficientNet, and ResNet
- add confusion matrix and per-class metrics
- improve dataset diversity
- add out-of-distribution image detection
- add multilingual farmer guidance
- add flock analytics and monitoring

## 21. Common Viva Questions

### Q: Why did you choose this project?

Poultry disease can affect flock health and farm productivity. The project applies image classification to explore a fast, accessible early-screening tool.

### Q: Is your system a diagnostic tool?

No. It is an academic screening aid. Real diagnosis requires a qualified veterinarian and may require laboratory tests.

### Q: What happens after the user uploads an image?

The image is validated, resized, converted into numerical features, standardized, scored by the model, converted into class probabilities, and the highest-probability class is displayed.

### Q: Where is user data stored?

Authentication is handled by Supabase Auth. Prediction metadata is stored in Supabase PostgreSQL and scan images are stored in a private Supabase Storage bucket.

### Q: How do you ensure one user cannot see another user's history?

Supabase Row Level Security policies restrict database rows and storage objects using the authenticated user's ID.

### Q: What is the biggest improvement you would make next?

I would fully train, evaluate, and deploy the MobileNetV2 transfer-learning model, then compare it against the current lightweight classifier using a held-out test set and per-class metrics.

## 22. Demo Order During Presentation

Use this order:

```text
1. Open homepage
2. Register or Login
3. Open Detect
4. Upload a clear sample image
5. Show prediction + confidence + probability bars
6. Explain symptoms/prevention guidance
7. Open History
8. Show stored scan and statistics
9. Download report
10. Logout
```

This gives a complete end-to-end demonstration in a short time.
