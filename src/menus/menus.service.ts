import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  findCategoryByMenuId(menuId: number) {
    return this.prisma.category.findMany({
      where: { menuId },
      orderBy: { name: 'asc' },
    });
  }
}
