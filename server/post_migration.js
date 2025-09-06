const mongoose = require('mongoose');
require('dotenv').config();

// Modèle User avec typeCompte obligatoire
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
    required: [true, 'Le type de compte est requis']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  entrepriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entreprise',
    required: function() {
      return this.typeCompte === 'entreprise';
    }
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

const User = mongoose.model('User', userSchema);

// Fonction pour vérifier que tous les utilisateurs ont un typeCompte
async function verifyAllUsersHaveTypeCompte() {
  try {
    console.log('🔍 Vérification que tous les utilisateurs ont un typeCompte...');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp');
    console.log('✅ Connecté à MongoDB');
    
    // Vérifier que tous les utilisateurs ont un typeCompte
    const usersWithoutType = await User.find({ typeCompte: { $exists: false } });
    
    if (usersWithoutType.length > 0) {
      console.log(`❌ ${usersWithoutType.length} utilisateurs n'ont pas encore de typeCompte`);
      console.log('⚠️  Exécutez d\'abord la migration: npm run migrate');
      return false;
    }
    
    console.log('✅ Tous les utilisateurs ont un typeCompte défini');
    
    // Vérifier la cohérence des données
    const adminCount = await User.countDocuments({ typeCompte: 'admin' });
    const entrepriseCount = await User.countDocuments({ typeCompte: 'entreprise' });
    
    console.log(`📊 Répartition des types de compte:`);
    console.log(`   - Administrateurs: ${adminCount}`);
    console.log(`   - Entreprises: ${entrepriseCount}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Fonction pour activer la validation stricte
async function activateStrictValidation() {
  try {
    console.log('🔒 Activation de la validation stricte...');
    
    const allUsersValid = await verifyAllUsersHaveTypeCompte();
    
    if (!allUsersValid) {
      console.log('❌ Impossible d\'activer la validation stricte');
      return;
    }
    
    console.log('✅ Tous les utilisateurs sont valides');
    console.log('\n🎯 ÉTAPES SUIVANTES:');
    console.log('1. Remplacez le contenu de models/User.js par le schéma strict');
    console.log('2. Redémarrez le serveur');
    console.log('3. Le champ typeCompte sera maintenant obligatoire');
    
    // Créer le fichier User.js avec le schéma strict
    await createStrictUserModel();
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'activation:', error);
  }
}

// Fonction pour créer le modèle User strict
async function createStrictUserModel() {
  try {
    console.log('\n📝 Création du modèle User strict...');
    
    const fs = require('fs');
    const path = require('path');
    
    const strictUserContent = `const mongoose = require('mongoose');
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
    required: [true, 'L\\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/, 'Veuillez entrer un email valide']
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
    required: [true, 'Le type de compte est requis']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  entrepriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entreprise',
    required: function() {
      return this.typeCompte === 'entreprise';
    }
  },
  telephone: {
    type: String,
    trim: true,
    match: [/^[0-9+\\-\\s()]+$/, 'Veuillez entrer un numéro de téléphone valide']
  },
  adresse: {
    type: String,
    trim: true,
    maxlength: [200, 'L\\'adresse ne peut pas dépasser 200 caractères']
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
userSchema.index({ entrepriseId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ statut: 1 });

// Virtual pour le nom complet
userSchema.virtual('nomComplet').get(function() {
  return \`\${this.prenom} \${this.nom}\`;
});

// Méthode pour comparer le mot de passe
userSchema.methods.comparerMotDePasse = async function(motDePasseSaisi) {
  return await bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

// Méthode pour obtenir le profil public
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.motDePasse;
  delete userObject.tokenVerification;
  delete userObject.tokenResetMotDePasse;
  delete userObject.dateExpirationReset;
  return userObject;
};

// Middleware pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode statique pour trouver un utilisateur par email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
`;
    
    const userModelPath = path.join(__dirname, 'models', 'User.js');
    
    // Sauvegarder l'ancien fichier
    const backupPath = path.join(__dirname, 'models', 'User.js.backup');
    if (fs.existsSync(userModelPath)) {
      fs.copyFileSync(userModelPath, backupPath);
      console.log('✅ Ancien modèle sauvegardé dans models/User.js.backup');
    }
    
    // Écrire le nouveau modèle strict
    fs.writeFileSync(userModelPath, strictUserContent);
    console.log('✅ Nouveau modèle User strict créé');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du modèle strict:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  activateStrictValidation().catch(console.error);
}

module.exports = {
  verifyAllUsersHaveTypeCompte,
  activateStrictValidation
}; 