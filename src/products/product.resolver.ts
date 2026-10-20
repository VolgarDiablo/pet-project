import { Parent, Query, Args, ResolveField, Resolver } from '@nestjs/graphql';
import { ProductModel } from './models/product.model';
import { ProductsService } from './products.service';
import { ImageModel } from '../images/models/image.model';
import { BrandModel } from '../brands/models/brand.model';

@Resolver(() => ProductModel)
export class ProductResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => ProductModel, { nullable: true, name: 'product' })
  product(@Args('slug') slug: string) {
    return this.productsService.findProductBySlug(slug);
  }

  @ResolveField(() => [ImageModel], { name: 'image' })
  async getImages(@Parent() product: ProductModel) {
    return this.productsService.findImagesByProductId(product.id);
  }

  @ResolveField(() => BrandModel, { nullable: true, name: 'brand' })
  async getBrand(@Parent() product: ProductModel) {
    return this.productsService.findBrandByProductId(product.id);
  }
}
