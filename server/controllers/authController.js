const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Entreprise = require('../models/Entreprise');
const { v4: uuidv4 } = require('uuid');

// Générer un token JWT
const genererToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET non configuré dans les variables d\'environnement');
  }
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Envoyer la réponse avec token
const envoyerReponseToken = (user, statusCode, res) => {
  const token = genererToken(user._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: user.getPublicProfile()
    });
};

// @desc    Inscription d'un utilisateur
// @route   POST /api/auth/inscription
// @access  Public
const inscription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { nom, prenom, email, motDePasse, telephone, typeCompte, role, entrepriseId } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const utilisateurExistant = await User.findOne({ email });
    if (utilisateurExistant) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà.'
      });
    }

    // Valider le rôle si fourni
    if (role && !['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Les rôles autorisés sont: user, admin, super_admin.'
      });
    }

    let entrepriseIdFinal = entrepriseId;

    // Si c'est une inscription d'entreprise, créer l'entreprise d'abord
    if (typeCompte === 'entreprise') {
      try {
        const nouvelleEntreprise = await Entreprise.create({
          identification: {
            nomEntreprise: `${nom} ${prenom}`, // Nom temporaire basé sur l'utilisateur
            region: 'Centre', // Valeur par défaut
            ville: 'Yaoundé', // Valeur par défaut
            dateCreation: new Date(),
            secteurActivite: 'Tertiaire', // Valeur par défaut
            sousSecteur: 'Autres', // Valeur par défaut
            formeJuridique: 'SARL', // Valeur par défaut
            numeroContribuable: `TEMP${Date.now()}`, // Numéro temporaire
          },
          contact: {
            telephone: telephone ? String(telephone).trim() : '+0000000000',
            email: email,
            adresse: {
              pays: 'Cameroun',
            }
          },
          investissementEmploi: {
            effectifsEmployes: 1, // Valeur par défaut (au moins l'utilisateur)
          },
          performanceEconomique: {
            sourcesFinancement: {
              ressourcesPropres: true,
            }
          },
          innovationDigitalisation: {
            integrationInnovation: 1,
            integrationEconomieNumerique: 1,
            utilisationIA: 1,
          },
          conventions: {
            respectDelaisReporting: {
              conforme: true,
            },
            conformiteNormesSpecifiques: {
              conforme: true,
            }
          },
          statut: 'En attente', // Valeur valide selon l'enum
          informationsCompletes: false // Marquer comme incomplète pour redirection vers paramètres
        });
        
        entrepriseIdFinal = nouvelleEntreprise._id;
      } catch (error) {
        console.error('Erreur lors de la création de l\'entreprise:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'entreprise.'
        });
      }
    }

    // Créer l'utilisateur
    const userData = {
      nom,
      prenom,
      email,
      motDePasse,
      telephone,
      typeCompte
    };

    // Ajouter entrepriseId si disponible
    if (entrepriseIdFinal) {
      userData.entrepriseId = entrepriseIdFinal;
    }

    // Définir le rôle par défaut selon le type de compte
    if (!role) {
      userData.role = typeCompte === 'admin' ? 'admin' : 'user';
    } else {
      userData.role = role;
    }

    const user = await User.create(userData);

    // Si c'est une entreprise, marquer qu'elle doit compléter ses informations
    if (typeCompte === 'entreprise') {
      user.entrepriseIncomplete = true;
      await user.save();
    }

    envoyerReponseToken(user, 201, res);
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription.'
    });
  }
};

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/connexion
// @access  Public
const connexion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, motDePasse, typeCompte } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findByEmail(email).select('+motDePasse');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Vérifier le type de compte si spécifié
    if (typeCompte && user.typeCompte !== typeCompte) {
      return res.status(401).json({
        success: false,
        message: `Ce compte n'est pas un compte ${typeCompte}.`
      });
    }

    // Vérifier le mot de passe
    const motDePasseCorrect = await user.comparerMotDePasse(motDePasse);
    if (!motDePasseCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Vérifier si le compte est actif
    if (user.statut !== 'actif') {
      return res.status(401).json({
        success: false,
        message: 'Votre compte a été désactivé. Contactez l\'administrateur.'
      });
    }

    // Mettre à jour la dernière connexion sans validation complète
    await User.updateOne(
      { _id: user._id },
      { $set: { derniereConnexion: new Date() } }
    );

    envoyerReponseToken(user, 200, res);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion.'
    });
  }
};

// @desc    Déconnexion d'un utilisateur
// @route   POST /api/auth/deconnexion
// @access  Private
const deconnexion = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie.'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion.'
    });
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/moi
// @access  Private
const obtenirProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('entrepriseId', 'nom secteur statut');
    
    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil.'
    });
  }
};

// @desc    Mettre à jour le profil de l'utilisateur
// @route   PUT /api/auth/moi
// @access  Private
const mettreAJourProfil = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nom, prenom, telephone, adresse, dateNaissance, genre, preferences } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    // Mettre à jour les champs autorisés
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
    if (adresse) user.adresse = adresse;
    if (dateNaissance) user.dateNaissance = dateNaissance;
    if (genre) user.genre = genre;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès.',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil.'
    });
  }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/changer-mot-de-passe
// @access  Private
const changerMotDePasse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { motDePasseActuel, nouveauMotDePasse } = req.body;

    const user = await User.findById(req.user.id).select('+motDePasse');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    // Vérifier le mot de passe actuel
    const motDePasseCorrect = await user.comparerMotDePasse(motDePasseActuel);
    if (!motDePasseCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect.'
      });
    }

    // Mettre à jour le mot de passe
    user.motDePasse = nouveauMotDePasse;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès.'
    });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe.'
    });
  }
};

// @desc    Demander la réinitialisation du mot de passe
// @route   POST /api/auth/oublie-mot-de-passe
// @access  Public
const oublieMotDePasse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur trouvé avec cet email.'
      });
    }

    // Générer un token de réinitialisation
    const tokenReset = uuidv4();
    const dateExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    user.tokenResetMotDePasse = tokenReset;
    user.dateExpirationReset = dateExpiration;
    await user.save();

    // Ici, vous pourriez envoyer un email avec le lien de réinitialisation
    // Pour l'instant, on retourne le token (en production, envoyez un email)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${tokenReset}`;

    res.status(200).json({
      success: true,
      message: 'Email de réinitialisation envoyé.',
      resetUrl // En production, ne pas inclure cette URL
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation.'
    });
  }
};

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/reset-mot-de-passe/:token
// @access  Public
const resetMotDePasse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { nouveauMotDePasse } = req.body;

    const user = await User.findOne({
      tokenResetMotDePasse: token,
      dateExpirationReset: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré.'
      });
    }

    // Mettre à jour le mot de passe
    user.motDePasse = nouveauMotDePasse;
    user.tokenResetMotDePasse = null;
    user.dateExpirationReset = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès.'
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe.'
    });
  }
};

// @desc    Vérifier le token de réinitialisation
// @route   GET /api/auth/verifier-reset-token/:token
// @access  Public
const verifierResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      tokenResetMotDePasse: token,
      dateExpirationReset: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token valide.'
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token.'
    });
  }
};

module.exports = {
  inscription,
  connexion,
  deconnexion,
  obtenirProfil,
  mettreAJourProfil,
  changerMotDePasse,
  oublieMotDePasse,
  resetMotDePasse,
  verifierResetToken
};
