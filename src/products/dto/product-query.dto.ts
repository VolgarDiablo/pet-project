import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ProductListSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
}

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ProductListSort, {
    message: 'sort must be one of: price_asc, price_desc, newest',
  })
  sort?: ProductListSort;
}
