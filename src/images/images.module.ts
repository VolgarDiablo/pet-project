import { Module } from '@nestjs/common';
import { ImageResolver } from './image.resolver';

@Module({
  providers: [ImageResolver],
})
export class ImagesModule {}
