import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { slugify } from '../src/common/utils/slug.util';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: 'Электроника' },
  { name: 'Книги' },
  { name: 'Одежда' },
];

type SeedProduct = {
  title: string;
  category: string;
  brand?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
};

const products: SeedProduct[] = [
  {
    title: 'Смартфон Galaxy S24',
    category: 'Электроника',
    brand: 'Samsung',
    description: 'Флагманский смартфон с AMOLED-экраном',
    price: 29999.0,
    discountPrice: 27999.0,
    stock: 25,
  },
  {
    title: 'Ноутбук ThinkPad X1',
    category: 'Электроника',
    brand: 'Lenovo',
    description: 'Бизнес-ноутбук 14 дюймов',
    price: 54999.0,
    stock: 10,
  },
  {
    title: 'Наушники WH-1000XM5',
    category: 'Электроника',
    brand: 'Sony',
    description: 'Беспроводные наушники с шумоподавлением',
    price: 12999.0,
    discountPrice: 10999.0,
    stock: 40,
  },
  {
    title: 'Чистый код',
    category: 'Книги',
    brand: 'Питер',
    description: 'Роберт Мартин о написании поддерживаемого кода',
    price: 1290.0,
    stock: 100,
  },
  {
    title: 'Грокаем алгоритмы',
    category: 'Книги',
    brand: 'Манн, Иванов и Фербер',
    price: 990.0,
    discountPrice: 790.0,
    stock: 60,
  },
  {
    title: 'Футболка Basic',
    category: 'Одежда',
    brand: 'Uniqlo',
    description: 'Хлопковая футболка унисекс',
    price: 799.0,
    stock: 200,
  },
  {
    title: 'Джинсы Slim Fit',
    category: 'Одежда',
    brand: "Levi's",
    price: 4599.0,
    discountPrice: 3999.0,
    stock: 75,
  },
];

const users = [
  {
    name: 'Admin',
    email: 'admin@example.com',
    password: 'Admin123!',
  },
  {
    name: 'Manager',
    email: 'manager@example.com',
    password: 'Manager123!',
  },
];

async function main() {
  console.log('Seeding place and menu...');
  const place = await prisma.place.upsert({
    where: { slug: 'main' },
    update: {},
    create: {
      name: 'Main',
      slug: 'main',
      address: 'Kyiv',
      phone: '+380000000000',
    },
  });

  const menu = await prisma.menu.upsert({
    where: { placeId_slug: { placeId: place.id, slug: 'kitchen' } },
    update: {},
    create: {
      name: 'Кухня',
      slug: 'kitchen',
      placeId: place.id,
    },
  });

  console.log('Seeding categories...');
  const categoryByName = new Map<string, number>();
  for (const c of categories) {
    const slug = slugify(c.name);
    const category = await prisma.category.upsert({
      where: { menuId_slug: { menuId: menu.id, slug } },
      update: {},
      create: { name: c.name, slug, menuId: menu.id },
    });
    categoryByName.set(c.name, category.id);
  }

  console.log('Seeding products...');
  for (const p of products) {
    const slug = slugify(p.title);
    await prisma.product.upsert({
      where: { slug },
      update: {
        title: p.title,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice,
        stock: p.stock,
        categoryId: categoryByName.get(p.category) ?? null,
        isActive: true,
        ...(p.brand
          ? {
              brand: {
                connectOrCreate: {
                  where: { name: p.brand },
                  create: { name: p.brand },
                },
              },
            }
          : {}),
      },
      create: {
        title: p.title,
        slug,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice,
        stock: p.stock,
        categoryId: categoryByName.get(p.category) ?? null,
        ...(p.brand
          ? {
              brand: {
                connectOrCreate: {
                  where: { name: p.brand },
                  create: { name: p.brand },
                },
              },
            }
          : {}),
      },
    });
  }

  console.log('Seeding users...');
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { emailVerified: true },
      create: {
        name: u.name,
        email: u.email,
        password: hash,
        emailVerified: true,
      },
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
