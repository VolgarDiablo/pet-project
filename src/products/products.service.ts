import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '.prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ProductListSort,
  ProductQueryDto,
} from './dto/product-query.dto';
import { ProductWithCategory } from './interfaces/product.interface';
import { generateUniqueSlug } from '../common/utils/slug.util';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { buildPaginatedResult, getSkip } from '../common/utils/pagination.util';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ProductQueryDto,
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
      const category = await this.prisma.category.findUnique({
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
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductWithCategory> {
    await this.ensureCategoryExists(dto.categoryId);

    const slug = await generateUniqueSlug(dto.title, (value) =>
      this.slugExists(value),
    );

    return this.prisma.product.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        brand: dto.brand,
        price: dto.price,
        discountPrice: dto.discountPrice,
        stock: dto.stock,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
  }

  async update(
    id: number,
    dto: UpdateProductDto,
  ): Promise<ProductWithCategory> {
    await this.ensureExists(id);

    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const data: Prisma.ProductUpdateInput = {
      description: dto.description,
      brand: dto.brand,
      price: dto.price,
      discountPrice: dto.discountPrice,
      stock: dto.stock,
    };

    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = await generateUniqueSlug(dto.title, (value) =>
        this.slugExists(value, id),
      );
    }

    if (dto.categoryId !== undefined) {
      data.category =
        dto.categoryId === null
          ? { disconnect: true }
          : { connect: { id: dto.categoryId } };
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async softDelete(
    id: number,
  ): Promise<{ id: number; isActive: boolean }> {
    await this.ensureExists(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
    return product;
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
    const exists = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }

  private async ensureCategoryExists(categoryId?: number): Promise<void> {
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
