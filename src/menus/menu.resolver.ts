import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { MenuModel } from './models/menu.model';
import { CategoryModel } from '../categories/models/category.model';
import { MenusService } from './menus.service';

@Resolver(() => MenuModel)
export class MenuResolver {
  constructor(private readonly menusService: MenusService) {}

  @ResolveField(() => [CategoryModel], { name: 'category' })
  async getCategory(@Parent() menu: MenuModel) {
    return this.menusService.findCategoryByMenuId(menu.id);
  }
}
