import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { PlaceModel } from './models/place.model';
import { WorkingHourModel } from './models/working-hour.model';
import { PlaceSocialModel } from './models/place-social.model';
import { MenuModel } from '../menus/models/menu.model';
import { ImageModel } from '../images/models/image.model';
import { PlacesService } from './places.service';

@Resolver(() => PlaceModel)
export class PlaceResolver {
  constructor(private readonly placesService: PlacesService) {}

  @Query(() => PlaceModel, { nullable: true, name: 'place' })
  async getPlace(@Args('slug', { type: () => String }) slug: string) {
    return this.placesService.findPlaceBySlug(slug);
  }

  @Query(() => [PlaceModel], { name: 'places' })
  async getPlaces() {
    return this.placesService.findAllPlaces();
  }

  @ResolveField(() => [WorkingHourModel], { name: 'workingHours' })
  async getWorkingHours(@Parent() place: PlaceModel) {
    return this.placesService.findWorkingHoursByPlaceId(place.id);
  }

  @ResolveField(() => [PlaceSocialModel], { name: 'socials' })
  async getSocials(@Parent() place: PlaceModel) {
    return this.placesService.findSocialsByPlaceId(place.id);
  }

  @ResolveField(() => [MenuModel], { name: 'menus' })
  async getMenus(@Parent() place: PlaceModel) {
    return this.placesService.findMenusByPlaceId(place.id);
  }

  @ResolveField(() => [ImageModel], { name: 'image' })
  async getImages(@Parent() place: PlaceModel) {
    return this.placesService.findImages(place.id);
  }
}
