import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '.prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    pagination: Pagination,
  ): Promise<PaginatedResult<CategoryWithProducts>> {
    const { page, limit } = pagination;

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        skip: getSkip(page, limit),
        take: limit,
        orderBy: { id: 'asc' },
        include: { products: true },
      }),
      this.prisma.category.count(),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(
    id: number,
    query: CategoryQuery,
  ): Promise<CategoryWithPaginatedProducts> {
    const { page, limit, sort } = query;

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    const orderBy = this.resolveProductOrder(sort);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { categoryId: id },
        skip: getSkip(page, limit),
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where: { categoryId: id } }),
    ]);

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
      return await this.prisma.category.create({
        data: { name: payload.name, slug },
        include: { products: true },
      });
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
      return await this.prisma.category.update({
        where: { id },
        data,
        include: { products: true },
      });
    } catch (error) {
      throw this.handleWriteError(error, payload.name);
    }
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    await this.ensureExists(id);
    await this.prisma.category.delete({ where: { id } });
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
    const exists = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }

  private async slugExists(slug: string, ignoreId?: number): Promise<boolean> {
    const found = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
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
