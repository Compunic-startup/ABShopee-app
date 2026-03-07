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
  StyleSheet,
  Platform,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'

/* ─── palette ─── */
const BLUE       = '#0B77A7'
const BLUE_DARK  = '#085f87'
const BLUE_LIGHT = '#E8F4FB'
const BLUE_MID   = '#C2E0F0'
const WHITE      = '#FFFFFF'
const BG         = '#F4F9FC'
const TEXT_DARK  = '#0D1B2A'
const TEXT_MID   = '#4A6070'
const TEXT_LIGHT = '#8FA8B8'
const BORDER     = '#DCE8F0'
const UNREAD_BG  = '#EEF7FC'

/* ─── category → icon / colour config ─── */
const getCategoryConfig = (category, eventKey) => {
  const map = {
    order: {
      'order.placed':    { icon: 'shopping-outline',       color: BLUE,      bg: BLUE_LIGHT },
      'order.confirmed': { icon: 'check-circle-outline',   color: '#1E8C45', bg: '#E8F5EE' },
      'order.shipped':   { icon: 'truck-delivery-outline', color: '#0097A7', bg: '#E0F7FA' },
      'order.delivered': { icon: 'package-variant-closed', color: '#1E8C45', bg: '#E8F5EE' },
      'order.cancelled': { icon: 'close-circle-outline',   color: '#C62828', bg: '#FFEBEE' },
      default:           { icon: 'receipt',                color: BLUE,      bg: BLUE_LIGHT },
    },
    payment: {
      'payment.success': { icon: 'check-decagram',         color: '#1E8C45', bg: '#E8F5EE' },
      'payment.failed':  { icon: 'alert-circle-outline',   color: '#C62828', bg: '#FFEBEE' },
      default:           { icon: 'credit-card-outline',    color: '#6A1B9A', bg: '#F3E5F5' },
    },
    promo: {
      default:           { icon: 'tag-outline',            color: '#E65100', bg: '#FFF3E0' },
    },
    system: {
      default:           { icon: 'bell-outline',           color: TEXT_MID,  bg: '#F0F4F8' },
    },
    default: {
      default:           { icon: 'bell-outline',           color: TEXT_MID,  bg: '#F0F4F8' },
    },
  }

  const catMap = map[category?.toLowerCase()] || map.default
  return catMap[eventKey] || catMap.default
}

/* ─── relative time ─── */
const getRelativeTime = dateStr => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins < 1)    return 'Just now'
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days < 7)    return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/* ─── filter tabs ─── */
const FILTERS = [
  { key: 'all',     label: 'All',      icon: 'bell-outline' },
  { key: 'order',   label: 'Orders',   icon: 'shopping-outline' },
  { key: 'payment', label: 'Payments', icon: 'credit-card-outline' },
  { key: 'promo',   label: 'Offers',   icon: 'tag-outline' },
]

/* ═══════════════════════════════════════════════════════ */
/*  Notification Card                                       */
/* ═══════════════════════════════════════════════════════ */
function NotificationCard({ item, index, listFadeAnim }) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isUnread  = !item.readAt
  const cfg       = getCategoryConfig(item.category, item.eventKey)

  const fullDate = new Date(item.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  return (
    <Animated.View
      style={{
        opacity: listFadeAnim,
        transform: [
          { scale: scaleAnim },
          {
            translateY: listFadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, isUnread && styles.cardUnread]}
      >
        {/* unread indicator bar */}
        {isUnread && <View style={styles.unreadBar} />}

        <View style={styles.cardInner}>
          {/* icon */}
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon} size={22} color={cfg.color} />
          </View>

          {/* content */}
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.timeText}>{getRelativeTime(item.createdAt)}</Text>
            </View>

            <Text style={styles.notifMessage} numberOfLines={2}>
              {item.message}
            </Text>

            <View style={styles.cardBottomRow}>
              <View style={[styles.categoryPill, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.categoryPillText, { color: cfg.color }]}>
                  {item.category?.toUpperCase()}
                </Text>
              </View>
              {isUnread && (
                <View style={styles.unreadDot} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  Main Screen                                            */
/* ═══════════════════════════════════════════════════════ */
export default function NotificationsScreen() {
  const navigation = useNavigation()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')

  const listFadeAnim   = useRef(new Animated.Value(0)).current
  const headerSlideAnim = useRef(new Animated.Value(-30)).current
  const headerOpacity  = useRef(new Animated.Value(0)).current

  /* header entrance */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity,   { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(headerSlideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [])

  /* list entrance after load */
  useEffect(() => {
    if (!loading) {
      listFadeAnim.setValue(0)
      Animated.timing(listFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }, [loading])

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
    }, [])
  )

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      const res  = await fetch(
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

  const onRefresh = () => {
    setRefreshing(true)
    fetchNotifications()
  }

  const filtered = selectedFilter === 'all'
    ? notifications
    : notifications.filter(n => n.category?.toLowerCase() === selectedFilter)

  const unreadCount = notifications.filter(n => !n.readAt).length

  /* ── render item ── */
  const renderItem = ({ item, index }) => (
    <NotificationCard item={item} index={index} listFadeAnim={listFadeAnim} />
  )

  /* ── empty state ── */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Icon name="bell-sleep-outline" size={52} color={BLUE_MID} />
      </View>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySubtitle}>No notifications here yet. We'll let you know when something arrives.</Text>
    </View>
  )

  /* ── date section header ── */
  const renderSectionDate = () => null  // can extend to group by date later

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      {/* ── Header ── */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerSlideAnim }] },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={28} color={WHITE} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
          {/* <TouchableOpacity style={styles.markAllBtn} activeOpacity={0.75}>
            <Icon name="check-all" size={18} color={WHITE} />
          </TouchableOpacity> */}
        </View>
      </Animated.View>

      {/* ── Filter tabs ── */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => {
          const isActive = selectedFilter === f.key
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setSelectedFilter(f.key)}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              activeOpacity={0.8}
            >
              <Icon name={f.icon} size={15} color={isActive ? WHITE : TEXT_LIGHT} />
              <Text style={[styles.filterTabLabel, isActive && styles.filterTabLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Count row ── */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          )}
        </View>
      )}

      {/* ── List / Loader ── */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Fetching notifications…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.notificationId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BLUE]}
              tintColor={BLUE}
            />
          }
        />
      )}
    </View>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  Styles                                                 */
/* ═══════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    backgroundColor: BLUE,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight:10
  },
  headerEyebrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: FONTS.Medium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    color: WHITE,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unreadBadge: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.Bold,
    color: BLUE,
  },
  markAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Filter bar */
  filterBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterTabActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabLabel: {
    fontSize: 11,
    fontFamily: FONTS.Medium,
    color: TEXT_LIGHT,
  },
  filterTabLabelActive: {
    color: WHITE,
    fontFamily: FONTS.Bold,
  },

  /* Count row */
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  countText: {
    fontSize: 11,
    fontFamily: FONTS.Medium,
    color: TEXT_LIGHT,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  unreadCount: {
    fontSize: 11,
    fontFamily: FONTS.Bold,
    color: BLUE,
    letterSpacing: 0.4,
  },

  /* List */
  list: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
  },

  /* Card */
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: UNREAD_BG,
    borderColor: BLUE_MID,
    shadowOpacity: 0.10,
    elevation: 3,
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: BLUE,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: TEXT_MID,
    flex: 1,
    marginRight: 8,
  },
  notifTitleUnread: {
    fontFamily: FONTS.Bold,
    color: TEXT_DARK,
  },
  timeText: {
    fontSize: 11,
    fontFamily: FONTS.Regular,
    color: TEXT_LIGHT,
    flexShrink: 0,
  },
  notifMessage: {
    fontSize: 13,
    fontFamily: FONTS.Regular,
    color: TEXT_MID,
    lineHeight: 19,
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 9,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
  },

  /* Empty */
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BLUE_MID,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: FONTS.Regular,
    color: TEXT_MID,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Loader */
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: TEXT_MID,
    letterSpacing: 0.3,
  },
})
