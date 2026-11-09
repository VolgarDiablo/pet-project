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
  CategoryWithPaginatedProduct,
  CategoryWithProduct,
  CreateCategory,
  ProductSort,
  UpdateCategory,
} from './interfaces/category.interface';
import { buildPaginatedResult, getSkip } from '../common/utils/pagination.util';
import { generateUniqueSlug } from '../common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    pagination: Pagination,
  ): Promise<PaginatedResult<CategoryWithProduct>> {
    const { page, limit } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        skip: getSkip(page, limit),
        take: limit,
        orderBy: { id: 'asc' },
        include: { product: true },
      }),
      this.prisma.category.count(),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(
    id: number,
    query: CategoryQuery,
  ): Promise<CategoryWithPaginatedProduct> {
    const { page, limit, sort } = query;

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    const where = { categoryId: id };
    const [product, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.resolveProductOrder(sort),
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      ...category,
      product: buildPaginatedResult(product, total, page, limit),
    };
  }

  async create(payload: CreateCategory): Promise<CategoryWithProduct> {
    const slug = await generateUniqueSlug(payload.name, (value) =>
      this.slugExists(value, undefined, payload.menuId),
    );

    try {
      return await this.prisma.category.create({
        data: {
          name: payload.name,
          slug,
          menuId: payload.menuId,
        },
        include: { product: true },
      });
    } catch (error) {
      throw this.handleWriteError(error, payload.name);
    }
  }

  async update(
    id: number,
    payload: UpdateCategory,
  ): Promise<CategoryWithProduct> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    const menuId = payload.menuId ?? existing.menuId;
    const data: Prisma.CategoryUpdateInput = {};
    if (payload.menuId !== undefined) {
      data.menu = { connect: { id: payload.menuId } };
    }
    if (payload.name !== undefined) {
      data.name = payload.name;
      data.slug = await generateUniqueSlug(payload.name, (value) =>
        this.slugExists(value, id, menuId),
      );
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data,
        include: { product: true },
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

  findProductsByCategoryId(categoryId: number) {
    return this.prisma.product.findMany({
      where: { categoryId, isActive: true },
      orderBy: { id: 'asc' },
    });
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

  private async slugExists(
    slug: string,
    ignoreId?: number,
    menuId?: number,
  ): Promise<boolean> {
    const found = await this.prisma.category.findFirst({
      where: { slug, ...(menuId !== undefined ? { menuId } : {}) },
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
