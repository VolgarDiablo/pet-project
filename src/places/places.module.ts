import { Module } from '@nestjs/common';
import { PlaceResolver } from './place.resolver';
import { PlacesService } from './places.service';
import './enums/social-network.enum';
import './enums/day-of-week.enum';

@Module({
  providers: [PlacesService, PlaceResolver],
  exports: [PlacesService],
})
export class PlacesModule {}
