const systemMonitor = require('../utils/systemMonitor');

const monitoringMiddleware = (req, res, next) => {
    // Enregistrer le temps de début de la requête
    const startTime = Date.now();

    // Une fois la réponse envoyée
    res.on('finish', () => {
        systemMonitor.trackRequest(req, startTime);
    });

    next();
};

module.exports = monitoringMiddleware;
