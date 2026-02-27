import React, { useEffect, useState } from 'react'
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
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../core/utils/fonts'

export default function AccountScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))

  const [user] = useState({
    name: 'Ayush Sharma',
    email: 'ayush@example.com',
    phone: '+91 9876543210',
    avatar: null,
    memberType: 'Premium Member',
  })

  const [stats, setStats] = useState({
    orders: 8,
    wishlist: 5,
    addresses: 2,
  })

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 800)
  }, [])

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }
  }, [loading])

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setStats({
        orders: Math.floor(Math.random() * 10) + 1,
        wishlist: Math.floor(Math.random() * 10) + 1,
        addresses: 2,
      })
      setRefreshing(false)
    }, 1000)
  }

  const menuSections = [
    {
      title: 'My Activity',
      items: [
        {
          icon: 'package-variant',
          label: 'My Orders',
          subtitle: `${stats.orders} orders`,
          color: '#2196F3',
          bgColor: '#E3F2FD',
          route: 'OrdersScreen',
        },
        {
          icon: 'heart',
          label: 'Wishlist',
          subtitle: `${stats.wishlist} items`,
          color: '#FF5252',
          bgColor: '#FFEBEE',
          route: 'WishlistScreen',
        },
        {
          icon: 'map-marker',
          label: 'Saved Addresses',
          subtitle: `${stats.addresses} addresses`,
          color: '#4CAF50',
          bgColor: '#E8F5E9',
          route: 'AddressesScreen',
        },
      ],
    },
    {
      title: 'Account Settings',
      items: [
        {
          icon: 'account-edit',
          label: 'Edit Profile',
          subtitle: 'Update your details',
          color: '#9C27B0',
          bgColor: '#F3E5F5',
          route: 'EditProfileScreen',
        },
        {
          icon: 'shield-check',
          label: 'Privacy & Security',
          subtitle: 'Password, 2FA',
          color: '#FF9800',
          bgColor: '#FFF3E0',
          route: 'SecurityScreen',
        },
        {
          icon: 'bell',
          label: 'Notifications',
          subtitle: 'Manage alerts',
          color: '#00BCD4',
          bgColor: '#E0F7FA',
          route: 'NotificationsScreen',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          label: 'Help & Support',
          subtitle: 'FAQs, Contact us',
          color: '#607D8B',
          bgColor: '#ECEFF1',
          route: 'HelpScreen',
        },
        {
          icon: 'star',
          label: 'Rate Our App',
          subtitle: 'Share your feedback',
          color: '#FFC107',
          bgColor: '#FFF9C4',
          route: 'RateAppScreen',
        },
        {
          icon: 'share-variant',
          label: 'Share App',
          subtitle: 'Tell your friends',
          color: '#4CAF50',
          bgColor: '#E8F5E9',
          route: 'ShareScreen',
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: 'file-document',
          label: 'Terms & Conditions',
          subtitle: 'User agreement',
          color: '#757575',
          bgColor: '#F5F5F5',
          route: 'TermsScreen',
        },
        {
          icon: 'shield-lock',
          label: 'Privacy Policy',
          subtitle: 'Data protection',
          color: '#757575',
          bgColor: '#F5F5F5',
          route: 'PrivacyScreen',
        },
      ],
    },
  ]

  const handleLogout = () => {
    navigation.navigate('LoginScreen')
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0B77A7" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Icon name="cog" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0B77A7']}
            tintColor="#0B77A7"
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Icon name="account" size={40} color="#0B77A7" />
                  </View>
                )}
                <TouchableOpacity style={styles.editAvatarBtn}>
                  <Icon name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.row}>
                  <Icon name="email" size={14} color="#666" />
                  <Text style={styles.userText}>{user.email}</Text>
                </View>
                <View style={styles.row}>
                  <Icon name="phone" size={14} color="#666" />
                  <Text style={styles.userText}>{user.phone}</Text>
                </View>
              </View>
            </View>

            <View style={styles.memberBadge}>
              <Icon name="crown" size={16} color="#FFD700" />
              <Text style={styles.memberText}>{user.memberType}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            {[
              { label: 'Orders', value: stats.orders, icon: 'package-variant', color: '#2196F3', bg: '#E3F2FD', route: 'OrdersScreen' },
              { label: 'Wishlist', value: stats.wishlist, icon: 'heart', color: '#FF5252', bg: '#FFEBEE', route: 'WishlistScreen' },
              { label: 'Addresses', value: stats.addresses, icon: 'map-marker', color: '#4CAF50', bg: '#E8F5E9', route: 'AddressesScreen' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.statCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(item.route)}
              >
                <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                  <Icon name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {menuSections.map((section, sIndex) => (
            <View key={sIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.menuItem}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate(item.route)}
                  >
                    <View style={styles.menuLeft}>
                      <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
                        <Icon name={item.icon} size={22} color={item.color} />
                      </View>
                      <View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={24} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.versionCard}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.versionSubtext}>© 2026 TechStore</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color="#F44336" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#0B77A7',
    paddingTop: '40@ms',
    paddingBottom: '20@ms',
    paddingHorizontal: '16@ms',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: '20@ms', fontFamily: FONTS.Bold },
  settingsBtn: { padding: 6 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  profileCard: {
    margin: '16@ms',
    padding: '16@ms',
    backgroundColor: '#fff',
    borderRadius: '12@ms',
  },
  profileHeader: { flexDirection: 'row' },
  avatarContainer: { marginRight: '16@ms' },
  avatar: { width: '80@ms', height: '80@ms', borderRadius: '40@ms' },
  avatarPlaceholder: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '40@ms',
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0B77A7',
    padding: 6,
    borderRadius: 20,
  },
  profileInfo: { justifyContent: 'center' },
  userName: { fontSize: '18@ms', fontFamily: FONTS.Bold, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  userText: { marginLeft: 6, color: '#555', fontSize: '12@ms' },
  memberBadge: {
    marginTop: '12@ms',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberText: { marginLeft: 6, color: '#444', fontSize: '12@ms' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: '16@ms',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: '12@ms',
    borderRadius: '12@ms',
    alignItems: 'center',
  },
  statIcon: {
    padding: 10,
    borderRadius: 30,
    marginBottom: 6,
  },
  statValue: { fontSize: '16@ms', fontFamily: FONTS.Bold },
  statLabel: { fontSize: '12@ms', color: '#666' },
  menuSection: { marginTop: '16@ms', marginHorizontal: '16@ms' },
  sectionTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    marginBottom: '8@ms',
    color: '#444',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: '12@ms',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14@ms',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: {
    width: '40@ms',
    height: '40@ms',
    borderRadius: '20@ms',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@ms',
  },
  menuLabel: { fontSize: '14@ms', fontFamily: FONTS.Medium },
  menuSubtitle: { fontSize: '11@ms', color: '#777' },
  versionCard: {
    alignItems: 'center',
    marginTop: '20@ms',
  },
  versionText: { fontSize: '12@ms', color: '#888' },
  versionSubtext: { fontSize: '11@ms', color: '#AAA' },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '16@ms',
    padding: '14@ms',
    backgroundColor: '#fff',
    marginHorizontal: '16@ms',
    borderRadius: '12@ms',
    gap: 6,
  },
  logoutText: {
    marginLeft: 6,
    color: '#F44336',
    fontFamily: FONTS.Bold,
  },
})