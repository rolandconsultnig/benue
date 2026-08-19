import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { PanicController } from './panic.controller';
import { ChannelsController } from './channels.controller';
import { IncidentsService } from './incidents.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [IncidentsController, PanicController, ChannelsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
