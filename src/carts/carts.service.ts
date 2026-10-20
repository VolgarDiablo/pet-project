import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class CartsService {
  findCart(_req: Request) {
    throw new Error('CartsService.findCart not implemented');
  }

  addCartItem(_req: Request, _productId: number, _quantity: number) {
    throw new Error('CartsService.addCartItem not implemented');
  }

  updateCartItem(_req: Request, _productId: number, _quantity: number) {
    throw new Error('CartsService.updateCartItem not implemented');
  }

  clearCart(_req: Request) {
    throw new Error('CartsService.clearCart not implemented');
  }

  findItemsByCartId(_cartId: number) {
    throw new Error('CartsService.findItemsByCartId not implemented');
  }

  findProductById(_productId: number) {
    throw new Error('CartsService.findProductById not implemented');
  }
}
