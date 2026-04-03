import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
  StyleSheet,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import ProductRAMs from './ProductRAMs'
import BASE_URL from '../../../services/api'
import color from '../../../utils/color'

const { width } = Dimensions.get('window')

const BLUE      = color.primary
const BLUE_DARK = color.PRIMARY_DARK
const BLUE_LIGHT = color.PRIMARY_LIGHT
const BLUE_MID  = color.PRIMARY_MID
const WHITE     = color.WHITE
const TEXT_DARK = color.TEXT_DARK
const TEXT_MID  = color.TEXT_MID
const TEXT_LIGHT = color.TEXT_LIGHT
const BORDER    = color.BORDER
const BG        = '#fffff0'

/* ──────────────────────────── sub-components ──────────────────────────── */

function CountBadge({ count }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  )
}

function CategoryTab({ item, isActive, onPress, index }) {
  const scaleAnim   = useRef(new Animated.Value(1)).current
  const slideAnim   = useRef(new Animated.Value(20)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start()
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateY: slideAnim }], opacity: opacityAnim }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[styles.tab, isActive && styles.tabActive]}
      >
        <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
          <Icon name={item.icon} size={20} color={isActive ? WHITE : TEXT_LIGHT} />
        </View>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
          {item.title}
        </Text>
        {isActive && <View style={styles.tabActiveDot} />}
      </TouchableOpacity>
    </Animated.View>
  )
}

function InfoBanner({ category, fadeAnim, slideAnim }) {
  if (!category) return null
  return (
    <Animated.View style={[styles.infoBanner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.infoBannerLeft}>
        <View style={styles.infoBannerIconBox}>
          <Icon name={category.icon} size={26} color={BLUE} />
        </View>
        <View style={styles.infoBannerText}>
          <Text style={styles.infoBannerTitle}>{category.title}</Text>
          <Text style={styles.infoBannerSub}>{category.subtitle}</Text>
        </View>
      </View>
    </Animated.View>
  )
}

/* ──────────────────────────── main component ──────────────────────────── */

export default function HardwareCategories() {
  const navigation = useNavigation()

  const [categories, setCategories]     = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading]           = useState(true)

  const fadeAnim   = useRef(new Animated.Value(0)).current
  const slideAnim  = useRef(new Animated.Value(8)).current
  const headerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      const res  = await fetch(`${BASE_URL}/customer/business/${businessId}/categories`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const json = await res.json()

      const mapped = (json?.data || []).map(item => ({
        id:       item.id,
        title:    item.name,
        subtitle: item.description || 'Explore Products',
        count:    item.productCount || 0,
        icon:     'shape',
      }))

      setCategories(mapped)
      if (mapped.length > 0) setActiveCategory(mapped[0].id)
    } catch {
      ToastAndroid.show('Failed to load categories', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeCategory) return
    fadeAnim.setValue(0)
    slideAnim.setValue(10)
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start()
  }, [activeCategory])

  const activeCategoryData = categories.find(c => c.id === activeCategory)

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Loading Categories…</Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      {/* ── Header ── */}
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
            <Icon name="view-grid" size={20} color={WHITE} />
          </View>
          <View>
            <Text style={styles.headerEyebrow}>Browse</Text>
            <Text style={styles.headerTitle}>Categories</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SearchScreen')} style={styles.searchBtn} activeOpacity={0.75}>
          <Icon name="magnify" size={20} color={BLUE} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Info banner ── */}
      <InfoBanner category={activeCategoryData} fadeAnim={fadeAnim} slideAnim={slideAnim} />

      {/* ── Main scroll ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <Text style={styles.sectionLabel}>All Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {categories.map((item, index) => (
              <CategoryTab
                key={item.id}
                item={item}
                index={index}
                isActive={item.id === activeCategory}
                onPress={() => setActiveCategory(item.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* Products */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ProductRAMs categoryId={activeCategory} />
        </Animated.View>

      </ScrollView>
    </View>
  )
}

/* ──────────────────────────── styles ──────────────────────────── */

const styles = StyleSheet.create({
  root: {
    backgroundColor: BG,
  },

  /* Loading */
  loadingScreen: {
    flex: 1,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: TEXT_MID,
    fontFamily: FONTS.Medium,
    letterSpacing: 0.4,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
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
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
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
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Info banner */
  infoBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoBannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BLUE_MID,
  },
  infoBannerText: { flex: 1 },
  infoBannerTitle: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: TEXT_DARK,
    letterSpacing: -0.2,
  },
  infoBannerSub: {
    fontSize: 12,
    color: TEXT_MID,
    fontFamily: FONTS.Regular,
    marginTop: 2,
  },

  /* Badge */
  badge: {
    backgroundColor: BLUE,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: WHITE,
    fontSize: 12,
    fontFamily: FONTS.Bold,
  },

  /* Tabs */
  tabsWrapper: { paddingTop: 16 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.Medium,
    color: TEXT_LIGHT,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 10,
  },
  tab: {
    alignItems: 'center',
    width: 82,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    position: 'relative',
  },
  tabActive: {
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tabIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: BLUE,
  },
  tabLabel: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: FONTS.Medium,
    color: TEXT_LIGHT,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: TEXT_DARK,
    fontFamily: FONTS.Bold,
  },
  tabActiveDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BLUE,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },

  /* Products section header */
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  productsSectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    color: TEXT_DARK,
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    color: BLUE,
  },
})
