import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ProductSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export class CategoryQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ProductSort, {
    message: 'sort must be one of: price_asc, price_desc',
  })
  sort?: ProductSort;
}
