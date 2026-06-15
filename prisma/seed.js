"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require(".prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
const slug_util_1 = require("../src/common/utils/slug.util");
dotenv.config();
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
const categories = [
    { name: 'Электроника' },
    { name: 'Книги' },
    { name: 'Одежда' },
];
const products = [
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
        role: client_1.Role.ADMIN,
    },
    {
        name: 'Manager',
        email: 'manager@example.com',
        password: 'Manager123!',
        role: client_1.Role.MANAGER,
    },
];
async function main() {
    console.log('Seeding categories...');
    const categoryByName = new Map();
    for (const c of categories) {
        const category = await prisma.category.upsert({
            where: { name: c.name },
            update: {},
            create: { name: c.name, slug: (0, slug_util_1.slugify)(c.name) },
        });
        categoryByName.set(c.name, category.id);
    }
    console.log('Seeding products...');
    for (const p of products) {
        const slug = (0, slug_util_1.slugify)(p.title);
        await prisma.product.upsert({
            where: { slug },
            update: {
                title: p.title,
                brand: p.brand,
                description: p.description,
                price: p.price,
                discountPrice: p.discountPrice,
                stock: p.stock,
                categoryId: categoryByName.get(p.category) ?? null,
                isActive: true,
            },
            create: {
                title: p.title,
                slug,
                brand: p.brand,
                description: p.description,
                price: p.price,
                discountPrice: p.discountPrice,
                stock: p.stock,
                categoryId: categoryByName.get(p.category) ?? null,
            },
        });
    }
    console.log('Seeding users (admin/manager)...');
    for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10);
        await prisma.user.upsert({
            where: { email: u.email },
            update: { role: u.role, emailVerified: true },
            create: {
                name: u.name,
                email: u.email,
                password: hash,
                role: u.role,
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
//# sourceMappingURL=seed.js.map