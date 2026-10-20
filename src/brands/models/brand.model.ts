import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ImageModel } from '../../images/models/image.model';

@ObjectType('Brand')
export class BrandModel {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [ImageModel])
  image: ImageModel[];
}
