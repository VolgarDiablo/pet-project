import { Inject } from '@nestjs/common';
import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import type { Request } from 'express';
import type { PubSub } from 'graphql-subscriptions';
import { OrderModel } from './models/order.model';
import { OrderItemModel } from './models/order-item.model';
import { OrdersService } from './orders.service';
import { PUB_SUB } from '../graphql/pubsub.provider';

@Resolver(() => OrderModel)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => [OrderModel], { name: 'orders' })
  async getOrders(@Context('req') req: Request) {
    return this.ordersService.findOrders(req);
  }

  @Query(() => OrderModel, { nullable: true, name: 'order' })
  async getOrder(
    @Context('req') req: Request,
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.ordersService.findOrderById(req, id);
  }

  @Mutation(() => OrderModel, { name: 'createOrder' })
  async createOrder(
    @Context('req') req: Request,
    @Args('notes', { type: () => String, nullable: true }) notes?: string,
  ) {
    return this.ordersService.createOrder(req, notes);
  }

  @Mutation(() => OrderModel, { name: 'cancelOrder' })
  async cancelOrder(
    @Context('req') req: Request,
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.ordersService.cancelOrder(req, id);
  }

  @Subscription(() => OrderModel, {
    name: 'orderUpdated',
    filter: (payload: { orderUpdated: OrderModel }, variables: { id: number }) =>
      payload.orderUpdated.id === variables.id,
  })
  orderUpdated(@Args('id', { type: () => Int }) _id: number) {
    return this.pubSub.asyncIterableIterator('orderUpdated');
  }

  @ResolveField(() => [OrderItemModel], { name: 'item' })
  async getItems(@Parent() order: OrderModel) {
    return this.ordersService.findItemsByOrderId(order.id);
  }
}
