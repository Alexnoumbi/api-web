const systemMonitor = require('../utils/systemMonitor');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

async function getUploadDirStats() {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const stats = await fs.stat(uploadDir);
    return {
        size: stats.size,
        files: (await fs.readdir(uploadDir)).length
    };
}

exports.getSystemStats = async (req, res) => {
    try {
        const stats = systemMonitor.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques système'
        });
    }
};

exports.getStorageStats = async (req, res) => {
    try {
        const uploadStats = await getUploadDirStats();
        res.json({
            success: true,
            data: {
                uploadDirectory: uploadStats,
                systemStorage: {
                    total: os.totalmem(),
                    free: os.freemem()
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques de stockage'
        });
    }
};

exports.getSecurityAlerts = async (req, res) => {
    try {
        // Pour l'instant, renvoie des données de base sur la sécurité
        res.json({
            success: true,
            data: {
                lastLogin: new Date(),
                failedLoginAttempts: 0,
                securityUpdatesAvailable: false,
                activeUsers: systemMonitor.getStats().process.activeUsers || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des alertes de sécurité'
        });
    }
};

exports.getBackupStatus = async (req, res) => {
    try {
        // Pour l'instant, renvoie un statut de sauvegarde basique
        res.json({
            success: true,
            data: {
                lastBackup: new Date(),
                backupSize: 0,
                status: 'success',
                nextScheduledBackup: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du statut des sauvegardes'
        });
    }
};
