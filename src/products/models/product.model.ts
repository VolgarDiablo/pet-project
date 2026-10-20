import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import { BrandModel } from '../../brands/models/brand.model';
import { ImageModel } from '../../images/models/image.model';

@ObjectType('Product')
export class ProductModel {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: Decimal;

  @Field(() => Float, { nullable: true })
  discountPrice?: Decimal;

  @Field(() => Int)
  stock: number;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Int, { nullable: true })
  brandId?: number;

  @Field(() => BrandModel, { nullable: true })
  brand?: BrandModel;

  @Field(() => [ImageModel])
  image: ImageModel[];
}
