import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SocialNetwork } from '@prisma/client';

@ObjectType('PlaceSocial')
export class PlaceSocialModel {
  @Field(() => Int)
  id: number;

  @Field(() => SocialNetwork)
  type: SocialNetwork;

  @Field()
  url: string;
}
