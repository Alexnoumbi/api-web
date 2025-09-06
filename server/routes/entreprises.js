const express = require('express');
const { body } = require('express-validator');
const { proteger, autoriser } = require('../middleware/auth');
const {
  getEntreprises,
  getEntreprise,
  createEntreprise,
  updateEntreprise,
  deleteEntreprise
} = require('../controllers/entrepriseController');

const router = express.Router();

// Validation for creation (required fields)
const validationCreate = [
  body('nomEntreprise')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Le nom de l'entreprise doit contenir entre 2 et 200 caracteres"),
  body('region')
    .isIn([
      'Adamaoua', 'Centre', 'Est', 'Extreme-Nord', 'Littoral',
      'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
    ])
    .withMessage('Region invalide'),
  body('ville')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ville doit contenir entre 2 et 100 caracteres'),
  body('dateCreation')
    .isISO8601()
    .withMessage('Date de creation invalide'),
  body('secteurActivite')
    .isIn(['Primaire', 'Secondaire', 'Tertiaire'])
    .withMessage("Secteur d'activite invalide"),
  body('sousSecteur')
    .isIn([
      'Agro-industriel', 'Foret-Bois', 'Mines', 'Petrole-Gaz',
      'Industrie manufacturiere', 'BTP', 'Energie', 'Eau',
      'Commerce', 'Transport', 'Telecommunications', 'Banque-Assurance',
      'Tourisme', 'Sante', 'Education', 'Autres'
    ])
    .withMessage('Sous-secteur invalide')
];

// Validation for updates: all fields optional to allow partial updates
const validationUpdate = [
  body('nomEntreprise')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Le nom de l'entreprise doit contenir entre 2 et 200 caracteres"),
  body('region')
    .optional({ checkFalsy: true })
    .isIn([
      'Adamaoua', 'Centre', 'Est', 'Extreme-Nord', 'Littoral',
      'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
    ])
    .withMessage('Region invalide'),
  body('ville')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ville doit contenir entre 2 et 100 caracteres'),
  body('dateCreation')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Date de creation invalide'),
  body('secteurActivite')
    .optional({ checkFalsy: true })
    .isIn(['Primaire', 'Secondaire', 'Tertiaire'])
    .withMessage("Secteur d'activite invalide"),
  body('sousSecteur')
    .optional({ checkFalsy: true })
    .isIn([
      'Agro-industriel', 'Foret-Bois', 'Mines', 'Petrole-Gaz',
      'Industrie manufacturiere', 'BTP', 'Energie', 'Eau',
      'Commerce', 'Transport', 'Telecommunications', 'Banque-Assurance',
      'Tourisme', 'Sante', 'Education', 'Autres'
    ])
    .withMessage('Sous-secteur invalide')
];

// Routes
router.get('/', proteger, getEntreprises);
router.get('/:id', proteger, getEntreprise);
router.post('/', proteger, autoriser('admin'), validationCreate, createEntreprise);
router.put('/:id', proteger, validationUpdate, updateEntreprise);
router.delete('/:id', proteger, autoriser('admin'), deleteEntreprise);

module.exports = router;
