import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoriesDataService } from './categories.data.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesDataService],
  exports: [CategoriesDataService],
})
export class CategoriesModule {}
