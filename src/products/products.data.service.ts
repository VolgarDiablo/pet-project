import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductWithCategory } from './interfaces/product.interface';

@Injectable()
export class ProductsDataService {
  constructor(private readonly prisma: PrismaService) {}

  async find(
    where: Prisma.ProductWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ProductOrderByWithRelationInput,
  ): Promise<[ProductWithCategory[], number]> {
    return Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  async findActiveBySlug(slug: string): Promise<ProductWithCategory | null> {
    return this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: true },
    });
  }

  async findIdOnly(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  async findIdBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  async create(
    data: Prisma.ProductCreateInput,
  ): Promise<ProductWithCategory> {
    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  async update(
    id: number,
    data: Prisma.ProductUpdateInput,
  ): Promise<ProductWithCategory> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async softDelete(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }
}
