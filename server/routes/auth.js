const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  inscription,
  connexion,
  deconnexion,
  obtenirProfil,
  mettreAJourProfil,
  changerMotDePasse,
  oublieMotDePasse,
  resetMotDePasse,
  verifierResetToken
} = require('../controllers/authController');
const { proteger } = require('../middleware/auth');

const router = express.Router();

// Configuration du limiteur de tentatives
const limiterTentatives = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite à 5 tentatives
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
});

// Validation pour l'inscription
const validationInscription = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('motDePasse')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('typeCompte')
    .notEmpty()
    .withMessage('Le type de compte est requis')
    .isIn(['admin', 'entreprise'])
    .withMessage('Le type de compte doit être "admin" ou "entreprise"'),
  body('telephone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Veuillez entrer un numéro de téléphone valide'),
  body('entrepriseId')
    .custom((value, { req }) => {
      // Pour les comptes entreprise, entrepriseId est optionnel car l'entreprise est créée automatiquement
      if (req.body.typeCompte === 'admin' && value) {
        throw new Error('L\'ID de l\'entreprise ne doit pas être fourni pour un compte administrateur');
      }
      return true;
    })
    .optional()
    .isMongoId()
    .withMessage('ID d\'entreprise invalide'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'super_admin'])
    .withMessage('Rôle invalide. Les rôles autorisés sont: user, admin, super_admin')
];

// Validation pour la connexion
const validationConnexion = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('motDePasse')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  body('typeCompte')
    .optional()
    .isIn(['admin', 'entreprise'])
    .withMessage('Le type de compte doit être "admin" ou "entreprise"')
];

// Validation pour la mise à jour du profil
const validationProfil = [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('telephone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Veuillez entrer un numéro de téléphone valide'),
  body('genre')
    .optional()
    .isIn(['homme', 'femme', 'autre'])
    .withMessage('Genre invalide'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Thème invalide'),
  body('preferences.langue')
    .optional()
    .isIn(['fr', 'en'])
    .withMessage('Langue invalide')
];

// Validation pour le changement de mot de passe
const validationChangementMotDePasse = [
  body('motDePasseActuel')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('nouveauMotDePasse')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Validation pour l'oubli de mot de passe
const validationOublieMotDePasse = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide')
];

// Validation pour la réinitialisation du mot de passe
const validationResetMotDePasse = [
  body('nouveauMotDePasse')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Routes publiques
router.post('/inscription', validationInscription, inscription);
router.post('/connexion', validationConnexion, limiterTentatives, connexion);
router.post('/oublie-mot-de-passe', validationOublieMotDePasse, oublieMotDePasse);
router.get('/verifier-reset-token/:token', verifierResetToken);
router.put('/reset-mot-de-passe/:token', validationResetMotDePasse, resetMotDePasse);

// Routes protégées
router.post('/deconnexion', proteger, deconnexion);
router.get('/moi', proteger, obtenirProfil);
router.put('/moi', proteger, validationProfil, mettreAJourProfil);
router.put('/changer-mot-de-passe', proteger, validationChangementMotDePasse, changerMotDePasse);

module.exports = router;
