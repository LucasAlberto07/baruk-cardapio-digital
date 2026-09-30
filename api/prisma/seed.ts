import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Tradicionais", slug: "tradicionais", sortOrder: 1 },
  { name: "Especiais", slug: "especiais", sortOrder: 2 },
  { name: "Doces", slug: "doces", sortOrder: 3 },
  { name: "Bebidas", slug: "bebidas", sortOrder: 4 },
];

const PRODUCTS: Record<string, [string, string, number][]> = {
  tradicionais: [
    ["Mussarela", "Molho, mussarela e azeitonas", 50],
    ["Presunto", "Molho, mussarela, presunto e azeitonas", 50],
    ["Calabresa", "Molho, mussarela, calabresa e azeitonas", 50],
    ["Frango", "Molho, mussarela, frango e azeitonas", 50],
    ["Milho", "Molho, mussarela, milho e azeitonas", 50],
    ["Marguerita", "Molho, mussarela, tomate, manjericão e azeitonas", 50],
    ["Portuguesa", "Molho, mussarela, presunto, ovo, cebola e azeitonas", 50],
    ["Atum", "Molho, mussarela, atum, cebola e azeitonas", 50],
    ["Bacon", "Molho, mussarela, bacon e azeitonas", 50],
  ],
  especiais: [
    ["Frango com Cheddar", "Molho, mussarela, frango, cheddar e azeitonas", 57],
    ["Calabresa com Cheddar", "Molho, mussarela, calabresa, cheddar e azeitonas", 57],
    ["Frango com Catupiry", "Molho, mussarela, frango, catupiry e azeitonas", 58],
    ["Calabresa com Catupiry", "Molho, mussarela, calabresa, catupiry e azeitonas", 58],
    ["Queijo Coalho", "Molho, mussarela, queijo coalho e azeitonas", 57],
    ["Três Queijos", "Molho, mussarela, cheddar, requeijão e azeitonas", 60],
    ["Carne Seca", "Molho, mussarela, carne seca, cebola e azeitonas", 60],
    ["Frango Tropical", "Molho, mussarela, frango, milho e azeitonas", 64],
    ["Sertaneja", "Molho, mussarela, carne seca, queijo coalho e azeitonas", 59],
    ["Esquina Sertaneja", "Molho, mussarela, carne seca, queijo coalho, requeijão e azeitonas", 79.99],
    ["Cupim", "Molho, mussarela, cupim, queijo coalho, cebola roxa, pasta de alho e azeitonas", 79.99],
    ["Costela", "Molho, mussarela, costela, requeijão, cebola roxa, pimenta biquinho e azeitonas", 79.99],
    ["Doritos", "Molho, mussarela, frango, cheddar, Doritos (½ pacote) e azeitonas", 74],
  ],
  doces: [
    ["Romeu e Julieta", "Mussarela, goiabada e azeitonas", 50],
    ["Dois Amores", "Chocolate ao leite e chocolate branco", 45],
    ["Sensação", "Nutella e morango fresco", 60],
    ["Marshmallow", "Nutella e marshmallow", 60],
  ],
  bebidas: [
    ["Guaraná Antarctica 1,5L", "Refrigerante gelado", 10],
    ["Coca-Cola Zero 1,5L", "Refrigerante gelado", 12],
    ["Coca-Cola Zero 2L", "Refrigerante gelado", 16],
    ["Guaraná Antarctica Zero 2L", "Refrigerante gelado", 14],
    ["Sprite 2L", "Refrigerante gelado", 14],
    ["Fanta Uva 2L", "Refrigerante gelado", 12],
  ],
};

const EXTRAS: [string, number][] = [
  ["Alho", 6],
  ["Azeitona", 6],
  ["Cebola", 6],
  ["Milho", 6],
  ["Mussarela", 6],
  ["Catupiry", 8],
  ["Cheddar", 8],
  ["Presunto", 8],
  ["Calabresa", 8],
  ["Frango", 8],
  ["Queijo Coalho", 10],
  ["Bacon", 10],
  ["Doritos", 12],
];

const PROMOS: [number, string, string, string, number | null, string | null][] = [
  [1, "Segunda", "Combo Baruk", "Promoção de segunda-feira.", 60, null],
  [2, "Terça em dobro", "Leve a segunda pizza", "Compre uma pizza e pague +R$ 25,00 para levar a segunda.", null, "Sabores selecionados"],
  [3, "Quarta", "Pizza + esfihas + refri", "1 pizza + 2 esfihas + 1 refri.", 58, null],
  [4, "Quinta", "Borda grátis", "Na compra de uma pizza e refri, ganhe borda grátis.", null, null],
  [5, "Sexta", "Pizzas selecionadas", "Pizzas selecionadas por R$ 45,00.", 45, null],
  [6, "Sábado", "Retire na Baruk", "Retirada no local por R$ 40,00.", 40, "Sabores selecionados"],
  [0, "Domingo", "Combo Família Baruk", "2 pizzas e leve o refri de graça.", null, null],
];

async function seed(tx: Prisma.TransactionClient) {
  for (const cat of CATEGORIES) {
    const category = await tx.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });

    for (const [name, description, price] of PRODUCTS[cat.slug]) {
      await tx.product.upsert({
        where: { name_categoryId: { name, categoryId: category.id } },
        update: { description, price },
        create: { name, description, price, categoryId: category.id },
      });
    }
  }

  for (const [name, price] of EXTRAS) {
    await tx.extra.upsert({ where: { name }, update: { price }, create: { name, price } });
  }

  await tx.promo.deleteMany();
  for (const [weekday, label, title, description, price, note] of PROMOS) {
    await tx.promo.create({ data: { weekday, label, title, description, price, note } });
  }
}

prisma.$transaction((tx) => seed(tx), { maxWait: 10_000, timeout: 30_000 })
  .then(() => console.log("Seed concluído."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
