import { Category, Product } from '@prisma/client';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { Pagination } from '../../common/interfaces/pagination.interface';

export type CategoryWithProducts = Category & {
  products: Product[];
};

export interface CategoryWithPaginatedProducts extends Category {
  products: PaginatedResult<Product>;
}

export enum ProductSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export interface CreateCategory {
  name: string;
}

export interface UpdateCategory {
  name?: string;
}

export interface CategoryQuery extends Pagination {
  sort?: ProductSort;
}
