import { Module } from '@nestjs/common';
import { BrandResolver } from './brand.resolver';

@Module({
  providers: [BrandResolver],
})
export class BrandsModule {}
