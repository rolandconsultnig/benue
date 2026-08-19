import { Module } from '@nestjs/common';
import { SopsController } from './sops.controller';

@Module({
  controllers: [SopsController],
})
export class SopsModule {}
