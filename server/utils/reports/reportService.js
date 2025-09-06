const path = require('path');
const fs = require('fs').promises;
const PDFGenerator = require('./pdfGenerator');
const ExcelGenerator = require('./excelGenerator');

class ReportService {
  constructor() {
    this.pdfGenerator = new PDFGenerator();
    this.excelGenerator = new ExcelGenerator();
    this.outputDir = path.join(__dirname, '../../uploads/reports');
  }

  async ensureOutputDirExists() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  async generateReport(data, type, format) {
    await this.ensureOutputDirExists();

    const timestamp = new Date().getTime();
    const filename = `${type}_report_${timestamp}.${format}`;
    const outputPath = path.join(this.outputDir, filename);

    try {
      if (format === 'pdf') {
        switch (type) {
          case 'entreprises':
            await this.pdfGenerator.generateEnterpriseReport(data, outputPath);
            break;
          case 'kpis':
            await this.pdfGenerator.generateKPIReport(data, outputPath);
            break;
          case 'performance':
            await this.pdfGenerator.generatePerformanceReport(data, outputPath);
            break;
          default:
            throw new Error('Type de rapport non supporté');
        }
      } else if (format === 'xlsx') {
        switch (type) {
          case 'entreprises':
            await this.excelGenerator.generateEnterpriseReport(data);
            break;
          case 'kpis':
            await this.excelGenerator.generateKPIReport(data);
            break;
          case 'performance':
            await this.excelGenerator.generatePerformanceReport(data);
            break;
          default:
            throw new Error('Type de rapport non supporté');
        }
        await this.excelGenerator.save(outputPath);
      } else {
        throw new Error('Format non supporté');
      }

      return {
        filename,
        path: outputPath,
        url: `/reports/${filename}`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la génération du rapport: ${error.message}`);
    }
  }

  async cleanOldReports(maxAge = 24 * 60 * 60 * 1000) { // Par défaut : 24 heures
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des anciens rapports:', error);
    }
  }
}

module.exports = new ReportService();
