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
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'

// ─── Dummy data ──────────────────────────────────────────────────────────────
const DUMMY_RETURNS = [
  {
    returnId: 'RET2024032801',
    orderId: 'ORD2024031501',
    type: 'return', // 'return' or 'replacement'
    status: 'approved', // pending, approved, rejected, processed, completed, cancelled
    createdAt: '2024-03-28T10:30:00Z',
    item: {
      title: 'Samsung Galaxy Buds Pro 2',
      quantity: 1,
      price: 15999,
      attributes: [
        { label: 'Color', displayValue: 'Bora Purple' },
      ],
      itemType: 'physical',
    },
    reason: 'Product damaged',
    description: 'The charging case has a crack on the lid.',
    refundAmount: 15999,
    refundMethod: 'Original Payment Method',
    timeline: [
      { status: 'requested', date: '2024-03-28T10:30:00Z', label: 'Return Requested' },
      { status: 'approved', date: '2024-03-28T14:15:00Z', label: 'Return Approved' },
    ],
  },
  {
    returnId: 'REP2024032502',
    orderId: 'ORD2024031203',
    type: 'replacement',
    status: 'processing',
    createdAt: '2024-03-25T16:20:00Z',
    item: {
      title: 'Nike Air Max 270 Running Shoes',
      quantity: 1,
      price: 12995,
      attributes: [
        { label: 'Size', displayValue: 'UK 9' },
        { label: 'Color', displayValue: 'Black/White' },
      ],
      itemType: 'physical',
    },
    reason: 'Wrong size delivered',
    description: 'Ordered UK 9 but received UK 8',
    newItem: {
      title: 'Nike Air Max 270 Running Shoes',
      attributes: [
        { label: 'Size', displayValue: 'UK 9' },
        { label: 'Color', displayValue: 'Black/White' },
      ],
    },
    timeline: [
      { status: 'requested', date: '2024-03-25T16:20:00Z', label: 'Replacement Requested' },
      { status: 'approved', date: '2024-03-25T19:45:00Z', label: 'Replacement Approved' },
      { status: 'processing', date: '2024-03-26T09:00:00Z', label: 'Replacement Processing' },
    ],
  },
]

// ─── Status config ───────────────────────────────────────────────────────────
const getStatusConfig = status => {
  const map = {
    pending: { color: color.secondary, bg: color.secondarylight, icon: 'clock-outline', label: 'Pending' },
    approved: { color: color.primary, bg: '#E8EDFF', icon: 'check-circle-outline', label: 'Approved' },
    rejected: { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Rejected' },
    processing: { color: color.primary, bg: '#E8EDFF', icon: 'package-variant', label: 'Processing' },
    completed: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-all', label: 'Completed' },
    cancelled: { color: '#C62828', bg: '#FFEBEE', icon: 'cancel', label: 'Cancelled' },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'help-circle-outline', label: status,
  }
}

const FILTERS = [
  { key: 'all', label: 'All', icon: 'format-list-bulleted' },
  { key: 'return', label: 'Returns', icon: 'keyboard-return' },
  { key: 'replacement', label: 'Replacements', icon: 'swap-horizontal' },
  { key: 'pending', label: 'Pending', icon: 'clock-outline' },
  { key: 'completed', label: 'Completed', icon: 'check-all' },
]

// ─── Return/Replacement Card ─────────────────────────────────────────────────
function ReturnCard({ item, navigation, fadeAnim }) {
  const statusConfig = getStatusConfig(item.status)
  const isReturn = item.type === 'return'
  const createdDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const isPending = item.status?.toLowerCase() === 'pending'
  const isCompleted = item.status?.toLowerCase() === 'completed'
  const isApproved = item.status?.toLowerCase() === 'approved'

  return (
    <Animated.View style={[styles.card, {
      opacity: fadeAnim,
      transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>

      {/* ── Card Header ── */}
      <View style={styles.cardHeader}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon 
              name={isReturn ? 'keyboard-return' : 'swap-horizontal'} 
              size={ms(14)} 
              color={isReturn ? '#E65100' : color.primary} 
            />
            <Text style={styles.returnId}>
              {isReturn ? 'Return' : 'Replacement'} #{item.returnId.slice(-8).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.orderDate}>Requested on {createdDate}</Text>
          <Text style={styles.orderRef}>Order #{item.orderId.slice(-8).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <Icon name={statusConfig.icon} size={ms(11)} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      {/* ── Item Row ── */}
      <View style={styles.itemRow}>
        {/* Icon box */}
        <View style={styles.itemThumb}>
          <Icon
            name={item.item?.itemType === 'digital' ? 'download-box' : 'cube-outline'}
            size={ms(26)}
            color={isReturn ? '#E65100' : color.primary}
          />
        </View>

        <View style={styles.itemMeta}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.item?.title || 'Product'}
          </Text>

          {/* Attributes */}
          {!!item.item?.attributes?.length && (
            <View style={styles.attrRow}>
              {item.item.attributes.map((a, i) => (
                <View key={i} style={styles.attrChip}>
                  <Text style={styles.attrText}>{a.label}: {a.displayValue}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.itemFootRow}>
            <Text style={styles.itemQty}>Qty: {item.item?.quantity}</Text>
          </View>
        </View>

        {/* Amount */}
        {isReturn && (
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Refund</Text>
            <Text style={styles.amountValue}>₹{item.refundAmount}</Text>
          </View>
        )}
      </View>

      {/* ── Reason strip ── */}
      <View style={styles.reasonStrip}>
        <Icon name="information-outline" size={ms(13)} color={color.text} />
        <View style={{ flex: 1 }}>
          <Text style={styles.reasonTitle}>Reason: {item.reason}</Text>
          {item.description && (
            <Text style={styles.reasonDesc} numberOfLines={2}>{item.description}</Text>
          )}
        </View>
      </View>

      {/* ── Replacement Info ── */}
      {!isReturn && item.newItem && (
        <View style={styles.replacementInfo}>
          <Icon name="swap-horizontal" size={ms(13)} color={color.primary} />
          <Text style={styles.replacementText}>
            New item: {item.newItem.title}
          </Text>
        </View>
      )}

      {/* ── Refund method ── */}
      {isReturn && item.refundMethod && (
        <View style={styles.refundRow}>
          <Icon name="cash-refund" size={ms(13)} color="#2E7D32" />
          <Text style={styles.refundText}>Refund via: {item.refundMethod}</Text>
        </View>
      )}

      <View style={styles.separator} />

      {/* ── Timeline ── */}
      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>Status Timeline</Text>
        {item.timeline?.map((step, idx) => {
          const stepDate = new Date(step.date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })
          const isLast = idx === item.timeline.length - 1
          return (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.timelineDot}>
                <View style={[styles.dot, isLast && styles.dotActive]} />
                {!isLast && <View style={styles.timelineLine} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.timelineLabel, isLast && styles.timelineLabelActive]}>
                  {step.label}
                </Text>
                <Text style={styles.timelineDate}>{stepDate}</Text>
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.separator} />

      {/* ── Action buttons ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.btnOutline}
          activeOpacity={0.7}
          onPress={() => {
            // Navigate to details screen (to be created)
            navigation.navigate('ReturnReplaceDetails', { returnId: item.returnId })
          }}
        >
          <Text style={styles.btnOutlineText}>View Details</Text>
        </TouchableOpacity>

        {isPending && (
          <TouchableOpacity style={styles.btnCancel} activeOpacity={0.7}>
            <Text style={styles.btnCancelText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {(isApproved || item.status === 'processing') && (
          <TouchableOpacity style={styles.btnFill} activeOpacity={0.7}>
            <Icon name="phone" size={ms(14)} color="#fff" />
            <Text style={styles.btnFillText}>Contact Support</Text>
          </TouchableOpacity>
        )}
      </View>

    </Animated.View>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ReturnReplacementScreen() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [fadeAnim] = useState(new Animated.Value(0))
  const navigation = useNavigation()

  useEffect(() => {
    if (!loading && returns.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start()
    }
  }, [loading, returns])

  useFocusEffect(useCallback(() => { fetchReturns() }, []))

  const fetchReturns = async () => {
    try {
      setLoading(true)
      // Simulating API call with dummy data
      await new Promise(resolve => setTimeout(resolve, 800))
      setReturns(DUMMY_RETURNS)
    } catch (e) {
      console.log('Returns fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredReturns = selectedFilter === 'all'
    ? returns
    : selectedFilter === 'return' || selectedFilter === 'replacement'
    ? returns.filter(r => r.type === selectedFilter)
    : returns.filter(r => r.status?.toLowerCase() === selectedFilter)

  const handleCreateTicket = () => {
    // Navigate to create return/replacement screen
    console.log('Orders')
    // navigation.navigate('CreateReturnScreen')
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={color.primary} />

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

        {returns.length > 0 && (
          <TouchableOpacity 
            style={styles.addBtn} 
            activeOpacity={0.7}
            onPress={handleCreateTicket}
          >
            <Icon name="plus" size={ms(22)} color="#fff" />
          </TouchableOpacity>
        )}
        {returns.length === 0 && <View style={styles.addBtn} />}
      </View>

      {/* ── Filter tabs ── */}
      {returns.length > 0 && (
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
      )}

      {/* ── Count summary ── */}
      {!loading && returns.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {filteredReturns.length} {filteredReturns.length === 1 ? 'request' : 'requests'} found
          </Text>
        </View>
      )}

      {/* ── List ── */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading requests…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReturns}
          keyExtractor={item => item.returnId}
          renderItem={({ item }) => (
            <ReturnCard item={item} navigation={navigation} fadeAnim={fadeAnim} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBg}>
                <Icon name="package-variant-closed" size={ms(48)} color={color.primary} />
              </View>
              <Text style={styles.emptyTitle}>No return or replacement requests</Text>
              <Text style={styles.emptyHint}>
                {selectedFilter === 'all'
                  ? 'You haven\'t created any return or replacement requests yet.'
                  : `No ${selectedFilter} requests found.`}
              </Text>
              {selectedFilter !== 'all' ? (
                <TouchableOpacity onPress={() => setSelectedFilter('all')} style={styles.clearFilter}>
                  <Text style={styles.clearFilterText}>View all requests</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleCreateTicket} style={styles.createBtn}>
                  <Icon name="plus-circle" size={ms(18)} color="#fff" />
                  <Text style={styles.createBtnText}>Create Return/Replacement Ticket</Text>
                </TouchableOpacity>
              )}
            </View>
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

// ─── Styles ──────────────────────────────────────────────────────────────────
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
  returnId: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  orderDate: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '3@vs' },
  orderRef: { fontSize: '10@ms', color: '#777', fontFamily: FONTS.Medium, marginTop: '2@vs' },
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

  amountCol: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  amountLabel: { fontSize: '10@ms', color: '#999', fontFamily: FONTS.Medium },
  amountValue: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text, marginTop: '2@vs' },

  // Reason strip
  reasonStrip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '8@s',
    backgroundColor: color.background,
    borderRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '8@vs',
    marginBottom: '8@vs',
  },
  reasonTitle: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },
  reasonDesc: { fontSize: '11@ms', color: '#666', fontFamily: FONTS.Medium, marginTop: '2@vs' },

  // Replacement info
  replacementInfo: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: color.primary + '15',
    borderRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '7@vs',
    marginBottom: '8@vs',
  },
  replacementText: { fontSize: '12@ms', color: color.primary, fontFamily: FONTS.Bold, flex: 1 },

  // Refund row
  refundRow: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '8@vs',
  },
  refundText: { fontSize: '12@ms', color: '#2E7D32', fontFamily: FONTS.Bold },

  // Timeline
  timeline: { marginBottom: '8@vs' },
  timelineTitle: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs' },
  timelineRow: { flexDirection: 'row', gap: '10@s', marginBottom: '10@vs' },
  timelineDot: { alignItems: 'center', width: '20@s' },
  dot: {
    width: '8@ms', height: '8@ms', borderRadius: '4@ms',
    backgroundColor: '#D0D0D0', borderWidth: 2, borderColor: '#E0E0E0',
  },
  dotActive: {
    backgroundColor: color.primary, borderColor: color.primary,
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: '4@vs',
  },
  timelineLabel: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium },
  timelineLabelActive: { color: color.text, fontFamily: FONTS.Bold },
  timelineDate: { fontSize: '10@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '2@vs' },

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
  btnCancel: {
    flex: 1, paddingVertical: '9@vs', borderRadius: '6@ms',
    borderWidth: 1.5, borderColor: '#C62828',
    alignItems: 'center', justifyContent: 'center',
  },
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
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createBtnText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },
})