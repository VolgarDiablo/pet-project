import { Resolver } from '@nestjs/graphql';
import { ImageModel } from './models/image.model';

@Resolver(() => ImageModel)
export class ImageResolver {}
