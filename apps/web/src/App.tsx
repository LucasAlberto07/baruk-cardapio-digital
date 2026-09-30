import { CartProvider } from "./context/CartContext";
import { MenuPage } from "./pages/MenuPage";

export default function App() {
  return (
    <CartProvider>
      <MenuPage />
    </CartProvider>
  );
}
