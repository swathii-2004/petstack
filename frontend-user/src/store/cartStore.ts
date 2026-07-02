import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "../types";

interface CartState {
    items: CartItem[];
    addItem: (product: Product, quantity?: number, selectedSize?: string) => void;
    removeItem: (productId: string, selectedSize?: string) => void;
    updateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
    clearCart: () => void;
    cartTotal: () => number;
    itemCount: () => number;
    isDrawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isDrawerOpen: false,

            addItem: (product, quantity = 1, selectedSize) => {
                set((state) => {
                    const getProductId = (p: any) => p._id || p.id;
                    const existingItem = state.items.find(
                        (i) => getProductId(i.product) === getProductId(product) && i.selectedSize === selectedSize
                    );
                    if (existingItem) {
                        return {
                            items: state.items.map((i) =>
                                getProductId(i.product) === getProductId(product) && i.selectedSize === selectedSize
                                    ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                                    : i
                            ),
                            isDrawerOpen: true,
                        };
                    }
                    return {
                        items: [...state.items, { product, quantity, selectedSize }],
                        isDrawerOpen: true
                    };
                });
            },

            removeItem: (productId, selectedSize) => {
                set((state) => ({
                    items: state.items.filter(
                        (i) => !((i.product._id || (i.product as any).id) === productId && i.selectedSize === selectedSize)
                    )
                }));
            },

            updateQuantity: (productId, quantity, selectedSize) => {
                set((state) => ({
                    items: state.items.map((i) =>
                        (i.product._id || (i.product as any).id) === productId && i.selectedSize === selectedSize
                            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.product.stock)) }
                            : i
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),

            cartTotal: () => {
                return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
            },

            itemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            },

            setDrawerOpen: (open) => set({ isDrawerOpen: open }),
        }),
        {
            name: "petstack-cart",
            partialize: (state) => ({ items: state.items }), // Only persist items, not drawer state
        }
    )
);
