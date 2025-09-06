const os = require('os');
const { execSync } = require('child_process');
const pidusage = require('pidusage');

class SystemMonitor {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      requests: {
        total: 0,
        perMinute: 0,
        responseTime: []
      },
      system: {
        cpu: 0,
        memory: {
          total: 0,
          used: 0,
          free: 0
        },
        disk: {
          total: 0,
          used: 0,
          free: 0
        }
      },
      usage: {
        mobile: 0,
        web: 0
      },
      security: {
        failedLogins: 0,
        suspiciousIPs: new Set(),
        blockedIPs: new Set()
      }
    };

    // Initialiser le monitoring
    this.startMonitoring();
  }

  startMonitoring() {
    // Mettre à jour les statistiques système toutes les 30 secondes
    setInterval(() => this.updateSystemStats(), 30000);

    // Nettoyer les anciennes statistiques toutes les heures
    setInterval(() => this.cleanOldStats(), 3600000);
  }

  async updateSystemStats() {
    try {
      // Update CPU usage
      const cpus = os.cpus();
      const totalCpu = cpus.reduce((acc, cpu) => {
        return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
      }, 0);
      this.stats.system.cpu = totalCpu;

      // Update memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      this.stats.system.memory = {
        total: totalMem,
        used: totalMem - freeMem,
        free: freeMem
      };

      // Update process usage
      const processStats = await pidusage(process.pid);
      this.stats.process = processStats;
    } catch (error) {
      console.error('Error updating system stats:', error);
    }
  }

  trackRequest(req, startTime) {
    const duration = Date.now() - startTime;
    this.stats.requests.total++;
    this.stats.requests.responseTime.push(duration);

    // Détecter si la requête vient d'un mobile
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);

    if (isMobile) {
      this.stats.usage.mobile++;
    } else {
      this.stats.usage.web++;
    }

    // Garder seulement les 1000 derniers temps de réponse
    if (this.stats.requests.responseTime.length > 1000) {
      this.stats.requests.responseTime.shift();
    }
  }

  trackSecurityEvent(type, data) {
    switch (type) {
      case 'failedLogin':
        this.stats.security.failedLogins++;
        break;
      case 'suspiciousIP':
        this.stats.security.suspiciousIPs.add(data.ip);
        break;
      case 'blockedIP':
        this.stats.security.blockedIPs.add(data.ip);
        break;
    }
  }

  cleanOldStats() {
    const oneHourAgo = Date.now() - 3600000;
    this.stats.requests.responseTime = this.stats.requests.responseTime.filter(
      time => time.timestamp > oneHourAgo
    );
  }

  getStats() {
    return {
      uptime: Date.now() - this.stats.startTime,
      ...this.stats
    };
  }

  getSecurityAlerts() {
    return {
      failedLogins: this.stats.security.failedLogins,
      suspiciousIPs: Array.from(this.stats.security.suspiciousIPs),
      blockedIPs: Array.from(this.stats.security.blockedIPs),
      lastUpdated: Date.now()
    };
  }

  getBackupStatus() {
    return {
      lastBackup: Date.now(), // In a real implementation, this would come from actual backup logs
      status: 'success',
      backupLocations: ['local', 'cloud'],
      nextScheduledBackup: Date.now() + 86400000 // 24 hours from now
    };
  }

  logRequest(responseTime, userAgent) {
    this.stats.requests.total++;
    this.stats.requests.responseTime.push({
      time: responseTime,
      timestamp: Date.now()
    });

    // Update mobile/web usage
    if (userAgent && userAgent.toLowerCase().includes('mobile')) {
      this.stats.usage.mobile++;
    } else {
      this.stats.usage.web++;
    }
  }

  logFailedLogin(ip) {
    this.stats.security.failedLogins++;

    // Add IP to suspicious list if multiple failed attempts
    if (this.stats.security.suspiciousIPs.has(ip)) {
      this.stats.security.blockedIPs.add(ip);
    } else {
      this.stats.security.suspiciousIPs.add(ip);
    }
  }
}

module.exports = new SystemMonitor();
