const axios = require('axios');

const BORZO_TEST_BASE = 'https://robotapitest-in.borzodelivery.com/api/business/1.6';
const BORZO_PROD_BASE = 'https://robot-in.borzodelivery.com/api/business/1.6';

function getBorzoConfig() {
  const token = process.env.BORZO_AUTH_TOKEN;
  const useProduction = String(process.env.BORZO_USE_PRODUCTION || '').toLowerCase() === 'true';
  const baseUrl = useProduction ? BORZO_PROD_BASE : BORZO_TEST_BASE;
  return { token, baseUrl };
}

function getBorzoClient() {
  const { token, baseUrl } = getBorzoConfig();
  if (!token) return null;

  return axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'X-DV-Auth-Token': token,
    },
  });
}

function isBengaluruAddress(address) {
  if (!address) return false;
  const value = String(address).toLowerCase();
  return value.includes('bengaluru') || value.includes('bangalore');
}

function keepPhoneAsEntered(value) {
  if (value == null) {
    throw new Error('Phone is required');
  }
  const phone = String(value).trim();
  if (!phone) {
    throw new Error('Phone is required');
  }
  return phone;
}

function mapBorzoOrderStatusToAppStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'completed') return 'delivered';
  if (value === 'canceled') return 'cancelled';
  if (value === 'active') return 'out_for_delivery';
  if (value === 'available' || value === 'new' || value === 'reactivated') return 'confirmed';
  if (value === 'delayed') return 'preparing';
  return 'pending';
}

function buildBorzoCreateOrderPayload(order, pickupPoint) {
  return {
    type: 'standard',
    matter: `Food delivery #${order._id}`,
    vehicle_type_id: 8,
    is_contact_person_notification_enabled: true,
    points: [
      {
        address: pickupPoint.address,
        contact_person: {
          name: pickupPoint.name || 'Restaurant',
          phone: keepPhoneAsEntered(pickupPoint.phone),
        },
        note: pickupPoint.note || 'Pickup from restaurant',
      },
      {
        address: order.customerAddress,
        contact_person: {
          name: order.customerName || null,
          phone: keepPhoneAsEntered(order.customerPhone),
        },
        client_order_id: String(order._id),
        note: `Food order worth INR ${order.totalAmount}`,
      },
    ],
  };
}

async function createBorzoOrderForAppOrder(order) {
  const client = getBorzoClient();
  if (!client) {
    throw new Error('Borzo auth token is not configured');
  }

  if (!isBengaluruAddress(order.customerAddress)) {
    throw new Error('Borzo delivery is available only for Bengaluru addresses');
  }

  const pickupAddress = process.env.BORZO_PICKUP_ADDRESS;
  const pickupPhone = process.env.BORZO_PICKUP_PHONE;
  if (!pickupAddress || !pickupPhone) {
    throw new Error('Borzo pickup details are missing on backend');
  }
  if (!isBengaluruAddress(pickupAddress)) {
    throw new Error('Borzo pickup address must be in Bengaluru');
  }

  const payload = buildBorzoCreateOrderPayload(order, {
    address: pickupAddress,
    phone: pickupPhone,
    name: process.env.BORZO_PICKUP_NAME || 'FoodApp Kitchen',
    note: process.env.BORZO_PICKUP_NOTE || null,
  });

  const { data } = await client.post('/create-order', payload);
  if (!data?.is_successful || !data?.order?.order_id) {
    const message = (data?.errors || []).join(', ') || 'Borzo order creation failed';
    throw new Error(message);
  }
  return data.order;
}

async function fetchBorzoOrder(orderId) {
  const client = getBorzoClient();
  if (!client) return null;

  const { data } = await client.get('/orders', {
    params: { order_id: Number(orderId), count: 1, offset: 0 },
  });
  if (!data?.is_successful || !Array.isArray(data.orders) || data.orders.length === 0) {
    return null;
  }
  return data.orders[0];
}

module.exports = {
  createBorzoOrderForAppOrder,
  fetchBorzoOrder,
  isBengaluruAddress,
  mapBorzoOrderStatusToAppStatus,
  keepPhoneAsEntered,
};
