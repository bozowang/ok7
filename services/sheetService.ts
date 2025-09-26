/**
 * @fileoverview Mock service for saving order data.
 */
import { ConfirmedOrder } from "../types";

/**
 * Mocks saving an order to a data store like Google Sheets.
 * In a real application, this would be a secure backend call.
 * @param order - The confirmed order details.
 */
export const saveOrderToSheet = async (order: ConfirmedOrder): Promise<void> => {
    try {
        // This is a mock implementation.
        // In a real-world scenario, you would send this data to a secure backend endpoint,
        // which would then interact with the Google Sheets API.
        console.log("Simulating saving order to Google Sheet:", {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            phone: order.customerPhone,
            address: order.deliveryAddress,
            total: order.total,
            restaurant: order.restaurantName,
            items: order.cart.map(item => `${item.name} (x${item.quantity})`).join(', '),
            notes: order.orderNotes,
            paymentMethod: order.paymentMethod,
            timestamp: new Date().toISOString(),
        });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // If the call were real, you might return a status or handle errors.
        return Promise.resolve();
    } catch (error) {
        console.error("Failed to 'save' order to sheet:", error);
        throw new Error("無法儲存訂單記錄。");
    }
};
