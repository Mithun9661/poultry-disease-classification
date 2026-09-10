# PoultryDetect — Model Card

## Model Purpose

The current deployed classifier is an academic image-screening model that assigns a poultry fecal sample image to one of four project classes:

- Coccidiosis
- Healthy
- Newcastle
- Salmonella

The model is intended for educational demonstration, not veterinary diagnosis.

## Deployed Model Type

The live web application currently uses a **lightweight browser-side linear classifier** with handcrafted image features.

Files:

```text
client/src/ml/browserModel.js
client/src/ml/poultryBrowserModel.json
```

## Input

- JPG or PNG image
- Maximum upload size enforced by the UI: 5 MB
- Image is resized to 40 × 40 pixels for feature extraction

## Feature Extraction

The deployed browser model computes:

- RGB channel statistics
- HSV channel statistics
- 8-bin histograms for color channels
- grayscale mean and standard deviation
- edge-magnitude mean and standard deviation
- 4 × 4 spatial block RGB averages

These features are standardized using stored mean and scale values.

## Prediction Method

The standardized feature vector is multiplied by stored learned class weights. The resulting class scores are converted to probabilities using Softmax.

Output:

```text
predictedClass
confidence
probabilities
```

## Reported Validation Result

The current project UI reports approximately **87.4% validation accuracy** for the deployed lightweight classifier.

This number should be interpreted only as performance on the project validation data. It should not be treated as field, clinical, or veterinary validation.

## Transfer-Learning Module

The repository separately includes a TensorFlow/Keras transfer-learning training script:

```text
ml/training/train.py
```

This pipeline uses:

- MobileNetV2 pretrained on ImageNet
- 224 × 224 input images
- Global Average Pooling
- Dense layer with ReLU
- Dropout regularization
- Softmax output
- data augmentation
- early stopping
- checkpointing
- fine-tuning of upper layers

The transfer-learning script represents the intended deep-learning extension, but the current production site is not serving that MobileNetV2 model.

## Known Limitations

- Image-only classification cannot establish a veterinary diagnosis.
- Dataset distribution may differ from real farms.
- Camera quality, lighting, background, fecal consistency, breed, age, and environment may affect performance.
- Similar visual symptoms can appear in multiple diseases.
- The model does not currently reject unrelated or out-of-distribution images.
- The reported validation accuracy is not enough to establish reliability for treatment decisions.

## Recommended Future Evaluation

For a stronger academic result, report:

- train / validation / test split
- class distribution
- confusion matrix
- accuracy
- precision
- recall
- F1-score
- per-class metrics
- macro and weighted averages
- comparison between lightweight model and MobileNetV2

## Safety Statement

Model predictions must be treated as screening output only. Veterinary examination and laboratory confirmation should be used for real-world disease diagnosis and treatment decisions.
