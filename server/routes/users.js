const express = require('express');
const { body, param, query } = require('express-validator');
const { proteger, autoriser } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

// Validation pour la création d'utilisateur
const validationUser = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('motDePasse')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Rôle invalide'),
  body('telephone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Veuillez entrer un numéro de téléphone valide')
];

// Routes
router.get('/', proteger, autoriser('admin'), getUsers);
router.get('/:id', proteger, getUser);
router.post('/', proteger, autoriser('admin'), validationUser, createUser);
router.put('/:id', proteger, validationUser, updateUser);
router.delete('/:id', proteger, autoriser('admin'), deleteUser);

module.exports = router;
