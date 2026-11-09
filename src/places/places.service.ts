import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  findPlaceBySlug(slug: string) {
    return this.prisma.place.findUnique({ where: { slug } });
  }

  findAllPlaces() {
    return this.prisma.place.findMany({ orderBy: { name: 'asc' } });
  }

  findWorkingHoursByPlaceId(placeId: number) {
    return this.prisma.workingHour.findMany({
      where: { placeId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  findSocialsByPlaceId(placeId: number) {
    return this.prisma.placeSocial.findMany({
      where: { placeId },
      orderBy: { type: 'asc' },
    });
  }

  findMenusByPlaceId(placeId: number) {
    return this.prisma.menu.findMany({
      where: { placeId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findImages(placeId: number) {
    return this.prisma.image.findMany({
      where: { placeId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }
}
