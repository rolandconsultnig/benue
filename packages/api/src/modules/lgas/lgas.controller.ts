import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Lga, Ward, GeoPoint } from '@cewers/shared';
import { LgasService } from './lgas.service';

@ApiTags('lgas')
@Controller('lgas')
export class LgasController {
  constructor(private readonly lgas: LgasService) {}

  @Get()
  @ApiOperation({ summary: 'List all 9 LGAs of Benue South with alert levels + open incident counts' })
  findAll(): Promise<Lga[]> {
    return this.lgas.findAll();
  }

  @Get(':idOrCode')
  @ApiOperation({ summary: 'Get a single LGA by id or code (e.g. AGATU)' })
  findOne(@Param('idOrCode') idOrCode: string): Promise<Lga & { code: string }> {
    return this.lgas.findOne(idOrCode);
  }

  @Get(':idOrCode/wards')
  @ApiOperation({ summary: 'List wards for an LGA with alert levels + open incident counts' })
  findWards(@Param('idOrCode') idOrCode: string): Promise<Ward[]> {
    return this.lgas.findWards(idOrCode);
  }

  @Get('locate/point')
  @ApiOperation({ summary: 'Find the LGA + nearest ward for a geographic point' })
  locatePoint(@Query('lng') lng: string, @Query('lat') lat: string) {
    return this.lgas.locatePoint({ lng: parseFloat(lng), lat: parseFloat(lat) });
  }
}
