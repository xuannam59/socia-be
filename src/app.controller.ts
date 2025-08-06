import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get('hello-world')
  getHello(): string {
    return 'Hello World';
  }
}
