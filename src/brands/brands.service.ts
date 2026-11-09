import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  findImagesByBrandId(brandId: number) {
    return this.prisma.image.findMany({
      where: { brandId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }
}
