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
  Platform,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Reason key -> human-readable label
const REASON_LABELS = {
  changed_mind: 'Changed my mind',
  wrong_item: 'Ordered wrong item',
  found_better_price: 'Found better price',
  delivery_too_long: 'Delivery too long',
  duplicate_order: 'Duplicate order',
  other: 'Other reason',
}

// Adapter: raw API row -> component-friendly shape
const adaptCancellation = raw => ({
  // identity
  cancellationId: raw.cancellationId,
  orderId: raw.orderId,
  itemId: raw.itemId,

  // status
  status: raw.status,
  statusLabel: raw.statusLabel,
  backendStatus: raw.status,

  // reason
  reason: raw.reason || REASON_LABELS[raw.reasonKey] || raw.reasonKey,
  reasonKey: raw.reasonKey,
  description: raw.description,

  // item
  item: {
    id: raw.itemId,
    title: raw.item?.title || 'Product',
    image: raw.item?.image || null,
    price: raw.item?.price ?? null,
    quantity: raw.item?.quantity ?? 1,
    itemType: raw.item?.itemType || 'physical',
    attributes: raw.item?.attributes || [],
  },

  // refund
  refundAmount: raw.refundAmount ?? null,
  refundMethod: raw.refundMethod ?? null,

  // dates
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
})

// API call
const fetchCancellationsAPI = async ({ status, page = 1, limit = 20 } = {}) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Missing auth credentials')

    let query = `page=${page}&limit=${limit}`
    if (status && status !== 'all') query += `&status=${status}`

    const url = `${BASE_URL}/customer/business/${businessId}/cancellations?${query}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const json = await response.json()
    console.log('fetchCancellationsAPI response:', json)

    if (!json.success) throw new Error(json.message || 'Failed to fetch cancellations')

    // Adapt every row from raw API shape to component shape
    const rows = (json.data?.requests || []).map(adaptCancellation)
    return { ...json.data, rows }
  } catch (error) {
    console.log('fetchCancellationsAPI error:', error)
    throw error
  }
}

// Map backendStatus -> UI status
const mapStatus = backendStatus => {
  const map = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    processing: 'processing',
    completed: 'completed',
  }
  return map[backendStatus?.toLowerCase()] || backendStatus
}

// Status config
const getStatusConfig = status => {
  const map = {
    pending: { color: color.WHITE, bg: color.primary, icon: 'clock-outline', label: 'Pending' },
    approved: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle-outline', label: 'Approved' },
    rejected: { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Rejected' },
    processing: { color: color.primary, bg: '#E8EDFF', icon: 'package-variant', label: 'Processing' },
    completed: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-all', label: 'Completed' },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'help-circle-outline', label: status,
  }
}

// Cancellation Card
function CancellationCard({ item, navigation, fadeAnim }) {
  const uiStatus = mapStatus(item.backendStatus || item.status)
  const statusConfig = getStatusConfig(uiStatus)
  const isPending = uiStatus === 'pending'

  const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <Animated.View style={[styles.card, {
      opacity: fadeAnim,
      transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>
      {/* Header: type + date + status pill */}
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="cancel" size={ms(14)} color="#E65100" />
          <Text style={styles.cancellationTypeLabel}>Cancellation</Text>
          <Text style={styles.orderDate}> · {createdDate}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <Icon name={statusConfig.icon} size={ms(11)} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.separator} />

      {/* Item row */}
      <View style={styles.itemRow}>
        <View style={styles.itemThumb}>
          <Icon
            name={item.item?.itemType === 'digital' ? 'download-box' : 'cube-outline'}
            size={ms(24)}
            color="#E65100"
          />
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.item?.title || 'Product'}
          </Text>
          <Text style={styles.itemSubtitle}>
            Qty: {item.item?.quantity}
            {item.item?.itemType === 'digital' ? '  ·  Digital' : ''}
            {item.refundAmount != null
              ? `  ·  Refund Rs.${item.refundAmount.toLocaleString('en-IN')}`
              : ''}
          </Text>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.reasonStrip}>
        <Icon name="information-outline" size={ms(12)} color={color.text} />
        <Text style={styles.reasonTitle}>{item.reason}</Text>
      </View>

      {/* Refund method */}
      {item.refundMethod && (
        <View style={styles.refundStrip}>
          <Icon name="cash-refund" size={ms(12)} color="#2E7D32" />
          <Text style={styles.refundText}>{item.refundMethod}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.btnOutline}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('cancellationdetails', { cancellationId: item.cancellationId })}
        >
          <Text style={styles.btnOutlineText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

// Main Screen
export default function CancellationsScreen() {
  const [cancellations, setCancellations] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [error, setError] = useState(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const navigation = useNavigation()

  useEffect(() => {
    if (!loading && cancellations.length > 0) {
      fadeAnim.setValue(0)
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start()
    }
  }, [loading, cancellations])

  useFocusEffect(useCallback(() => { fetchCancellations() }, []))

  const fetchCancellations = async () => {
    try {
      setLoading(true)
      setError(null)

      let apiStatus
      if (selectedFilter === 'pending') {
        apiStatus = 'pending'
      } else if (selectedFilter === 'approved') {
        apiStatus = 'approved'
      } else if (selectedFilter === 'rejected') {
        apiStatus = 'rejected'
      }

      const data = await fetchCancellationsAPI({ status: apiStatus })
      setCancellations(data.rows || [])
    } catch (e) {
      console.log('Cancellations fetch error', e)
      setError('Failed to load cancellations. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCancellations()
  }, [selectedFilter])

  const handleCreateCancellation = () => {
    navigation.navigate('Tabs', { screen: 'Orders' })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cancellations</Text>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, selectedFilter === filter.key && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterLabel, selectedFilter === filter.key && styles.filterLabelActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Error banner */}
      {!!error && !loading && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle-outline" size={ms(16)} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchCancellations}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List / Loader */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading cancellations...</Text>
        </View>
      ) : (
        <FlatList
          data={cancellations}
          keyExtractor={item => item.cancellationId}
          renderItem={({ item }) => (
            <CancellationCard item={item} navigation={navigation} fadeAnim={fadeAnim} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconBg}>
                  <Icon name="cancel" size={ms(48)} color="#E65100" />
                </View>
                <Text style={styles.emptyTitle}>No Cancellations Found</Text>
                <Text style={styles.emptyHint}>
                  {selectedFilter === 'all'
                    ? "You can cancel items by creating a cancellation request from your orders"
                    : `No ${selectedFilter} cancellations found.`}
                </Text>
                {selectedFilter !== 'all' ? (
                  <TouchableOpacity onPress={() => setSelectedFilter('all')} style={styles.clearFilter}>
                    <Text style={styles.clearFilterText}>View all cancellations</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleCreateCancellation} style={styles.createBtn}>
                    <Text style={styles.createBtnText}>View All Orders</Text>
                    <Icon name="arrow-right-circle" size={ms(18)} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchCancellations() }}
              colors={[color.primary]}
              tintColor={color.primary}
            />
          }
        />
      )}
    </View>
  )
}

// Styles
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    letterSpacing: 0.2,
    flex: 1,
    textAlign: 'center',
  },
  backBtn: {
    width: '36@s', height: '36@s',
    borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },

  // Filter bar
  filterBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  filterScroll: { paddingHorizontal: '16@s', paddingVertical: '12@vs', gap: '10@s' },
  filterChip: {
    paddingHorizontal: '14@s', paddingVertical: '6@vs',
    borderRadius: '20@ms',
    backgroundColor: color.background,
    borderWidth: 1, borderColor: '#DEDEDE',
  },
  filterChipActive: { backgroundColor: color.primary + '20', borderColor: color.primary },
  filterLabel: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888' },
  filterLabelActive: { color: color.primary, fontFamily: FONTS.Bold },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: '16@s', paddingVertical: '10@vs',
    borderBottomWidth: 1, borderBottomColor: '#FFCDD2',
  },
  errorText: { flex: 1, fontSize: '12@ms', color: '#C62828', fontFamily: FONTS.Medium },
  retryText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.primary },

  // List
  list: { paddingHorizontal: '12@s', paddingTop: '12@vs', paddingBottom: '32@vs', gap: '10@vs' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: '8@ms',
    paddingHorizontal: '14@s', paddingVertical: '12@vs',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '10@vs',
  },
  cancellationTypeLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#E65100' },
  orderDate: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '3@vs' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    paddingHorizontal: '10@s', paddingVertical: '4@vs', borderRadius: '20@ms',
  },
  statusText: { fontSize: '11@ms', fontFamily: FONTS.Bold },

  separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '10@vs' },

  // Item row
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', marginBottom: '10@vs' },
  itemThumb: {
    width: '56@s', height: '56@s', borderRadius: '6@ms',
    backgroundColor: '#E6510020',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EEE',
  },
  itemMeta: { flex: 1 },
  itemTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms' },
  itemSubtitle: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },

  // Reason strip
  reasonStrip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '8@s',
    backgroundColor: color.background,
    borderRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '8@vs',
    marginBottom: '8@vs',
  },
  reasonTitle: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },

  // Refund strip
  refundStrip: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: '#E8F5E9', borderRadius: '6@ms',
    paddingHorizontal: '10@s', paddingVertical: '7@vs',
    marginBottom: '8@vs',
  },
  refundText: { fontSize: '12@ms', color: '#2E7D32', fontFamily: FONTS.Bold },

  // Actions
  actionRow: { flexDirection: 'row', gap: '10@s', marginTop: '4@vs' },
  btnOutline: {
    flex: 1, paddingVertical: '9@vs', borderRadius: '6@ms',
    borderWidth: 1.5, borderColor: color.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },

  // Loader
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '60@vs' },
  loadingText: { marginTop: '14@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingTop: '60@vs', paddingHorizontal: '32@s' },
  emptyIconBg: {
    width: '96@s', height: '96@s', borderRadius: '48@ms',
    backgroundColor: '#E6510020',
    justifyContent: 'center', alignItems: 'center', marginBottom: '20@vs',
  },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs', textAlign: 'center' },
  emptyHint: { fontSize: '13@ms', color: '#999', fontFamily: FONTS.Medium, textAlign: 'center', lineHeight: '20@vs' },
  clearFilter: {
    marginTop: '20@vs', paddingHorizontal: '24@s', paddingVertical: '10@vs',
    borderRadius: '6@ms', borderWidth: 1.5, borderColor: color.primary,
  },
  clearFilterText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
  createBtn: {
    marginTop: '24@vs', paddingHorizontal: '20@s', paddingVertical: '12@vs',
    borderRadius: '8@ms', backgroundColor: color.primary,
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    elevation: 2,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  createBtnText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },
})
