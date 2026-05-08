import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { api } from '../config/api';

function MenuImage({ uri, style, brandColor, label }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[styles.cardImage, styles.cardImageFallback]}>
        <Text style={[styles.cardImageFallbackLetter, { color: brandColor }]}>
          {(label || '?').slice(0, 1).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

const DEFAULT_SETTINGS = {
  appName: 'FoodApp',
  logoUrl: '',
  accentColor: '#FF6B35',
  isShopOpen: true,
  shopUnavailableMessage: 'Shops are unavailable right now.',
};

export default function HomeScreen({ navigation }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const { cart, count, dispatch } = useCart();

  const brandColor = settings.accentColor || DEFAULT_SETTINGS.accentColor;
  const isShopOpen = settings.isShopOpen !== false;

  const fetchHomeData = useCallback(async () => {
    try {
      const [{ data: menuData }, { data: settingsData }] = await Promise.all([
        axios.get(api.getMenu),
        axios.get(api.getSettings),
      ]);
      setMenu(menuData);
      setSettings({ ...DEFAULT_SETTINGS, ...settingsData });
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onPullRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData();
  }, [fetchHomeData]);

  useFocusEffect(useCallback(() => {
    fetchHomeData();
  }, [fetchHomeData]));

  useEffect(() => {
    const interval = setInterval(() => {
      fetchHomeData();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchHomeData]);

  const categories = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(
        menu
          .map((item) => item.category)
          .filter(Boolean)
      )
    );
    return ['All', ...dynamicCategories];
  }, [menu]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeCategory, categories]);

  const filtered = useMemo(() => {
    let result = menu;
    if (activeCategory !== 'All') {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (search) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  }, [menu, activeCategory, search]);

  const getItemQty = (id) => {
    const item = cart.find((i) => i._id === id);
    return item ? item.quantity : 0;
  };

  const renderItem = ({ item }) => {
    const qty = getItemQty(item._id);
    return (
      <View style={styles.card}>
        <MenuImage
          uri={item.image}
          style={styles.cardImage}
          brandColor={brandColor}
          label={item.name}
        />
        <View style={styles.cardBody}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemDesc} numberOfLines={2}>
            {item.description || 'Freshly prepared and ready to order.'}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={[styles.price, { color: brandColor }]}>₹{item.price}</Text>
            {qty === 0 ? (
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: brandColor }]}
                onPress={() => dispatch({ type: 'ADD_ITEM', item })}
                activeOpacity={0.85}
              >
                <Text style={styles.addBtnText}>ADD</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.qtyControl, { borderColor: `${brandColor}40` }]}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => dispatch({ type: 'REMOVE_ITEM', id: item._id })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                >
                  <Text style={[styles.qtyBtnText, { color: brandColor }]}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => dispatch({ type: 'ADD_ITEM', item })}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Text style={[styles.qtyBtnText, { color: brandColor }]}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <View style={styles.logoWrap}>
            {settings.logoUrl ? (
              <Image source={{ uri: settings.logoUrl }} style={styles.logo} />
            ) : (
              <View style={[styles.logoFallback, { backgroundColor: brandColor }]}>
                <Text style={styles.logoFallbackText}>
                  {(settings.appName || 'F').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.brandText}>
            <Text style={styles.greeting} numberOfLines={1}>
              {settings.appName || DEFAULT_SETTINGS.appName}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              What are you craving?
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.myOrdersBtn, { borderColor: brandColor }]}
            onPress={() => navigation.navigate('MyOrders')}
            activeOpacity={0.85}
          >
            <Text style={[styles.myOrdersBtnText, { color: brandColor }]}>My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartBtn}
            activeOpacity={0.85}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="bag-handle-outline" size={26} color="#1A1A2E" />
            {count > 0 && (
              <View style={[styles.badge, { backgroundColor: brandColor }]}>
                <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIconIon} />
        <TextInput
          placeholder="Search dishes, categories…"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          {...(Platform.OS === 'ios' ? { clearButtonMode: 'while-editing' } : {})}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.catChip,
              activeCategory === cat && { backgroundColor: brandColor, borderColor: brandColor },
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.listWrap}>
        {!isShopOpen ? (
          <View style={styles.unavailableState}>
            <Text style={styles.unavailableTitle}>Shop Unavailable</Text>
            <Text style={styles.unavailableSubtitle}>
              {settings.shopUnavailableMessage || DEFAULT_SETTINGS.shopUnavailableMessage}
            </Text>
          </View>
        ) : loading && menu.length === 0 ? (
          <ActivityIndicator size="large" color={brandColor} style={styles.listLoader} />
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item, index) => (item._id != null ? String(item._id) : `menu-${index}`)}
            style={styles.menuList}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No food items found</Text>
                <Text style={styles.emptySubtitle}>
                  New menu items added from admin will appear here automatically.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {count > 0 && isShopOpen && (
        <TouchableOpacity
          style={[styles.floatingCart, { backgroundColor: brandColor }]}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.floatingText}>
            {count} items | ₹{cart.reduce((s, i) => s + i.price * i.quantity, 0)}
          </Text>
          <Text style={styles.floatingText}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 56,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    minWidth: 0,
  },
  logoWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0E8E0',
  },
  brandText: { flex: 1, marginLeft: 12, minWidth: 0, justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  logo: { width: 50, height: 50, borderRadius: 15, resizeMode: 'cover' },
  logoFallback: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  myOrdersBtn: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  myOrdersBtnText: { fontWeight: '700', fontSize: 11 },
  cartBtn: { padding: 6, marginLeft: 4, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFBF7',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0E8E0',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  searchIconIon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A2E', paddingVertical: 0 },
  catScroll: { flexGrow: 0, marginBottom: 10 },
  catScrollContent: { paddingHorizontal: 18, paddingRight: 28, alignItems: 'center', paddingVertical: 2 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  catText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  catTextActive: { color: '#fff' },
  listWrap: {
    flex: 1,
    minHeight: 0,
  },
  menuList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 120,
    flexGrow: 1,
  },
  listLoader: { marginTop: 48 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 178,
    backgroundColor: '#F3EDE6',
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageFallbackLetter: { fontSize: 44, fontWeight: '800', opacity: 0.35 },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  itemName: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  itemDesc: { fontSize: 14, color: '#9CA3AF', marginTop: 6, lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  price: { fontSize: 18, fontWeight: '800' },
  addBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 88,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF7',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  qtyBtnText: { fontSize: 18, fontWeight: '700' },
  qtyText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', paddingHorizontal: 6, minWidth: 22, textAlign: 'center' },
  floatingCart: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    borderRadius: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  floatingText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyState: { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', maxWidth: 280 },
  unavailableState: {
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E8E0',
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  unavailableTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  unavailableSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 21,
  },
});
