import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProductModel } from '../../products/models/product.model';

@ObjectType('Category')
export class CategoryModel {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => Int)
  menuId: number;

  @Field(() => [ProductModel])
  product: ProductModel[];
}
