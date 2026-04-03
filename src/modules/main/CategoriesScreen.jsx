// import React, { useState, useEffect, useRef, useCallback } from 'react'
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StatusBar,
//   Animated,
//   ActivityIndicator,
//   ToastAndroid,
//   Platform,
// } from 'react-native'
// import { ScaledSheet, ms, s, vs } from 'react-native-size-matters'
// import { useNavigation } from '@react-navigation/native'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import BASE_URL from '../../core/services/api'
// import ProductTiles from '../../core/components/local/Categories/ProductRAMs'
// import FONTS from '../../core/utils/fonts'
// import color from '../../core/utils/color'

// // ─── Smart icon resolver ───────────────────────────────────────────────────────
// // Maps category name keywords → MaterialCommunityIcons icon name
// const resolveIcon = (name = '') => {
//   const n = name.toLowerCase()
//   if (n.includes('keyboard'))                        return 'keyboard'
//   if (n.includes('mouse'))                           return 'mouse'
//   if (n.includes('monitor') || n.includes('display')) return 'monitor'
//   if (n.includes('laptop') || n.includes('notebook')) return 'laptop'
//   if (n.includes('desktop') || n.includes('computer')) return 'desktop-classic'
//   if (n.includes('printer'))                         return 'printer'
//   if (n.includes('scanner'))                         return 'scanner'
//   if (n.includes('headphone') || n.includes('audio') || n.includes('speaker')) return 'headphones'
//   if (n.includes('webcam') || n.includes('camera'))  return 'webcam'
//   if (n.includes('pendrive') || n.includes('usb') || n.includes('flash')) return 'usb-flash-drive'
//   if (n.includes('ssd') || n.includes('hard') || n.includes('storage') || n.includes('hdd')) return 'harddisk'
//   if (n.includes('ram') || n.includes('memory'))     return 'memory'
//   if (n.includes('processor') || n.includes('cpu'))  return 'chip'
//   if (n.includes('motherboard'))                     return 'developer-board'
//   if (n.includes('gpu') || n.includes('graphic') || n.includes('card')) return 'expansion-card'
//   if (n.includes('power') || n.includes('smps') || n.includes('ups')) return 'power-plug'
//   if (n.includes('cable') || n.includes('wire') || n.includes('connector')) return 'cable-data'
//   if (n.includes('router') || n.includes('network') || n.includes('wifi')) return 'router-wireless'
//   if (n.includes('antivirus') || n.includes('security') || n.includes('software')) return 'shield-check'
//   if (n.includes('office') || n.includes('ms '))     return 'microsoft-office'
//   if (n.includes('mobile') || n.includes('phone'))   return 'cellphone'
//   if (n.includes('tablet') || n.includes('ipad'))    return 'tablet'
//   if (n.includes('gaming') || n.includes('game'))    return 'controller-classic'
//   if (n.includes('bag') || n.includes('case') || n.includes('sleeve')) return 'bag-personal'
//   if (n.includes('chair') || n.includes('desk'))     return 'seat'
//   if (n.includes('cooling') || n.includes('fan') || n.includes('cooler')) return 'fan'
//   if (n.includes('projector'))                       return 'projector'
//   if (n.includes('server'))                          return 'server'
//   return 'shape-outline'  // fallback
// }

// // ─── Left sidebar category tab ────────────────────────────────────────────────
// function SideTab({ item, isActive, onPress }) {
//   return (
//     <TouchableOpacity
//       style={[styles.sideTab, isActive && styles.sideTabActive]}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       {/* Active indicator bar */}
//       {isActive && <View style={styles.sideTabBar} />}

//       <View style={[styles.sideTabIconWrap, isActive && styles.sideTabIconWrapActive]}>
//         <Icon
//           name={resolveIcon(item.title)}
//           size={ms(20)}
//           color={isActive ? color.primary : '#888'}
//         />
//       </View>

//       <Text
//         style={[styles.sideTabLabel, isActive && styles.sideTabLabelActive]}
//         numberOfLines={2}
//       >
//         {item.title}
//       </Text>
//     </TouchableOpacity>
//   )
// }

// // ─── Right content header ─────────────────────────────────────────────────────
// function ContentHeader({ category, fadeAnim }) {
//   if (!category) return null
//   return (
//     <Animated.View style={[styles.contentHeader, { opacity: fadeAnim }]}>
//       <View style={styles.contentHeaderLeft}>
//         <View style={styles.contentHeaderIcon}>
//           <Icon name={resolveIcon(category.title)} size={ms(18)} color={color.primary} />
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.contentHeaderTitle}>{category.title}</Text>
//           {!!category.subtitle && category.subtitle !== 'Explore Products' && (
//             <Text style={styles.contentHeaderSub} numberOfLines={1}>{category.subtitle}</Text>
//           )}
//         </View>
//       </View>
//       {category.count > 0 && (
//         <View style={styles.countPill}>
//           <Text style={styles.countPillText}>{category.count} items</Text>
//         </View>
//       )}
//     </Animated.View>
//   )
// }

// // ─── Main ─────────────────────────────────────────────────────────────────────
// export default function HardwareCategories() {
//   const navigation = useNavigation()

//   const [categories,      setCategories]      = useState([])
//   const [activeCategory,  setActiveCategory]  = useState(null)
//   const [loading,         setLoading]         = useState(true)

//   const fadeAnim  = useRef(new Animated.Value(1)).current
//   const sideRef   = useRef(null)   // sidebar ScrollView ref for auto-scroll

//   // ── fetch categories ────────────────────────────────────────────────────────
//   const fetchCategories = useCallback(async () => {
//     try {
//       const token      = await AsyncStorage.getItem('userToken')
//       const businessId = await AsyncStorage.getItem('businessId')
//       const res  = await fetch(
//         `${BASE_URL}/customer/business/${businessId}/categories`,
//         { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
//       )
//       const json = await res.json()
//       const mapped = (json?.data || []).map(item => ({
//         id:       item.id,
//         title:    item.name,
//         subtitle: item.description || '',
//         count:    item.productCount || 0,
//       }))
//       setCategories(mapped)
//       if (mapped.length > 0) setActiveCategory(mapped[0].id)
//     } catch {
//       ToastAndroid.show('Failed to load categories', ToastAndroid.SHORT)
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => { fetchCategories() }, [])

//   // Fade in products when category changes
//   const handleSelectCategory = useCallback((id) => {
//     if (id === activeCategory) return
//     Animated.sequence([
//       Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
//       Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
//     ]).start()
//     setActiveCategory(id)
//   }, [activeCategory])

//   const activeCategoryData = categories.find(c => c.id === activeCategory) ?? null

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor={color.primary} />
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Categories</Text>
//         </View>
//         <View style={styles.loaderWrap}>
//           <ActivityIndicator size="large" color={color.primary} />
//           <Text style={styles.loaderText}>Loading…</Text>
//         </View>
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={color.primary} />

//       {/* ── Header ───────────────────────────────────────────────────────── */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Categories</Text>
//       </View>

//       {/* ── Two-column layout ─────────────────────────────────────────────── */}
//       <View style={styles.body}>

//         {/* ── LEFT: Sidebar ─────────────────────────────────────────────── */}
//         <ScrollView
//           ref={sideRef}
//           style={styles.sidebar}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.sidebarContent}
//         >
//           {categories.map((item) => (
//             <SideTab
//               key={item.id}
//               item={item}
//               isActive={item.id === activeCategory}
//               onPress={() => handleSelectCategory(item.id)}
//             />
//           ))}
//         </ScrollView>

//         {/* ── RIGHT: Products ───────────────────────────────────────────── */}
//         <ScrollView
//           style={styles.productArea}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.productAreaContent}
//         >
//           {/* Category header strip */}
//           <ContentHeader category={activeCategoryData} fadeAnim={fadeAnim} />

//           {/* Product grid */}
//           <Animated.View style={{ opacity: fadeAnim }}>
//             <ProductTiles categoryId={activeCategory} />
//           </Animated.View>
//         </ScrollView>

//       </View>
//     </View>
//   )
// }

// // ─── Styles — ONLY color.* values ────────────────────────────────────────────
// const styles = ScaledSheet.create({
//   container: { flex: 1, backgroundColor: color.background },

//   loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: '10@vs' },
//   loaderText: { fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

//   // ── Header ────────────────────────────────────────────────────────────────
//   header: {
//     backgroundColor: color.primary,
//     paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
//     paddingBottom: '14@vs',
//     paddingHorizontal: '16@s',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//   },
//   headerTitle: {
//     fontSize: '18@ms',
//     fontFamily: FONTS.Bold,
//     color: '#fff',
//   },

//   // ── Two-col body ──────────────────────────────────────────────────────────
//   body: {
//     flex: 1,
//     flexDirection: 'row',
//   },

//   // ── LEFT sidebar ──────────────────────────────────────────────────────────
//   sidebar: {
//     width: '88@s',
//     backgroundColor: color.background,
//     borderRightWidth: 1,
//     borderRightColor: '#E8E8E8',
//   },
//   sidebarContent: {
//     paddingVertical: '4@vs',
//   },

//   // Each sidebar tab
//   sideTab: {
//     alignItems: 'center',
//     paddingVertical: '14@vs',
//     paddingHorizontal: '4@s',
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//     position: 'relative',
//     backgroundColor: color.background,
//   },
//   sideTabActive: {
//     backgroundColor: '#fff',
//   },
//   // Left accent bar — Flipkart's signature active indicator
//   sideTabBar: {
//     position: 'absolute',
//     left: 0,
//     top: 0,
//     bottom: 0,
//     width: '3@s',
//     backgroundColor: color.secondary,
//     borderTopRightRadius: '3@ms',
//     borderBottomRightRadius: '3@ms',
//   },
//   sideTabIconWrap: {
//     width: '40@s',
//     height: '40@s',
//     borderRadius: '8@ms',
//     backgroundColor: '#F0F0F0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: '6@vs',
//   },
//   sideTabIconWrapActive: {
//     backgroundColor: color.primary + 20,
//   },
//   sideTabLabel: {
//     fontSize: '10@ms',
//     fontFamily: FONTS.Medium,
//     color: '#888',
//     textAlign: 'center',
//     lineHeight: '13@ms',
//   },
//   sideTabLabelActive: {
//     color: color.text,
//     fontFamily: FONTS.Bold,
//   },

//   // ── RIGHT content area ────────────────────────────────────────────────────
//   productArea: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   productAreaContent: {
//     paddingBottom: '24@vs',
//   },

//   // Category header strip inside product area
//   contentHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: '12@s',
//     paddingVertical: '12@vs',
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//     backgroundColor: '#fff',
//   },
//   contentHeaderLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: '8@s',
//     flex: 1,
//   },
//   contentHeaderIcon: {
//     width: '32@s',
//     height: '32@s',
//     borderRadius: '8@ms',
//     backgroundColor: color.primary + 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   contentHeaderTitle: {
//     fontSize: '14@ms',
//     fontFamily: FONTS.Bold,
//     color: color.text,
//   },
//   contentHeaderSub: {
//     fontSize: '11@ms',
//     color: '#888',
//     fontFamily: FONTS.Medium,
//     marginTop: '2@vs',
//   },
//   countPill: {
//     backgroundColor: color.primary + 20,
//     paddingHorizontal: '8@s',
//     paddingVertical: '3@vs',
//     borderRadius: '20@ms',
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   countPillText: {
//     fontSize: '10@ms',
//     fontFamily: FONTS.Bold,
//     color: color.primary,
//   },
// })


import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Animated, ActivityIndicator,
  ToastAndroid, Platform,
} from 'react-native'
import { ScaledSheet, ms, vs } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BASE_URL from '../../core/services/api'
import ProductTiles from '../../core/components/local/Categories/ProductRAMs'
import FONTS from '../../core/utils/fonts'
import color from '../../core/utils/color'

// ─── Smart icon resolver ──────────────────────────────────────────────────────
const resolveIcon = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('keyboard')) return 'keyboard'
  if (n.includes('mouse')) return 'mouse'
  if (n.includes('monitor') || n.includes('display')) return 'monitor'
  if (n.includes('laptop') || n.includes('notebook')) return 'laptop'
  if (n.includes('desktop') || n.includes('computer')) return 'desktop-classic'
  if (n.includes('printer')) return 'printer'
  if (n.includes('scanner')) return 'scanner'
  if (n.includes('headphone') || n.includes('audio') || n.includes('speaker')) return 'headphones'
  if (n.includes('webcam') || n.includes('camera')) return 'webcam'
  if (n.includes('pendrive') || n.includes('usb') || n.includes('flash')) return 'usb-flash-drive'
  if (n.includes('ssd') || n.includes('hard') || n.includes('storage') || n.includes('hdd')) return 'harddisk'
  if (n.includes('ram') || n.includes('memory')) return 'memory'
  if (n.includes('processor') || n.includes('cpu')) return 'chip'
  if (n.includes('motherboard')) return 'developer-board'
  if (n.includes('gpu') || n.includes('graphic') || n.includes('card')) return 'expansion-card'
  if (n.includes('power') || n.includes('smps') || n.includes('ups')) return 'power-plug'
  if (n.includes('cable') || n.includes('wire') || n.includes('connector')) return 'cable-data'
  if (n.includes('router') || n.includes('network') || n.includes('wifi')) return 'router-wireless'
  if (n.includes('antivirus') || n.includes('security') || n.includes('software')) return 'shield-check'
  if (n.includes('office') || n.includes('ms ')) return 'microsoft-office'
  if (n.includes('mobile') || n.includes('phone')) return 'cellphone'
  if (n.includes('tablet') || n.includes('ipad')) return 'tablet'
  if (n.includes('gaming') || n.includes('game')) return 'controller-classic'
  if (n.includes('bag') || n.includes('case') || n.includes('sleeve')) return 'bag-personal'
  if (n.includes('cooling') || n.includes('fan') || n.includes('cooler')) return 'fan'
  if (n.includes('projector')) return 'projector'
  if (n.includes('server')) return 'server'
  return 'shape-outline'
}

// ─── Data hook ────────────────────────────────────────────────────────────────
function useCategoryData() {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await AsyncStorage.getItem('userToken')
        const businessId = await AsyncStorage.getItem('businessId')

        const res = await fetch(
          `${BASE_URL}/customer/business/${businessId}/categories`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const json = await res.json()

        const mapped = (json?.data || []).map(item => ({
          id: item.id,
          title: item.name,
          subtitle: item.description || '',
          count: item.productCount || 0,
        }))

        setCategories(mapped)
        if (mapped.length > 0) setActiveCategory(mapped[0].id)
      } catch {
        ToastAndroid.show('Failed to load categories', ToastAndroid.SHORT)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { categories, activeCategory, setActiveCategory, loading }
}

// ─── Header ───────────────────────────────────────────────────────────────────
function AppHeader() {
  return (
    <View style={shared.header}>
      <Text style={shared.headerTitle}>Categories</Text>
    </View>
  )
}

function Loader() {
  return (
    <View style={shared.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />
      <AppHeader />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(10) }}>
        <ActivityIndicator size="large" color={color.primary} />
        <Text style={shared.loaderText}>Loading…</Text>
      </View>
    </View>
  )
}

// ─── Content Header ───────────────────────────────────────────────────────────
function ContentHeader({ category, fadeAnim }) {
  if (!category) return null

  return (
    <Animated.View style={[shared.contentHeader, { opacity: fadeAnim }]}>
      <View style={shared.contentHeaderLeft}>
        <View style={shared.contentHeaderIconBox}>
          <Icon name={resolveIcon(category.title)} size={ms(15)} color={color.primary} />
        </View>
        <Text style={shared.contentHeaderTitle}>{category.title}</Text>
      </View>

      {category.count > 0 && (
        <View style={shared.countPill}>
          <Text style={shared.countPillText}>{category.count} items</Text>
        </View>
      )}
    </Animated.View>
  )
}

// ─── OPTION B ONLY ────────────────────────────────────────────────────────────
function ChipTabB({ item, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[bStyles.chip, isActive && bStyles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon
        name={resolveIcon(item.title)}
        size={ms(13)}
        color={isActive ? '#fff' : color.primary}
      />
      <Text style={[bStyles.chipLabel, isActive && bStyles.chipLabelActive]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  )
}

export default function CategoriesOptionB() {
  const { categories, activeCategory, setActiveCategory, loading } = useCategoryData()
  const fadeAnim = useRef(new Animated.Value(1)).current

  const handleSelect = useCallback((id) => {
    if (id === activeCategory) return

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start()

    setActiveCategory(id)
  }, [activeCategory])

  if (loading) return <Loader />

  const active = categories.find(c => c.id === activeCategory) ?? null

  return (
    <View style={shared.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />
      <AppHeader />

      <View style={bStyles.chipBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={bStyles.chipBarContent}
        >
          {categories.map(item => (
            <ChipTabB
              key={item.id}
              item={item}
              isActive={item.id === activeCategory}
              onPress={() => handleSelect(item.id)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(24) }}
      >
        <ContentHeader category={active} fadeAnim={fadeAnim} />
        <Animated.View style={{ opacity: fadeAnim }}>
          <ProductTiles categoryId={activeCategory} />
        </Animated.View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const bStyles = ScaledSheet.create({
  chipBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  chipBarContent: {
    paddingHorizontal: '12@s',
    paddingVertical: '10@vs',
    gap: '8@s',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '5@s',
    paddingHorizontal: '12@s',
    paddingVertical: '7@vs',
    borderRadius: '20@ms',
    backgroundColor: color.primary + 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  chipLabel: {
    fontSize: '12@ms',
    fontFamily: FONTS.Medium,
    color: color.primary,
  },
  chipLabelActive: {
    color: '#fff',
    fontFamily: FONTS.Bold,
  },
})

const shared = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  loaderText: { fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  header: {
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '14@vs',
    paddingHorizontal: '16@s',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },

  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '12@s',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },

  contentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    flex: 1,
  },

  contentHeaderIconBox: {
    width: '30@s',
    height: '30@s',
    borderRadius: '6@ms',
    backgroundColor: color.primary + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentHeaderTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
  },

  countPill: {
    backgroundColor: color.primary + 20,
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
    borderRadius: '20@ms',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  countPillText: {
    fontSize: '10@ms',
    fontFamily: FONTS.Bold,
    color: color.primary,
  },
})