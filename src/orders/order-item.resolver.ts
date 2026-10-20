import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { OrderItemModel } from './models/order-item.model';
import { ProductModel } from '../products/models/product.model';
import { OrdersService } from './orders.service';

@Resolver(() => OrderItemModel)
export class OrderItemResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @ResolveField(() => ProductModel, { name: 'product' })
  async getProduct(@Parent() item: OrderItemModel) {
    return this.ordersService.findProductById(item.productId);
  }
}
