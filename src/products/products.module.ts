import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductController } from './products.controller';
import { AuthModule } from '../auth/auth.module';
import { ProductResolver } from './product.resolver';

@Module({
  imports: [AuthModule],
  controllers: [ProductController],
  providers: [ProductsService, ProductResolver],
})
export class ProductsModule {}
