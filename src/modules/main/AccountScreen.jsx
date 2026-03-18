import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Image,
  RefreshControl,
  StyleSheet,
  Platform,
  ToastAndroid,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BASE_URL from '../../core/services/api'
import FONTS from '../../core/utils/fonts'

/* ─── palette ─── */
const BLUE = '#0B77A7'
const BLUE_DARK = '#085f87'
const BLUE_LIGHT = '#E8F4FB'
const BLUE_MID = '#C2E0F0'
const WHITE = '#FFFFFF'
const BG = '#F4F9FC'
const TEXT_DARK = '#0D1B2A'
const TEXT_MID = '#4A6070'
const TEXT_LIGHT = '#8FA8B8'
const BORDER = '#DCE8F0'
const DEALER_GOLD = '#C8973A'
const DEALER_GOLD_BG = '#FDF6E9'

/* ─── menu config ─── */
const getUserMenu = stats => [
  { key: 'wishlist', icon: 'heart-outline', label: 'Wishlist', subtitle: `Your saved items`, route: 'WishlistScreen' },
  { key: 'transactions', icon: 'cash-multiple', label: 'Transactions', subtitle: 'Payment history', route: 'usertransactions' },
  { key: 'refunds', icon: 'cash-refund', label: 'Refunds', subtitle: 'Track your refunds', route: 'userrefunds' },
  { key: 'notifications', icon: 'bell-outline', label: 'Notifications', subtitle: 'Alerts & updates', route: 'NotificationsScreen' },
  // { key: 'support',       icon: 'headset',                   label: 'Help & Support',    subtitle: 'FAQs, Contact us',                 route: 'HelpScreen' },
]

const getDealerMenu = stats => [
  { key: 'orders', icon: 'clipboard-list-outline', label: 'Dealer Orders', subtitle: `${stats.orders} bulk orders`, route: 'OrdersScreen', dealerOnly: true },
  { key: 'transactions', icon: 'bank-outline', label: 'Business Transactions', subtitle: 'B2B payment ledger', route: 'usertransactions', dealerOnly: true },
  { key: 'refunds', icon: 'cash-refund', label: 'Refunds & Disputes', subtitle: 'Raise & track claims', route: 'userrefunds', dealerOnly: true },
  { key: 'wishlist', icon: 'bookmark-multiple-outline', label: 'Saved Lists', subtitle: `${stats.wishlist} procurement lists`, route: 'WishlistScreen', dealerOnly: true },
  { key: 'notifications', icon: 'bell-badge-outline', label: 'Trade Notifications', subtitle: 'Price & stock alerts', route: 'NotificationsScreen', dealerOnly: true },
  // { key: 'support',       icon: 'face-agent',               label: 'Priority Support',         subtitle: 'Dedicated B2B assistance',            route: 'HelpScreen',          dealerOnly: true },
]

/* ─── StatCard ─── */
function StatCard({ item, isDealer, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const onIn = () => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start()
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={onIn} onPressOut={onOut}
        activeOpacity={1}
        style={[styles.statCard, isDealer && styles.statCardDealer]}
      >
        <View style={[styles.statIconWrap, isDealer ? styles.statIconWrapDealer : styles.statIconWrapUser]}>
          <Icon name={item.icon} size={22} color={isDealer ? DEALER_GOLD : BLUE} />
        </View>
        <Text style={[styles.statValue, isDealer && styles.statValueDealer]}>{item.value}</Text>
        <Text style={styles.statLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ─── MenuItem ─── */
function MenuItem({ item, isDealer, isLast, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const onIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={onIn} onPressOut={onOut}
        activeOpacity={1}
        style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      >
        <View style={[
          styles.menuIconWrap,
          isDealer && item.dealerOnly ? styles.menuIconWrapDealer : styles.menuIconWrapUser,
        ]}>
          <Icon name={item.icon} size={20} color={isDealer && item.dealerOnly ? DEALER_GOLD : BLUE} />
        </View>
        <View style={styles.menuTextBlock}>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={TEXT_LIGHT} />
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ─── Business Info Row ─── */
function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={15} color={TEXT_LIGHT} style={{ marginTop: 1 }} />
      <View style={styles.infoRowText}>
        <Text style={styles.infoRowLabel}>{label}</Text>
        <Text style={styles.infoRowValue}>{value}</Text>
      </View>
    </View>
  )
}

/* ─── Main Component ─── */
export default function AccountScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [profile, setProfile] = useState(null)   // raw API response data
  const [stats, setStats] = useState({ orders: 0, wishlist: 5, addresses: 2 })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const headerAnim = useRef(new Animated.Value(0)).current

  /* ── fetch profile ── */
  const fetchProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      const res = await fetch(`${BASE_URL}/customer/business/${businessId}/customer-business-profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json()
      console.log('Profile fetch response:', json)

      if (json?.success && json?.data) {
        await AsyncStorage.setItem(
          'userProfile',
          JSON.stringify(json.data)
        )
      }

      if (json?.success && json?.data) {
        setProfile(json.data)
      } else {
        const code = json?.error?.code
        if (code === 'BUSINESS_NOT_FOUND') {
          ToastAndroid.show('Business not found', ToastAndroid.SHORT)
        } else if (code === 'CUSTOMER_BUSINESS_PROFILE_NOT_FOUND') {
          ToastAndroid.show('Business profile not found', ToastAndroid.SHORT)
        }
      }
    } catch (err) {
      console.error('fetchProfile error:', err)
      ToastAndroid.show('Network error. Please try again.', ToastAndroid.SHORT)
    }
  }, [])

  /* ── initial load ── */
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()

    fetchProfile().finally(() => {
      setLoading(false)
    })
  }, [])

  /* ── fade-in after load ── */
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }, [loading])

  /* ── pull-to-refresh ── */
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchProfile()
    setRefreshing(false)
  }, [fetchProfile])

  /* ── derived display values ── */
  const userProfile = profile?.userProfile ?? {}
  const address = profile?.address ?? {}
  const isDealer = profile?.businessType === 'wholesale' || profile?.businessType === 'dealer'

  const displayName = [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ')
    || 'Customer'

  const displayEmail = profile?.email || 'No email on record'
  const displayPhone = userProfile.phone || profile?.phone || ''
  const avatarUrl = userProfile.avatarUrl || null

  const memberLabel = isDealer
    ? (profile?.businessType === 'wholesale' ? 'Wholesale Member' : 'Dealer Member')
    : 'Regular Member'

  const menuItems = isDealer ? getDealerMenu(stats) : getUserMenu(stats)

  const statRows = [
    { label: 'Orders', value: stats.orders, icon: 'package-variant', route: 'OrdersScreen' },
    { label: 'Wishlist', value: stats.wishlist, icon: 'heart', route: 'WishlistScreen' },
    { label: 'Addresses', value: stats.addresses, icon: 'map-marker', route: 'AddressesScreen' },
  ]

  const formattedAddress = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
  ].filter(Boolean).join(', ')

  /* ── logout ── */
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userProfile', 'Identifier'])
    setIsLoggedIn(false)
  }

  /* ── loading screen ── */
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Text style={styles.headerTitle}>My Account</Text>
        </Animated.View>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </View>
    )
  }

  /* ── main render ── */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }),
            }],
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Icon name="account-circle-outline" size={20} color={WHITE} />
          </View>
          <View>
            <Text style={styles.headerEyebrow}>Manage</Text>
            <Text style={styles.headerTitle}>My Account</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BLUE]}
            tintColor={BLUE}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Profile Card ── */}
          <View style={[styles.profileCard, isDealer && styles.profileCardDealer]}>

            {/* Dealer badge strip */}
            {isDealer && (
              <View style={styles.dealerStrip}>
                <Icon name="crown" size={13} color={DEALER_GOLD} />
                <Text style={styles.dealerStripText}>
                  {profile?.tradeName || profile?.legalName || 'Business Account'}
                </Text>
              </View>
            )}

            <View style={styles.profileHeader}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Icon name="account" size={38} color={BLUE} />
                  </View>
                )}
                <View style={[styles.statusDot, { backgroundColor: profile?.status === 'active' ? '#4CAF50' : '#9E9E9E' }]} />
              </View>

              {/* Name + contact */}
              <View style={styles.profileInfo}>
                <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>

                {displayEmail ? (
                  <View style={styles.infoChip}>
                    <Icon name="email-outline" size={13} color={TEXT_MID} />
                    <Text style={styles.infoChipText} numberOfLines={1}>{displayEmail}</Text>
                  </View>
                ) : null}

                {displayPhone ? (
                  <View style={styles.infoChip}>
                    <Icon name="phone-outline" size={13} color={TEXT_MID} />
                    <Text style={styles.infoChipText}>{displayPhone}</Text>
                  </View>
                ) : null}

                <View style={[styles.memberBadge, isDealer && styles.memberBadgeDealer]}>
                  <Icon name={isDealer ? 'crown' : 'account-check'} size={12} color={isDealer ? DEALER_GOLD : BLUE} />
                  <Text style={[styles.memberText, isDealer && styles.memberTextDealer]}>{memberLabel}</Text>
                </View>
              </View>
            </View>

            {/* Business details section */}
            {profile && (
              <View style={styles.businessDetails}>
                <View style={styles.businessDetailsDivider} />

                {profile.legalName ? (
                  <InfoRow icon="domain" label="Legal Name" value={profile.legalName} />
                ) : null}
                {profile.gstNumber && profile.isGstRegistered ? (
                  <InfoRow icon="file-certificate-outline" label="GST No." value={profile.gstNumber} />
                ) : null}
                {profile.panNumber ? (
                  <InfoRow icon="card-account-details-outline" label="PAN" value={profile.panNumber} />
                ) : null}
                {formattedAddress ? (
                  <InfoRow icon="map-marker-outline" label="Address" value={formattedAddress} />
                ) : null}
                {profile.website ? (
                  <InfoRow icon="web" label="Website" value={profile.website} />
                ) : null}
              </View>
            )}
          </View>

          {/* ── Menu ── */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>
              {isDealer ? 'Business Menu' : 'My Activity'}
            </Text>
            <View style={[styles.menuCard, isDealer && styles.menuCardDealer]}>
              {menuItems.map((item, i) => (
                <MenuItem
                  key={item.key}
                  item={item}
                  isDealer={isDealer}
                  isLast={i === menuItems.length - 1}
                  onPress={() => navigation.navigate(item.route)}
                />
              ))}
            </View>
          </View>

          {/* ── Account Settings ── */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>Settings</Text>
            <View style={styles.menuCard}>
              {[
                { key: 'cart', icon: 'account-edit-outline', label: 'Cart', subtitle: 'See Your Cart', route: 'CartScreen' },
                // { key: 'profile', icon: 'account-edit-outline', label: 'Become a B2B Customer', subtitle: 'Register your details', route: 'ProfileInfoScreen' },
                { key: 'edit', icon: 'account-edit-outline', label: 'Edit Profile', subtitle: 'Update your details', route: 'EditProfileScreen' },
                // { key: 'security', icon: 'shield-check-outline',  label: 'Privacy & Security', subtitle: 'Password, 2FA',         route: 'SecurityScreen' },
                // { key: 'terms',    icon: 'file-document-outline', label: 'Terms & Conditions', subtitle: 'User agreement',        route: 'TermsScreen' },
                // { key: 'privacy',  icon: 'shield-lock-outline',   label: 'Privacy Policy',     subtitle: 'Data protection',       route: 'PrivacyScreen' },
              ].map((item, i, arr) => (
                <MenuItem
                  key={item.key}
                  item={item}
                  isDealer={false}
                  isLast={i === arr.length - 1}
                  onPress={() =>
                    item.route === 'EditProfileScreen'
                      ? navigation.navigate('EditProfileScreen', { profile })
                      : navigation.navigate(item.route)
                  }
                />
              ))}
            </View>
          </View>

          {/* ── Logout ── */}
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#F44336" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 48 }} />
        </Animated.View>
      </ScrollView>
    </View>
  )
}

/* ─── styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    backgroundColor: BLUE,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 10, color: 'rgba(255,255,255,0.65)',
    fontFamily: FONTS.Medium, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20, fontFamily: FONTS.Bold, color: WHITE,
    letterSpacing: -0.3, lineHeight: 24,
  },

  /* Loader */
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: TEXT_MID, fontFamily: FONTS.Medium, letterSpacing: 0.4 },

  /* Profile Card */
  profileCard: {
    margin: 16,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCardDealer: {
    borderColor: '#E8D5A8',
    shadowColor: DEALER_GOLD,
  },
  dealerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DEALER_GOLD_BG,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  dealerStripText: {
    fontSize: 12,
    fontFamily: FONTS.Bold,
    color: DEALER_GOLD,
    letterSpacing: 0.3,
  },
  profileHeader: { flexDirection: 'row', gap: 14 },

  /* Avatar */
  avatarContainer: { position: 'relative', alignSelf: 'flex-start' },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: BLUE_MID },
  avatarPlaceholder: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: BLUE_MID,
  },
  statusDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 13, height: 13, borderRadius: 7,
    borderWidth: 2, borderColor: WHITE,
  },

  /* Profile info */
  profileInfo: { flex: 1, justifyContent: 'center', gap: 5 },
  userName: { fontSize: 17, fontFamily: FONTS.Bold, color: TEXT_DARK, letterSpacing: -0.2 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoChipText: { fontSize: 12, color: TEXT_MID, fontFamily: FONTS.Regular, flex: 1 },

  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: BLUE_LIGHT,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  memberBadgeDealer: { backgroundColor: DEALER_GOLD_BG },
  memberText: { fontSize: 11, fontFamily: FONTS.Medium, color: BLUE },
  memberTextDealer: { color: DEALER_GOLD },

  /* Business details */
  businessDetails: { marginTop: 12 },
  businessDetailsDivider: { height: 1, backgroundColor: BORDER, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  infoRowText: { flex: 1 },
  infoRowLabel: { fontSize: 10, fontFamily: FONTS.Medium, color: TEXT_LIGHT, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoRowValue: { fontSize: 13, fontFamily: FONTS.Medium, color: TEXT_DARK, marginTop: 1 },

  /* Stats */
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
  },
  statCard: {
    backgroundColor: WHITE,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  statCardDealer: { borderColor: '#E8D5A8' },
  statIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  statIconWrapUser: { backgroundColor: BLUE_LIGHT },
  statIconWrapDealer: { backgroundColor: DEALER_GOLD_BG },
  statValue: { fontSize: 18, fontFamily: FONTS.Bold, color: TEXT_DARK },
  statValueDealer: { color: DEALER_GOLD },
  statLabel: { fontSize: 11, color: TEXT_LIGHT, fontFamily: FONTS.Medium, marginTop: 2 },

  /* Menu */
  menuSection: { marginTop: 20, marginHorizontal: 16 },
  sectionLabel: {
    fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_LIGHT,
    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8,
  },
  menuCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  menuCardDealer: { borderColor: '#E8D5A8' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  menuIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconWrapUser: { backgroundColor: BLUE_LIGHT },
  menuIconWrapDealer: { backgroundColor: DEALER_GOLD_BG },
  menuTextBlock: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_DARK },
  menuSubtitle: { fontSize: 11, color: TEXT_LIGHT, fontFamily: FONTS.Regular, marginTop: 2 },

  /* Version */
  versionCard: { alignItems: 'center', marginTop: 24, gap: 3 },
  versionText: { fontSize: 12, color: TEXT_LIGHT, fontFamily: FONTS.Medium },
  versionSubtext: { fontSize: 11, color: '#C0CDD6', fontFamily: FONTS.Regular },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 12, marginHorizontal: 16,
    padding: 14, backgroundColor: '#FFF5F5',
    borderRadius: 14, gap: 8,
    borderWidth: 1, borderColor: '#FFD5D5',
  },
  logoutText: { fontSize: 15, color: '#F44336', fontFamily: FONTS.Bold, letterSpacing: 0.2 },
})
