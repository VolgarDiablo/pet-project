import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { CreateCategory } from '../interfaces/category.interface';

export class CreateCategoryDto implements CreateCategory {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;
}
