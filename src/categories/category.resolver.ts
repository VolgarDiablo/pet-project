import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CategoryModel } from './models/category.model';
import { CategoriesService } from './categories.service';
import { ProductModel } from '../products/models/product.model';

@Resolver(() => CategoryModel)
export class CategoryResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ResolveField(() => [ProductModel], { name: 'product' })
  async getProducts(@Parent() category: CategoryModel) {
    return this.categoriesService.findProductsByCategoryId(category.id);
  }
}
