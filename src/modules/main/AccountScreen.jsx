// import React, { useEffect, useState } from 'react'
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   StatusBar,
//   Animated,
//   Image,
//   RefreshControl,
// } from 'react-native'
// import { ScaledSheet } from 'react-native-size-matters'
// import { useNavigation } from '@react-navigation/native'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
// import FONTS from '../../core/utils/fonts'
// import AsyncStorage from '@react-native-async-storage/async-storage'

// export default function AccountScreen({setIsLoggedIn}) {
//   const navigation = useNavigation()
//   const [loading, setLoading] = useState(true)
//   const [refreshing, setRefreshing] = useState(false)
//   const [fadeAnim] = useState(new Animated.Value(0))

//   const [user] = useState({
//     name: 'User',
//     email: 'User@example.com',
//     phone: '+91 9876543210',
//     avatar: null,
//     memberType: 'Premium Member',
//   })

//   const [stats, setStats] = useState({
//     orders: 8,
//     wishlist: 5,
//     addresses: 2,
//   })

//   useEffect(() => {
//     setTimeout(() => {
//       setLoading(false)
//     }, 800)
//   }, [])

//   useEffect(() => {
//     if (!loading) {
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 400,
//         useNativeDriver: true,
//       }).start()
//     }
//   }, [loading])

//   const onRefresh = () => {
//     setRefreshing(true)
//     setTimeout(() => {
//       setStats({
//         orders: Math.floor(Math.random() * 10) + 1,
//         wishlist: Math.floor(Math.random() * 10) + 1,
//         addresses: 2,
//       })
//       setRefreshing(false)
//     }, 1000)
//   }

//   const menuSections = [
//     {
//       title: 'My Activity',
//       items: [
//         {
//           icon: 'package-variant',
//           label: 'My Orders',
//           subtitle: `${stats.orders} orders`,
//           color: '#2196F3',
//           bgColor: '#E3F2FD',
//           route: 'OrdersScreen',
//         },
//         {
//           icon: 'cash',
//           label: 'Transactions',
//           subtitle: `${stats.orders} orders`,
//           color: '#059b00',
//           bgColor: '#E3F2FD',
//           route: 'usertransactions',
//         },
//         {
//           icon: 'cash-refund',
//           label: 'Refunds',
//           subtitle: `${stats.orders} orders`,
//           color: '#a5a200',
//           bgColor: '#E3F2FD',
//           route: 'userrefunds',
//         },
//         {
//           icon: 'heart',
//           label: 'Wishlist',
//           subtitle: `${stats.wishlist} items`,
//           color: '#FF5252',
//           bgColor: '#FFEBEE',
//           route: 'WishlistScreen',
//         },
//       ],
//     },

//     {
//       title: 'Account Settings',
//       items: [
//         {
//           icon: 'account-edit',
//           label: 'Edit Profile',
//           subtitle: 'Update your details',
//           color: '#9C27B0',
//           bgColor: '#F3E5F5',
//           route: 'EditProfileScreen',
//         },
//         {
//           icon: 'shield-check',
//           label: 'Privacy & Security',
//           subtitle: 'Password, 2FA',
//           color: '#FF9800',
//           bgColor: '#FFF3E0',
//           route: 'SecurityScreen',
//         },
//         {
//           icon: 'bell',
//           label: 'Notifications',
//           subtitle: 'Manage alerts',
//           color: '#00BCD4',
//           bgColor: '#E0F7FA',
//           route: 'NotificationsScreen',
//         },
//       ],
//     },
//     {
//       title: 'Support',
//       items: [
//         {
//           icon: 'help-circle',
//           label: 'Help & Support',
//           subtitle: 'FAQs, Contact us',
//           color: '#607D8B',
//           bgColor: '#ECEFF1',
//           route: 'HelpScreen',
//         },
//         {
//           icon: 'star',
//           label: 'Rate Our App',
//           subtitle: 'Share your feedback',
//           color: '#FFC107',
//           bgColor: '#FFF9C4',
//           route: 'RateAppScreen',
//         },
//         {
//           icon: 'share-variant',
//           label: 'Share App',
//           subtitle: 'Tell your friends',
//           color: '#4CAF50',
//           bgColor: '#E8F5E9',
//           route: 'ShareScreen',
//         },
//       ],
//     },
//     {
//       title: 'Legal',
//       items: [
//         {
//           icon: 'file-document',
//           label: 'Terms & Conditions',
//           subtitle: 'User agreement',
//           color: '#757575',
//           bgColor: '#F5F5F5',
//           route: 'TermsScreen',
//         },
//         {
//           icon: 'shield-lock',
//           label: 'Privacy Policy',
//           subtitle: 'Data protection',
//           color: '#757575',
//           bgColor: '#F5F5F5',
//           route: 'PrivacyScreen',
//         },
//       ],
//     },
//   ]

//   const handleLogout = async () => {
//     await AsyncStorage.removeItem('userToken')
//     setIsLoggedIn(false)
//   }

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>My Account</Text>
//         </View>
//         <View style={styles.loader}>
//           <ActivityIndicator size="large" color="#0B77A7" />
//           <Text style={styles.loadingText}>Loading profile...</Text>
//         </View>
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>My Account</Text>
//         <TouchableOpacity style={styles.settingsBtn}>
//           <Icon name="cog" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#0B77A7']}
//             tintColor="#0B77A7"
//           />
//         }
//       >
//         <Animated.View style={{ opacity: fadeAnim }}>
//           <View style={styles.profileCard}>
//             <View style={styles.profileHeader}>
//               <View style={styles.avatarContainer}>
//                 {user.avatar ? (
//                   <Image source={{ uri: user.avatar }} style={styles.avatar} />
//                 ) : (
//                   <View style={styles.avatarPlaceholder}>
//                     <Icon name="account" size={40} color="#0B77A7" />
//                   </View>
//                 )}
//                 <TouchableOpacity style={styles.editAvatarBtn}>
//                   <Icon name="camera" size={16} color="#fff" />
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.profileInfo}>
//                 <Text style={styles.userName}>{user.name}</Text>
//                 <View style={styles.row}>
//                   <Icon name="email" size={14} color="#666" />
//                   <Text style={styles.userText}>{user.email}</Text>
//                 </View>
//                 <View style={styles.row}>
//                   <Icon name="phone" size={14} color="#666" />
//                   <Text style={styles.userText}>{user.phone}</Text>
//                 </View>
//               </View>
//             </View>

//             <View style={styles.memberBadge}>
//               <Icon name="crown" size={16} color="#FFD700" />
//               <Text style={styles.memberText}>{user.memberType}</Text>
//             </View>
//           </View>

//           <View style={styles.statsContainer}>
//             {[
//               { label: 'Orders', value: stats.orders, icon: 'package-variant', color: '#2196F3', bg: '#E3F2FD', route: 'OrdersScreen' },
//               { label: 'Wishlist', value: stats.wishlist, icon: 'heart', color: '#FF5252', bg: '#FFEBEE', route: 'WishlistScreen' },
//               { label: 'Addresses', value: stats.addresses, icon: 'map-marker', color: '#4CAF50', bg: '#E8F5E9', route: 'AddressesScreen' },
//             ].map((item, i) => (
//               <TouchableOpacity
//                 key={i}
//                 style={styles.statCard}
//                 activeOpacity={0.8}
//                 onPress={() => navigation.navigate(item.route)}
//               >
//                 <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
//                   <Icon name={item.icon} size={24} color={item.color} />
//                 </View>
//                 <Text style={styles.statValue}>{item.value}</Text>
//                 <Text style={styles.statLabel}>{item.label}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {menuSections.map((section, sIndex) => (
//             <View key={sIndex} style={styles.menuSection}>
//               <Text style={styles.sectionTitle}>{section.title}</Text>
//               <View style={styles.menuCard}>
//                 {section.items.map((item, i) => (
//                   <TouchableOpacity
//                     key={i}
//                     style={styles.menuItem}
//                     activeOpacity={0.7}
//                     onPress={() => navigation.navigate(item.route)}
//                   >
//                     <View style={styles.menuLeft}>
//                       <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
//                         <Icon name={item.icon} size={22} color={item.color} />
//                       </View>
//                       <View>
//                         <Text style={styles.menuLabel}>{item.label}</Text>
//                         <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
//                       </View>
//                     </View>
//                     <Icon name="chevron-right" size={24} color="#999" />
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>
//           ))}

//           <View style={styles.versionCard}>
//             <Text style={styles.versionText}>Version 1.0.0</Text>
//             <Text style={styles.versionSubtext}>© 2026 TechStore</Text>
//           </View>

//           <TouchableOpacity
//             style={styles.logoutBtn}
//             activeOpacity={0.8}
//             onPress={handleLogout}
//           >
//             <Icon name="logout" size={20} color="#F44336" />
//             <Text style={styles.logoutText}>Logout</Text>
//           </TouchableOpacity>

//           <View style={{ height: 40 }} />
//         </Animated.View>
//       </ScrollView>
//     </View>
//   )
// }

// const styles = ScaledSheet.create({
//   container: { flex: 1, backgroundColor: '#F5F7FA' },
//   header: {
//     backgroundColor: '#0B77A7',
//     paddingTop: '40@ms',
//     paddingBottom: '20@ms',
//     paddingHorizontal: '16@ms',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   headerTitle: { color: '#fff', fontSize: '20@ms', fontFamily: FONTS.Bold },
//   settingsBtn: { padding: 6 },
//   loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   loadingText: { marginTop: 10, color: '#666' },
//   profileCard: {
//     margin: '16@ms',
//     padding: '16@ms',
//     backgroundColor: '#fff',
//     borderRadius: '12@ms',
//   },
//   profileHeader: { flexDirection: 'row' },
//   avatarContainer: { marginRight: '16@ms' },
//   avatar: { width: '80@ms', height: '80@ms', borderRadius: '40@ms' },
//   avatarPlaceholder: {
//     width: '80@ms',
//     height: '80@ms',
//     borderRadius: '40@ms',
//     backgroundColor: '#E3F2FD',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   editAvatarBtn: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     backgroundColor: '#0B77A7',
//     padding: 6,
//     borderRadius: 20,
//   },
//   profileInfo: { justifyContent: 'center' },
//   userName: { fontSize: '18@ms', fontFamily: FONTS.Bold, marginBottom: 6 },
//   row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
//   userText: { marginLeft: 6, color: '#555', fontSize: '12@ms' },
//   memberBadge: {
//     marginTop: '12@ms',
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   memberText: { marginLeft: 6, color: '#444', fontSize: '12@ms' },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginHorizontal: '16@ms',
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     marginHorizontal: 4,
//     padding: '12@ms',
//     borderRadius: '12@ms',
//     alignItems: 'center',
//   },
//   statIcon: {
//     padding: 10,
//     borderRadius: 30,
//     marginBottom: 6,
//   },
//   statValue: { fontSize: '16@ms', fontFamily: FONTS.Bold },
//   statLabel: { fontSize: '12@ms', color: '#666' },
//   menuSection: { marginTop: '16@ms', marginHorizontal: '16@ms' },
//   sectionTitle: {
//     fontSize: '14@ms',
//     fontFamily: FONTS.Bold,
//     marginBottom: '8@ms',
//     color: '#444',
//   },
//   menuCard: {
//     backgroundColor: '#fff',
//     borderRadius: '12@ms',
//   },
//   menuItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '14@ms',
//   },
//   menuLeft: { flexDirection: 'row', alignItems: 'center' },
//   menuIcon: {
//     width: '40@ms',
//     height: '40@ms',
//     borderRadius: '20@ms',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: '12@ms',
//   },
//   menuLabel: { fontSize: '14@ms', fontFamily: FONTS.Medium },
//   menuSubtitle: { fontSize: '11@ms', color: '#777' },
//   versionCard: {
//     alignItems: 'center',
//     marginTop: '20@ms',
//   },
//   versionText: { fontSize: '12@ms', color: '#888' },
//   versionSubtext: { fontSize: '11@ms', color: '#AAA' },
//   logoutBtn: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: '16@ms',
//     padding: '14@ms',
//     backgroundColor: '#fff',
//     marginHorizontal: '16@ms',
//     borderRadius: '12@ms',
//     gap: 6,
//   },
//   logoutText: {
//     marginLeft: 6,
//     color: '#F44336',
//     fontFamily: FONTS.Bold,
//   },
// })


import React, { useEffect, useRef, useState } from 'react'
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
  Switch,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../core/utils/fonts'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

/* dealer premium palette overlay */
const DEALER_ACCENT   = '#0B77A7'
const DEALER_GOLD     = '#C8973A'
const DEALER_GOLD_BG  = '#FDF6E9'
const DEALER_GOLD_MID = '#F0D9A8'

/* ─── menu config ─── */
const getUserMenu = stats => [
  {
    key: 'wishlist',
    icon: 'heart-outline',
    label: 'Wishlist',
    subtitle: `${stats.wishlist} saved items`,
    route: 'WishlistScreen',
  },
  {
    key: 'transactions',
    icon: 'cash-multiple',
    label: 'Transactions',
    subtitle: 'Payment history',
    route: 'usertransactions',
  },
  {
    key: 'refunds',
    icon: 'cash-refund',
    label: 'Refunds',
    subtitle: 'Track your refunds',
    route: 'userrefunds',
  },
  {
    key: 'notifications',
    icon: 'bell-outline',
    label: 'Notifications',
    subtitle: 'Alerts & updates',
    route: 'NotificationsScreen',
  },
  {
    key: 'support',
    icon: 'headset',
    label: 'Help & Support',
    subtitle: 'FAQs, Contact us',
    route: 'HelpScreen',
  },
]

const getDealerMenu = stats => [
  {
    key: 'orders',
    icon: 'clipboard-list-outline',
    label: 'Dealer Orders',
    subtitle: `${stats.orders} bulk orders`,
    route: 'OrdersScreen',
    dealerOnly: true,
  },
  {
    key: 'transactions',
    icon: 'bank-outline',
    label: 'Business Transactions',
    subtitle: 'B2B payment ledger',
    route: 'usertransactions',
    dealerOnly: true,
  },
  {
    key: 'refunds',
    icon: 'cash-refund',
    label: 'Refunds & Disputes',
    subtitle: 'Raise & track claims',
    route: 'userrefunds',
    dealerOnly: true,
  },
  {
    key: 'wishlist',
    icon: 'bookmark-multiple-outline',
    label: 'Saved Lists',
    subtitle: `${stats.wishlist} procurement lists`,
    route: 'WishlistScreen',
    dealerOnly: true,
  },
  {
    key: 'notifications',
    icon: 'bell-badge-outline',
    label: 'Trade Notifications',
    subtitle: 'Price & stock alerts',
    route: 'NotificationsScreen',
    dealerOnly: true,
  },
  {
    key: 'support',
    icon: 'face-agent',
    label: 'Priority Support',
    subtitle: 'Dedicated B2B assistance',
    route: 'HelpScreen',
    dealerOnly: true,
  },
]

/* ─── StatCard ─── */
function StatCard({ item, isDealer, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start()
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
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
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
        style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      >
        <View style={[
          styles.menuIconWrap,
          isDealer && item.dealerOnly ? styles.menuIconWrapDealer : styles.menuIconWrapUser,
        ]}>
          <Icon
            name={item.icon}
            size={20}
            color={isDealer && item.dealerOnly ? DEALER_GOLD : BLUE}
          />
        </View>

        <View style={styles.menuTextBlock}>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>

        <View style={styles.menuChevronWrap}>
          <Icon name="chevron-right" size={18} color={TEXT_LIGHT} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  Main                                                   */
/* ═══════════════════════════════════════════════════════ */
export default function AccountScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()

  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isDealer, setIsDealer]     = useState(false)

  const fadeAnim      = useRef(new Animated.Value(0)).current
  const headerAnim    = useRef(new Animated.Value(0)).current
  const toggleAnim    = useRef(new Animated.Value(0)).current   // 0 = user, 1 = dealer
  const profileScale  = useRef(new Animated.Value(0.88)).current

  const [stats] = useState({ orders: 8, wishlist: 5, addresses: 2 })

  const user = {
    name: 'User',
    email: 'User@example.com',
    phone: '+91 98765 43210',
    memberType: 'Premium Member',
  }
  const dealer = {
    name: 'User',
    company: 'Sharma Hardware Co.',
    email: 'User@sharmahard.com',
    phone: '+91 98765 43210',
    gst: '27AADCS0472N1Z1',
    memberType: 'Verified Dealer',
  }

  /* mount */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()
    setTimeout(() => {
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(profileScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start()
    }
  }, [loading])

  /* dealer toggle */
  const handleToggle = val => {
    setIsDealer(val)
    Animated.timing(toggleAnim, {
      toValue: val ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start()
  }

  const headerBg = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BLUE, BLUE_DARK],
  })

  const cardBorderColor = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BLUE_MID, DEALER_GOLD_MID],
  })

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken')
    setIsLoggedIn(false)
  }

  const menuItems = isDealer ? getDealerMenu(stats) : getUserMenu(stats)
  const statItems = [
    { label: 'Orders',    value: stats.orders,    icon: isDealer ? 'clipboard-list-outline' : 'shopping-outline',    route: 'OrdersScreen' },
    { label: 'Wishlist',  value: stats.wishlist,  icon: isDealer ? 'bookmark-multiple-outline' : 'heart-outline',    route: 'WishlistScreen' },
    { label: 'Addresses', value: stats.addresses, icon: isDealer ? 'office-building-outline' : 'map-marker-outline', route: 'AddressesScreen' },
  ]

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />
        <View style={[styles.header, { backgroundColor: BLUE }]} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      {/* ── Animated Header ── */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: headerBg,
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }),
            }],
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Icon name="account-circle-outline" size={30} color={WHITE} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{isDealer ? 'Dealer Portal' : 'My Account'}</Text>
          </View>
        </View>

        {/* ── Dealer toggle ──
        <View style={styles.dealerToggleWrap}>
          <Text style={styles.dealerToggleLabel}>{isDealer ? 'Dealer' : 'User'}</Text>
          <Switch
            value={isDealer}
            onValueChange={handleToggle}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: DEALER_GOLD }}
            thumbColor={WHITE}
            ios_backgroundColor="rgba(255,255,255,0.3)"
          />
        </View> */}
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE]} tintColor={BLUE} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Profile Card ── */}
          <Animated.View
            style={[
              styles.profileCard,
              isDealer && styles.profileCardDealer,
              {
                borderColor: cardBorderColor,
                transform: [{ scale: profileScale }],
              },
            ]}
          >
            {/* dealer crown banner */}
            {isDealer && (
              <View style={styles.dealerBanner}>
                <Icon name="crown" size={13} color={DEALER_GOLD} />
                <Text style={styles.dealerBannerText}>VERIFIED DEALER ACCOUNT</Text>
                <Icon name="crown" size={13} color={DEALER_GOLD} />
              </View>
            )}

            <View style={styles.profileRow}>
              {/* avatar */}
              <View style={[styles.avatarRing, isDealer && styles.avatarRingDealer]}>
                <Image
                  source={require('../../core/assets/images/constants/userprofile.jpg')}
                  style={styles.avatar}
                  defaultSource={require('../../core/assets/images/constants/userprofile.jpg')}
                />
                <TouchableOpacity style={[styles.cameraBtn, isDealer && styles.cameraBtnDealer]}>
                  <Icon name="camera" size={13} color={WHITE} />
                </TouchableOpacity>
              </View>

              {/* info */}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{isDealer ? dealer.name : user.name}</Text>

                {isDealer && (
                  <Text style={styles.companyName}>{dealer.company}</Text>
                )}

                <View style={styles.infoRow}>
                  <Icon name="email-outline" size={12} color={TEXT_LIGHT} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {isDealer ? dealer.email : user.email}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="phone-outline" size={12} color={TEXT_LIGHT} />
                  <Text style={styles.infoText}>{user.phone}</Text>
                </View>

                {isDealer && (
                  <View style={styles.infoRow}>
                    <Icon name="identifier" size={12} color={DEALER_GOLD} />
                    <Text style={[styles.infoText, { color: DEALER_GOLD }]}>{dealer.gst}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* member badge */}
            <View style={[styles.memberBadge, isDealer && styles.memberBadgeDealer]}>
              <Icon name={isDealer ? 'crown' : 'shield-check'} size={14} color={isDealer ? DEALER_GOLD : BLUE} />
              <Text style={[styles.memberText, isDealer && styles.memberTextDealer]}>
                {isDealer ? dealer.memberType : user.memberType}
              </Text>
              {isDealer && (
                <View style={styles.verifiedChip}>
                  <Icon name="check-decagram" size={12} color={WHITE} />
                  <Text style={styles.verifiedChipText}>GST Verified</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── Menu Card ── */}
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>
              {isDealer ? 'DEALER TOOLS' : 'QUICK ACCESS'}
            </Text>
            {isDealer && <View style={styles.dealerPill}><Text style={styles.dealerPillText}>B2B</Text></View>}
          </View>

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

          {/* ── Logout ── */}
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Icon name="logout-variant" size={18} color="#C62828" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* ── Version ── */}
          <View style={styles.versionRow}>
            <Text style={styles.versionText}>v1.0.0  ·  © 2026 AB SHOPEE</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  )
}

/* ═══════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBox: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 10, color: 'rgba(255,255,255,0.65)',
    fontFamily: FONTS.Medium, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20, fontFamily: FONTS.Bold, color: WHITE,
    letterSpacing: -0.3, lineHeight: 22,
  },

  /* Dealer toggle */
  dealerToggleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dealerToggleLabel: { fontSize: 12, fontFamily: FONTS.Bold, color: WHITE },

  /* Loader */
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_MID },

  /* Profile card */
  profileCard: {
    marginHorizontal: 16, marginTop: 18,
    backgroundColor: WHITE, borderRadius: 18,
    padding: 18, borderWidth: 1.5, borderColor: BLUE_MID,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
    overflow: 'hidden',
  },
  profileCardDealer: {
    borderColor: DEALER_GOLD_MID,
    shadowColor: DEALER_GOLD,
  },

  /* dealer banner */
  dealerBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: DEALER_GOLD_BG,
    paddingVertical: 7, marginHorizontal: -18, marginTop: -18,
    marginBottom: 16, borderBottomWidth: 1, borderBottomColor: DEALER_GOLD_MID,
  },
  dealerBannerText: {
    fontSize: 10, fontFamily: FONTS.Bold,
    color: DEALER_GOLD, letterSpacing: 1.2,
  },

  /* profile row */
  profileRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  avatarRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2.5, borderColor: BLUE_MID,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarRingDealer: { borderColor: DEALER_GOLD },
  avatar: { width: 74, height: 74, borderRadius: 37 },
  cameraBtn: {
    position: 'absolute', bottom: 1, right: 1,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: WHITE,
  },
  cameraBtnDealer: { backgroundColor: DEALER_GOLD },

  profileInfo: { flex: 1, paddingTop: 2 },
  profileName: { fontSize: 17, fontFamily: FONTS.Bold, color: TEXT_DARK, marginBottom: 2 },
  companyName: { fontSize: 12, fontFamily: FONTS.Bold, color: BLUE, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  infoText: { fontSize: 12, fontFamily: FONTS.Regular, color: TEXT_MID, flex: 1 },

  /* member badge */
  memberBadge: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 14, gap: 6,
    backgroundColor: BLUE_LIGHT, paddingVertical: 8,
    paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: BLUE_MID,
  },
  memberBadgeDealer: {
    backgroundColor: DEALER_GOLD_BG, borderColor: DEALER_GOLD_MID,
  },
  memberText: { fontSize: 12, fontFamily: FONTS.Bold, color: BLUE, flex: 1 },
  memberTextDealer: { color: DEALER_GOLD },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1E8C45', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 8,
  },
  verifiedChipText: { fontSize: 10, fontFamily: FONTS.Bold, color: WHITE },

  /* Stats */
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16,
    marginTop: 14, gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: WHITE,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statCardDealer: { borderColor: DEALER_GOLD_MID, shadowColor: DEALER_GOLD },
  statIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statIconWrapUser:   { backgroundColor: BLUE_LIGHT },
  statIconWrapDealer: { backgroundColor: DEALER_GOLD_BG },
  statValue: {
    fontSize: 20, fontFamily: FONTS.Bold, color: TEXT_DARK, lineHeight: 24,
  },
  statValueDealer: { color: DEALER_GOLD },
  statLabel: { fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_LIGHT, marginTop: 2 },

  /* Section label */
  sectionLabel: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 8, gap: 8,
  },
  sectionLabelText: {
    fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_LIGHT,
    letterSpacing: 1.1, textTransform: 'uppercase',
  },
  dealerPill: {
    backgroundColor: DEALER_GOLD, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  dealerPillText: { fontSize: 9, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: 0.6 },

  /* Menu card */
  menuCard: {
    marginHorizontal: 16, backgroundColor: WHITE,
    borderRadius: 16, borderWidth: 1, borderColor: BORDER,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  menuCardDealer: { borderColor: DEALER_GOLD_MID, shadowColor: DEALER_GOLD },

  /* Menu item */
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  menuIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuIconWrapUser:   { backgroundColor: BLUE_LIGHT },
  menuIconWrapDealer: { backgroundColor: DEALER_GOLD_BG },
  menuTextBlock: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: FONTS.Bold, color: TEXT_DARK },
  menuSubtitle: { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT, marginTop: 2 },
  menuChevronWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: BG, justifyContent: 'center', alignItems: 'center',
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFCDD2',
    gap: 8,
  },
  logoutText: { fontSize: 14, fontFamily: FONTS.Bold, color: '#C62828' },

  /* Version */
  versionRow: { alignItems: 'center', marginTop: 20 },
  versionText: { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT, letterSpacing: 0.3 },
})
