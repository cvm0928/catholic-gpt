import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { AssistantServiceI } from './assistant-service.interface';

@Injectable()
export class MockAssistantService implements AssistantServiceI {
  async addUserMessageToThread(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    threadId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: string,
  ): Promise<void> {
    return;
  }

  async createThread(): Promise<string> {
    return 'mock-thread-id';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  streamThreadResponse(threadId: string): Observable<string> {
    return new Observable((observer) => {
      const fileStream = fs.createReadStream(path.join(__dirname, 'mock.md'));
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: 200,
      });

      rl.on('line', (line) => {
        observer.next(line + '\n');
      });

      rl.on('close', () => {
        observer.next('[DONE]');
        observer.complete();
      });

      rl.on('error', (error) => {
        observer.error(error);
      });

      return () => {
        rl.close();
      };
    });
  }
}
