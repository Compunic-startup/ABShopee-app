import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
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
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import color from '../../../utils/color'

// ─── Category → icon config (semantic colors only, no palette vars) ───────────
const getCategoryConfig = (category, eventKey) => {
  const map = {
    order: {
      'order.placed': { icon: 'shopping-outline', accent: color.primary },
      'order.confirmed': { icon: 'check-circle-outline', accent: '#2E7D32' },
      'order.shipped': { icon: 'truck-delivery-outline', accent: color.primary },
      'order.delivered': { icon: 'package-variant-closed', accent: '#2E7D32' },
      'order.cancelled': { icon: 'close-circle-outline', accent: '#C62828' },
      default: { icon: 'receipt-text-outline', accent: color.primary },
    },
    payment: {
      'payment.success': { icon: 'check-decagram', accent: '#2E7D32' },
      'payment.failed': { icon: 'alert-circle-outline', accent: '#C62828' },
      default: { icon: 'credit-card-outline', accent: color.primary },
    },
    promo: {
      default: { icon: 'tag-outline', accent: '#E65100' },
    },
    system: {
      default: { icon: 'bell-outline', accent: '#888' },
    },
    default: {
      default: { icon: 'bell-outline', accent: '#888' },
    },
  }
  const catMap = map[category?.toLowerCase()] || map.default
  return catMap[eventKey] || catMap.default
}

// ─── Relative time ────────────────────────────────────────────────────────────
const relativeTime = iso => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all', label: 'All', icon: 'bell-outline' },
  { key: 'order', label: 'Orders', icon: 'shopping-outline' },
  { key: 'payment', label: 'Payments', icon: 'credit-card-outline' },
  { key: 'promo', label: 'Offers', icon: 'tag-outline' },
]
function NotificationCard({ item, fadeAnim }) {
  const cfg = getCategoryConfig(item.category, item.eventKey)

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.65}
      >
        <View style={styles.cardInner}>
          <View style={[
            styles.iconCircle,
            { backgroundColor: color.background },
          ]}>
            <Icon name={cfg.icon} size={ms(20)} color={cfg.accent} />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.topRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.time}>
                {relativeTime(item.createdAt)}
              </Text>
            </View>

            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>

            <View style={styles.bottomRow}>
              <View style={[
                styles.categoryChip,
                { backgroundColor: color.background },
              ]}>
                <Text style={[styles.categoryChipText, { color: cfg.accent }]}>
                  {item.category?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const navigation = useNavigation()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')

  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
    }
  }, [loading])

  useFocusEffect(useCallback(() => { fetchNotifications() }, []))

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/notifications`,
        { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      setNotifications(json?.notifications || [])
    } catch (e) {
      console.log('Notifications fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => { setRefreshing(true); fetchNotifications() }

  const filtered = selectedFilter === 'all'
    ? notifications
    : notifications.filter(n => n.category?.toLowerCase() === selectedFilter)

  // ── Empty state ────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Icon name="bell-sleep-outline" size={ms(44)} color={color.primary} />
      </View>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySubtitle}>
        No notifications yet. We'll let you know when something arrives.
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: s(36) }} />
      </View>

      {/* ── Filter bar — scrollable chips ── */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => {
          const active = selectedFilter === f.key
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f.key)}
              activeOpacity={0.7}
            >
              <Icon
                name={f.icon}
                size={ms(13)}
                color={active ? '#fff' : '#888'}
              />
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Summary row ── */}
      {!loading && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ── List / Loader ── */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loaderText}>Fetching notifications…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.notificationId}
          renderItem={({ item }) => (
            <NotificationCard item={item} fadeAnim={fadeAnim} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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

// ─── Styles — ONLY color.* values ────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // ── Header ────────────────────────────────────────────────────────────────
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
    paddingTop: '30@vs',
  },
  backBtn: {
    width: '36@s', height: '36@s', borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff',
  },
  unreadBadge: {
    backgroundColor: color.secondary,
    borderRadius: '12@ms',
    paddingHorizontal: '10@s', paddingVertical: '3@vs',
    minWidth: '28@s', alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text,
  },

  // ── Filter bar ────────────────────────────────────────────────────────────
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

  // ── Summary row ───────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingTop: '10@vs',
    paddingBottom: '4@vs',
  },
  summaryText: {
    fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  unreadSummary: {
    fontSize: '11@ms', fontFamily: FONTS.Bold, color: color.primary,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  list: {
    paddingHorizontal: '0@s',
    paddingBottom: '32@vs',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // ── Card — Flipkart flat style ────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    position: 'relative',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: '16@s',
    paddingVertical: '14@vs',
    paddingLeft: '20@s',        // extra left padding to clear the unread bar
    gap: '12@s',
  },
  iconCircle: {
    width: '44@s', height: '44@s', borderRadius: '22@ms',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EBEBEB',
    flexShrink: 0,
  },
  cardBody: { flex: 1 },

  // Top row: title + time
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4@vs',
    gap: '8@s',
  },
  title: {
    flex: 1, fontSize: '13@ms',
    fontFamily: FONTS.Medium, color: '#666',
  },
  time: {
    fontSize: '11@ms', color: '#BDBDBD', fontFamily: FONTS.Medium,
    flexShrink: 0,
  },

  // Message
  message: {
    fontSize: '13@ms', color: '#555',
    fontFamily: FONTS.Medium, lineHeight: '19@ms',
    marginBottom: '8@vs',
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryChip: {
    paddingHorizontal: '8@s', paddingVertical: '3@vs',
    borderRadius: '4@ms',
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    fontSize: '9@ms', fontFamily: FONTS.Bold, letterSpacing: 0.8,
  },


  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center', paddingTop: vs(60), paddingHorizontal: s(40),
  },
  emptyIconWrap: {
    width: '88@s', height: '88@s', borderRadius: '44@ms',
    backgroundColor: color.secondarylight,
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

  // ── Loader ────────────────────────────────────────────────────────────────
  loaderWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: '12@vs',
  },
  loaderText: {
    fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium,
  },
})