import React, { useState, useEffect } from 'react';
import { Restaurant, MenuItem, CartItem, CustomerDetails, ConfirmedOrder } from './types';
import { fetchRestaurants, fetchMenu, submitOrder } from './services/geminiService';
import { saveOrderToSheet } from './services/sheetService';
import { SHIPPING_FEE } from './constants';

import Header from './components/Header';
import RestaurantList from './components/RestaurantList';
import MenuView from './components/MenuView';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import ConfirmationView from './components/ConfirmationView';
import Footer from './components/Footer';
import Spinner from './components/Spinner';
import Alert from './components/Alert';

type View = 'list' | 'menu' | 'cart' | 'checkout' | 'confirmation';

const App: React.FC = () => {
    const [view, setView] = useState<View>('list');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuLoading, setIsMenuLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Initial load of restaurants
    useEffect(() => {
        const loadRestaurants = async () => {
            setIsLoading(true);
            try {
                const data = await fetchRestaurants();
                setRestaurants(data);
            } catch (error) {
                console.error(error);
                setAlert({ message: (error as Error).message, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        loadRestaurants();
    }, []);

    const handleSelectRestaurant = async (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        setView('menu');
        setIsMenuLoading(true);
        try {
            const menu = await fetchMenu(restaurant.name);
            setMenuItems(menu);
        } catch (error) {
            console.error(error);
            setAlert({ message: (error as Error).message, type: 'error' });
            // Go back to list if menu fails to load
            setView('list'); 
        } finally {
            setIsMenuLoading(false);
        }
    };

    const handleAddToCart = (item: MenuItem) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
        setAlert({ message: `「${item.name}」已加入購物車`, type: 'success' });
    };

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
        } else {
            setCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
        }
    };

    const handleRemoveItem = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };
    
    const handleCheckoutSubmit = async (details: CustomerDetails) => {
        if (!selectedRestaurant) return;
        setIsSubmitting(true);
        try {
            const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const total = subtotal + SHIPPING_FEE;

            const confirmation = await submitOrder(cart, details, selectedRestaurant.name, total);
            
            const finalOrder: ConfirmedOrder = {
                ...details,
                ...confirmation,
                cart,
                restaurantName: selectedRestaurant.name,
                total,
            };

            await saveOrderToSheet(finalOrder);

            setConfirmedOrder(finalOrder);
            setView('confirmation');
            setCart([]);
            setAlert({ message: '訂單成功提交！', type: 'success' });
        } catch (error) {
            console.error(error);
            setAlert({ message: (error as Error).message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewOrder = () => {
        setView('list');
        setSelectedRestaurant(null);
        setMenuItems([]);
        setCart([]);
        setConfirmedOrder(null);
    };

    const navigateTo = (newView: View) => {
        if (newView === 'list') {
            setSelectedRestaurant(null);
        }
        setView(newView);
    };

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const renderContent = () => {
        if (isLoading) {
            return <Spinner message="正在獲取餐廳列表..." />;
        }

        switch (view) {
            case 'list':
                return <RestaurantList restaurants={restaurants} onSelectRestaurant={handleSelectRestaurant} />;
            case 'menu':
                return selectedRestaurant && <MenuView 
                    restaurant={selectedRestaurant} 
                    menuItems={menuItems} 
                    onAddToCart={handleAddToCart}
                    onBack={() => navigateTo('list')}
                    isLoading={isMenuLoading}
                />;
            case 'cart':
                return <CartView 
                    cart={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onCheckout={() => navigateTo('checkout')}
                    onBack={() => navigateTo(selectedRestaurant ? 'menu' : 'list')}
                />;
            case 'checkout':
                return <CheckoutView 
                    onSubmit={handleCheckoutSubmit}
                    onBack={() => navigateTo('cart')}
                    isLoading={isSubmitting}
                />;
            case 'confirmation':
                return confirmedOrder && <ConfirmationView order={confirmedOrder} onNewOrder={handleNewOrder} />;
            default:
                return <RestaurantList restaurants={restaurants} onSelectRestaurant={handleSelectRestaurant} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
            <Header cartItemCount={cartItemCount} onCartClick={() => navigateTo('cart')} onLogoClick={() => navigateTo('list')} />
            <main className="container mx-auto px-4 flex-grow">
                {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
};

export default App;
