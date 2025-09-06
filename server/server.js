const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Vérification de la configuration JWT
if (!process.env.JWT_SECRET) {
  console.error('❌ ERREUR CRITIQUE: JWT_SECRET non configuré !');
  console.error('💡 Solution: Ajoutez JWT_SECRET dans votre fichier .env');
  console.error('💡 Exemple: JWT_SECRET=votre_secret_jwt_tres_securise_ici_2025');
  process.exit(1);
}

// Configuration MongoDB avec fallback automatique
let MONGODB_URI = process.env.MONGODB_URI;

// Si pas d'URI configurée, essayer MongoDB local
if (!MONGODB_URI) {
  console.log('⚠️ Aucune URI MongoDB configurée, utilisation de MongoDB local');
  MONGODB_URI = 'mongodb://localhost:27017/myapp';
}

// Détecter le type de base de données
const isLocalDB = MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1');
const dbType = isLocalDB ? 'Locale' : 'Atlas';

// Configuration de la limitation de taux
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});

// Middleware de sécurité
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: (origin, callback) => {
    // Permettre l'accès depuis Flutter (pas d'origine) et localhost
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // En production, vous pouvez ajouter votre domaine Flutter ici
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connexion à MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout de 5 secondes
  socketTimeoutMS: 45000, // Timeout de socket de 45 secondes
  family: 4, // Forcer IPv4
})
.then(() => {
  console.log('✅ Connexion à MongoDB établie avec succès');
  console.log(`📊 Base de données: ${dbType}`);
})
.catch(err => {
  console.error('❌ Erreur de connexion à MongoDB :', err.message);
  
  if (err.code === 'ESERVFAIL') {
    console.error('💡 Solution: Vérifiez votre connexion internet et l\'URI MongoDB');
    console.error('💡 Pour le développement local, installez MongoDB localement');
    console.error('💡 Pour Atlas, vérifiez vos identifiants et l\'URI de connexion');
  } else if (err.code === 'ENOTFOUND') {
    console.error('💡 Solution: L\'hôte MongoDB n\'est pas accessible');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('💡 Solution: MongoDB n\'est pas démarré localement');
  }
  
  // Continuer l'exécution du serveur même sans MongoDB
  console.log('⚠️ Le serveur continue sans base de données (mode dégradé)');
  
  if (isLocalDB) {
    console.log('💡 Solutions pour MongoDB local :');
    console.log('   1. Installez MongoDB Community Server');
    console.log('   2. Vérifiez que le service MongoDB est démarré');
    console.log('   3. Utilisez : Get-Service MongoDB');
    console.log('   4. Ou utilisez Docker : docker run -d --name mongodb-local -p 27017:27017 mongo:latest');
  } else {
    console.log('💡 Solutions pour MongoDB Atlas :');
    console.log('   1. Vérifiez que votre IP est autorisée dans Atlas');
    console.log('   2. Vérifiez vos identifiants de connexion');
    console.log('   3. Vérifiez que votre cluster est actif');
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const entrepriseRoutes = require('./routes/entreprises');
const kpisRoutes = require('./routes/kpis');
const documentsRoutes = require('./routes/documents');
const visitesRoutes = require('./routes/visites');
const conventionRoutes = require('./routes/conventions');
const indicatorRoutes = require('./routes/indicators');
const adminRoutes = require('./routes/admin');

// Import role middleware
const { checkRole } = require('./middleware/roles');
const { roles } = require('./middleware/roles');

// Apply role-based middleware to specific routes
app.use('/api/admin/*', checkRole(roles.ADMIN));
app.use('/api/inspector/*', checkRole(roles.INSPECTOR));

// Use routes with proper prefixes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/entreprises', entrepriseRoutes);
app.use('/api/kpis', kpisRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/visites', visitesRoutes);
app.use('/api/admin', adminRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Serveur opérationnel',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Socket.io configuration
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  // Verify token using your auth middleware logic
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.user.id);

  // Join room for user's enterprise
  if (socket.user.enterpriseId) {
    socket.join(`enterprise_${socket.user.enterpriseId}`);
  }

  // Join room for user's role
  socket.join(`role_${socket.user.role}`);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.user.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}`);
});
