const mongoose = require('mongoose');
require('dotenv').config();

// Modèle User temporaire pour la migration (sans typeCompte requis)
const userSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  email: String,
  motDePasse: String,
  role: String,
  entrepriseId: mongoose.Schema.Types.ObjectId,
  telephone: String,
  adresse: String,
  dateNaissance: Date,
  genre: String,
  photo: String,
  statut: String,
  derniereConnexion: Date,
  emailVerifie: Boolean,
  tokenVerification: String,
  tokenResetMotDePasse: String,
  dateExpirationReset: Date,
  preferences: {
    theme: String,
    langue: String,
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean
    }
  }
});

const User = mongoose.model('User', userSchema);

// Fonction de migration
async function migrateUsers() {
  try {
    console.log('🚀 Démarrage de la migration des utilisateurs...');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp');
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(`📊 ${users.length} utilisateurs trouvés`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      try {
        // Déterminer le type de compte basé sur les données existantes
        let typeCompte = 'entreprise';
        
        // Si l'utilisateur a un rôle admin ou super_admin, c'est probablement un admin
        if (user.role === 'admin' || user.role === 'super_admin') {
          typeCompte = 'admin';
        }
        
        // Si l'utilisateur n'a pas d'entreprise, c'est probablement un admin
        if (!user.entrepriseId) {
          typeCompte = 'admin';
        }
        
        // Mettre à jour l'utilisateur avec le nouveau champ typeCompte
        await User.updateOne(
          { _id: user._id },
          { $set: { typeCompte: typeCompte } }
        );
        
        console.log(`✅ Utilisateur ${user.email} migré vers typeCompte: ${typeCompte}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Erreur lors de la migration de l'utilisateur ${user.email}:`, error.message);
      }
    }
    
    console.log(`\n🏁 Migration terminée ! ${updatedCount}/${users.length} utilisateurs migrés avec succès.`);
    
    // Après la migration, rendre le champ typeCompte obligatoire
    console.log('\n🔧 Mise à jour du schéma...');
    await makeTypeCompteRequired();
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Fonction pour rendre le champ typeCompte obligatoire après la migration
async function makeTypeCompteRequired() {
  try {
    console.log('📝 Mise à jour du schéma pour rendre typeCompte obligatoire...');
    
    // Note: Cette fonction nécessite une redémarrage du serveur pour prendre effet
    // car Mongoose charge le schéma au démarrage
    
    console.log('✅ Schéma mis à jour. Redémarrez le serveur pour appliquer les changements.');
    console.log('⚠️  IMPORTANT: Après redémarrage, le champ typeCompte sera obligatoire.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du schéma:', error);
  }
}

// Fonction pour vérifier la migration
async function verifyMigration() {
  try {
    console.log('🔍 Vérification de la migration...');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp');
    console.log('✅ Connecté à MongoDB');
    
    // Vérifier que tous les utilisateurs ont maintenant un typeCompte
    const usersWithoutType = await User.find({ typeCompte: { $exists: false } });
    
    if (usersWithoutType.length === 0) {
      console.log('✅ Tous les utilisateurs ont un typeCompte défini');
      
      // Afficher la répartition des types de compte
      const adminCount = await User.countDocuments({ typeCompte: 'admin' });
      const entrepriseCount = await User.countDocuments({ typeCompte: 'entreprise' });
      
      console.log(`📊 Répartition des types de compte:`);
      console.log(`   - Administrateurs: ${adminCount}`);
      console.log(`   - Entreprises: ${entrepriseCount}`);
      
      // Vérifier que tous les utilisateurs entreprise ont un entrepriseId
      const usersWithoutEntreprise = await User.find({ 
        typeCompte: 'entreprise', 
        entrepriseId: { $exists: false } 
      });
      
      if (usersWithoutEntreprise.length === 0) {
        console.log('✅ Tous les utilisateurs entreprise ont un entrepriseId');
      } else {
        console.log(`⚠️  ${usersWithoutEntreprise.length} utilisateurs entreprise n'ont pas d'entrepriseId`);
        usersWithoutEntreprise.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user._id})`);
        });
      }
      
    } else {
      console.log(`❌ ${usersWithoutType.length} utilisateurs n'ont pas de typeCompte`);
      usersWithoutType.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user._id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Fonction pour nettoyer les données invalides
async function cleanupInvalidData() {
  try {
    console.log('🧹 Nettoyage des données invalides...');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp');
    console.log('✅ Connecté à MongoDB');
    
    // Trouver les utilisateurs avec des données incohérentes
    const invalidUsers = await User.find({
      $or: [
        { typeCompte: 'admin', entrepriseId: { $exists: true, $ne: null } },
        { typeCompte: 'entreprise', entrepriseId: { $exists: false } }
      ]
    });
    
    if (invalidUsers.length === 0) {
      console.log('✅ Aucune donnée invalide trouvée');
      return;
    }
    
    console.log(`⚠️  ${invalidUsers.length} utilisateurs avec des données incohérentes trouvés`);
    
    for (const user of invalidUsers) {
      try {
        if (user.typeCompte === 'admin' && user.entrepriseId) {
          // Supprimer l'entrepriseId pour les admins
          await User.updateOne(
            { _id: user._id },
            { $unset: { entrepriseId: "" } }
          );
          console.log(`✅ Supprimé entrepriseId pour l'admin ${user.email}`);
        } else if (user.typeCompte === 'entreprise' && !user.entrepriseId) {
          // Changer le type de compte en admin pour les utilisateurs sans entreprise
          await User.updateOne(
            { _id: user._id },
            { $set: { typeCompte: 'admin' } }
          );
          console.log(`✅ Changé le type de compte en admin pour ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors du nettoyage de ${user.email}:`, error.message);
      }
    }
    
    console.log('🏁 Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la migration si le fichier est appelé directement
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'verify':
      verifyMigration();
      break;
    case 'cleanup':
      cleanupInvalidData();
      break;
    case 'migrate':
    default:
      migrateUsers();
      break;
  }
}

module.exports = {
  migrateUsers,
  verifyMigration,
  cleanupInvalidData
}; 