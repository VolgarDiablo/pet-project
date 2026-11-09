import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { extractBearerToken } from '../auth/utils/bearer-token.util';
import { verifyToken } from '../auth/utils/jwt.util';

const CART_COOKIE = 'cart_sid';
const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
};

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async findCart(req: Request, res: Response) {
    return this.getOrCreateCart(req, res);
  }

  async addCartItem(
    req: Request,
    res: Response,
    productId: number,
    quantity: number,
  ) {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    await this.ensureActiveProduct(productId);
    const cart = await this.getOrCreateCart(req, res);

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: { increment: quantity } },
    });

    return cart;
  }

  async updateCartItem(
    req: Request,
    res: Response,
    productId: number,
    quantity: number,
  ) {
    const cart = await this.getOrCreateCart(req, res);

    if (quantity <= 0) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
      return cart;
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
    });

    if (!existing) {
      await this.ensureActiveProduct(productId);
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
      return cart;
    }

    await this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });

    return cart;
  }

  async clearCart(req: Request, res: Response) {
    const cart = await this.getOrCreateCart(req, res);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return cart;
  }

  findItemsByCartId(cartId: number) {
    return this.prisma.cartItem.findMany({
      where: { cartId },
      orderBy: { id: 'asc' },
    });
  }

  findProductById(productId: number) {
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  async getOrCreateCart(req: Request, res: Response) {
    const userId = this.getUserId(req);
    const sessionId = this.getSessionId(req);

    if (userId !== null) {
      return this.resolveUserCart(userId, sessionId, res);
    }

    if (sessionId) {
      const guestCart = await this.prisma.cart.findUnique({
        where: { sessionId },
      });
      if (guestCart) {
        return guestCart;
      }
    }

    const newSessionId = randomBytes(32).toString('hex');
    const cart = await this.prisma.cart.create({
      data: { sessionId: newSessionId },
    });
    res.cookie(CART_COOKIE, newSessionId, CART_COOKIE_OPTIONS);
    return cart;
  }

  private async resolveUserCart(
    userId: number,
    sessionId: string | undefined,
    res: Response,
  ) {
    let userCart = await this.prisma.cart.findUnique({ where: { userId } });

    if (sessionId) {
      const guestCart = await this.prisma.cart.findUnique({
        where: { sessionId },
      });

      if (guestCart && (!userCart || guestCart.id !== userCart.id)) {
        if (!userCart) {
          userCart = await this.prisma.cart.update({
            where: { id: guestCart.id },
            data: { userId, sessionId: null },
          });
        } else {
          await this.mergeCartItems(guestCart.id, userCart.id);
          await this.prisma.cart.delete({ where: { id: guestCart.id } });
        }
        res.clearCookie(CART_COOKIE, { path: '/' });
      }
    }

    if (!userCart) {
      userCart = await this.prisma.cart.create({ data: { userId } });
    }

    return userCart;
  }

  private async mergeCartItems(fromCartId: number, toCartId: number) {
    const guestItems = await this.prisma.cartItem.findMany({
      where: { cartId: fromCartId },
    });

    for (const item of guestItems) {
      await this.prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: toCartId, productId: item.productId },
        },
        create: {
          cartId: toCartId,
          productId: item.productId,
          quantity: item.quantity,
        },
        update: { quantity: { increment: item.quantity } },
      });
    }
  }

  private async ensureActiveProduct(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
  }

  private getUserId(req: Request): number | null {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return null;
    }
    return verifyToken(token).id;
  }

  private getSessionId(req: Request): string | undefined {
    const cookies = req.cookies as Record<string, string> | undefined;
    const value = cookies?.[CART_COOKIE];
    return value && value.length > 0 ? value : undefined;
  }
}
