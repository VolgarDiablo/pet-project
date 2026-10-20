import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { MailModule } from './mail/mail.module';
import { AppGraphQLModule } from './graphql/graphql.module';
import { BrandsModule } from './brands/brands.module';
import { ImagesModule } from './images/images.module';
import { CartsModule } from './carts/carts.module';
import { OrdersModule } from './orders/orders.module';
import { PlacesModule } from './places/places.module';
import { MenusModule } from './menus/menus.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppGraphQLModule,
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    BrandsModule,
    ImagesModule,
    PlacesModule,
    MenusModule,
    CartsModule,
    OrdersModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
