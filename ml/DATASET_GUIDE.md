# Getting the Poultry Disease Dataset

This project classifies poultry fecal images into 4 classes: **Healthy, Coccidiosis, Salmonella, Newcastle**.

The dataset contains thousands of images and is intentionally not committed to this repository.

## Dataset structure

Arrange the data as:

```text
ml/training/data/
  train/
    Healthy/
    Coccidiosis/
    Salmonella/
    Newcastle/
  val/
    Healthy/
    Coccidiosis/
    Salmonella/
    Newcastle/
```

An 80/20 or 85/15 train/validation split per class is suitable.

## Sources

The commonly used poultry fecal-image dataset is based on the Machuve et al. dataset. It is available through public research/data repositories such as Zenodo and is also mirrored in poultry-disease datasets on Kaggle.

## Training

Once the data folder is ready:

```bash
cd ml/training
python train.py
```

A GPU runtime such as Google Colab is recommended for faster training. The training script produces:

- `poultry_disease_model.keras`
- `class_indices.json`

Copy both output files into `ml/inference_service/` before starting the FastAPI inference service.
