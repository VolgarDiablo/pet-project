import { Module } from '@nestjs/common';
import { BrandResolver } from './brand.resolver';
import { BrandsService } from './brands.service';

@Module({
  providers: [BrandsService, BrandResolver],
  exports: [BrandsService],
})
export class BrandsModule {}
