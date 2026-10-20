import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CartItemModel } from './cart-item.model';

@ObjectType('Cart')
export class CartModel {
  @Field(() => Int)
  id: number;

  @Field(() => Int, { nullable: true })
  userId?: number;

  @Field(() => [CartItemModel])
  item: CartItemModel[];
}
