const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.doc = new PDFDocument();
  }

  // Méthodes utilitaires communes
  addHeader(title) {
    this.doc.fontSize(20).text(title, { align: 'center' });
    this.doc.moveDown();
    this.doc.fontSize(12);
  }

  addGeneralInfo(totalCount, type) {
    this.doc.text(`Date du rapport: ${new Date().toLocaleDateString()}`);
    this.doc.text(`Nombre total de ${type}: ${totalCount}`);
    this.doc.moveDown();
  }

  addFooter() {
    this.doc.fontSize(8);
    this.doc.text('Document confidentiel - Usage interne uniquement', {
      align: 'center',
      y: this.doc.page.height - 50
    });
  }

  async generateFile(outputPath) {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);
      this.doc.pipe(writeStream);
      this.doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }

  async generateEnterpriseReport(data, outputPath) {
    try {
      this.addHeader('Rapport des Entreprises');
      this.addGeneralInfo(data.length, 'entreprises');

      // Tableau des entreprises
      data.forEach((enterprise, index) => {
        this.doc.text(`${index + 1}. ${enterprise.nom}`);
        this.doc.fontSize(10);
        this.doc.text(`Secteur: ${enterprise.secteur}`);
        this.doc.text(`Statut: ${enterprise.statut}`);
        this.doc.text(`Investissements: ${enterprise.investissementsRealises} FCFA`);
        this.doc.text(`Emplois créés: ${enterprise.emploisCrees}`);
        this.doc.moveDown();
        this.doc.fontSize(12);
      });

      this.addFooter();
      return this.generateFile(outputPath);
    } catch (error) {
      throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }

  async generateKPIReport(data, outputPath) {
    try {
      this.addHeader('Rapport des KPIs');
      this.addGeneralInfo(data.length, 'KPIs');

      // Regroupement par catégorie
      const kpisByCategory = data.reduce((acc, kpi) => {
        if (!acc[kpi.categorie]) {
          acc[kpi.categorie] = [];
        }
        acc[kpi.categorie].push(kpi);
        return acc;
      }, {});

      // Affichage des KPIs par catégorie
      Object.entries(kpisByCategory).forEach(([category, kpis]) => {
        this.doc.fontSize(14).text(category);
        this.doc.moveDown();
        this.doc.fontSize(10);

        kpis.forEach(kpi => {
          this.doc.text(`Indicateur: ${kpi.nom}`);
          this.doc.text(`Valeur actuelle: ${kpi.valeurActuelle}`);
          this.doc.text(`Valeur cible: ${kpi.valeurCible}`);
          this.doc.text(`Statut: ${kpi.statut}`);
          this.doc.moveDown();
        });
      });

      this.addFooter();
      return this.generateFile(outputPath);
    } catch (error) {
      throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }

  async generatePerformanceReport(data, outputPath) {
    try {
      this.addHeader('Rapport de Performance');
      this.addGeneralInfo(data.length, 'entreprises analysées');

      // Résumé global
      const totalInvestissements = data.reduce((sum, item) => sum + item.totalInvestissements, 0);
      const totalEmplois = data.reduce((sum, item) => sum + item.emploisCrees, 0);

      this.doc.text(`Investissements totaux: ${totalInvestissements.toLocaleString()} FCFA`);
      this.doc.text(`Total emplois créés: ${totalEmplois}`);
      this.doc.moveDown();

      // Détails par entreprise
      this.doc.fontSize(14).text('Détails par entreprise');
      this.doc.moveDown();
      this.doc.fontSize(10);

      data.forEach(item => {
        this.doc.text(`Entreprise ID: ${item._id}`);
        this.doc.text(`Investissements: ${item.totalInvestissements.toLocaleString()} FCFA`);
        this.doc.text(`Emplois créés: ${item.emploisCrees}`);
        this.doc.text(`Chiffre d'affaires: ${item.chiffreAffaires.toLocaleString()} FCFA`);
        this.doc.moveDown();
      });

      this.addFooter();
      return this.generateFile(outputPath);
    } catch (error) {
      throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }
}

module.exports = PDFGenerator;
