const Excel = require('exceljs');

class ExcelGenerator {
  constructor() {
    this.workbook = new Excel.Workbook();
  }

  async generateEnterpriseReport(data) {
    const worksheet = this.workbook.addWorksheet('Entreprises');

    // En-têtes
    worksheet.columns = [
      { header: 'Nom', key: 'nom', width: 30 },
      { header: 'Secteur', key: 'secteur', width: 20 },
      { header: 'Région', key: 'region', width: 20 },
      { header: 'Statut', key: 'statut', width: 15 },
      { header: 'Investissements (FCFA)', key: 'investissementsRealises', width: 20 },
      { header: 'Emplois Créés', key: 'emploisCrees', width: 15 },
      { header: 'Date Création', key: 'dateCreation', width: 20 }
    ];

    // Style des en-têtes
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF999999' }
    };

    // Données
    data.forEach(enterprise => {
      worksheet.addRow({
        nom: enterprise.nom,
        secteur: enterprise.secteur,
        region: enterprise.region,
        statut: enterprise.statut,
        investissementsRealises: enterprise.investissementsRealises,
        emploisCrees: enterprise.emploisCrees,
        dateCreation: new Date(enterprise.dateCreation).toLocaleDateString()
      });
    });

    // Formatage des nombres
    worksheet.getColumn('investissementsRealises').numFmt = '#,##0 "FCFA"';
    worksheet.getColumn('emploisCrees').numFmt = '#,##0';

    // Totaux
    const lastRow = worksheet.rowCount + 1;
    worksheet.addRow({
      nom: 'TOTAL',
      investissementsRealises: { formula: `SUM(E2:E${lastRow-1})` },
      emploisCrees: { formula: `SUM(F2:F${lastRow-1})` }
    });
    worksheet.getRow(lastRow).font = { bold: true };

    return this.workbook;
  }

  async generateKPIReport(data) {
    const worksheet = this.workbook.addWorksheet('KPIs');

    // En-têtes
    worksheet.columns = [
      { header: 'Catégorie', key: 'categorie', width: 20 },
      { header: 'Indicateur', key: 'nom', width: 30 },
      { header: 'Valeur Actuelle', key: 'valeurActuelle', width: 15 },
      { header: 'Valeur Cible', key: 'valeurCible', width: 15 },
      { header: 'Progression (%)', key: 'progression', width: 15 },
      { header: 'Statut', key: 'statut', width: 15 }
    ];

    // Style des en-têtes
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF999999' }
    };

    // Données
    data.forEach(kpi => {
      const progression = (kpi.valeurActuelle / kpi.valeurCible * 100).toFixed(2);
      worksheet.addRow({
        categorie: kpi.categorie,
        nom: kpi.nom,
        valeurActuelle: kpi.valeurActuelle,
        valeurCible: kpi.valeurCible,
        progression: progression,
        statut: kpi.statut
      });
    });

    // Formatage conditionnel
    worksheet.getColumn('progression').numFmt = '0.00"%"';
    worksheet.addConditionalFormatting({
      ref: `E2:E${worksheet.rowCount}`,
      rules: [
        {
          type: 'colorScale',
          minimum: { type: 'num', value: 0, color: { argb: 'FFFF0000' } },
          midpoint: { type: 'num', value: 50, color: { argb: 'FFFFFF00' } },
          maximum: { type: 'num', value: 100, color: { argb: 'FF00FF00' } }
        }
      ]
    });

    return this.workbook;
  }

  async generatePerformanceReport(data) {
    const worksheet = this.workbook.addWorksheet('Performance');

    // En-têtes
    worksheet.columns = [
      { header: 'Entreprise ID', key: 'entrepriseId', width: 20 },
      { header: 'Investissements (FCFA)', key: 'totalInvestissements', width: 25 },
      { header: 'Emplois Créés', key: 'emploisCrees', width: 15 },
      { header: "Chiffre d'Affaires (FCFA)", key: 'chiffreAffaires', width: 25 }
    ];

    // Style des en-têtes
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF999999' }
    };

    // Données
    data.forEach(item => {
      worksheet.addRow({
        entrepriseId: item._id,
        totalInvestissements: item.totalInvestissements,
        emploisCrees: item.emploisCrees,
        chiffreAffaires: item.chiffreAffaires
      });
    });

    // Formatage des nombres
    worksheet.getColumn('totalInvestissements').numFmt = '#,##0 "FCFA"';
    worksheet.getColumn('emploisCrees').numFmt = '#,##0';
    worksheet.getColumn('chiffreAffaires').numFmt = '#,##0 "FCFA"';

    // Totaux
    const lastRow = worksheet.rowCount + 1;
    worksheet.addRow({
      entrepriseId: 'TOTAL',
      totalInvestissements: { formula: `SUM(B2:B${lastRow-1})` },
      emploisCrees: { formula: `SUM(C2:C${lastRow-1})` },
      chiffreAffaires: { formula: `SUM(D2:D${lastRow-1})` }
    });
    worksheet.getRow(lastRow).font = { bold: true };

    return this.workbook;
  }

  async save(outputPath) {
    return this.workbook.xlsx.writeFile(outputPath);
  }
}

module.exports = ExcelGenerator;
