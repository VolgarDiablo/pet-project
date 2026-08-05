import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryWithProducts } from './interfaces/category.interface';

@Injectable()
export class CategoriesDataService {
  constructor(private readonly prisma: PrismaService) {}

  async find(
    skip: number,
    take: number,
  ): Promise<[CategoryWithProducts[], number]> {
    return Promise.all([
      this.prisma.category.findMany({
        skip,
        take,
        orderBy: { id: 'asc' },
        include: { products: true },
      }),
      this.prisma.category.count(),
    ]);
  }

  async findById(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findIdBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  async findIdOnly(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  async findProductsByCategoryId(
    categoryId: number,
    skip: number,
    take: number,
    orderBy: Prisma.ProductOrderByWithRelationInput,
  ) {
    const where = { categoryId };
    return Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  async create(name: string, slug: string): Promise<CategoryWithProducts> {
    return this.prisma.category.create({
      data: { name, slug },
      include: { products: true },
    });
  }

  async update(
    id: number,
    data: Prisma.CategoryUpdateInput,
  ): Promise<CategoryWithProducts> {
    return this.prisma.category.update({
      where: { id },
      data,
      include: { products: true },
    });
  }

  async delete(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }
}
