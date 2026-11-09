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
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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
      const category = await this.prisma.category.findFirst({
        where: { slug: query.categorySlug!.trim() },
        select: { id: true },
      });
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
      where.brand = {
        name: { contains: query.brand, mode: 'insensitive' },
      };
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

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: getSkip(page, limit),
        take: limit,
        orderBy: this.resolveOrder(query.sort),
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async findBySlug(slug: string): Promise<ProductWithCategory> {
    const product = await this.findProductBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }

    return product;
  }

  findProductBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: true },
    });
  }

  findImagesByProductId(productId: number) {
    return this.prisma.image.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async findBrandByProductId(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { brand: true },
    });
    return product?.brand ?? null;
  }

  async create(payload: CreateProduct): Promise<ProductWithCategory> {
    await this.ensureCategoryExists(payload.categoryId);

    const slug = await generateUniqueSlug(payload.title, (value) =>
      this.slugExists(value),
    );

    return this.prisma.product.create({
      data: {
        title: payload.title,
        slug,
        description: payload.description,
        brand: this.connectBrandByName(payload.brand),
        price: payload.price,
        discountPrice: payload.discountPrice,
        stock: payload.stock,
        ...(payload.categoryId !== undefined
          ? { category: { connect: { id: payload.categoryId } } }
          : {}),
      },
      include: { category: true },
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
      price: payload.price,
      discountPrice: payload.discountPrice,
      stock: payload.stock,
    };

    if (payload.brand !== undefined) {
      data.brand = this.connectBrandByName(payload.brand) ?? {
        disconnect: true,
      };
    }

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

    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async softDelete(id: number): Promise<{ id: number; isActive: boolean }> {
    await this.ensureExists(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
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

  private connectBrandByName(
    name?: string,
  ): Prisma.BrandCreateNestedOneWithoutProductInput | undefined {
    if (!name) {
      return undefined;
    }
    return {
      connectOrCreate: {
        where: { name },
        create: { name },
      },
    };
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
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
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException(`Category ${categoryId} does not exist`);
    }
  }

  private async slugExists(slug: string, ignoreId?: number): Promise<boolean> {
    const found = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!found && found.id !== ignoreId;
  }
}
