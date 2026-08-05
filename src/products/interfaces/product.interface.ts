import { Category, Product } from '.prisma/client';
import { Pagination } from '../../common/interfaces/pagination.interface';

export type ProductWithCategory = Product & {
  category: Category | null;
};

export enum ProductListSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
}

export interface CreateProduct {
  title: string;
  description?: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  categoryId?: number;
}

export interface UpdateProduct {
  title?: string;
  description?: string;
  brand?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  categoryId?: number | null;
}

export interface ProductQuery extends Pagination {
  categoryId?: number;
  categorySlug?: string;
  brand?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductListSort;
}
