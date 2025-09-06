const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer un email valide']
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false
  },
  typeCompte: {
    type: String,
    enum: ['admin', 'entreprise'],
    required: false // Temporairement optionnel jusqu'à la migration
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  entrepriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entreprise',
    required: false // Rendu optionnel pour permettre l'inscription d'entreprise
  },
  entrepriseIncomplete: {
    type: Boolean,
    default: false
  },
  telephone: {
    type: String,
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Veuillez entrer un numéro de téléphone valide']
  },
  adresse: {
    type: String,
    trim: true,
    maxlength: [200, 'L\'adresse ne peut pas dépasser 200 caractères']
  },
  dateNaissance: {
    type: Date
  },
  genre: {
    type: String,
    enum: ['homme', 'femme', 'autre'],
    required: false
  },
  photo: {
    type: String,
    default: null
  },
  statut: {
    type: String,
    enum: ['actif', 'inactif', 'suspendu'],
    default: 'actif'
  },
  derniereConnexion: {
    type: Date,
    default: null
  },
  emailVerifie: {
    type: Boolean,
    default: false
  },
  tokenVerification: {
    type: String,
    default: null
  },
  tokenResetMotDePasse: {
    type: String,
    default: null
  },
  dateExpirationReset: {
    type: Date,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    langue: {
      type: String,
      enum: ['fr', 'en'],
      default: 'fr'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
// Supprimé l'index explicite sur email pour éviter le doublon avec unique: true
userSchema.index({ entrepriseId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ statut: 1 });

// Virtual pour le nom complet
userSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

// Middleware pre-save pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparerMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

// Méthode pour obtenir les informations publiques de l'utilisateur
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.motDePasse;
  delete userObject.tokenVerification;
  delete userObject.tokenResetMotDePasse;
  delete userObject.dateExpirationReset;
  return userObject;
};

// Méthode statique pour trouver un utilisateur par email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Méthode pour vérifier si l'utilisateur est admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.role === 'super_admin';
};

module.exports = mongoose.model('User', userSchema); 