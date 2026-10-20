import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProductModel } from '../../products/models/product.model';

@ObjectType('CartItem')
export class CartItemModel {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int)
  cartId: number;

  @Field(() => Int)
  productId: number;

  @Field(() => ProductModel)
  product: ProductModel;
}
