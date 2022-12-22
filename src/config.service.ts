// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  /**
   * @param key
   */
  getValue(key: string): string {
    const value = this.env[key];
    if (!value) {
      throw new Error(
        `config error - missing config for key ${key} in .env file`,
      );
    }

    return value;
  }

  getOptionalValue(key: string): string {
    const value = this.env[key];
    if (!value) {
      return undefined;
    }
    return value;
  }

  /**
   * @param keys
   */
  ensureValues(keys: string[]): ConfigService {
    keys.forEach((k) => this.getValue(k));
    return this;
  }
}

const configService = new ConfigService(process.env).ensureValues(['CRON_DIR']);

export { configService };
