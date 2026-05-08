import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE =
  process.env.REACT_APP_API_URL ||
  `http://${runtimeHost}:5002/api`;
const UPLOADS_API = `${API_BASE}/uploads`;

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', bg: '#EFF6FF', icon: '✅' },
  preparing: { label: 'Preparing', color: '#8B5CF6', bg: '#F5F3FF', icon: '🍳' },
  out_for_delivery: { label: 'Out of Delivery', color: '#FF6B35', bg: '#FFF0E8', icon: '🛵' },
  delivered: { label: 'Delivered', color: '#22C55E', bg: '#F0FDF4', icon: '🎉' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
};

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const EMPTY_MENU_FORM = {
  name: '',
  description: '',
  price: '',
  category: '',
  image: '',
  isAvailable: true,
};

const EMPTY_SETTINGS = {
  appName: 'FoodApp',
  logoUrl: '',
  accentColor: '#FF6B35',
  isShopOpen: true,
  shopUnavailableMessage: 'Shops are unavailable right now.',
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN');
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.3,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      padding: '22px 24px',
      flex: 1,
      minWidth: 160,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#1A1A2E', fontFamily: 'Syne, sans-serif' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SectionCard({ title, subtitle, actions, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      padding: 24,
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 22, color: '#1A1A2E' }}>{title}</h3>
          {subtitle && <p style={{ marginTop: 6, color: '#888', fontSize: 14 }}>{subtitle}</p>}
        </div>
        {actions ? <div style={{ marginLeft: 'auto', maxWidth: '100%', overflowX: 'auto' }}>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

function OrderCard({ order, onStatusChange, accentColor, isCompact }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    await onStatusChange(order._id, nextStatus);
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setUpdating(true);
    await onStatusChange(order._id, 'cancelled');
    setUpdating(false);
  };

  const handleStatusSelectUpdate = async () => {
    if (!selectedStatus || selectedStatus === order.status) return;
    setUpdating(true);
    await onStatusChange(order._id, selectedStatus);
    setUpdating(false);
  };

  useEffect(() => {
    setSelectedStatus(order.status);
  }, [order.status]);

  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      marginBottom: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      border: `1px solid ${order.status === 'pending' ? `${accentColor}30` : '#F0F0F0'}`,
      overflow: 'hidden',
    }}>
      <div
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isCompact ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: cfg.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>{cfg.icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>
              {order.customerName}
              <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                #{order._id.slice(-6).toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
              📞 {order.customerPhone} · {timeAgo(order.createdAt)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: isCompact ? 60 : 0, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: accentColor, fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap' }}>
              ₹{order.totalAmount}
            </div>
            <div style={{ fontSize: 11, color: order.paymentStatus === 'paid' ? '#22C55E' : '#F59E0B', fontWeight: 600, marginTop: 2 }}>
              {order.paymentStatus === 'paid' ? '💳 Paid' : '⏳ Unpaid'}
            </div>
          </div>
          <StatusBadge status={order.status} />
          <span style={{ fontSize: 18, color: '#ccc', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #F5F5F5', padding: '16px 20px', background: '#FAFAFA' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Delivery Address
            </div>
            <div style={{ fontSize: 14, color: '#444', background: '#fff', padding: '10px 14px', borderRadius: 10, border: '1px solid #EEE' }}>
              📍 {order.customerAddress}
            </div>
          </div>

          {order.deliveryProvider === 'borzo' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Borzo Tracking
              </div>
              <div style={{ fontSize: 14, color: '#444', background: '#fff', padding: '10px 14px', borderRadius: 10, border: '1px solid #EEE' }}>
                <div style={{ fontWeight: 700, color: '#1A1A2E' }}>Borzo ID: {order.borzoOrderId || 'Pending'}</div>
                <div style={{ marginTop: 4, color: '#666' }}>
                  Status: {order.borzoStatus || 'Not assigned'}
                </div>
                {order.borzoTrackingUrl ? (
                  <a
                    href={order.borzoTrackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 6, color: accentColor, fontWeight: 700 }}
                  >
                    Open live tracking map
                  </a>
                ) : (
                  <div style={{ marginTop: 6, color: '#999' }}>Tracking URL will appear soon.</div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Items Ordered ({order.items.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {order.items.map((item, index) => (
                <div
                  key={`${order._id}-${index}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fff',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #EEE',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>₹{item.price} × {item.quantity}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#1A1A2E' }}>₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: '#FFF0E8',
            borderRadius: 10,
            marginBottom: 16,
          }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Total Amount</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: accentColor }}>₹{order.totalAmount}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                borderRadius: 10,
                border: '1px solid #DDD',
                padding: '10px 12px',
                minWidth: isCompact ? '100%' : 220,
                background: '#fff',
              }}
            >
              {ORDER_STATUSES.map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {STATUS_CONFIG[statusKey]?.label || statusKey}
                </option>
              ))}
            </select>
            <button
              onClick={handleStatusSelectUpdate}
              disabled={updating || selectedStatus === order.status}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${accentColor}`,
                background: selectedStatus === order.status ? '#F8F8F8' : `${accentColor}14`,
                color: selectedStatus === order.status ? '#999' : accentColor,
                fontWeight: 700,
                cursor: selectedStatus === order.status ? 'not-allowed' : 'pointer',
                width: isCompact ? '100%' : 'auto',
              }}
            >
              Set Status
            </button>
          </div>

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {nextStatus && (
                <button
                  onClick={handleAdvance}
                  disabled={updating}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: accentColor,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    opacity: updating ? 0.7 : 1,
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {updating ? '...' : `Mark as ${STATUS_CONFIG[nextStatus]?.label} ${STATUS_CONFIG[nextStatus]?.icon}`}
                </button>
              )}
              <button
                onClick={handleCancel}
                disabled={updating}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1.5px solid #EF4444',
                  background: '#FEF2F2',
                  color: '#EF4444',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  opacity: updating ? 0.7 : 1,
                  width: isCompact ? '100%' : 'auto',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItemCard({ item, accentColor, onEdit, onToggleAvailability, onDelete }) {
  return (
    <div style={{
      border: '1px solid #EFEFEF',
      borderRadius: 18,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {item.image ? (
        <img src={item.image} alt={item.name} style={{ width: '100%', height: 180, objectFit: 'cover', background: '#F5F5F5' }} />
      ) : (
        <div style={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F4F0', color: '#999', fontWeight: 700 }}>
          No image
        </div>
      )}
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h4 style={{ fontSize: 18, color: '#1A1A2E' }}>{item.name}</h4>
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{item.category}</p>
          </div>
          <span style={{ color: accentColor, fontSize: 22, fontWeight: 800 }}>₹{item.price}</span>
        </div>
        <p style={{ marginTop: 10, color: '#666', fontSize: 14, minHeight: 42 }}>
          {item.description || 'No description added yet.'}
        </p>
        <div style={{ marginTop: 14 }}>
          <span style={{
            display: 'inline-flex',
            padding: '5px 10px',
            borderRadius: 999,
            background: item.isAvailable ? '#F0FDF4' : '#FEF2F2',
            color: item.isAvailable ? '#22C55E' : '#EF4444',
            fontWeight: 700,
            fontSize: 12,
          }}>
            {item.isAvailable ? 'Available in customer app' : 'Hidden from customer app'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={() => onEdit(item)} style={secondaryButtonStyle}>Edit</button>
          <button
            onClick={() => onToggleAvailability(item)}
            style={{ ...secondaryButtonStyle, borderColor: item.isAvailable ? '#F59E0B' : '#22C55E', color: item.isAvailable ? '#F59E0B' : '#22C55E' }}
          >
            {item.isAvailable ? 'Hide' : 'Show'}
          </button>
          <button onClick={() => onDelete(item)} style={{ ...secondaryButtonStyle, borderColor: '#EF4444', color: '#EF4444' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const secondaryButtonStyle = {
  background: '#fff',
  border: '1px solid #D8D8D8',
  padding: '10px 14px',
  borderRadius: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

const textInputStyle = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #E8E8E8',
  padding: '12px 14px',
  fontSize: 14,
  outline: 'none',
  background: '#fff',
};

const uploadPanelStyle = {
  marginTop: 16,
  padding: 16,
  borderRadius: 14,
  border: '1px dashed #D9D9D9',
  background: '#FCFCFC',
};

export default function App() {
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeView, setActiveView] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [notification, setNotification] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [savingMenu, setSavingMenu] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingMenuImage, setUploadingMenuImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_FORM);
  const [settingsForm, setSettingsForm] = useState(EMPTY_SETTINGS);
  const prevCountRef = React.useRef(0);

  const accentColor = settingsForm.accentColor || '#FF6B35';
  const isDesktop = viewportWidth >= 1024;
  const isCompact = viewportWidth < 768;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) setIsNavOpen(false);
  }, [isDesktop]);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingOrders(true);
      const { data } = await axios.get(`${API_BASE}/orders`);
      if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
        const newCount = data.length - prevCountRef.current;
        setNotification(`🔔 ${newCount} new order${newCount > 1 ? 's' : ''} received!`);
        setTimeout(() => setNotification(null), 4000);
      }
      prevCountRef.current = data.length;
      setOrders(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      setLoadingMenu(true);
      const { data } = await axios.get(`${API_BASE}/menu?all=true`);
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/settings`);
      setSettingsForm({ ...EMPTY_SETTINGS, ...data });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    fetchSettings();
  }, [fetchOrders, fetchMenu, fetchSettings]);

  useEffect(() => {
    if (!isLive) return undefined;
    const interval = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(interval);
  }, [isLive, fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API_BASE}/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(true);
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  // const uploadImage = async (file) => {
  //   const formData = new FormData();
  //   formData.append('image', file);
  //   const { data } = await axios.post(UPLOADS_API, formData, {
  //     headers: { 'Content-Type': 'multipart/form-data' },
  //   });
  //   return data.url;
  // };
  const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await axios.post(
    UPLOADS_API,
    formData
  );

  return data.url;
};

  const handleMenuImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMenuImage(true);
      const imageUrl = await uploadImage(file);
      setMenuForm((current) => ({ ...current, image: imageUrl }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload menu image');
    } finally {
      setUploadingMenuImage(false);
      event.target.value = '';
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const logoUrl = await uploadImage(file);
      setSettingsForm((current) => ({ ...current, logoUrl }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  const resetMenuForm = () => {
    setMenuForm(EMPTY_MENU_FORM);
    setEditingMenuId(null);
  };

  const handleMenuSubmit = async (event) => {
    event.preventDefault();

    if (!menuForm.name || !menuForm.category || !menuForm.price) {
      alert('Name, category, and price are required.');
      return;
    }

    try {
      setSavingMenu(true);
      const payload = {
        ...menuForm,
        price: Number(menuForm.price),
      };

      if (editingMenuId) {
        await axios.patch(`${API_BASE}/menu/${editingMenuId}`, payload);
      } else {
        await axios.post(`${API_BASE}/menu`, payload);
      }

      await fetchMenu();
      resetMenuForm();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save menu item');
    } finally {
      setSavingMenu(false);
    }
  };

  const handleEditMenuItem = (item) => {
    setActiveView('menu');
    setEditingMenuId(item._id);
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price ?? '',
      category: item.category || '',
      image: item.image || '',
      isAvailable: Boolean(item.isAvailable),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleAvailability = async (item) => {
    try {
      await axios.patch(`${API_BASE}/menu/${item._id}`, { isAvailable: !item.isAvailable });
      fetchMenu();
    } catch (err) {
      alert('Failed to update item visibility');
    }
  };

  const handleDeleteMenuItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/menu/${item._id}`);
      if (editingMenuId === item._id) resetMenuForm();
      fetchMenu();
    } catch (err) {
      alert('Failed to delete menu item');
    }
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    try {
      setSavingSettings(true);
      const { data } = await axios.patch(`${API_BASE}/settings`, settingsForm);
      setSettingsForm({ ...EMPTY_SETTINGS, ...data });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save branding settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleShopAvailability = async () => {
    try {
      setSavingSettings(true);
      const { data } = await axios.patch(`${API_BASE}/settings`, {
        isShopOpen: !settingsForm.isShopOpen,
      });
      setSettingsForm({ ...EMPTY_SETTINGS, ...data });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update shop availability');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    active: orders.filter((order) => ['confirmed', 'preparing', 'out_for_delivery'].includes(order.status)).length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    revenue: orders.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.totalAmount, 0),
  };

  const menuStats = useMemo(() => ({
    total: menuItems.length,
    live: menuItems.filter((item) => item.isAvailable).length,
    hidden: menuItems.filter((item) => !item.isAvailable).length,
    categories: new Set(menuItems.map((item) => item.category).filter(Boolean)).size,
  }), [menuItems]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {!isDesktop && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 68,
          background: '#1A1A2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 120,
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        }}>
          <button
            type="button"
            onClick={() => setIsNavOpen((open) => !open)}
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fff',
              borderRadius: 10,
              padding: '8px 10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ☰ Menu
          </button>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: 'Syne, sans-serif' }}>
            {settingsForm.appName || 'FoodApp'}
          </div>
        </div>
      )}

      {notification && (
        <div style={{
          position: 'fixed',
          top: isDesktop ? 24 : 84,
          right: isDesktop ? 24 : 12,
          zIndex: 1000,
          background: '#1A1A2E',
          color: '#fff',
          padding: '14px 20px',
          borderRadius: 14,
          fontWeight: 600,
          fontSize: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.3s ease',
          borderLeft: `4px solid ${accentColor}`,
          maxWidth: isDesktop ? 380 : 'calc(100% - 24px)',
        }}>
          {notification}
        </div>
      )}

      <div style={{
        position: isDesktop ? 'fixed' : 'fixed',
        left: 0,
        top: isDesktop ? 0 : 68,
        bottom: 0,
        width: 260,
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        zIndex: 115,
        transform: isDesktop ? 'translateX(0)' : (isNavOpen ? 'translateX(0)' : 'translateX(-100%)'),
        transition: 'transform 0.25s ease',
      }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {settingsForm.logoUrl ? (
              <img src={settingsForm.logoUrl} alt={settingsForm.appName} style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover', background: '#fff' }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 14, background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24 }}>
                {(settingsForm.appName || 'F').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>
                {settingsForm.appName || 'FoodApp'}
              </div>
              <div style={{ fontSize: 12, color: accentColor, marginTop: 4, fontWeight: 600 }}>
                Admin Portal
              </div>
            </div>
          </div>
        </div>

        {[
          { id: 'orders', label: 'Orders', icon: '📋' },
          { id: 'menu', label: 'Menu Manager', icon: '🍽️' },
          { id: 'branding', label: 'Brand Settings', icon: '🎨' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              setIsNavOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 24px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              background: activeView === item.id ? `${accentColor}20` : 'transparent',
              borderLeft: activeView === item.id ? `3px solid ${accentColor}` : '3px solid transparent',
              color: activeView === item.id ? accentColor : '#8A8FA8',
              fontSize: 14,
              fontWeight: activeView === item.id ? 700 : 500,
              marginTop: item.id === 'orders' ? 18 : 0,
            }}
          >
            {item.icon} <span style={{ marginLeft: 10 }}>{item.label}</span>
          </button>
        ))}

        <div style={{ marginTop: 'auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 13, color: '#8A8FA8', marginBottom: 8 }}>Shop Availability</div>
            <button
              type="button"
              onClick={handleToggleShopAvailability}
              disabled={savingSettings}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 10,
                padding: '10px 12px',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                background: settingsForm.isShopOpen ? '#22C55E' : '#EF4444',
                opacity: savingSettings ? 0.7 : 1,
              }}
            >
              {settingsForm.isShopOpen ? 'Shop Available' : 'Shop Currently Unavailable'}
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#8A8FA8' }}>Live Updates</span>
              <button
                onClick={() => setIsLive(!isLive)}
                style={{
                  width: 42,
                  height: 22,
                  borderRadius: 11,
                  border: 'none',
                  background: isLive ? '#22C55E' : '#444',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3,
                  left: isLive ? 22 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                }} />
              </button>
            </div>
            {lastUpdated && (
              <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
                Updated {timeAgo(lastUpdated)}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isDesktop && isNavOpen && (
        <div
          onClick={() => setIsNavOpen(false)}
          style={{
            position: 'fixed',
            top: 68,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 110,
          }}
        />
      )}

      <div style={{
        marginLeft: isDesktop ? 260 : 0,
        padding: isDesktop ? '32px 32px 40px' : '84px 14px 28px',
      }}>
        {activeView === 'orders' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: isCompact ? 25 : 30, fontWeight: 800, color: '#1A1A2E' }}>
                  {filter === 'all' ? 'All Orders' : STATUS_CONFIG[filter]?.label || filter}
                </h1>
                <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>
                  {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <button
                onClick={() => fetchOrders()}
                style={{
                  background: accentColor,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard icon="📋" label="Total Orders" value={stats.total} color="#3B82F6" />
              <StatCard icon="⏳" label="Pending" value={stats.pending} color="#F59E0B" />
              <StatCard icon="🔥" label="Active" value={stats.active} color="#8B5CF6" />
              <StatCard icon="🎉" label="Delivered" value={stats.delivered} color="#22C55E" />
              <StatCard icon="💰" label="Revenue" value={`₹${stats.revenue}`} color={accentColor} />
            </div>

            <SectionCard
              title="Order Filters"
              subtitle="Track and update incoming customer orders."
              actions={
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'confirmed', label: 'Confirmed' },
                    { id: 'preparing', label: 'Preparing' },
                    { id: 'out_for_delivery', label: 'Out of Delivery' },
                    { id: 'delivered', label: 'Delivered' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFilter(item.id)}
                      style={{
                        border: `1px solid ${filter === item.id ? accentColor : '#DDD'}`,
                        background: filter === item.id ? `${accentColor}12` : '#fff',
                        color: filter === item.id ? accentColor : '#555',
                        borderRadius: 999,
                        padding: '8px 14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              }
            >
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                  Orders will appear here once customers place them.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <OrderCard key={order._id} order={order} onStatusChange={handleStatusChange} accentColor={accentColor} isCompact={isCompact} />
                ))
              )}
            </SectionCard>
          </>
        )}

        {activeView === 'menu' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: isCompact ? 25 : 30, fontWeight: 800, color: '#1A1A2E' }}>Menu Manager</h1>
                <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>
                  Add items from admin and they will reflect in the customer app.
                </p>
              </div>
              <button
                onClick={fetchMenu}
                style={{
                  background: accentColor,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Refresh Menu
              </button>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard icon="🍽️" label="Total Items" value={menuStats.total} color={accentColor} />
              <StatCard icon="🟢" label="Visible In App" value={menuStats.live} color="#22C55E" />
              <StatCard icon="🙈" label="Hidden Items" value={menuStats.hidden} color="#EF4444" />
              <StatCard icon="🏷️" label="Categories" value={menuStats.categories} color="#8B5CF6" />
            </div>

            <SectionCard
              title={editingMenuId ? 'Edit Food Item' : 'Add Food Item'}
              subtitle="Create or update menu items stored in MongoDB."
              actions={editingMenuId ? <button onClick={resetMenuForm} style={secondaryButtonStyle}>Cancel Edit</button> : null}
            >
              <form onSubmit={handleMenuSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="Food name" style={textInputStyle} />
                  <input value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} placeholder="Category" style={textInputStyle} />
                  <input value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} placeholder="Price" type="number" min="0" style={textInputStyle} />
                  <input value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} placeholder="Image URL" style={textInputStyle} />
                </div>
                <div style={uploadPanelStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1A1A2E' }}>Food image</div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                        Upload from your computer or keep using an image URL.
                      </div>
                    </div>
                    <label style={{ ...secondaryButtonStyle, background: '#fff', color: '#1A1A2E', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input type="file" accept="image/*" onChange={handleMenuImageUpload} style={{ display: 'none' }} />
                      {uploadingMenuImage ? 'Uploading...' : 'Upload image'}
                    </label>
                  </div>
                  {menuForm.image && (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <img src={menuForm.image} alt="Menu preview" style={{ width: 88, height: 88, borderRadius: 14, objectFit: 'cover', background: '#F3F3F3' }} />
                      <button
                        type="button"
                        onClick={() => setMenuForm({ ...menuForm, image: '' })}
                        style={{ ...secondaryButtonStyle, borderColor: '#EF4444', color: '#EF4444' }}
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder="Description"
                  rows={4}
                  style={{ ...textInputStyle, marginTop: 16, resize: 'vertical' }}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 16, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={menuForm.isAvailable}
                    onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                  />
                  Show this item in the customer app
                </label>
                <div style={{ marginTop: 20 }}>
                  <button
                    type="submit"
                    disabled={savingMenu}
                    style={{
                      background: accentColor,
                      color: '#fff',
                      border: 'none',
                      padding: '12px 18px',
                      borderRadius: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: savingMenu ? 0.7 : 1,
                    }}
                  >
                    {savingMenu ? 'Saving...' : editingMenuId ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard
              title="Current Menu"
              subtitle="Available items are visible in the customer app immediately after refresh."
            >
              {loadingMenu ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>Loading menu...</div>
              ) : menuItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>No menu items added yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                  {menuItems.map((item) => (
                    <MenuItemCard
                      key={item._id}
                      item={item}
                      accentColor={accentColor}
                      onEdit={handleEditMenuItem}
                      onToggleAvailability={handleToggleAvailability}
                      onDelete={handleDeleteMenuItem}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {activeView === 'branding' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: isCompact ? 25 : 30, fontWeight: 800, color: '#1A1A2E' }}>Brand Settings</h1>
                <p style={{ color: '#888', marginTop: 4, fontSize: 14 }}>
                  Change the customer-facing logo and brand name from the admin panel.
                </p>
              </div>
              <button
                onClick={fetchSettings}
                style={{
                  background: accentColor,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Reload Settings
              </button>
            </div>

            <SectionCard title="Branding" subtitle="These values are used by the admin portal and customer app.">
              <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'start' }}>
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>App Name</label>
                      <input value={settingsForm.appName} onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })} style={textInputStyle} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Logo URL</label>
                      <input value={settingsForm.logoUrl} onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })} placeholder="https://..." style={textInputStyle} />
                    </div>
                    <div style={uploadPanelStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1A1A2E' }}>Brand logo</div>
                          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                            Upload a square logo image for the admin and customer app.
                          </div>
                        </div>
                        <label style={{ ...secondaryButtonStyle, background: '#fff', color: '#1A1A2E', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                          {uploadingLogo ? 'Uploading...' : 'Upload logo'}
                        </label>
                      </div>
                      {settingsForm.logoUrl && (
                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                          <img src={settingsForm.logoUrl} alt="Logo preview" style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover', background: '#F3F3F3' }} />
                          <button
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, logoUrl: '' })}
                            style={{ ...secondaryButtonStyle, borderColor: '#EF4444', color: '#EF4444' }}
                          >
                            Remove logo
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Accent Color</label>
                      <input value={settingsForm.accentColor} onChange={(e) => setSettingsForm({ ...settingsForm, accentColor: e.target.value })} placeholder="#FF6B35" style={textInputStyle} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Unavailable Message</label>
                      <input
                        value={settingsForm.shopUnavailableMessage || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, shopUnavailableMessage: e.target.value })}
                        placeholder="Shops are unavailable right now."
                        style={textInputStyle}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      style={{
                        background: accentColor,
                        color: '#fff',
                        border: 'none',
                        padding: '12px 18px',
                        borderRadius: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        opacity: savingSettings ? 0.7 : 1,
                      }}
                    >
                      {savingSettings ? 'Saving...' : 'Save Branding'}
                    </button>
                  </div>

                  <div style={{
                    border: '1px solid #EFEFEF',
                    borderRadius: 20,
                    padding: 24,
                    background: '#FAFAFA',
                    minHeight: 260,
                  }}>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 18 }}>Preview</div>
                    <div style={{
                      background: '#FFF8F0',
                      borderRadius: 20,
                      padding: 22,
                      border: '1px solid #F0E6DC',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {settingsForm.logoUrl ? (
                          <img src={settingsForm.logoUrl} alt={settingsForm.appName} style={{ width: 72, height: 72, borderRadius: 20, objectFit: 'cover', background: '#fff' }} />
                        ) : (
                          <div style={{ width: 72, height: 72, borderRadius: 20, background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 32 }}>
                            {(settingsForm.appName || 'F').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', fontFamily: 'Syne, sans-serif' }}>
                            {settingsForm.appName || 'FoodApp'}
                          </div>
                          <div style={{ color: '#666', marginTop: 6 }}>Customer app header and Razorpay branding</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 24 }}>
                        <button
                          type="button"
                          style={{
                            background: accentColor,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 14,
                            padding: '12px 18px',
                            fontWeight: 700,
                          }}
                        >
                          Sample CTA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </SectionCard>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        button:hover { filter: brightness(1.03); }
        input:focus, textarea:focus { border-color: ${accentColor}; box-shadow: 0 0 0 3px ${accentColor}20; }
      `}</style>
    </div>
  );
}
