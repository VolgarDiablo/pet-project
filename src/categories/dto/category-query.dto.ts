import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CategoryQuery,
  ProductSort,
} from '../interfaces/category.interface';

export { ProductSort };

export class CategoryQueryDto extends PaginationDto implements CategoryQuery {
  @IsOptional()
  @IsEnum(ProductSort, {
    message: 'sort must be one of: price_asc, price_desc',
  })
  sort?: ProductSort;
}
