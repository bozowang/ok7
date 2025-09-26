/**
 * @fileoverview Type definitions for the application.
 */

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  minOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface CustomerDetails {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: string;
  orderNotes?: string;
}

export interface ConfirmedOrder extends CustomerDetails {
  orderNumber: string;
  estimatedDeliveryTime: string;
  total: number;
  cart: CartItem[];
  restaurantName: string;
}
