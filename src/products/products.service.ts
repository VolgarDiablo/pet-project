import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateProduct,
  ProductListSort,
  ProductQuery,
  ProductWithCategory,
  UpdateProduct,
} from './interfaces/product.interface';
import { generateUniqueSlug } from '../common/utils/slug.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { buildPaginatedResult, getSkip } from '../common/utils/pagination.util';
import { ProductsDataService } from './products.data.service';
import { CategoriesDataService } from '../categories/categories.data.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsData: ProductsDataService,
    private readonly categoriesData: CategoriesDataService,
  ) {}

  async findAll(
    query: ProductQuery,
  ): Promise<PaginatedResult<ProductWithCategory>> {
    const { page, limit } = query;

    const where: Prisma.ProductWhereInput = { isActive: true };

    const hasSlug =
      query.categorySlug !== undefined && query.categorySlug.trim() !== '';
    if (hasSlug && query.categoryId !== undefined) {
      throw new BadRequestException(
        'Use either categoryId or categorySlug, not both',
      );
    }

    if (hasSlug) {
      const category = await this.categoriesData.findIdBySlug(
        query.categorySlug!.trim(),
      );
      if (!category) {
        throw new NotFoundException(
          `Category with slug "${query.categorySlug}" not found`,
        );
      }
      where.categoryId = category.id;
    } else if (query.categoryId !== undefined) {
      where.categoryId = query.categoryId;
    }
    if (query.brand) {
      where.brand = { contains: query.brand, mode: 'insensitive' };
    }
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const [data, total] = await this.productsData.find(
      where,
      getSkip(page, limit),
      limit,
      this.resolveOrder(query.sort),
    );

    return buildPaginatedResult(data, total, page, limit);
  }

  async findBySlug(slug: string): Promise<ProductWithCategory> {
    const product = await this.productsData.findActiveBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }

    return product;
  }

  async create(payload: CreateProduct): Promise<ProductWithCategory> {
    await this.ensureCategoryExists(payload.categoryId);

    const slug = await generateUniqueSlug(payload.title, (value) =>
      this.slugExists(value),
    );

    return this.productsData.create({
      title: payload.title,
      slug,
      description: payload.description,
      brand: payload.brand,
      price: payload.price,
      discountPrice: payload.discountPrice,
      stock: payload.stock,
      ...(payload.categoryId !== undefined
        ? { category: { connect: { id: payload.categoryId } } }
        : {}),
    });
  }

  async update(
    id: number,
    payload: UpdateProduct,
  ): Promise<ProductWithCategory> {
    await this.ensureExists(id);

    if (payload.categoryId !== undefined) {
      await this.ensureCategoryExists(payload.categoryId);
    }

    const data: Prisma.ProductUpdateInput = {
      description: payload.description,
      brand: payload.brand,
      price: payload.price,
      discountPrice: payload.discountPrice,
      stock: payload.stock,
    };

    if (payload.title !== undefined) {
      data.title = payload.title;
      data.slug = await generateUniqueSlug(payload.title, (value) =>
        this.slugExists(value, id),
      );
    }

    if (payload.categoryId !== undefined) {
      data.category =
        payload.categoryId === null
          ? { disconnect: true }
          : { connect: { id: payload.categoryId } };
    }

    return this.productsData.update(id, data);
  }

  async softDelete(
    id: number,
  ): Promise<{ id: number; isActive: boolean }> {
    await this.ensureExists(id);
    return this.productsData.softDelete(id);
  }

  private resolveOrder(
    sort?: ProductListSort,
  ): Prisma.ProductOrderByWithRelationInput {
    if (sort === ProductListSort.PRICE_ASC) {
      return { price: 'asc' };
    }
    if (sort === ProductListSort.PRICE_DESC) {
      return { price: 'desc' };
    }
    if (sort === ProductListSort.NEWEST) {
      return { createdAt: 'desc' };
    }
    return { id: 'asc' };
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.productsData.findIdOnly(id);
    if (!exists) {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }

  private async ensureCategoryExists(
    categoryId?: number | null,
  ): Promise<void> {
    if (categoryId === undefined || categoryId === null) {
      return;
    }
    const category = await this.categoriesData.findIdOnly(categoryId);
    if (!category) {
      throw new BadRequestException(`Category ${categoryId} does not exist`);
    }
  }

  private async slugExists(slug: string, ignoreId?: number): Promise<boolean> {
    const found = await this.productsData.findIdBySlug(slug);
    return !!found && found.id !== ignoreId;
  }
}
