const mongoose = require('mongoose');

const entrepriseSchema = new mongoose.Schema({
  // 1. Indicateurs d'Identification et Structure de l'Entreprise
  identification: {
    nomEntreprise: {
      type: String,
      required: [true, 'Le nom de l\'entreprise est requis'],
      trim: true,
      maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
    },
    raisonSociale: {
      type: String,
      trim: true,
      maxlength: [200, 'La raison sociale ne peut pas dépasser 200 caractères']
    },
    region: {
      type: String,
      required: [true, 'La région est requise'],
      trim: true,
      enum: [
        'Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral', 
        'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
      ]
    },
    ville: {
      type: String,
      required: [true, 'La ville est requise'],
      trim: true,
      maxlength: [100, 'La ville ne peut pas dépasser 100 caractères']
    },
    dateCreation: {
      type: Date,
      required: [true, 'La date de création est requise']
    },
    secteurActivite: {
      type: String,
      required: [true, 'Le secteur d\'activité est requis'],
      enum: [
        'Primaire', 'Secondaire', 'Tertiaire'
      ]
    },
    sousSecteur: {
      type: String,
      required: [true, 'Le sous-secteur est requis'],
      enum: [
        'Agro-industriel', 'Forêt-Bois', 'Mines', 'Pétrole-Gaz',
        'Industrie manufacturière', 'BTP', 'Énergie', 'Eau',
        'Commerce', 'Transport', 'Télécommunications', 'Banque-Assurance',
        'Tourisme', 'Santé', 'Éducation', 'Autres'
      ]
    },
    filiereProduction: {
      type: String,
      trim: true,
      maxlength: [100, 'La filière de production ne peut pas dépasser 100 caractères']
    },
    formeJuridique: {
      type: String,
      required: [true, 'La forme juridique est requise'],
      enum: [
        'SARL', 'SA', 'EI', 'SUARL', 'SARLU', 'SNC', 'SCS', 'SAS', 'Autres'
      ]
    },
    numeroContribuable: {
      type: String,
      required: [true, 'Le numéro de contribuable est requis'],
      trim: true,
      unique: true,
      match: [/^[A-Z0-9]+$/, 'Le numéro de contribuable doit être alphanumérique']
    }
  },

  // 2. Indicateurs de Performance Économique et Financière
  performanceEconomique: {
    chiffreAffaires: {
      montant: {
        type: Number,
        min: [0, 'Le chiffre d\'affaires ne peut pas être négatif']
      },
      devise: {
        type: String,
        enum: ['FCFA', 'USD', 'EUR'],
        default: 'FCFA'
      },
      periode: {
        type: String,
        enum: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4', 'Année complète']
      }
    },
    evolutionCA: {
      type: String,
      enum: ['Hausse', 'Baisse', 'Stabilité']
    },
    coutsProduction: {
      montant: {
        type: Number,
        min: [0, 'Les coûts de production ne peuvent pas être négatifs']
      },
      devise: {
        type: String,
        enum: ['FCFA', 'USD', 'EUR'],
        default: 'FCFA'
      }
    },
    evolutionCouts: {
      type: String,
      enum: ['Accroissement', 'Baisse', 'Stabilité']
    },
    situationTresorerie: {
      type: String,
      enum: ['Difficile', 'Normale', 'Aisée']
    },
    sourcesFinancement: {
      ressourcesPropres: { type: Boolean, default: false },
      subventions: { type: Boolean, default: false },
      concoursBancaires: { type: Boolean, default: false },
      creditsFournisseur: { type: Boolean, default: false },
      autres: { type: Boolean, default: false },
      autresDetails: {
        type: String,
        trim: true,
        maxlength: [200, 'Les détails ne peuvent pas dépasser 200 caractères']
      }
    }
  },

  // 3. Indicateurs d'Investissement et d'Emploi
  investissementEmploi: {
    effectifsEmployes: {
      type: Number,
      required: [true, 'Le nombre d\'employés est requis'],
      min: [0, 'Le nombre d\'employés ne peut pas être négatif']
    },
    nouveauxEmploisCrees: {
      type: Number,
      default: 0,
      min: [0, 'Le nombre de nouveaux emplois ne peut pas être négatif']
    },
    nouveauxInvestissementsRealises: {
      type: Boolean,
      default: false
    },
    typesInvestissements: {
      immobiliers: { type: Boolean, default: false },
      mobiliers: { type: Boolean, default: false },
      incorporels: { type: Boolean, default: false },
      financiers: { type: Boolean, default: false }
    }
  },

  // 4. Indicateurs d'Innovation et de Digitalisation
  innovationDigitalisation: {
    integrationInnovation: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    },
    integrationEconomieNumerique: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    },
    utilisationIA: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    }
  },

  // 5. Indicateurs liés aux Conventions
  conventions: {
    respectDelaisReporting: {
      conforme: { type: Boolean, default: true },
      joursRetard: { type: Number, default: 0, min: 0 }
    },
    atteinteCiblesInvestissement: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    atteinteCiblesEmploi: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    conformiteNormesSpecifiques: {
      conforme: { type: Boolean, default: true },
      niveauConformite: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
      }
    }
  },

  // Informations de contact
  contact: {
    telephone: {
      type: String,
      required: false,
      trim: true,
      default: null,
      validate: {
        validator: function(v) {
          // Only validate format when a value is provided
          if (v === null || v === undefined || v === '') return true;
          return /^[0-9+\-\s()]+$/.test(v);
        },
        message: 'Veuillez entrer un numéro de téléphone valide'
      }
    },
    email: {
      type: String,
      required: [true, 'L\'email est requis'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer un email valide']
    },
    siteWeb: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Veuillez entrer une URL valide']
    },
    adresse: {
      rue: {
        type: String,
        trim: true,
        maxlength: [200, 'L\'adresse ne peut pas dépasser 200 caractères']
      },
      ville: {
        type: String,
        trim: true,
        maxlength: [100, 'La ville ne peut pas dépasser 100 caractères']
      },
      codePostal: {
        type: String,
        trim: true,
        maxlength: [10, 'Le code postal ne peut pas dépasser 10 caractères']
      },
      pays: {
        type: String,
        trim: true,
        maxlength: [50, 'Le pays ne peut pas dépasser 50 caractères'],
        default: 'Cameroun'
      }
    }
  },

  // Statut et métadonnées
  statut: {
    type: String,
    enum: ['En attente', 'Actif', 'Inactif', 'Suspendu'],
    default: 'En attente'
  },
  informationsCompletes: {
    type: Boolean,
    default: false
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual properties or methods here if needed
entrepriseSchema.virtual('conventionsActives', {
  ref: 'Convention',
  localField: '_id',
  foreignField: 'enterpriseId',
  match: { status: 'ACTIVE' }
});

module.exports = mongoose.model('Entreprise', entrepriseSchema);
