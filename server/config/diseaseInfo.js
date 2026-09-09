const diseaseInfo = {
  Healthy: {
    description: "No signs of common fecal-indicated disease detected.",
    treatmentSuggestion:
      "No treatment needed. Maintain regular hygiene, clean water access, and balanced feed to keep the flock healthy.",
  },
  Coccidiosis: {
    description:
      "A parasitic intestinal disease caused by Eimeria protozoa, common in young birds, often showing blood-tinged or watery droppings.",
    treatmentSuggestion:
      "Consult a veterinarian promptly. Anticoccidial medication (e.g., amprolium) is commonly used, along with improved litter management and hygiene to reduce spread.",
  },
  Salmonella: {
    description:
      "A bacterial infection that can cause diarrhea, reduced appetite, and in severe cases, high mortality in young chicks.",
    treatmentSuggestion:
      "Consult a veterinarian for antibiotic guidance and biosecurity measures. Isolate affected birds and disinfect housing to prevent spread to the rest of the flock.",
  },
  Newcastle: {
    description:
      "A highly contagious viral disease affecting the respiratory, nervous, and digestive systems of poultry.",
    treatmentSuggestion:
      "No specific cure exists — prevention via vaccination is key. Isolate affected birds immediately, contact a veterinarian, and follow local animal health authority reporting requirements as this disease is often notifiable.",
  },
};

module.exports = diseaseInfo;
