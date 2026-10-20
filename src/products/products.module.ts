import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductController } from './products.controller';
import { ProductDataService } from './products.data.service';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { ProductResolver } from './product.resolver';

@Module({
  imports: [AuthModule, CategoriesModule],
  controllers: [ProductController],
  providers: [ProductsService, ProductDataService, ProductResolver],
})
export class ProductsModule {}
