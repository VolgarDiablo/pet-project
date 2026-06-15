import { Category, Product } from '.prisma/client';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

export type CategoryWithProducts = Category & {
  products: Product[];
};

export interface CategoryWithPaginatedProducts extends Category {
  products: PaginatedResult<Product>;
}
