import { Category, Product } from '@prisma/client';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { Pagination } from '../../common/interfaces/pagination.interface';

export type CategoryWithProduct = Category & {
  product: Product[];
};

export interface CategoryWithPaginatedProduct extends Category {
  product: PaginatedResult<Product>;
}

export enum ProductSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export interface CreateCategory {
  name: string;
  menuId: number;
}

export interface UpdateCategory {
  name?: string;
  menuId?: number;
}

export interface CategoryQuery extends Pagination {
  sort?: ProductSort;
}
