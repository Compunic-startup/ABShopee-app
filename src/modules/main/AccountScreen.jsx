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
  Platform,
  ToastAndroid,
} from 'react-native'
import { ScaledSheet, ms, s, vs } from 'react-native-size-matters'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BASE_URL from '../../core/services/api'
import FONTS from '../../core/utils/fonts'
import color from '../../core/utils/color'
import { SafeAreaView } from 'react-native-safe-area-context'

const MENU_SECTIONS = [
  {
    title: 'My Orders & Activity',
    items: [
      { key: 'orders', icon: 'package-variant', label: 'My Orders', route: 'OrdersScreen' },
      { key: 'loyalty', icon: 'star-circle', label: 'Loyalty Points', route: 'LoyaltyPointsScreen' },
      { key: 'addresses', icon: 'map-marker-outline', label: 'My Addresses', route: 'AddressesScreen' },
      { key: 'wishlist', icon: 'heart-outline', label: 'Wishlist', route: 'WishlistScreen' },
      { key: 'transactions', icon: 'cash-multiple', label: 'Transactions', route: 'usertransactions' },
      { key: 'refunds', icon: 'cash-refund', label: 'Returns & Replacements', route: 'returnreplacement' },
      { key: 'cancellations', icon: 'cancel', label: 'Cancellations', route: 'cancellations' },
    ],
  },
  {
    title: 'Notifications & Communication',
    items: [
      { key: 'notifications', icon: 'bell-outline', label: 'Notifications', route: 'NotificationsScreen' },
    ],
  },
  {
    title: 'Account Settings',
    items: [
      { key: 'cart', icon: 'cart-outline', label: 'My Cart', route: 'CartScreen' },
      { key: 'edit', icon: 'account-edit-outline', label: 'Edit Profile', route: 'EditProfileScreen' },
    ],
  },
]

function MenuRow({ item, isLast, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuIconBox}>
        <Icon name={item.icon} size={ms(20)} color={color.primary} />
      </View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      <Icon name="chevron-right" size={ms(20)} color="#BDBDBD" />
    </TouchableOpacity>
  )
}

function InfoRow({ icon, value }) {
  if (!value) return null
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={ms(14)} color="#888" />
      <Text style={styles.infoText} numberOfLines={2}>{value}</Text>
    </View>
  )
}

export default function AccountScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [profile, setProfile] = useState(null)

  const fadeAnim = useRef(new Animated.Value(0)).current

  const fetchProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/customer-business-profile`,
        { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      console.log('Profile fetch response:', json)
      if (json?.success && json?.data) {
        await AsyncStorage.setItem('userProfile', JSON.stringify(json.data))
        setProfile(json.data)
      } else {
        const code = json?.error?.code
        if (code === 'BUSINESS_NOT_FOUND') ToastAndroid.show('Business not found', ToastAndroid.SHORT)
        if (code === 'CUSTOMER_BUSINESS_PROFILE_NOT_FOUND') ToastAndroid.show('Profile not found', ToastAndroid.SHORT)
      }
    } catch {
      ToastAndroid.show('Network error. Please try again.', ToastAndroid.SHORT)
    }
  }, [])

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
    }
  }, [loading])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchProfile()
    setRefreshing(false)
  }, [fetchProfile])

  useFocusEffect(useCallback(() => { fetchProfile() }, []))

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userProfile', 'Identifier'])
    setIsLoggedIn(false)
  }

  const userProfile = profile?.userProfile ?? {}
  const firstName = userProfile.firstName || null
  const lastName = userProfile.lastName || null
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Customer'
  const email = profile?.email || null
  const phone = userProfile.phone || profile?.phone || null
  const avatarUrl = userProfile.avatarUrl || null
  const tradeName = profile?.tradeName || null
  const legalName = profile?.legalName || null
  const gst = profile?.isGstRegistered && profile?.gstNumber ? profile.gstNumber : null
  const pan = profile?.panNumber || null
  const website = profile?.website || null
  const isActive = profile?.status === 'active'

  const addr = profile?.address ?? {}
  const formattedAddress = [
    addr.addressLine1, addr.addressLine2,
    addr.city, addr.state, addr.postalCode,
  ].filter(Boolean).join(', ') || null

  const initial = (firstName?.[0] || 'U').toUpperCase()

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
        </View>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </View>
    )
  }

  return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={color.primary} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[color.primary]}
              tintColor={color.primary}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            <View style={styles.profileHero}>
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}
                {/* Active dot */}
                <View style={[
                  styles.activeDot,
                  { backgroundColor: isActive ? '#43A047' : '#BDBDBD' },
                ]} />
              </View>

              {/* Name + status */}
              <View style={styles.heroText}>
                <Text style={styles.heroName} numberOfLines={1}>{displayName}</Text>
                {tradeName && tradeName !== displayName && (
                  <Text style={styles.heroTrade} numberOfLines={1}>{tradeName}</Text>
                )}
                <View style={[
                  styles.statusPill,
                  { backgroundColor: isActive ? color.primary + 20 : color.background },
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? '#43A047' : '#BDBDBD' },
                  ]} />
                  <Text style={[
                    styles.statusTxt,
                    { color: isActive ? '#2E7D32' : '#888' },
                  ]}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              {/* Edit shortcut */}
              <TouchableOpacity
                style={styles.editHeroBtn}
                onPress={() => navigation.navigate('EditProfileScreen', { profile })}
                activeOpacity={0.7}
              >
                <Icon name="pencil-outline" size={ms(16)} color={color.primary} />
              </TouchableOpacity>
            </View>

            {/* ── Contact / business info block ── */}
            {(email || phone || legalName || gst || pan || website) && (
              <View style={styles.infoBlock}>
                <InfoRow icon="email-outline" value={email} />
                <InfoRow icon="phone-outline" value={phone} />
                <InfoRow icon="domain" value={legalName} />
                <InfoRow icon="file-certificate-outline" value={gst ? `GST: ${gst}` : null} />
                <InfoRow icon="card-account-details-outline" value={pan ? `PAN: ${pan}` : null} />
                <InfoRow icon="web" value={website} />
              </View>
            )}

            {/* ── Menu sections — Flipkart layout ── */}
            {MENU_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionCard}>
                  {section.items.map((item, i) => (
                    <MenuRow
                      key={item.key}
                      item={item}
                      isLast={i === section.items.length - 1}
                      onPress={() => {
                        if (item.key === 'orders') {
                          navigation.navigate('Tabs', { screen: 'Orders' })
                        } else if (item.key === 'edit') {
                          navigation.navigate('EditProfileScreen', { profile })
                        } else {
                          navigation.navigate(item.route)
                        }
                      }}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* ── Logout ── */}
            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={handleLogout}
                  activeOpacity={0.6}
                >
                  <View style={[styles.menuIconBox, styles.menuIconBoxRed]}>
                    <Icon name="logout" size={ms(20)} color="#C62828" />
                  </View>
                  <Text style={[styles.menuLabel, { color: '#C62828' }]}>Logout</Text>
                  <Icon name="chevron-right" size={ms(20)} color="#BDBDBD" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── App version footer ── */}
            <Text style={styles.versionText}>All Rights Reserved, AB Computers {'\n'} RNT Marg Silver Mall, Indore, 452012</Text>
            <View style={{ height: vs(10) }} />
          </Animated.View>
        </ScrollView>
      </View>
  )
}

// ─── Styles — ONLY color.* values ────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: '10@vs' },
  loadingText: { fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '22@vs',
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

  // ── Profile hero — tight Flipkart-style strip ──────────────────────────────
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: '16@s',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    gap: '12@s',
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: '56@s', height: '56@s', borderRadius: '28@ms',
    borderWidth: 2, borderColor: color.secondary,
  },
  avatarFallback: {
    width: '56@s', height: '56@s', borderRadius: '28@ms',
    backgroundColor: color.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: color.secondary,
  },
  avatarInitial: { fontSize: '22@ms', fontFamily: FONTS.Bold, color: '#fff' },
  activeDot: {
    position: 'absolute', bottom: '1@s', right: '1@s',
    width: '12@s', height: '12@s', borderRadius: '6@ms',
    borderWidth: 2, borderColor: '#fff',
  },
  heroText: { flex: 1 },
  heroName: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text },
  heroTrade: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888', marginTop: '2@vs' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    alignSelf: 'flex-start', marginTop: '5@vs',
    paddingHorizontal: '8@s', paddingVertical: '3@vs',
    borderRadius: '20@ms',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  statusDot: { width: '6@s', height: '6@s', borderRadius: '3@ms' },
  statusTxt: { fontSize: '11@ms', fontFamily: FONTS.Medium },
  editHeroBtn: {
    width: '34@s', height: '34@s', borderRadius: '17@ms',
    backgroundColor: color.primary + 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EEE',
  },

  // ── Info block (email, phone etc.) ────────────────────────────────────────
  infoBlock: {
    backgroundColor: '#fff',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    borderBottomWidth: '8@vs',
    borderBottomColor: color.background,
    gap: '10@vs',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '10@s',
  },
  infoText: {
    flex: 1, fontSize: '13@ms', color: color.text,
    fontFamily: FONTS.Medium, lineHeight: '19@ms',
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: { marginTop: '8@vs' },
  sectionTitle: {
    fontSize: '12@ms', fontFamily: FONTS.Bold,
    color: '#888', letterSpacing: 0.5,
    paddingHorizontal: '16@s',
    paddingVertical: '8@vs',
    backgroundColor: color.background,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB',
  },

  // ── Menu row — Flipkart: icon + label + chevron, no background fill ────────
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: '16@s', paddingVertical: '14@vs',
    backgroundColor: '#fff',
    gap: '14@s',
  },
  menuRowBorder: {
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  menuIconBox: {
    width: '36@s', height: '36@s', borderRadius: '8@ms',
    backgroundColor: color.primary + 20,
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconBoxRed: {
    backgroundColor: '#FFEBEE',
  },
  menuLabel: {
    flex: 1, fontSize: '14@ms',
    fontFamily: FONTS.Medium, color: color.text,
  },

  // ── Version footer ────────────────────────────────────────────────────────
  versionText: {
    textAlign: 'center',
    fontSize: '12@ms',
    color: '#BDBDBD',
    fontFamily: FONTS.Medium,
    marginTop: '16@vs',
    marginBottom: '4@vs',
  },
})