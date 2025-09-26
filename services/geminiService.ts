/**
 * @fileoverview Service for interacting with the Google Gemini API via a secure proxy.
 *
 * MOCK MODE: If the Google Apps Script proxy URL is not configured, this service
 * will return mock data to allow the application to run for demonstration purposes.
 * A warning will be logged to the console with instructions.
 */
import { Restaurant, MenuItem, CartItem, CustomerDetails } from '../types';

// ===================================================================================
// 重要：請將此處的佔位符替換為您部署的 Google Apps Script Web 應用程式 URL。
// 請參考 `google_apps_script/README.md` 中的部署說明。
// ===================================================================================
const APPS_SCRIPT_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

/**
 * 檢查代理 URL 是否已設定。如果沒有，應用程式將以模擬模式運行。
 */
const isProxyConfigured = APPS_SCRIPT_URL !== 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' && APPS_SCRIPT_URL;

// #region Mock Data
// 當代理未設定時，用於提供範例資料的函式。

const getMockRestaurants = (): Promise<Restaurant[]> => {
    console.warn("⚠️ 代理未設定！正在回傳模擬餐廳資料。請部署 Google Apps Script 代理並在 services/geminiService.ts 中更新 APPS_SCRIPT_URL。");
    return Promise.resolve([
        {
            id: 'mock-1',
            name: '模擬披薩屋 (Mock Pizza)',
            category: '義式料理',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop',
            rating: 4.5,
            reviews: 150,
            deliveryTime: '20-30 分鐘',
            minOrder: 150,
        },
        {
            id: 'mock-2',
            name: '模擬壽司吧 (Mock Sushi)',
            category: '日式料理',
            image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1974&auto=format&fit=crop',
            rating: 4.8,
            reviews: 250,
            deliveryTime: '30-40 分鐘',
            minOrder: 300,
        },
        {
            id: 'mock-3',
            name: '模擬塔可卡車 (Mock Tacos)',
            category: '墨西哥料理',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop',
            rating: 4.2,
            reviews: 95,
            deliveryTime: '15-25 分鐘',
            minOrder: 100,
        },
         {
            id: 'mock-4',
            name: '模擬漢堡店 (Mock Burgers)',
            category: '美式料理',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1998&auto=format&fit=crop',
            rating: 4.6,
            reviews: 320,
            deliveryTime: '25-35 分鐘',
            minOrder: 200,
        },
    ]);
};

const getMockMenu = (restaurantName: string): Promise<MenuItem[]> => {
    console.warn(`⚠️ 代理未設定！正在為「${restaurantName}」回傳模擬菜單資料。`);
    const items = [
        { id: 'menu-1', name: '模擬主餐', price: 250 },
        { id: 'menu-2', name: '模擬配菜', price: 180 },
        { id: 'menu-3', name: '模擬沙拉', price: 120 },
        { id: 'menu-4', name: '模擬甜點', price: 90 },
        { id: 'menu-5', name: '模擬飲料', price: 60 },
    ];
    // 為不同餐廳產生稍微不同的菜單
    return Promise.resolve(items.map(item => ({...item, id: `${restaurantName}-${item.id}`})));
};

const getMockOrder = (): Promise<{ orderNumber: string; estimatedDeliveryTime: string }> => {
    console.warn("⚠️ 代理未設定！正在回傳模擬訂單確認。");
    const orderId = `MOCK-${Math.floor(Math.random() * 9000) + 1000}`;
    return Promise.resolve({
        orderNumber: orderId,
        estimatedDeliveryTime: "25-35 分鐘",
    });
};

// #endregion

// 手動定義 Type enum 以移除客戶端對 @google/genai 的依賴。
export enum Type {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
}

// 結構定義現在被發送到代理，而不是由客戶端 SDK 使用。
const getRestaurantsSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        category: { type: Type.STRING },
        image: { type: Type.STRING, description: 'A URL to an image of the restaurant or its food.' },
        rating: { type: Type.NUMBER },
        reviews: { type: Type.INTEGER },
        deliveryTime: { type: Type.STRING, description: 'Estimated delivery time, e.g., "25-35 min"' },
        minOrder: { type: Type.INTEGER },
      },
      required: ['id', 'name', 'category', 'image', 'rating', 'reviews', 'deliveryTime', 'minOrder'],
    },
};

const getMenuSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            price: { type: Type.INTEGER },
        },
        required: ['id', 'name', 'price'],
    },
};

const submitOrderSchema = {
    type: Type.OBJECT,
    properties: {
        orderNumber: { type: Type.STRING },
        estimatedDeliveryTime: { type: Type.STRING },
    },
    required: ['orderNumber', 'estimatedDeliveryTime'],
};

/**
 * 呼叫 Google Apps Script 代理的輔助函式。
 * @param payload - 要發送到 Gemini API 的資料。
 * @returns 來自 API 的文字回應。
 */
const callProxy = async (payload: { model: string; contents: string; config: any; }): Promise<any> => {
    if (!isProxyConfigured) {
        throw new Error("請先部署 Google Apps Script 代理，並在 services/geminiService.ts 中更新 APPS_SCRIPT_URL。");
    }

    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Apps Script doPost 需要此內容類型
        },
        body: JSON.stringify(payload),
        mode: 'cors',
    });

    const responseData = await response.json();

    // Google Apps Script Web 應用程式通常會回傳 HTTP 200 狀態碼，即使伺服器內部發生錯誤。
    // 因此，我們必須檢查回應主體中是否有自訂的 'error' 物件。
    if (!response.ok || responseData.error) {
        const errorMessage = responseData.error?.message || '代理請求失敗，但未回傳具體錯誤訊息。';
        throw new Error(errorMessage);
    }

    // 代理回傳一個模仿 SDK 回應結構的 JSON 物件：{ text: '...' }
    return responseData;
};


export const fetchRestaurants = async (): Promise<Restaurant[]> => {
    if (!isProxyConfigured) {
        return getMockRestaurants();
    }
    
    try {
        const response = await callProxy({
            model: "gemini-2.5-flash",
            contents: "Generate a list of 12 diverse, fictional restaurants for a food delivery app. Provide details like name, category (e.g., 'Italian', 'Sushi', 'Mexican'), a realistic image URL from a food-related image source like Unsplash, rating (between 3.5 and 5.0), number of reviews (between 50 and 500), estimated delivery time, and minimum order amount in TWD.",
            config: {
                responseMimeType: "application/json",
                responseSchema: getRestaurantsSchema,
            },
        });

        const jsonStr = response.text.trim();
        const restaurants = JSON.parse(jsonStr);
        return restaurants;
    } catch (error) {
        console.error("Error fetching restaurants via proxy:", error);
        throw new Error(`無法獲取餐廳列表：${(error as Error).message}`);
    }
};

export const fetchMenu = async (restaurantName: string): Promise<MenuItem[]> => {
    if (!isProxyConfigured) {
        return getMockMenu(restaurantName);
    }

    try {
        const response = await callProxy({
            model: "gemini-2.5-flash",
            contents: `Generate a sample menu with about 10-15 items for a restaurant called "${restaurantName}". For each item, provide a name and a price in TWD.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: getMenuSchema,
            },
        });

        const jsonStr = response.text.trim();
        const menu = JSON.parse(jsonStr);
        return menu;
    } catch (error) {
        console.error(`Error fetching menu for ${restaurantName} via proxy:`, error);
        throw new Error(`無法獲取菜單：${(error as Error).message}`);
    }
};

export const submitOrder = async (
    cart: CartItem[],
    details: CustomerDetails,
    restaurantName: string,
    total: number
): Promise<{ orderNumber: string; estimatedDeliveryTime: string }> => {
    if (!isProxyConfigured) {
        return getMockOrder();
    }
    
    try {
        const orderSummary = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
        const prompt = `A customer has placed a food delivery order.
        - Restaurant: ${restaurantName}
        - Items: ${orderSummary}
        - Total: TWD ${total}
        - Customer: ${details.customerName}
        - Address: ${details.deliveryAddress}
        Generate a fictional order number (e.g., "GEM-xxxx-xxxx") and an estimated delivery time (e.g., "30-45 分鐘").`;
        
        const response = await callProxy({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: submitOrderSchema,
            },
        });
        
        const jsonStr = response.text.trim();
        const orderConfirmation = JSON.parse(jsonStr);
        return orderConfirmation;
    } catch (error) {
        console.error("Error submitting order via proxy:", error);
        throw new Error(`訂單提交失敗：${(error as Error).message}`);
    }
};