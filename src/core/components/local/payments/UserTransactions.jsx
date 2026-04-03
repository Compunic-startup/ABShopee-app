import React, { useCallback, useEffect, useRef, useState } from 'react'
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
    case 'success':
      return { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle-outline', label: 'Success' }
    case 'failed':
      return { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Failed' }
    case 'pending':
      return { color: '#E65100', bg: '#FFF3E0', icon: 'clock-outline', label: 'Pending' }
    case 'refunded':
      return { color: '#6A1B9A', bg: '#F3E5F5', icon: 'cash-refund', label: 'Refunded' }
    default:
      return { color: '#888', bg: color.background, icon: 'help-circle-outline', label: status }
  }
}

// ─── Type config ──────────────────────────────────────────────────────────────
const getTypeConfig = type => {
  switch (type?.toLowerCase()) {
    case 'payment':
      return { icon: 'credit-card-outline', color: color.primary }
    case 'refund':
      return { icon: 'cash-refund', color: '#6A1B9A' }
    case 'escrow':
      return { icon: 'shield-check-outline', color: '#0097A7' }
    default:
      return { icon: 'swap-horizontal', color: '#888' }
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
const formatDate = iso => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatTime = iso => {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const formatAmount = (amount, currency = 'INR') => {
  return `${currency === 'INR' ? '₹' : currency}${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',     label: 'All',      icon: 'view-list'            },
  { key: 'payment', label: 'Payments', icon: 'credit-card-outline'  },
  { key: 'refund',  label: 'Refunds',  icon: 'cash-refund'          },
  { key: 'escrow',  label: 'Escrow',   icon: 'shield-check-outline' },
]

// ─── Transaction Card — Flipkart flat style ───────────────────────────────────
function TransactionCard({ item, listAnim }) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  const statusCfg  = getStatusConfig(item.status)
  const typeCfg    = getTypeConfig(item.type)
  const items      = item.orderPreview?.items || []
  const firstItem  = items[0]
  const extraCount = items.length - 1

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
        {/* ── Top row: type icon · amount · status badge ── */}
        <View style={styles.cardTop}>
          <View style={[styles.typeIconCircle, { backgroundColor: color.background }]}>
            <Icon name={typeCfg.icon} size={ms(20)} color={typeCfg.color} />
          </View>

          <View style={styles.cardTopMid}>
            <Text style={styles.amountText}>{formatAmount(item.amount, item.currency)}</Text>
            <View style={styles.typeRow}>
              <Text style={[styles.typeLabel, { color: typeCfg.color }]}>
                {item.type?.toUpperCase()}
              </Text>
              <Text style={styles.dot}>·</Text>
              <Icon name={getProviderIcon(item.provider)} size={ms(11)} color="#BDBDBD" />
              <Text style={styles.providerText}>{item.provider}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Icon name={statusCfg.icon} size={ms(11)} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
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

        {/* ── Bottom row: order ID · date/time ── */}
        <View style={styles.cardBottom}>
          <View style={styles.cardBottomLeft}>
            <Icon name="receipt" size={ms(11)} color="#BDBDBD" />
            <Text style={styles.orderIdText} numberOfLines={1}>
              {item.orderId?.slice(0, 8)}…
            </Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Icon name="calendar-outline" size={ms(11)} color="#BDBDBD" />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.timeSep}>·</Text>
            <Icon name="clock-outline" size={ms(11)} color="#BDBDBD" />
            <Text style={styles.dateText}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TransactionsScreen() {
  const navigation = useNavigation()

  const [transactions, setTransactions]     = useState([])
  const [loading, setLoading]               = useState(false)
  const [refreshing, setRefreshing]         = useState(false)
  const [page, setPage]                     = useState(1)
  const [hasMore, setHasMore]               = useState(true)
  const [total, setTotal]                   = useState(0)
  const [selectedFilter, setSelectedFilter] = useState('all')

  const listAnim = useRef(new Animated.Value(0)).current

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(1, true)
    }, [selectedFilter])
  )

  const fetchTransactions = async (pageNumber = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        listAnim.setValue(0)
      }

      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const customerId = await AsyncStorage.getItem('customerId')

      let url = `${BASE_URL}/customer/business/${businessId}/customers/${customerId}/transactions?page=${pageNumber}&limit=10`
      if (selectedFilter !== 'all') url += `&transactionType=${selectedFilter.toUpperCase()}`

      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()

      const newData    = json?.data?.transactions || []
      const totalCount = json?.data?.total || 0

      if (reset) {
        setTransactions(newData)
        setTotal(totalCount)
      } else {
        setTransactions(prev => [...prev, ...newData])
      }

      setHasMore(newData.length === 10)
      setPage(pageNumber)

      Animated.timing(listAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    } catch (e) {
      console.log('Transaction fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) fetchTransactions(page + 1)
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchTransactions(1, true)
  }

  const onFilterChange = key => {
    setSelectedFilter(key)
    setPage(1)
    setTransactions([])
  }

  // ── Footer spinner ──────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (!hasMore || transactions.length === 0) return null
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
        <Icon name="wallet-outline" size={ms(44)} color={color.primary} />
      </View>
      <Text style={styles.emptyTitle}>No transactions yet</Text>
      <Text style={styles.emptySubtitle}>
        Your payment history will appear here once you make a purchase.
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
        <Text style={styles.headerTitle}>Transactions</Text>
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
      {!loading && transactions.length > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {total} transaction{total !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ── List / Loader ── */}
      {loading && transactions.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loaderText}>Fetching transactions…</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.transactionId}
          renderItem={({ item }) => <TransactionCard item={item} listAnim={listAnim} />}
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
    marginBottom: '12@vs',
  },
  typeIconCircle: {
    width: '44@s', height: '44@s', borderRadius: '22@ms',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EBEBEB',
    flexShrink: 0,
  },
  cardTopMid: { flex: 1 },
  amountText: {
    fontSize: '17@ms', fontFamily: FONTS.Bold, color: color.text, letterSpacing: -0.3,
  },
  typeRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: '4@s', marginTop: '3@vs',
  },
  typeLabel: {
    fontSize: '10@ms', fontFamily: FONTS.Bold, letterSpacing: 0.6,
  },
  dot: { fontSize: '11@ms', color: '#BDBDBD' },
  providerText: {
    fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#BDBDBD',
    textTransform: 'capitalize',
  },

  // ── Status badge ─────────────────────────────────────────────────────────────
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: '8@s', paddingVertical: '4@vs',
    borderRadius: '4@ms', gap: '4@s', flexShrink: 0,
  },
  statusText: { fontSize: '10@ms', fontFamily: FONTS.Bold },

  // ── Divider ──────────────────────────────────────────────────────────────────
  divider: {
    height: 1, backgroundColor: '#F0F0F0', marginBottom: '10@vs',
  },

  // ── Items preview ─────────────────────────────────────────────────────────────
  itemsPreview: {
    flexDirection: 'row', alignItems: 'center',
    gap: '6@s', marginBottom: '10@vs',
  },
  itemsText: {
    fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#555', flex: 1,
  },
  itemsExtra: {
    fontFamily: FONTS.Bold,
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
  timeSep:  { fontSize: '11@ms', color: '#BDBDBD' },

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