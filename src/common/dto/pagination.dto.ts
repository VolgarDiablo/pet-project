import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Pagination } from '../interfaces/pagination.interface';

export const ALLOWED_LIMITS = [10, 25, 50, 100] as const;

export class PaginationDto implements Pagination {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 1;
    }
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 ? n : 1;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 10;
    }
    return Number(value);
  })
  @Type(() => Number)
  @IsIn(ALLOWED_LIMITS, {
    message: `limit must be one of: ${ALLOWED_LIMITS.join(', ')}`,
  })
  limit: number = 10;
}
