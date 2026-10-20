import { Field, Int, Float, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import { ProductModel } from '../../products/models/product.model';

@ObjectType('OrderItem')
export class OrderItemModel {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: Decimal;

  @Field(() => Float)
  totalPrice: Decimal;

  @Field(() => Int)
  orderId: number;

  @Field(() => Int)
  productId: number;

  @Field(() => ProductModel)
  product: ProductModel;
}
