import { Module } from '@nestjs/common';
import { PlaceResolver } from './place.resolver';
import './enums/social-network.enum';
import './enums/day-of-week.enum';

@Module({
  providers: [PlaceResolver],
})
export class PlacesModule {}
