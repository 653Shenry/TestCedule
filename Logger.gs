/**
 * Classe de gestion des logs
 */
class Logger {
  static log(type, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  static error(message, error) {
    this.log('ERROR', message, error);
    console.error(error);
  }

  static info(message, data) {
    this.log('INFO', message, data);
  }

  static debug(message, data) {
    this.log('DEBUG', message, data);
  }

  static warning(message, data) {
    this.log('WARNING', message, data);
  }
}
