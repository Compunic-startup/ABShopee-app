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

// ─── Reason key → human-readable label ───────────────────────────────────────
const REASON_LABELS = {
  wrong_item: 'Wrong item received',
  damaged: 'Item damaged',
  defective: 'Item defective',
  not_as_described: 'Not as described',
  missing_parts: 'Missing parts',
  changed_mind: 'Changed mind',
  size_issue: 'Size issue',
  quality_issue: 'Quality issue',
}

// ─── Adapter: raw API row → component-friendly shape ─────────────────────────
const adaptReturn = raw => ({
  // identity
  returnId: raw.returnId,
  orderId: raw.orderId,
  itemId: raw.itemId,

  // type & status
  type: raw.type,
  status: raw.status,
  workflowStatus: raw.workflowStatus,
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

  // evidence / photos
  evidence: raw.evidence || [],
  photos: raw.photos || [],

  // payment
  payment: raw.payment || null,

  // refund
  refundAmount: raw.refundAmount ?? null,
  refundMethod: raw.refundMethod ?? null,

  // courier (NEW STRUCTURE)
  trackingId: raw.courier?.trackingId || null,
  courierName: raw.courier?.name || null,
  courierDate: raw.courier?.date || null,

  // timeline (use backend directly now)
  timeline: raw.timeline || [],

  // dates (fallback if not present)
  createdAt: raw.createdAt || raw.timeline?.[0]?.date,
  updatedAt: raw.updatedAt || raw.timeline?.slice(-1)[0]?.date,
})

// ─── Build a minimal timeline when the API doesn't return one ────────────────
const buildTimeline = raw => {
  const steps = [
    { label: 'Request submitted', date: raw.createdAt },
  ]

  const status = raw.status?.toLowerCase()

  if (['approved', 'processing', 'completed'].includes(status)) {
    steps.push({ label: 'Request approved', date: raw.updatedAt })
  }
  if (['processing', 'completed'].includes(status)) {
    steps.push({ label: 'Processing started', date: raw.updatedAt })
  }
  if (status === 'completed') {
    steps.push({ label: 'Completed', date: raw.updatedAt })
  }
  if (status === 'rejected') {
    steps.push({ label: 'Request rejected', date: raw.updatedAt })
  }
  if (status === 'cancelled') {
    steps.push({ label: 'Request cancelled', date: raw.updatedAt })
  }

  return steps
}

// ─── API call ────────────────────────────────────────────────────────────────
const fetchReturnsAPI = async ({ type, status, page = 1, limit = 20 } = {}) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Missing auth credentials')

    let query = `page=${page}&limit=${limit}`
    if (type) query += `&type=${type}`
    if (status) query += `&status=${status}`

    const url = `${BASE_URL}/customer/business/${businessId}/returns?${query}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const json = await response.json()
    console.log('fetchReturnsAPI response:', json)

    if (!json.success) throw new Error(json.message || 'Failed to fetch returns')

    // Adapt every row from raw API shape to component shape
    const rows = (json.data?.requests || []).map(adaptReturn)
    return { ...json.data, rows }
  } catch (error) {
    console.log('fetchReturnsAPI error:', error)
    throw error
  }
}

// ─── Map backendStatus → UI status ───────────────────────────────────────────
const mapStatus = backendStatus => {
  const map = {
    submitted: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    processing: 'processing',
    completed: 'completed',
  }
  return map[backendStatus?.toLowerCase()] || backendStatus
}

// ─── Status config ────────────────────────────────────────────────────────────
const getStatusConfig = status => {
  const map = {
    pending: { color: color.WHITE, bg: color.primary, icon: 'clock-outline', label: 'Pending' },
    approved: { color: color.primary, bg: '#E8EDFF', icon: 'check-circle-outline', label: 'Approved' },
    rejected: { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Rejected' },
    processing: { color: color.primary, bg: '#E8EDFF', icon: 'package-variant', label: 'Processing' },
    completed: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-all', label: 'Completed' },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'help-circle-outline', label: status,
  }
}



// ─── Return / Replacement Card ────────────────────────────────────────────────

function ReturnCard({ item, navigation, fadeAnim }) {
  const uiStatus = mapStatus(item.backendStatus || item.status)
  const statusConfig = getStatusConfig(uiStatus)
  const isReturn = item.type === 'return'
  const isPending = uiStatus === 'pending'

  const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <Animated.View style={[styles.card, {
      opacity: fadeAnim,
      transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>

      {/* ── Header: type + date + status pill ── */}
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon
            name={isReturn ? 'keyboard-return' : 'swap-horizontal'}
            size={ms(14)}
            color={isReturn ? '#E65100' : color.primary}
          />
          <Text style={styles.returnTypeLabel}>
            {isReturn ? 'Return' : 'Replacement'}
          </Text>
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

      {/* ── Item row ── */}
      <View style={styles.itemRow}>
        <View style={styles.itemThumb}>
          <Icon
            name={item.item?.itemType === 'digital' ? 'download-box' : 'cube-outline'}
            size={ms(24)}
            color={isReturn ? '#E65100' : color.primary}
          />
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.item?.title || 'Product'}
          </Text>
          <Text style={styles.itemSubtitle}>
            Qty: {item.item?.quantity}
            {item.item?.itemType === 'digital' ? '  ·  Digital' : ''}
            {isReturn && item.refundAmount != null
              ? `  ·  Refund ₹${item.refundAmount.toLocaleString('en-IN')}`
              : ''}
          </Text>
        </View>
      </View>

      {/* ── Reason ── */}
      <View style={styles.reasonStrip}>
        <Icon name="information-outline" size={ms(12)} color={color.text} />
        <Text style={styles.reasonTitle}>{item.reason}</Text>
      </View>

      {/* ── Actions ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.btnOutline}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('returnreplacedetails', { returnId: item.returnId })}
        >
          <Text style={styles.btnOutlineText}>View Details</Text>
        </TouchableOpacity>
      </View>

    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReturnReplacementScreen() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [error, setError] = useState(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const navigation = useNavigation()

  useEffect(() => {
    if (!loading && returns.length > 0) {
      fadeAnim.setValue(0)
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start()
    }
  }, [loading, returns])

  useFocusEffect(useCallback(() => { fetchReturns() }, []))

  const fetchReturns = async () => {
    try {
      setLoading(true)
      setError(null)

      let apiType, apiStatus
      if (selectedFilter === 'return' || selectedFilter === 'replacement') {
        apiType = selectedFilter
      } else if (selectedFilter === 'pending') {
        apiStatus = 'submitted'   // backend uses "submitted" for pending
      } else if (selectedFilter === 'completed') {
        apiStatus = 'completed'
      }

      const data = await fetchReturnsAPI({ type: apiType, status: apiStatus })
      setReturns(data.rows || [])
    } catch (e) {
      console.log('Returns fetch error', e)
      setError('Failed to load requests. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [selectedFilter])

  const handleCreateTicket = () => {
    navigation.navigate('Tabs', { screen: 'Orders' })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Returns & Replacements</Text>
      </View>

      {/* ── Error banner ── */}
      {!!error && !loading && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle-outline" size={ms(16)} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchReturns}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List / Loader ── */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading requests…</Text>
        </View>
      ) : (
        <FlatList
          data={returns}
          keyExtractor={item => item.returnId}
          renderItem={({ item }) => (
            <ReturnCard item={item} navigation={navigation} fadeAnim={fadeAnim} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconBg}>
                  <Icon name="package-variant-closed" size={ms(48)} color={color.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Replacements Found</Text>
                <Text style={styles.emptyHint}>
                  {selectedFilter === 'all'
                    ? "You can replace products by creating a replacement request from your orders"
                    : `No ${selectedFilter} requests found.`}
                </Text>
                {selectedFilter !== 'all' ? (
                  <TouchableOpacity onPress={() => setSelectedFilter('all')} style={styles.clearFilter}>
                    <Text style={styles.clearFilterText}>View all requests</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleCreateTicket} style={styles.createBtn}>
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
              onRefresh={() => { setRefreshing(true); fetchReturns() }}
              colors={[color.primary]}
              tintColor={color.primary}
            />
          }
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  addBtn: {
    width: '36@s', height: '36@s',
    borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },

  filterBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: '5@s',
    paddingHorizontal: '14@s', paddingVertical: '6@vs',
    borderRadius: '20@ms',
    backgroundColor: color.background,
    borderWidth: 1, borderColor: '#DEDEDE',
  },
  filterChipActive: { backgroundColor: color.primary + '20', borderColor: color.primary },
  filterLabel: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888' },
  filterLabelActive: { color: color.primary, fontFamily: FONTS.Bold },

  summaryBar: {
    paddingHorizontal: '16@s', paddingVertical: '8@vs',
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EBEBEB',
  },
  summaryText: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: '16@s', paddingVertical: '10@vs',
    borderBottomWidth: 1, borderBottomColor: '#FFCDD2',
  },
  errorText: { flex: 1, fontSize: '12@ms', color: '#C62828', fontFamily: FONTS.Medium },
  retryText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.primary },

  list: { paddingHorizontal: '12@s', paddingTop: '12@vs', paddingBottom: '32@vs', gap: '10@vs' },

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
  returnTypeLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  orderDate: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '3@vs' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    paddingHorizontal: '10@s', paddingVertical: '4@vs', borderRadius: '20@ms',
  },
  statusText: { fontSize: '11@ms', fontFamily: FONTS.Bold },

  separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '10@vs' },

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
  amountCol: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  amountLabel: { fontSize: '10@ms', color: '#999', fontFamily: FONTS.Medium },
  amountValue: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text, marginTop: '2@vs' },

  reasonStrip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '8@s',
    backgroundColor: color.background,
    borderRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '8@vs',
    marginBottom: '8@vs',
  },
  reasonTitle: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },
  reasonDesc: { fontSize: '11@ms', color: '#666', fontFamily: FONTS.Medium, marginTop: '2@vs' },

  // Evidence row
  evidenceRow: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    marginBottom: '8@vs',
  },
  evidenceText: { fontSize: '12@ms', color: color.primary, fontFamily: FONTS.Medium },

  courierRow: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: color.primary + '10',
    borderRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '7@vs',
    marginBottom: '8@vs',
  },
  courierText: { fontSize: '12@ms', color: color.primary, fontFamily: FONTS.Bold },

  refundRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '8@vs' },
  refundText: { fontSize: '12@ms', color: '#2E7D32', fontFamily: FONTS.Bold },

  timeline: { marginBottom: '8@vs' },
  timelineTitle: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs' },
  timelineRow: { flexDirection: 'row', gap: '10@s', marginBottom: '10@vs' },
  timelineDot: { alignItems: 'center', width: '20@s' },
  dot: {
    width: '8@ms', height: '8@ms', borderRadius: '4@ms',
    backgroundColor: '#D0D0D0', borderWidth: 2, borderColor: '#E0E0E0',
  },
  dotActive: { backgroundColor: color.primary, borderColor: color.primary },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: '4@vs' },
  timelineLabel: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium },
  timelineLabelActive: { color: color.text, fontFamily: FONTS.Bold },
  timelineDate: { fontSize: '10@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '2@vs' },

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
  btnCancel: {
    flex: 1, paddingVertical: '9@vs', borderRadius: '6@ms',
    borderWidth: 1.5, borderColor: '#C62828',
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#C62828' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '60@vs' },
  loadingText: { marginTop: '14@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  emptyWrap: { alignItems: 'center', paddingTop: '60@vs', paddingHorizontal: '32@s' },
  emptyIconBg: {
    width: '96@s', height: '96@s', borderRadius: '48@ms',
    backgroundColor: color.primary + '20',
    justifyContent: 'center', alignItems: 'center', marginBottom: '20@vs',
  },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs', textAlign: 'center' },
  emptyHint: { fontSize: '13@ms', color: '#999', fontFamily: FONTS.Medium, textAlign: 'center', lineHeight: '20@ms' },
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