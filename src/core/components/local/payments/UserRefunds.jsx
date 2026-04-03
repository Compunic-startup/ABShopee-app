import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import color from '../../../utils/color'

// ─── Status config ────────────────────────────────────────────────────────────
const getStatusConfig = status => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
      return { color: '#1E8C45', bg: '#E8F5EE', icon: 'check-circle-outline', label: 'Completed' }
    case 'processing':
      return { color: color.primary, bg: '#E8EEFB', icon: 'progress-clock', label: 'Processing' }
    case 'pending':
      return { color: '#E65100', bg: '#FFF3E0', icon: 'clock-outline', label: 'Pending' }
    case 'failed':
      return { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Failed' }
    case 'cancelled':
      return { color: '#6A1B9A', bg: '#F3E5F5', icon: 'cancel', label: 'Cancelled' }
    default:
      return { color: '#888', bg: color.background, icon: 'help-circle-outline', label: status }
  }
}

// ─── Provider icon ────────────────────────────────────────────────────────────
const getProviderIcon = provider => {
  switch (provider?.toLowerCase()) {
    case 'razorpay': return 'lightning-bolt'
    case 'upi':      return 'cellphone'
    case 'cod':      return 'cash'
    case 'wallet':   return 'wallet-outline'
    default:         return 'credit-card-outline'
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (amount, currency = 'INR') =>
  `${currency === 'INR' ? '₹' : currency}${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const fmtDate = iso =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtTime = iso =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',        label: 'All',        icon: 'view-list'             },
  { key: 'processing', label: 'Processing', icon: 'progress-clock'        },
  { key: 'completed',  label: 'Completed',  icon: 'check-circle-outline'  },
  { key: 'pending',    label: 'Pending',    icon: 'clock-outline'         },
]

// ─── Refund Card — Flipkart flat style ───────────────────────────────────────
function RefundCard({ item, listAnim }) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  const statusCfg  = getStatusConfig(item.status)
  const items      = item.orderPreview?.items || []
  const financials = item.orderPreview?.financials || {}
  const payment    = item.initialPayment || {}
  const firstItem  = items[0]
  const extraCount = items.length - 1

  // ── Refund progress bar ──
  const totalPaid     = parseFloat(financials.totalPaid     || 0)
  const totalRefunded = parseFloat(financials.totalRefunded || 0)
  const progress      = totalPaid > 0 ? Math.min(totalRefunded / totalPaid, 1) : 0
  const isFullRefund  = financials.refundableRemaining === 0

  return (
    <Animated.View
      style={{
        opacity: listAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onIn}
        onPressOut={onOut}
        style={styles.card}
      >
        {/* ── Top row: icon · amount · status badge ── */}
        <View style={styles.cardTop}>
          <View style={[styles.iconCircle, { backgroundColor: color.background }]}>
            <Icon name="cash-refund" size={ms(20)} color={statusCfg.color} />
          </View>

          <View style={styles.cardTopMid}>
            <Text style={styles.amountText}>{fmt(item.amount, item.currency)}</Text>
            <View style={styles.providerRow}>
              <Icon name={getProviderIcon(item.provider)} size={ms(11)} color="#BDBDBD" />
              <Text style={styles.providerText}>{item.provider}</Text>
              {payment.method && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.providerText}>{payment.method}</Text>
                </>
              )}
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Icon name={statusCfg.icon} size={ms(11)} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* ── Refund progress bar ── */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Refund Progress</Text>
            <Text style={styles.progressValue}>
              {fmt(totalRefunded)} / {fmt(totalPaid)}
              {isFullRefund && (
                <Text style={styles.fullRefundBadge}> FULL</Text>
              )}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: statusCfg.color },
              ]}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Order items preview ── */}
        {firstItem && (
          <View style={styles.itemsPreview}>
            <Icon name="shopping-outline" size={ms(12)} color="#BDBDBD" />
            <Text style={styles.itemsText} numberOfLines={1}>
              {firstItem.title}
              {extraCount > 0 && (
                <Text style={[styles.itemsExtra, { color: color.primary }]}>
                  {` +${extraCount} more item${extraCount > 1 ? 's' : ''}`}
                </Text>
              )}
            </Text>
          </View>
        )}

        {/* ── Payment ref ── */}
        {payment.providerPaymentId && (
          <View style={styles.refRow}>
            <Icon name="identifier" size={ms(11)} color="#BDBDBD" />
            <Text style={styles.refText} numberOfLines={1}>
              Ref: {payment.providerPaymentId}
            </Text>
          </View>
        )}

        {/* ── Reason ── */}
        {item.reason && (
          <View style={styles.reasonRow}>
            <Icon name="information-outline" size={ms(11)} color="#BDBDBD" />
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Bottom row: order ID · date/time ── */}
        <View style={styles.cardBottom}>
          <View style={styles.cardBottomLeft}>
            <Icon name="receipt-text-outline" size={ms(11)} color="#BDBDBD" />
            <Text style={styles.orderIdText}>{item.orderId?.slice(0, 8)}…</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Icon name="calendar-outline" size={ms(11)} color="#BDBDBD" />
            <Text style={styles.dateText}>{fmtDate(item.createdAt)}</Text>
            <Text style={styles.dot}>·</Text>
            <Icon name="clock-outline" size={ms(11)} color="#BDBDBD" />
            <Text style={styles.dateText}>{fmtTime(item.createdAt)}</Text>
          </View>
        </View>

        {/* ── Completed-at row ── */}
        {item.completedAt && (
          <View style={[styles.dateTimeRow, { marginTop: vs(6), justifyContent: 'flex-end' }]}>
            <Icon name="check-circle-outline" size={ms(11)} color="#1E8C45" />
            <Text style={[styles.dateText, { color: '#1E8C45' }]}>
              Completed {fmtDate(item.completedAt)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RefundsScreen() {
  const navigation = useNavigation()

  const [refunds, setRefunds]               = useState([])
  const [loading, setLoading]               = useState(false)
  const [refreshing, setRefreshing]         = useState(false)
  const [page, setPage]                     = useState(1)
  const [hasMore, setHasMore]               = useState(true)
  const [total, setTotal]                   = useState(0)
  const [selectedFilter, setSelectedFilter] = useState('all')

  const listAnim = useRef(new Animated.Value(0)).current

  useFocusEffect(
    useCallback(() => {
      fetchRefunds(1, true)
    }, [selectedFilter])
  )

  const fetchRefunds = async (pageNumber = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        listAnim.setValue(0)
      }

      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      let url = `${BASE_URL}/customer/business/${businessId}/refunds?page=${pageNumber}&limit=10`
      if (selectedFilter !== 'all') url += `&status=${selectedFilter}`

      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()

      const newData    = json?.data?.refunds || []
      const totalCount = json?.data?.total   || 0

      if (reset) {
        setRefunds(newData)
        setTotal(totalCount)
      } else {
        setRefunds(prev => [...prev, ...newData])
      }

      setHasMore(newData.length === 10)
      setPage(pageNumber)

      Animated.timing(listAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    } catch (e) {
      console.log('Refunds fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) fetchRefunds(page + 1)
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchRefunds(1, true)
  }

  const onFilterChange = key => {
    setSelectedFilter(key)
    setPage(1)
    setRefunds([])
  }

  // ── Footer spinner ──────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (!hasMore || refunds.length === 0) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={color.primary} />
        <Text style={styles.footerText}>Loading more…</Text>
      </View>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Icon name="cash-refund" size={ms(44)} color={color.primary} />
      </View>
      <Text style={styles.emptyTitle}>No refunds yet</Text>
      <Text style={styles.emptySubtitle}>
        Any refunds raised against your orders will appear here.
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Refunds</Text>
        {total > 0 ? (
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{total}</Text>
          </View>
        ) : (
          <View style={{ width: s(36) }} />
        )}
      </View>

      {/* ── Filter bar ── */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => {
          const active = selectedFilter === f.key
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onFilterChange(f.key)}
              activeOpacity={0.7}
            >
              <Icon name={f.icon} size={ms(13)} color={active ? '#fff' : '#888'} />
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Summary row ── */}
      {!loading && refunds.length > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {total} refund{total !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ── List / Loader ── */}
      {loading && refunds.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loaderText}>Fetching refunds…</Text>
        </View>
      ) : (
        <FlatList
          data={refunds}
          keyExtractor={item => item.refundId}
          renderItem={({ item }) => <RefundCard item={item} listAnim={listAnim} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[color.primary]}
              tintColor={color.primary}
            />
          }
        />
      )}
    </View>
  )
}

// ─── Styles — ONLY color.* values ─────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '14@vs',
    paddingHorizontal: '14@s',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  backBtn: {
    width: '36@s', height: '36@s', borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff',
  },
  totalBadge: {
    backgroundColor: color.secondary,
    borderRadius: '12@ms',
    paddingHorizontal: '10@s', paddingVertical: '3@vs',
    minWidth: '28@s', alignItems: 'center',
  },
  totalBadgeText: {
    fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text,
  },

  // ── Filter bar ───────────────────────────────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: '12@s',
    paddingVertical: '10@vs',
    gap: '8@s',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4@s',
    paddingVertical: '7@vs',
    borderRadius: '6@ms',
    backgroundColor: color.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  filterLabel: {
    fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#888',
  },
  filterLabelActive: {
    color: '#fff', fontFamily: FONTS.Bold,
  },

  // ── Summary row ──────────────────────────────────────────────────────────────
  summaryRow: {
    paddingHorizontal: '16@s',
    paddingTop: '10@vs',
    paddingBottom: '4@vs',
  },
  summaryText: {
    fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  list: {
    paddingHorizontal: '0@s',
    paddingBottom: '32@vs',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // ── Card — Flipkart flat style ────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    paddingHorizontal: '16@s',
    paddingVertical: '14@vs',
    paddingLeft: '20@s',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12@s',
  },
  iconCircle: {
    width: '44@s', height: '44@s', borderRadius: '22@ms',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EBEBEB',
    flexShrink: 0,
  },
  cardTopMid: { flex: 1 },
  amountText: {
    fontSize: '17@ms', fontFamily: FONTS.Bold, color: color.text, letterSpacing: -0.3,
  },
  providerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: '4@s', marginTop: '3@vs',
  },
  providerText: {
    fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#BDBDBD',
    textTransform: 'capitalize',
  },
  dot: { fontSize: '11@ms', color: '#BDBDBD' },

  // ── Status badge ─────────────────────────────────────────────────────────────
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: '8@s', paddingVertical: '4@vs',
    borderRadius: '4@ms', gap: '4@s', flexShrink: 0,
  },
  statusText: { fontSize: '10@ms', fontFamily: FONTS.Bold },

  // ── Progress bar ─────────────────────────────────────────────────────────────
  progressSection: { marginTop: '14@vs' },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '6@vs',
  },
  progressLabel: {
    fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#888',
  },
  progressValue: {
    fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text,
  },
  fullRefundBadge: {
    color: '#1E8C45', fontSize: '10@ms', fontFamily: FONTS.Bold,
  },
  progressBar: {
    height: '5@vs', backgroundColor: '#EBEBEB',
    borderRadius: '4@ms', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: '4@ms' },

  // ── Divider ──────────────────────────────────────────────────────────────────
  divider: {
    height: 1, backgroundColor: '#F0F0F0', marginVertical: '12@vs',
  },

  // ── Items preview ─────────────────────────────────────────────────────────────
  itemsPreview: {
    flexDirection: 'row', alignItems: 'center',
    gap: '6@s', marginBottom: '6@vs',
  },
  itemsText: {
    fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#555', flex: 1,
  },
  itemsExtra: { fontFamily: FONTS.Bold },

  // ── Ref & reason rows ─────────────────────────────────────────────────────────
  refRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: '5@s', marginBottom: '4@vs',
  },
  refText: {
    fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#BDBDBD', flex: 1,
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: '5@s', marginBottom: '4@vs',
  },
  reasonText: {
    fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#555', flex: 1,
  },

  // ── Card bottom ───────────────────────────────────────────────────────────────
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardBottomLeft: { flexDirection: 'row', alignItems: 'center', gap: '5@s' },
  orderIdText: {
    fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#BDBDBD',
  },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: '4@s' },
  dateText: { fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#BDBDBD' },

  // ── Footer loader ─────────────────────────────────────────────────────────────
  footerLoader: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: '8@s', paddingVertical: '16@vs',
  },
  footerText: {
    fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888',
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center', paddingTop: vs(60), paddingHorizontal: s(40),
  },
  emptyIconWrap: {
    width: '88@s', height: '88@s', borderRadius: '44@ms',
    backgroundColor: color.primary + 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: '20@vs',
    borderWidth: 1, borderColor: '#EEE',
  },
  emptyTitle: {
    fontSize: '18@ms', fontFamily: FONTS.Bold,
    color: color.text, marginBottom: '8@vs',
  },
  emptySubtitle: {
    fontSize: '13@ms', color: '#888',
    fontFamily: FONTS.Medium, textAlign: 'center', lineHeight: '20@ms',
  },

  // ── Loader ────────────────────────────────────────────────────────────────────
  loaderWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: '12@vs',
  },
  loaderText: {
    fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium,
  },
})