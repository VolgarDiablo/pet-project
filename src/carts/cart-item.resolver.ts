import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CartItemModel } from './models/cart-item.model';
import { ProductModel } from '../products/models/product.model';
import { CartsService } from './carts.service';

@Resolver(() => CartItemModel)
export class CartItemResolver {
  constructor(private readonly cartsService: CartsService) {}

  @ResolveField(() => ProductModel, { name: 'product' })
  async getProduct(@Parent() item: CartItemModel) {
    return this.cartsService.findProductById(item.productId);
  }
}
