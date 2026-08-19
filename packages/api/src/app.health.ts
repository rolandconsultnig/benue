import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

/** Liveness + readiness probe. */
@ApiTags('health')
@Controller('health')
export class AppHealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return { status: 'ok', service: 'cewers-api', timestamp: new Date().toISOString() };
  }
}
