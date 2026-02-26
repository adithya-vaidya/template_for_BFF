import axios from 'axios';

/**
 * DataSource Manager - Plugin Architecture similar to AWS AppSync
 * Manages multiple datasources with dynamic routing capabilities
 *
 * Note: dotenv is loaded in server.js before this module is imported
 * so process.env contains all .env variables
 */

class DataSourceManager {
  constructor() {
    this.dataSources = new Map();
    this._initialized = false;
  }

  _ensureInitialized() {
    if (!this._initialized) {
      this.initializeDatasources();
      this._initialized = true;
    }
  }

  /**
   * Initialize all datasources from environment variables
   * Format: DATASOURCE_<NAME>=<TYPE>|<BASE_URL>|<TIMEOUT>|<RETRY_COUNT>
   */
  initializeDatasources() {
    const datasourcePattern = /^DATASOURCE_(.+)$/;
    let count = 0;

    Object.entries(process.env).forEach(([key, value]) => {
      const match = key.match(datasourcePattern);

      if (match && value) {
        // match[1] is the datasource name portion after DATASOURCE_
        // Preserve the original (raw) name in the config, but use a lowercase key for lookups
        const rawName = String(match[1]);
        const keyName = rawName.toLowerCase();
        const [type = 'http', baseUrl = '', timeout, retryCount] = value.split('|');

        const datasourceConfig = {
          // preserve original name exactly as provided in .env (no trimming/case-change)
          name: rawName,
          type: (type || 'http').toLowerCase(),
          baseUrl: (baseUrl || '').trim(),
          timeout: parseInt(timeout) || 5000,
          retryCount: parseInt(retryCount) || 3,
          headers: this.getDefaultHeaders()
        };

        // store under lowercase key for case-insensitive lookup, but keep config.name unchanged
        this.dataSources.set(keyName, datasourceConfig);
        console.log(`  ✓ DataSource: ${rawName} → ${datasourceConfig.baseUrl}`);
        count++;
      }
    });

    if (count === 0) {
      console.warn('⚠ No datasources configured in environment variables');
    } else {
      console.log(`✓ ${count} datasource(s) initialized`);
    }
  }

  /**
   * Get default headers for all requests
   */
  getDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'BFF-DataSourceManager/1.0.0'
    };
  }

  /**
   * Get datasource configuration by name
   */
  getDatasource(name) {
    this._ensureInitialized();
    const datasource = this.dataSources.get(String(name).toLowerCase());

    if (!datasource) {
      const available = Array.from(this.dataSources.values()).map(v => v.name).join(', ');
      throw new Error(`DataSource '${name}' not found. Available: ${available}`);
    }

    return datasource;
  }

  /**
   * List all available datasources
   */
  listDatasources() {
    this._ensureInitialized();
    return Array.from(this.dataSources.values()).map(ds => ({
      name: ds.name,
      type: ds.type,
      baseUrl: ds.baseUrl,
      timeout: ds.timeout,
      retryCount: ds.retryCount
    }));
  }

  /**
   * Call datasource with automatic retry logic
   */
  async callDatasource(datasourceName, config) {
    this._ensureInitialized();
    const datasource = this.getDatasource(datasourceName);

    const {
      method = 'GET',
      path = '',
      data = null,
      headers = {},
      params = null
    } = config;

    const url = `${datasource.baseUrl}${path}`;
    const mergedHeaders = { ...datasource.headers, ...headers };

    let lastError;

    // Retry logic
    for (let attempt = 1; attempt <= datasource.retryCount; attempt++) {
      try {
        const response = await axios({
          method,
          url,
          data,
          headers: mergedHeaders,
          params,
          timeout: datasource.timeout
        });

        return {
          success: true,
          status: response.status,
          data: response.data,
          headers: response.headers,
          datasource: datasourceName
        };
      } catch (error) {
        lastError = error;

        if (attempt < datasource.retryCount) {
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          const delay = Math.pow(2, attempt - 1) * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`Retry attempt ${attempt} for ${datasourceName}...`);
        }
      }
    }

    // All retries failed
    throw new Error(
      `DataSource call failed after ${datasource.retryCount} attempts. ` +
      `Error: ${lastError.message || 'Unknown error'}`
    );
  }

  /**
   * Register custom datasource at runtime
   */
  registerDatasource(name, config) {
    this._ensureInitialized();
    const datasourceConfig = {
      name: String(name).toLowerCase(),
      type: (config.type || 'http').toLowerCase(),
      baseUrl: config.baseUrl,
      timeout: config.timeout || 5000,
      retryCount: config.retryCount || 3,
      headers: { ...this.getDefaultHeaders(), ...(config.headers || {}) }
    };
    
    this.dataSources.set(String(name).toLowerCase(), datasourceConfig);
    console.log(`✓ DataSource registered: ${name}`);
  }

  /**
   * Unregister datasource
   */
  unregisterDatasource(name) {
    this._ensureInitialized();
    const deleted = this.dataSources.delete(String(name).toLowerCase());
    if (deleted) {
      console.log(`✓ DataSource unregistered: ${name}`);
    }
    return deleted;
  }
}

// Export singleton instance
export const dataSourceManager = new DataSourceManager();
