import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsDataService } from './products.data.service';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [AuthModule, CategoriesModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsDataService],
})
export class ProductsModule {}
