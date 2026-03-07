import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  RefreshControl,
  Linking,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../core/utils/fonts'
import color from '../../core/utils/color'
import BASE_URL from '../../core/services/api'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'


export default function OrdersScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [fadeAnim] = useState(new Animated.Value(0))
  const navigation = useNavigation()

  useEffect(() => {
    if (!loading && orders.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }
  }, [loading, orders])

  useFocusEffect(
    useCallback(() => {
      fetchOrders()
    }, [])
  )

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${businessId}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      console.log('Fetched orders:', json)
      setOrders(json?.data?.orders || [])
    } catch (e) {
      console.log('Orders fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  const getStatusConfig = status => {
    const configs = {
      pending:    { color: '#FF9800', bgColor: '#FFF3E0', icon: 'clock-outline',         label: 'Pending'    },
      confirmed:  { color: '#2196F3', bgColor: '#E3F2FD', icon: 'check-circle-outline',  label: 'Confirmed'  },
      processing: { color: '#9C27B0', bgColor: '#F3E5F5', icon: 'package-variant',        label: 'Processing' },
      shipped:    { color: '#00BCD4', bgColor: '#E0F7FA', icon: 'truck-delivery',         label: 'Shipped'    },
      delivered:  { color: '#4CAF50', bgColor: '#E8F5E9', icon: 'check-all',              label: 'Delivered'  },
      cancelled:  { color: '#F44336', bgColor: '#FFEBEE', icon: 'close-circle-outline',   label: 'Cancelled'  },
      refunded:   { color: '#607D8B', bgColor: '#ECEFF1', icon: 'cash-refund',            label: 'Refunded'   },
    }
    return configs[status?.toLowerCase()] || {
      color: '#757575', bgColor: '#F5F5F5', icon: 'help-circle-outline', label: status,
    }
  }

  const getPaymentIcon = provider => {
    const icons = { razorpay: 'credit-card', cod: 'cash', upi: 'cellphone', wallet: 'wallet' }
    return icons[provider?.toLowerCase()] || 'cash'
  }

  const filterOrders = () => {
    if (selectedFilter === 'all') return orders
    return orders.filter(order => order.status.toLowerCase() === selectedFilter)
  }

  const filters = [
    { key: 'all',       label: 'All Orders', icon: 'view-list'          },
    { key: 'pending',   label: 'Pending',    icon: 'clock-outline'      },
    { key: 'delivered', label: 'Delivered',  icon: 'check-all'          },
    { key: 'cancelled', label: 'Cancelled',  icon: 'close-circle-outline'},
  ]

  const renderOrder = ({ item }) => {
    const orderDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
    const orderTime = new Date(item.createdAt).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    })

    const payment     = item.payment?.[0]
    const firstItem   = item.items?.[0]
    const itemCount   = item.items?.length || 0
    const statusConfig = getStatusConfig(item.status)

    // ── Shipment (safe) ────────────────────────────────────────────────────
    const firstShipment = Array.isArray(item.shipment) && item.shipment.length > 0
      ? item.shipment[0]
      : null

    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
            }],
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9}>

          {/* Item Details */}
          <View style={styles.itemSection}>
            <View style={styles.itemBox}>
              <View style={styles.itemIconContainer}>
                <Icon
                  name={firstItem?.itemSnapshot?.itemType === 'digital' ? 'download' : 'cube-outline'}
                  size={24}
                  color="#0B77A7"
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {firstItem?.itemSnapshot?.title}
                </Text>
                {!!firstItem?.selectedAttributes?.attributes?.length && (
                  <View style={styles.attributesContainer}>
                    {firstItem.selectedAttributes.attributes.map((attr, idx) => (
                      <View key={idx} style={styles.attributeChip}>
                        <Text style={styles.attributeText}>
                          {attr.label}: {attr.displayValue}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.qtyPriceRow}>
                  <View style={styles.qtyBadge}>
                    <Icon name="numeric" size={12} color="#666" />
                    <Text style={styles.qtyText}>Qty: {firstItem?.quantity}</Text>
                  </View>
                  {itemCount > 1 && (
                    <Text style={styles.moreItems}>+{itemCount - 1} more</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Icon name="calendar-outline" size={14} color="#666" />
              <Text style={styles.dateText}>{orderDate}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Icon name="clock-outline" size={14} color="#666" />
              <Text style={styles.dateText}>{orderTime}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Icon name="package-variant" size={14} color="#666" />
              <Text style={styles.dateText}>{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Shipment Strip (only if shipment exists) ── */}
          {firstShipment && (
            <>
              <View style={styles.shipmentStrip}>
                <View style={styles.shipmentLeft}>
                  <Icon name="truck-fast-outline" size={15} color="#0277BD" />
                  <Text style={styles.shipmentCarrier}>{firstShipment.carrier || 'Courier'}</Text>
                  <View style={styles.shipmentStatusDot} />
                  <Text style={styles.shipmentStatusText}>
                    {firstShipment.status?.charAt(0).toUpperCase() + firstShipment.status?.slice(1)}
                  </Text>
                </View>
                {firstShipment.trackingId && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.trackingIdBtn}
                  >
                    <Text style={styles.trackingIdText2}>TRACKING LINK : </Text>
                    <Text style={styles.trackingIdText}>{firstShipment.trackingId}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.trackingHint}>Tap the tracking link to track your order</Text>
              <View style={styles.divider} />
            </>
          )}

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>₹{item.pricing?.amount}</Text>
            </View>
            <View style={styles.paymentContainer}>
              <Icon name={getPaymentIcon(payment?.provider)} size={18} color="#666" />
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentMethod}>{payment?.method || 'N/A'}</Text>
                <Text style={[styles.paymentStatus, {
                  color: payment?.status === 'success' ? '#4CAF50' : '#FF9800',
                }]}>
                  {payment?.status || 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('OrderDetailsScreen', { orderId: item.orderId })}
            >
              <Icon name="eye-outline" size={18} color="#0B77A7" />
              <Text style={styles.actionBtnText}>View Details</Text>
            </TouchableOpacity>

            {statusConfig.label === 'Delivered' && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} activeOpacity={0.7}>
                <Icon name="replay" size={18} color="#fff" />
                <Text style={styles.actionBtnTextPrimary}>Reorder</Text>
              </TouchableOpacity>
            )}

            {statusConfig.label === 'Shipped' && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} activeOpacity={0.7}>
                <Icon name="map-marker-path" size={18} color="#fff" />
                <Text style={styles.actionBtnTextPrimary}>Track Order</Text>
              </TouchableOpacity>
            )}
          </View>

        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="package-variant-closed" size={100} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptySubtitle}>Start shopping to see your orders here</Text>
      <TouchableOpacity style={styles.shopNowBtn} activeOpacity={0.8}>
        <Text style={styles.shopNowText}>Start Shopping</Text>
        <Icon name="arrow-right" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  )

  const filteredOrders = filterOrders()

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="package-variant" size={28} color="#fff" />
          <Text style={styles.heading}>My Orders</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Icon name="magnify" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, selectedFilter === filter.key && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Icon name={filter.icon} size={16} color={selectedFilter === filter.key ? '#fff' : '#666'} />
              <Text style={[styles.filterText, selectedFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0B77A7" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.orderId}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0B77A7']}
              tintColor="#0B77A7"
            />
          }
        />
      )}
    </View>
  )
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: '16@s', paddingVertical: '14@vs', backgroundColor: '#0B77A7',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: '12@s' },
  heading: { fontSize: '22@ms', fontFamily: FONTS.Bold, color: '#fff' },
  searchBtn: { width: '40@s', height: '40@s', borderRadius: '20@s', justifyContent: 'center', alignItems: 'center' },

  // Filters
  filterContainer: {
    backgroundColor: '#fff', paddingVertical: '12@vs', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  filterScroll: { paddingHorizontal: '16@s', gap: '10@s' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: '16@s', paddingVertical: '8@vs',
    borderRadius: '20@ms', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', gap: '6@s',
  },
  filterChipActive: { backgroundColor: '#0B77A7', borderColor: '#0B77A7' },
  filterText: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#666' },
  filterTextActive: { color: '#fff', fontFamily: FONTS.Bold },

  // List
  list: { padding: '16@s', paddingBottom: '24@vs' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: '16@ms', padding: '16@s', marginBottom: '14@vs',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },

  // Item Section
  itemSection: { marginBottom: '14@vs' },
  itemBox: { flexDirection: 'row', gap: '12@s', backgroundColor: '#F8F9FA', padding: '12@s', borderRadius: '12@ms' },
  itemIconContainer: {
    width: '44@s', height: '44@s', borderRadius: '10@ms',
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center',
  },
  itemDetails: { flex: 1 },
  itemTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '6@vs' },
  attributesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: '6@s', marginBottom: '8@vs' },
  attributeChip: { backgroundColor: '#E8F5E9', paddingHorizontal: '8@s', paddingVertical: '3@vs', borderRadius: '10@ms' },
  attributeText: { fontSize: '10@ms', color: '#388E3C', fontFamily: FONTS.Medium },
  qtyPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyBadge: { flexDirection: 'row', alignItems: 'center', gap: '4@s' },
  qtyText: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium },
  moreItems: { fontSize: '11@ms', color: '#0B77A7', fontFamily: FONTS.Bold },

  // Date & Time
  dateTimeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '16@s', marginBottom: '14@vs' },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: '6@s' },
  dateText: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium },

  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: '14@vs' },

  // ── Shipment Strip ──────────────────────────────────────────────────────────
  shipmentStrip: {
    flexDirection: 'column',
    alignItems: 'left',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    borderRadius: '10@ms',
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    marginBottom: '5@vs',
  },
  shipmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'flex-start',
    gap: '8@s',
    flex: 1,
  },
  shipmentCarrier: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    color: '#0277BD',
  },
  shipmentStatusDot: {
    width: '4@ms',
    height: '4@ms',
    borderRadius: '2@ms',
    backgroundColor: '#90CAF9',
  },
  shipmentStatusText: {
    fontSize: '11@ms',
    color: '#0277BD',
    fontFamily: FONTS.Medium,
  },
  trackingIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    borderRadius: '8@ms',
    paddingVertical: '4@vs',
  },
  trackingIdText2: {
    fontSize: '11@ms',
    fontFamily: FONTS.Bold,
    color: '#005789',
  },
  trackingIdText: {
    fontSize: '11@ms',
    fontFamily: FONTS.SemiBold,
    color: '#0277BD',
    textDecorationLine: 'underline',
  },
  trackingHint: {
    fontSize: '10@ms',
    color: '#90A4AE',
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    marginBottom: '-4@vs',
  },
  // ───────────────────────────────────────────────────────────────────────────

  // Bottom Section
  bottomSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14@vs' },
  amountContainer: { flex: 1 },
  amountLabel: { fontSize: '12@ms', color: '#666', marginBottom: '4@vs' },
  amount: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },
  paymentContainer: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    backgroundColor: '#F8F9FA', padding: '10@s', borderRadius: '10@ms',
  },
  paymentDetails: { alignItems: 'flex-end' },
  paymentMethod: { fontSize: '12@ms', color: '#1a1a1a', fontFamily: FONTS.Bold },
  paymentStatus: { fontSize: '10@ms', fontFamily: FONTS.Medium, marginTop: '2@vs' },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: '10@s' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: '10@vs', borderRadius: '10@ms', borderWidth: 1.5,
    borderColor: '#0B77A7', backgroundColor: '#fff', gap: '6@s',
  },
  actionBtnPrimary: { backgroundColor: '#0B77A7', borderColor: '#0B77A7' },
  actionBtnText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },
  actionBtnTextPrimary: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: '40@s', paddingTop: '60@vs' },
  emptyTitle: { fontSize: '22@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginTop: '24@vs', marginBottom: '8@vs' },
  emptySubtitle: { fontSize: '14@ms', color: '#666', textAlign: 'center', marginBottom: '32@vs' },
  shopNowBtn: {
    flexDirection: 'row', backgroundColor: '#0B77A7', paddingHorizontal: '32@s',
    paddingVertical: '14@vs', borderRadius: '30@ms', alignItems: 'center', gap: '8@s',
    elevation: 4, shadowColor: '#0B77A7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  shopNowText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '16@ms' },

  // Loading
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '60@vs' },
  loadingText: { marginTop: '16@vs', fontSize: '14@ms', color: '#666', fontFamily: FONTS.Medium },
})