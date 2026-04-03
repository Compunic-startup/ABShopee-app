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
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../core/utils/fonts'
import color from '../../core/utils/color'
import BASE_URL from '../../core/services/api'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Status config — only color.* values ─────────────────────────────────────
const getStatusConfig = status => {
  const map = {
    pending: { color: color.secondary, bg: color.secondarylight, icon: 'clock-outline', label: 'Pending' },
    confirmed: { color: color.primary, bg: '#E8EDFF', icon: 'check-circle-outline', label: 'Confirmed' },
    processing: { color: color.primary, bg: '#E8EDFF', icon: 'package-variant', label: 'Processing' },
    shipped: { color: color.primary, bg: '#E8EDFF', icon: 'truck-delivery', label: 'Shipped' },
    delivered: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-all', label: 'Delivered' },
    cancelled: { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Cancelled' },
    refunded: { color: color.text, bg: color.background, icon: 'cash-refund', label: 'Refunded' },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'help-circle-outline', label: status,
  }
}

const FILTERS = [
  { key: 'all', label: 'All', icon: 'format-list-bulleted' },
  { key: 'pending', label: 'Pending', icon: 'clock-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'truck-delivery' },
  { key: 'delivered', label: 'Delivered', icon: 'check-all' },
  { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
]

// ─── Flipkart-style order card ────────────────────────────────────────────────
function OrderCard({ item, navigation, fadeAnim }) {
  const statusConfig = getStatusConfig(item.status)
  const firstItem = item.items?.[0]
  const itemCount = item.items?.length || 0
  const payment = item.payment?.[0]
  const firstShipment = Array.isArray(item.shipment) && item.shipment.length > 0
    ? item.shipment[0] : null

  const orderDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const isDelivered = item.status?.toLowerCase() === 'delivered'
  const isCancelled = item.status?.toLowerCase() === 'cancelled'
  const isShipped = item.status?.toLowerCase() === 'shipped'

  return (
    <Animated.View style={[styles.card, {
      opacity: fadeAnim,
      transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>

      {/* ── Card Header: Order ID + Status pill ── */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.orderId?.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{orderDate}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <Icon name={statusConfig.icon} size={ms(11)} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      {/* ── Item Row (Flipkart style: icon box + details) ── */}
      <View style={styles.itemRow}>
        {/* Icon box mimics product thumbnail */}
        <View style={styles.itemThumb}>
          <Icon
            name={firstItem?.itemSnapshot?.itemType === 'digital' ? 'download-box' : 'cube-outline'}
            size={ms(26)}
            color={color.primary}
          />
        </View>

        <View style={styles.itemMeta}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {firstItem?.itemSnapshot?.title || 'Product'}
          </Text>

          {/* Attributes */}
          {!!firstItem?.selectedAttributes?.attributes?.length && (
            <View style={styles.attrRow}>
              {firstItem.selectedAttributes.attributes.map((a, i) => (
                <View key={i} style={styles.attrChip}>
                  <Text style={styles.attrText}>{a.label}: {a.displayValue}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.itemFootRow}>
            <Text style={styles.itemQty}>Qty: {firstItem?.quantity}</Text>
            {itemCount > 1 && (
              <Text style={styles.moreItems}>+{itemCount - 1} more item{itemCount > 2 ? 's' : ''}</Text>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>₹{item.pricing?.amount}</Text>
        </View>
      </View>

      {/* ── Shipment strip ── */}
      {firstShipment && (
        <View style={styles.shipStrip}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent:'space-around', gap:10}}>
            <Icon name="truck-fast-outline" size={ms(13)} color={color.primary} />

            <Text style={styles.shipCarrier}>
              {firstShipment.carrier || 'Courier'}
            </Text>

            <View style={styles.shipDot} />

            <Text style={styles.shipStatus}>
              {firstShipment.status?.charAt(0).toUpperCase() + firstShipment.status?.slice(1)}
            </Text>
          </View>

          {firstShipment.trackingId && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={styles.trackId}>
                Bility: {firstShipment.trackingId}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Payment row ── */}
      <View style={styles.payRow}>
        <Icon name={payment?.method === 'COD' ? 'cash' : 'credit-card-outline'} size={ms(13)} color={color.text} />
        <Text style={styles.payText}>{payment?.method || 'Payment'}</Text>
        <View style={styles.payDot} />
        <Text style={[styles.payStatus, {
          color: payment?.status === 'success' ? '#2E7D32' : '#E65100',
        }]}>
          {payment?.status || 'Pending'}
        </Text>
      </View>

      <View style={styles.separator} />

      {/* ── Action buttons ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.btnOutline}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('OrderDetailsScreen', { orderId: item.orderId })}
        >
          <Text style={styles.btnOutlineText}>View Details</Text>
        </TouchableOpacity>

        {isDelivered && (
          <TouchableOpacity style={styles.btnFill} activeOpacity={0.7}>
            <Icon name="replay" size={ms(14)} color="#fff" />
            <Text style={styles.btnFillText}>Reorder</Text>
          </TouchableOpacity>
        )}

        {isShipped && (
          <TouchableOpacity style={styles.btnFill} activeOpacity={0.7}>
            <Icon name="map-marker-path" size={ms(14)} color="#fff" />
            <Text style={styles.btnFillText}>Track</Text>
          </TouchableOpacity>
        )}
      </View>

    </Animated.View>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
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
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start()
    }
  }, [loading, orders])

  useFocusEffect(useCallback(() => { fetchOrders() }, []))

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${businessId}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      setOrders(json?.data?.orders || [])
    } catch (e) {
      console.log('Orders fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredOrders = selectedFilter === 'all'
    ? orders
    : orders.filter(o => o.status?.toLowerCase() === selectedFilter)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={color.primary} />

      {/* ── Header (Flipkart yellow) ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* ── Filter tabs ── */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => {
            const active = selectedFilter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f.key)}
                activeOpacity={0.7}
              >
                <Icon name={f.icon} size={ms(13)} color={active ? color.primary : '#888'} />
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* ── Order count summary ── */}
      {!loading && orders.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
          </Text>
        </View>
      )}

      {/* ── List ── */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Fetching your orders…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.orderId}
          renderItem={({ item }) => (
            <OrderCard item={item} navigation={navigation} fadeAnim={fadeAnim} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBg}>
                <Icon name="package-variant" size={ms(48)} color={color.primary} />
              </View>
              <Text style={styles.emptyTitle}>No orders here</Text>
              <Text style={styles.emptyHint}>
                {selectedFilter === 'all'
                  ? 'You haven\'t placed any orders yet.`'
                  : `No ${selectedFilter} orders found.`}
              </Text>
              {selectedFilter !== 'all' && (
                <TouchableOpacity onPress={() => setSelectedFilter('all')} style={styles.clearFilter}>
                  <Text style={styles.clearFilterText}>View all orders</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders() }}
              colors={[color.primary]}
              tintColor={color.primary}
            />
          }
        />
      )}
    </View>
  )
}

// ─── Styles — only color.* values ────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '14@vs',
    paddingHorizontal: '16@s',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    letterSpacing: 0.2,
  },
  backBtn: {
    width: '36@s', height: '36@s',
    borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  searchBtn: {
    width: '36@s', height: '36@s',
    borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Filter bar ────────────────────────────────────────────────────────────
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  filterScroll: { paddingHorizontal: '12@s', paddingVertical: '10@vs', gap: '8@s' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: '5@s',
    paddingHorizontal: '14@s', paddingVertical: '6@vs',
    borderRadius: '20@ms',
    backgroundColor: color.background,
    borderWidth: 1, borderColor: '#DEDEDE',
  },
  filterChipActive: {
    backgroundColor: color.primary + '20',
    borderColor: color.primary,
  },
  filterLabel: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888' },
  filterLabelActive: { color: color.primary, fontFamily: FONTS.Bold },

  // ── Summary bar ───────────────────────────────────────────────────────────
  summaryBar: {
    paddingHorizontal: '16@s',
    paddingVertical: '8@vs',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  summaryText: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },

  // ── List ──────────────────────────────────────────────────────────────────
  list: { paddingHorizontal: '12@s', paddingTop: '12@vs', paddingBottom: '32@vs', gap: '10@vs' },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: '8@ms',
    paddingHorizontal: '14@s',
    paddingVertical: '12@vs',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10@vs',
  },
  orderId: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  orderDate: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    paddingHorizontal: '10@s', paddingVertical: '4@vs',
    borderRadius: '20@ms',
  },
  statusText: { fontSize: '11@ms', fontFamily: FONTS.Bold },

  separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '10@vs' },

  // Item row
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', marginBottom: '10@vs' },
  itemThumb: {
    width: '56@s', height: '56@s', borderRadius: '6@ms',
    backgroundColor: color.primary + '20',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EEE',
  },
  itemMeta: { flex: 1 },
  itemTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms' },
  attrRow: { flexDirection: 'row', flexWrap: 'wrap', gap: '5@s', marginTop: '5@vs' },
  attrChip: {
    backgroundColor: color.background,
    paddingHorizontal: '7@s', paddingVertical: '2@vs',
    borderRadius: '4@ms', borderWidth: 1, borderColor: '#E0E0E0',
  },
  attrText: { fontSize: '10@ms', color: '#555', fontFamily: FONTS.Medium },
  itemFootRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s', marginTop: '6@vs' },
  itemQty: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium },
  moreItems: { fontSize: '11@ms', color: color.primary, fontFamily: FONTS.Bold },

  amountCol: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  amountLabel: { fontSize: '10@ms', color: '#999', fontFamily: FONTS.Medium },
  amountValue: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text, marginTop: '2@vs' },

  // Shipment strip
  shipStrip: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: color.background,
    borderRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '7@vs',
    marginBottom: '8@vs', flexWrap: 'wrap',
  },
  shipCarrier: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.primary },
  shipDot: { width: '3@ms', height: '3@ms', borderRadius: '2@ms', backgroundColor: '#CCC' , marginHorizontal:'2@ms'},
  shipStatus: { fontSize: '11@ms', color: '#555', fontFamily: FONTS.Medium },
  trackId: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, flex: 1 },

  // Payment row
  payRow: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '2@vs',
  },
  payText: { fontSize: '12@ms', color: '#555', fontFamily: FONTS.Medium },
  payDot: { width: '3@ms', height: '3@ms', borderRadius: '2@ms', backgroundColor: '#CCC' },
  payStatus: { fontSize: '12@ms', fontFamily: FONTS.Bold },

  // Actions
  actionRow: { flexDirection: 'row', gap: '10@s', marginTop: '4@vs' },
  btnOutline: {
    flex: 1, paddingVertical: '9@vs', borderRadius: '6@ms',
    borderWidth: 1.5, borderColor: color.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
  btnFill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '6@s', paddingVertical: '9@vs', borderRadius: '6@ms',
    backgroundColor: color.primary,
  },
  btnFillText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#fff' },
  btnCancel: { borderColor: '#C62828' },
  btnCancelText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#C62828' },

  // Loading
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '60@vs' },
  loadingText: { marginTop: '14@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: '60@vs', paddingHorizontal: '32@s' },
  emptyIconBg: {
    width: '96@s', height: '96@s', borderRadius: '48@ms',
    backgroundColor: color.primary + '20',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: '20@vs',
  },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs' },
  emptyHint: { fontSize: '13@ms', color: '#999', fontFamily: FONTS.Medium, textAlign: 'center' },
  clearFilter: {
    marginTop: '20@vs', paddingHorizontal: '24@s', paddingVertical: '10@vs',
    borderRadius: '6@ms', borderWidth: 1.5, borderColor: color.primary,
  },
  clearFilterText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
})