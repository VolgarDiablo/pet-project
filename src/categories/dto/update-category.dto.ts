import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategory } from '../interfaces/category.interface';

export class UpdateCategoryDto
  extends PartialType(CreateCategoryDto)
  implements UpdateCategory {}
