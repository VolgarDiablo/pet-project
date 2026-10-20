import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Request } from 'express';
import { CartModel } from './models/cart.model';
import { CartItemModel } from './models/cart-item.model';
import { CartsService } from './carts.service';

@Resolver(() => CartModel)
export class CartResolver {
  constructor(private readonly cartsService: CartsService) {}

  @Query(() => CartModel, { nullable: true, name: 'cart' })
  async getCart(@Context('req') req: Request) {
    return this.cartsService.findCart(req);
  }

  @Mutation(() => CartModel, { name: 'addCartItem' })
  async addCartItem(
    @Context('req') req: Request,
    @Args('productId', { type: () => Int }) productId: number,
    @Args('quantity', { type: () => Int, defaultValue: 1 }) quantity: number,
  ) {
    return this.cartsService.addCartItem(req, productId, quantity);
  }

  @Mutation(() => CartModel, { name: 'updateCartItem' })
  async updateCartItem(
    @Context('req') req: Request,
    @Args('productId', { type: () => Int }) productId: number,
    @Args('quantity', { type: () => Int }) quantity: number,
  ) {
    return this.cartsService.updateCartItem(req, productId, quantity);
  }

  @Mutation(() => CartModel, { name: 'clearCart' })
  async clearCart(@Context('req') req: Request) {
    return this.cartsService.clearCart(req);
  }

  @ResolveField(() => [CartItemModel], { name: 'item' })
  async getItems(@Parent() cart: CartModel) {
    return this.cartsService.findItemsByCartId(cart.id);
  }
}
