const reportService = require('../utils/reports/reportService');

exports.generateReport = async (req, res) => {
    try {
        const { type, format, dateDebut, dateFin } = req.body;
        const report = await reportService.generateReport(type, format, dateDebut, dateFin);
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport'
        });
    }
};

exports.getReportTypes = async (req, res) => {
    try {
        const types = [
            {
                id: 'entreprises',
                name: 'Rapport des entreprises',
                formats: ['pdf', 'excel']
            },
            {
                id: 'utilisateurs',
                name: 'Rapport des utilisateurs',
                formats: ['pdf', 'excel']
            },
            {
                id: 'kpis',
                name: 'Rapport des KPIs',
                formats: ['pdf', 'excel']
            }
        ];

        res.json({
            success: true,
            data: types
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des types de rapports'
        });
    }
};
