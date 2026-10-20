import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CategoryModel } from '../../categories/models/category.model';

@ObjectType('Menu')
export class MenuModel {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => [CategoryModel])
  category: CategoryModel[];
}
