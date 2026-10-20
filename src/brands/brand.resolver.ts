import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { BrandModel } from './models/brand.model';
import { ImageModel } from '../images/models/image.model';
import { BrandsService } from './brands.service';

@Resolver(() => BrandModel)
export class BrandResolver {
  constructor(private readonly brandsService: BrandsService) {}

  @ResolveField(() => [ImageModel], { name: 'image' })
  async getImages(@Parent() brand: BrandModel) {
    return this.brandsService.findImagesByBrandId(brand.id);
  }
}
