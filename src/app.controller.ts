import { Controller, Get } from '@nestjs/common';
import { Public } from '@social/decorators/customize';

@Controller()
export class AppController {
  constructor() {}

  @Public()
  @Get('hello-world')
  getHello(): string {
    return 'Hello World';
  }
}
