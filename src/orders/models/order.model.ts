import { Field, Int, Float, ObjectType } from '@nestjs/graphql';
import { OrderStatus } from '../enums/order-status.enum';
import { Decimal } from '@prisma/client/runtime/client';
import { OrderItemModel } from './order-item.model';

@ObjectType('Order')
export class OrderModel {
  @Field(() => Int)
  id: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float)
  totalAmount: Decimal;

  @Field()
  currency: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Int, { nullable: true })
  userId?: number;

  @Field(() => [OrderItemModel])
  item: OrderItemModel[];
}
