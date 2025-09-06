const axios = require('axios');

// Configuration de base
const BASE_URL = 'http://localhost:3000/api/auth';

// Fonction de débogage pour l'inscription entreprise
async function debugInscriptionEntreprise() {
  try {
    console.log('🔍 Débogage de l\'inscription entreprise...');
    
    const payload = {
      nom: 'TestUser',
      prenom: 'User',
      email: 'user.debug@example.com',
      motDePasse: 'User123',
      typeCompte: 'entreprise',
      entrepriseId: '507f1f77bcf86cd799439011',
      telephone: '0987654321'
    };
    
    console.log('📤 Payload envoyé:');
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${BASE_URL}/inscription`, payload);
    
    console.log('✅ Inscription réussie:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
      
      // Afficher les erreurs de validation en détail
      if (error.response.data.errors) {
        console.error('\n🔍 Erreurs de validation:');
        error.response.data.errors.forEach((err, index) => {
          console.error(`${index + 1}. Champ: ${err.path}`);
          console.error(`   Message: ${err.msg}`);
          console.error(`   Valeur: ${err.value}`);
        });
      }
    } else if (error.request) {
      console.error('❌ Aucune réponse reçue du serveur');
      console.error('Request:', error.request);
    } else {
      console.error('❌ Erreur lors de la configuration de la requête:', error.message);
    }
  }
}

// Fonction de débogage pour l'inscription admin
async function debugInscriptionAdmin() {
  try {
    console.log('🔍 Débogage de l\'inscription admin...');
    
    const payload = {
      nom: 'TestAdmin',
      prenom: 'Admin',
      email: 'admin.debug@example.com',
      motDePasse: 'Admin123',
      typeCompte: 'admin',
      telephone: '0123456789'
    };
    
    console.log('📤 Payload envoyé:');
    console.log(JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${BASE_URL}/inscription`, payload);
    
    console.log('✅ Inscription réussie:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
      
      // Afficher les erreurs de validation en détail
      if (error.response.data.errors) {
        console.error('\n🔍 Erreurs de validation:');
        error.response.data.errors.forEach((err, index) => {
          console.error(`${index + 1}. Champ: ${err.path}`);
          console.error(`   Message: ${err.msg}`);
          console.error(`   Valeur: ${err.value}`);
        });
      }
    } else if (error.request) {
      console.error('❌ Aucune réponse reçue du serveur');
      console.error('Request:', error.request);
    } else {
      console.error('❌ Erreur lors de la configuration de la requête:', error.message);
    }
  }
}

// Fonction pour tester la validation côté serveur
async function testValidationCoteServeur() {
  try {
    console.log('🔍 Test de la validation côté serveur...');
    
    // Test avec typeCompte manquant
    console.log('\n📝 Test 1: typeCompte manquant');
    try {
      const payload = {
        nom: 'Test',
        prenom: 'User',
        email: 'test1@example.com',
        motDePasse: 'Test123'
        // typeCompte manquant
      };
      
      const response = await axios.post(`${BASE_URL}/inscription`, payload);
      console.log('❌ La validation aurait dû échouer');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation correctement rejetée (typeCompte manquant)');
        console.log('Message:', error.response.data.errors?.[0]?.msg);
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }
    
    // Test avec typeCompte invalide
    console.log('\n📝 Test 2: typeCompte invalide');
    try {
      const payload = {
        nom: 'Test',
        prenom: 'User',
        email: 'test2@example.com',
        motDePasse: 'Test123',
        typeCompte: 'invalid_type'
      };
      
      const response = await axios.post(`${BASE_URL}/inscription`, payload);
      console.log('❌ La validation aurait dû échouer');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation correctement rejetée (typeCompte invalide)');
        console.log('Message:', error.response.data.errors?.[0]?.msg);
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }
    
    // Test avec typeCompte valide mais entrepriseId manquant
    console.log('\n📝 Test 3: typeCompte=entreprise mais entrepriseId manquant');
    try {
      const payload = {
        nom: 'Test',
        prenom: 'User',
        email: 'test3@example.com',
        motDePasse: 'Test123',
        typeCompte: 'entreprise'
        // entrepriseId manquant
      };
      
      const response = await axios.post(`${BASE_URL}/inscription`, payload);
      console.log('❌ La validation aurait dû échouer');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation correctement rejetée (entrepriseId manquant)');
        console.log('Message:', error.response.data.errors?.[0]?.msg);
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de validation:', error.message);
  }
}

// Fonction principale de débogage
async function runDebug() {
  console.log('🚀 Démarrage du débogage d\'authentification...\n');
  
  // Test des validations
  await testValidationCoteServeur();
  
  console.log('\n---\n');
  
  // Test des inscriptions
  await debugInscriptionAdmin();
  
  console.log('\n---\n');
  
  await debugInscriptionEntreprise();
  
  console.log('\n🏁 Débogage terminé !');
}

// Exécuter le débogage si le fichier est appelé directement
if (require.main === module) {
  runDebug().catch(console.error);
}

module.exports = {
  debugInscriptionEntreprise,
  debugInscriptionAdmin,
  testValidationCoteServeur
}; 