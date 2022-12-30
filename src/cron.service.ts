import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import * as parser from 'cron-parser';
import { isSameMinute } from './date.helper';
import { configService } from './config.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  @Cron('*/45 * * * * *')
  async handleCron(): Promise<void> {
    const runDate = new Date();
    const cronDir = configService.getValue('CRON_DIR');
    const files = fs.readdirSync(cronDir);
    const commandsToRun: string[] = [];

    for (const file of files) {
      const vars: { [key: string]: string } = {};
      const readStream = fs.createReadStream(path.join(cronDir, file));
      const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });

      for await (let line of rl) {
        line = line.trim();
        if (line === '' || line.startsWith('#')) continue;

        const lineRegex = /^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+)$/;
        const commandRes = lineRegex.exec(line);

        if (commandRes) {
          const time = commandRes[1];
          let command = commandRes[2];
          const userPrefix = configService.getOptionalValue('USER_PREFIX');
          if (userPrefix && command.startsWith(userPrefix)) {
            /** trailing whitespace + 1 */
            command = command.slice(userPrefix.length + 1);
          }

          for (const [key, value] of Object.entries(vars)) {
            command = command.replace(
              new RegExp(`\\$${key}`, 'g'),
              value.toString(),
            );
          }

          const interval = parser.parseExpression(time);
          const prevExecDate = interval.prev().toDate();

          if (isSameMinute(runDate, prevExecDate)) {
            this.logger.debug('scheduling command ' + command);
            this.logger.debug('matched time expression ' + time);
            commandsToRun.push(command);
          }
        } else if (line.indexOf('=') > -1) {
          const [key, value] = line.split('=');
          vars[key] = value;
        }
      }
    }

    commandsToRun.forEach((command) => {
      this.logger.debug('Executing ' + command);
      try {
        execSync(command);
      } catch (e) {
        this.logger.error(e);
      }
    });
  }
}
