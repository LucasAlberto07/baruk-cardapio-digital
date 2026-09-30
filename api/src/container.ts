import { PrismaClient } from "@prisma/client";
import { CategoryRepository, PrismaCategoryRepository } from "./modules/categories/categories.repository";
import { PrismaProductRepository, ProductRepository } from "./modules/products/products.repository";
import { ExtraRepository, PrismaExtraRepository } from "./modules/extras/extras.repository";
import { PrismaPromoRepository, PromoRepository } from "./modules/promos/promos.repository";
import { OrderRepository, PrismaOrderRepository } from "./modules/orders/orders.repository";
import { CategoriesService } from "./modules/categories/categories.service";
import { ProductsService } from "./modules/products/products.service";
import { ExtrasService } from "./modules/extras/extras.service";
import { PromosService } from "./modules/promos/promos.service";
import { MenuService } from "./modules/menu/menu.service";
import { Clock, OrdersService } from "./modules/orders/orders.service";

export type Repositories = {
  categories: CategoryRepository;
  products: ProductRepository;
  extras: ExtraRepository;
  promos: PromoRepository;
  orders: OrderRepository;
};

export type Services = {
  menu: MenuService;
  categories: CategoriesService;
  products: ProductsService;
  extras: ExtrasService;
  promos: PromosService;
  orders: OrdersService;
};

/** Composition root: o único lugar que decide quais implementações concretas são usadas. */
export function createServices(repositories: Repositories, clock?: Clock): Services {
  const { categories, products, extras, promos, orders } = repositories;
  const categoriesService = new CategoriesService(categories, products);

  return {
    menu: new MenuService(categories, products, extras, promos),
    categories: categoriesService,
    products: new ProductsService(products, categoriesService),
    extras: new ExtrasService(extras),
    promos: new PromosService(promos),
    orders: new OrdersService(orders, products, extras, promos, clock),
  };
}

export function createPrismaRepositories(prisma: PrismaClient): Repositories {
  return {
    categories: new PrismaCategoryRepository(prisma),
    products: new PrismaProductRepository(prisma),
    extras: new PrismaExtraRepository(prisma),
    promos: new PrismaPromoRepository(prisma),
    orders: new PrismaOrderRepository(prisma),
  };
}

export function createPrismaHealthCheck(prisma: PrismaClient) {
  return async () => {
    await prisma.$queryRaw`SELECT 1`;
  };
}
