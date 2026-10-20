import { Field, Int, ObjectType } from '@nestjs/graphql';
import { WorkingHourModel } from './working-hour.model';
import { PlaceSocialModel } from './place-social.model';
import { MenuModel } from '../../menus/models/menu.model';
import { ImageModel } from '../../images/models/image.model';

@ObjectType('Place')
export class PlaceModel {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  wifiPassword?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  address: string;

  @Field({ nullable: true })
  addressUrl?: string;

  @Field()
  phone: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  website?: string;

  @Field(() => [WorkingHourModel])
  workingHours: WorkingHourModel[];

  @Field(() => [PlaceSocialModel])
  socials: PlaceSocialModel[];

  @Field(() => [MenuModel])
  menus: MenuModel[];

  @Field(() => [ImageModel])
  image: ImageModel[];
}
