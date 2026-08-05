import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Pagination } from '../common/interfaces/pagination.interface';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import {
  CategoryQuery,
  CategoryWithPaginatedProducts,
  CategoryWithProducts,
  CreateCategory,
  ProductSort,
  UpdateCategory,
} from './interfaces/category.interface';
import {
  buildPaginatedResult,
  getSkip,
} from '../common/utils/pagination.util';
import { generateUniqueSlug } from '../common/utils/slug.util';
import { CategoriesDataService } from './categories.data.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesData: CategoriesDataService) {}

  async findAll(
    pagination: Pagination,
  ): Promise<PaginatedResult<CategoryWithProducts>> {
    const { page, limit } = pagination;
    const [data, total] = await this.categoriesData.find(
      getSkip(page, limit),
      limit,
    );
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(
    id: number,
    query: CategoryQuery,
  ): Promise<CategoryWithPaginatedProducts> {
    const { page, limit, sort } = query;

    const category = await this.categoriesData.findById(id);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    const [products, total] = await this.categoriesData.findProductsByCategoryId(
      id,
      getSkip(page, limit),
      limit,
      this.resolveProductOrder(sort),
    );

    return {
      ...category,
      products: buildPaginatedResult(products, total, page, limit),
    };
  }

  async create(payload: CreateCategory): Promise<CategoryWithProducts> {
    const slug = await generateUniqueSlug(payload.name, (value) =>
      this.slugExists(value),
    );

    try {
      return await this.categoriesData.create(payload.name, slug);
    } catch (error) {
      throw this.handleWriteError(error, payload.name);
    }
  }

  async update(
    id: number,
    payload: UpdateCategory,
  ): Promise<CategoryWithProducts> {
    await this.ensureExists(id);

    const data: Prisma.CategoryUpdateInput = {};
    if (payload.name !== undefined) {
      data.name = payload.name;
      data.slug = await generateUniqueSlug(payload.name, (value) =>
        this.slugExists(value, id),
      );
    }

    try {
      return await this.categoriesData.update(id, data);
    } catch (error) {
      throw this.handleWriteError(error, payload.name);
    }
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    await this.ensureExists(id);
    await this.categoriesData.delete(id);
    return { id, deleted: true };
  }

  private resolveProductOrder(
    sort?: ProductSort,
  ): Prisma.ProductOrderByWithRelationInput {
    if (sort === ProductSort.PRICE_ASC) {
      return { price: 'asc' };
    }
    if (sort === ProductSort.PRICE_DESC) {
      return { price: 'desc' };
    }
    return { id: 'asc' };
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.categoriesData.findIdOnly(id);
    if (!exists) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }

  private async slugExists(slug: string, ignoreId?: number): Promise<boolean> {
    const found = await this.categoriesData.findIdBySlug(slug);
    return !!found && found.id !== ignoreId;
  }

  private handleWriteError(error: unknown, name?: string): Error {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        `Category with name "${name}" already exists`,
      );
    }
    return error as Error;
  }
}
