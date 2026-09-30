export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
};

export type Extra = {
  id: string;
  name: string;
  price: number;
};

export type Promo = {
  id: string;
  weekday: number; // 0 = domingo ... 6 = sábado
  label: string;
  title: string;
  description: string;
  price?: number | null;
  note?: string | null;
};

// Payload único que a API devolve para montar o cardápio inteiro de uma vez.
export type MenuResponse = {
  categories: Category[];
  products: Product[];
  extras: Extra[];
  promos: Promo[];
};

export type SliceOption = "8 fatias" | "12 fatias";

export type CartLineSelection = {
  productId: string;
  productName: string;
  basePrice: number;
  qty: number;
  slice?: SliceOption;
  extraIds?: string[];
  drinkProductId?: string | null;
};

export type OrderPayload = {
  customerName: string;
  /** Telefone do cliente para os avisos no WhatsApp (qualquer formato; a API normaliza). */
  customerPhone: string;
  address: string;
  notes?: string;
  // Cada item é um produto (productId) OU uma promoção do dia (promoId), nunca os dois.
  items: {
    productId?: string;
    promoId?: string;
    qty: number;
    extraIds?: string[];
    drinkProductId?: string | null;
    slice?: SliceOption;
  }[];
};
