import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Image')
export class ImageModel {
  @Field(() => Int)
  id: number;

  @Field()
  url: string;

  @Field({ nullable: true })
  alt?: string;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => Boolean)
  isPrimary: boolean;
}
