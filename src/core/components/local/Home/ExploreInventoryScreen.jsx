import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ToastAndroid,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native'
import { TextInput } from 'react-native-paper'
import { ScaledSheet, moderateScale, scale, verticalScale, ms, vs, s } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import ProductBottomSheet from './ProductAddSheet'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'

const { width } = Dimensions.get('window')
const PAGE_SIZE = 50

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] })
  return (
    <View style={sk.card}>
      <Animated.View style={[sk.image, { opacity }]} />
      <View style={sk.body}>
        <Animated.View style={[sk.badgeRow, { opacity }]}>
          <Animated.View style={[sk.pill, { width: 56 }]} />
          <Animated.View style={[sk.pill, { width: 46 }]} />
        </Animated.View>
        <Animated.View style={[sk.line, { width: '90%', opacity }]} />
        <Animated.View style={[sk.line, { width: '65%', opacity }]} />
        <Animated.View style={[sk.priceBlock, { opacity }]} />
      </View>
    </View>
  )
}

const sk = ScaledSheet.create({
  card: {
    width: '48%', marginBottom: '14@vs',
    backgroundColor: '#fff', borderRadius: '8@ms',
    overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB',
  },
  image:      { width: '100%', height: '135@vs', backgroundColor: color.primary + 20 },
  body:       { padding: '10@s' },
  badgeRow:   { flexDirection: 'row', gap: '6@s', marginBottom: '8@vs' },
  pill:       { height: '14@vs', borderRadius: '6@ms', backgroundColor: color.primary + 20 },
  line:       { height: '11@vs', borderRadius: '5@ms', backgroundColor: color.primary + 20, marginBottom: '6@vs' },
  priceBlock: { height: '18@vs', width: '55%', borderRadius: '5@ms', backgroundColor: color.primary + 20, marginTop: '4@vs' },
})

function SkeletonGrid() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: s(14), paddingTop: vs(10) }}>
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </View>
  )
}

// ─── AutoScrollTitleDesc (logic unchanged) ────────────────────────────────────
function AutoScrollTitleDesc({ title, description, style, height = 38 }) {
  const translateTitle = useRef(new Animated.Value(0)).current
  const translateDesc  = useRef(new Animated.Value(height)).current
  const titleOpacity   = useRef(new Animated.Value(1)).current
  const descOpacity    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!description) return
    Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(translateTitle, { toValue: -height, duration: 800, useNativeDriver: true }),
          Animated.timing(titleOpacity,   { toValue: 0,       duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateDesc, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(descOpacity,   { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.delay(1800),
        Animated.parallel([
          Animated.timing(translateDesc,  { toValue: height, duration: 0, useNativeDriver: true }),
          Animated.timing(descOpacity,    { toValue: 0,      duration: 0, useNativeDriver: true }),
          Animated.timing(translateTitle, { toValue: 0,      duration: 0, useNativeDriver: true }),
          Animated.timing(titleOpacity,   { toValue: 1,      duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start()
  }, [description])

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.Text
        style={[style, { position: 'absolute', transform: [{ translateY: translateTitle }], opacity: titleOpacity }]}
        numberOfLines={2}
      >{title}</Animated.Text>
      {!!description && (
        <Animated.Text
          style={[style, { position: 'absolute', transform: [{ translateY: translateDesc }], opacity: descOpacity, fontSize: ms(11), color: '#888' }]}
          numberOfLines={2}
        >{description}</Animated.Text>
      )}
    </View>
  )
}

// ─── Dropdown (logic unchanged, colors updated) ───────────────────────────────
function Dropdown({ label, icon, options, selectedKey, onSelect }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos]         = useState({ top: 0, left: 0, width: 0 })
  const anchorRef             = useRef(null)

  const open = () => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      const menuWidth = Math.max(w, moderateScale(175))
      const safeLeft  = Math.min(x, width - menuWidth - s(10))
      setPos({ top: y + h + 4, left: Math.max(s(8), safeLeft), width: menuWidth })
      setVisible(true)
    })
  }

  const selectedOption = options.find(o => o.key === selectedKey)
  const isActive       = selectedKey !== null && selectedKey !== undefined && selectedKey !== 'all'

  return (
    <>
      <TouchableOpacity
        ref={anchorRef}
        style={[styles.dropBtn, isActive && styles.dropBtnActive]}
        onPress={open}
        activeOpacity={0.8}
      >
        <Icon name={icon} size={ms(12)} color={isActive ? '#fff' : color.primary} />
        <Text style={[styles.dropBtnLabel, isActive && styles.dropBtnLabelActive]} numberOfLines={1}>
          {isActive && selectedOption ? (selectedOption.shortLabel || selectedOption.label) : label}
        </Text>
        <Icon name="chevron-down" size={ms(12)} color={isActive ? '#fff' : color.primary} />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.ddOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.ddMenu, { top: pos.top, left: pos.left, width: pos.width }]}>
            {options.map((opt, idx) => {
              const sel = opt.key === selectedKey
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.ddItem, sel && styles.ddItemActive, idx < options.length - 1 && styles.ddItemBorder]}
                  onPress={() => { onSelect(opt.key); setVisible(false) }}
                  activeOpacity={0.7}
                >
                  {opt.icon && <Icon name={opt.icon} size={ms(15)} color={sel ? color.primary : '#666'} style={{ marginRight: s(8) }} />}
                  <Text style={[styles.ddItemText, sel && styles.ddItemTextActive]}>{opt.label}</Text>
                  {sel && <Icon name="check" size={ms(13)} color={color.primary} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

// ─── PaginationBar (logic unchanged, colors updated) ─────────────────────────
function PaginationBar({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const delta = 1
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return (
    <View style={styles.paginationBar}>
      <TouchableOpacity
        style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
        onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Icon name="chevron-left" size={ms(18)} color={currentPage === 1 ? '#BDBDBD' : color.primary} />
      </TouchableOpacity>
      {pages.map((p, idx) =>
        p === '...' ? (
          <Text key={`dot-${idx}`} style={styles.pageDots}>…</Text>
        ) : (
          <TouchableOpacity
            key={p}
            style={[styles.pageBtn, p === currentPage && styles.pageBtnActive]}
            onPress={() => p !== currentPage && onPageChange(p)}
          >
            <Text style={[styles.pageBtnText, p === currentPage && styles.pageBtnTextActive]}>{p}</Text>
          </TouchableOpacity>
        )
      )}
      <TouchableOpacity
        style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
        onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Icon name="chevron-right" size={ms(18)} color={currentPage === totalPages ? '#BDBDBD' : color.primary} />
      </TouchableOpacity>
    </View>
  )
}

const PLACEHOLDER_IMAGE = noimage

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ExploreInventoryScreen() {
  const navigation = useNavigation()
  const [wishlistIds,      setWishlistIds]      = useState(new Set())
  const [products,         setProducts]         = useState([])
  const [totalCount,       setTotalCount]       = useState(0)
  const [loading,          setLoading]          = useState(false)
  const [contentLoading,   setContentLoading]   = useState(false)
  const [refreshing,       setRefreshing]       = useState(false)
  const [selectedProduct,  setSelectedProduct]  = useState(null)
  const [sheetVisible,     setSheetVisible]     = useState(false)
  const [searchQuery,      setSearchQuery]      = useState('')
  const [searching,        setSearching]        = useState(false)
  const [selectedFilter,   setSelectedFilter]   = useState('all')
  const [sortOption,       setSortOption]       = useState(null)
  const [currentPage,      setCurrentPage]      = useState(1)
  const searchTimeoutRef   = useRef(null)
  const abortControllerRef = useRef(null)
  const [fadeAnim]         = useState(new Animated.Value(0))
  const [headerAnim]       = useState(new Animated.Value(0))
  const listRef            = useRef(null)

  const filterOptions = [
    { key: 'all',      label: 'All Products', shortLabel: 'All',      icon: 'view-grid'    },
    { key: 'digital',  label: 'Digital',      shortLabel: 'Digital',  icon: 'download'     },
    { key: 'physical', label: 'Physical',     shortLabel: 'Physical', icon: 'cube-outline' },
    { key: 'in_stock', label: 'In Stock',     shortLabel: 'In Stock', icon: 'check-circle' },
    { key: 'featured', label: 'Featured',     shortLabel: 'Featured', icon: 'star'         },
  ]
  const sortOptions = [
    { key: 'price_asc',  label: 'Price: Low → High', shortLabel: '↑ Price', icon: 'sort-ascending'  },
    { key: 'price_desc', label: 'Price: High → Low', shortLabel: '↓ Price', icon: 'sort-descending' },
  ]
  const getSortParams = key => {
    if (key === 'price_asc')  return '&sortBy=discountedPrice&sortOrder=asc'
    if (key === 'price_desc') return '&sortBy=discountedPrice&sortOrder=desc'
    return ''
  }

  // ── All logic unchanged ────────────────────────────────────────────────────
  useEffect(() => { fetchProducts(true) }, [])
  useEffect(() => {
    if (searchQuery.trim().length >= 3) searchProducts(searchQuery.trim())
    else fetchProducts(false)
  }, [sortOption])
  useEffect(() => {
    if (!loading && !contentLoading && products.length > 0) {
      fadeAnim.setValue(0)
      Animated.parallel([
        Animated.timing(fadeAnim,   { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()
    }
  }, [loading, contentLoading, products])
  useEffect(() => {
    setCurrentPage(1)
    listRef.current?.scrollToOffset?.({ offset: 0, animated: false })
  }, [selectedFilter, sortOption, searchQuery])

  const WishlistHeart = ({ active, onPress }) => {
    const animScale = useRef(new Animated.Value(1)).current
    const [isProcessing, setIsProcessing] = useState(false)
    const handlePress = async () => {
      setIsProcessing(true)
      Animated.sequence([
        Animated.spring(animScale, { toValue: 1.3, useNativeDriver: true }),
        Animated.spring(animScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start()
      await onPress()
      setIsProcessing(false)
    }
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.heartBtn} disabled={isProcessing}>
        <Animated.View style={{ transform: [{ scale: animScale }] }}>
          {isProcessing
            ? <ActivityIndicator size="small" color="#C62828" />
            : <Icon name={active ? 'heart' : 'heart-outline'} size={ms(19)} color={active ? '#C62828' : '#BDBDBD'} />
          }
        </Animated.View>
      </TouchableOpacity>
    )
  }

  const toggleWishlist = async itemId => {
    const isWishlisted = wishlistIds.has(itemId)
    try {
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      if (!token || !businessId) throw new Error('Missing auth or business ID')
      const url = isWishlisted
        ? `/customer/business/${businessId}/items/${itemId}/wishlist/remove`
        : `/customer/business/${businessId}/items/${itemId}/wishlist/add`
      const res = await fetch(BASE_URL + url, {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('wishlist failed')
      ToastAndroid.show(isWishlisted ? 'Removed from wishlist ♡' : 'Added to wishlist ♥', ToastAndroid.SHORT)
      setWishlistIds(prev => {
        const next = new Set(prev)
        isWishlisted ? next.delete(itemId) : next.add(itemId)
        return next
      })
    } catch {
      ToastAndroid.show('Wishlist action failed', ToastAndroid.SHORT)
    }
  }

  const mapProduct = item => {
    const price              = item.prices?.[0]
    const priceData          = item.prices?.[0]
    const digitalAssetsCount = Array.isArray(item.digitalAssets) ? item.digitalAssets.length : 0
    const inventory          = Array.isArray(item.inventories) ? item.inventories[0] : undefined
    const category           = Array.isArray(item.Categories)  ? item.Categories[0]  : undefined
    const featuredAttr       = Array.isArray(item.attributes) ? item.attributes.find(a => a.key === 'is_featured')      : undefined
    const shortDescAttr      = Array.isArray(item.attributes) ? item.attributes.find(a => a.key === 'short_description') : undefined
    const resolvedDescription = shortDescAttr?.value || item.description || null
    const rawBase     = item.discountPricing?.basePrice    ?? Number(price?.amount ?? 0)
    const rawDiscount = item.discountPricing?.discountTotal ?? 0
    const rawFinal    = item.discountPricing?.finalPrice   ?? Number(price?.amount ?? 0)
    const effectiveFinalPrice = (rawFinal === 0 && rawDiscount === 0) ? rawBase : rawFinal
    const isDigital   = item.itemType === 'digital'
    const inStock     = isDigital ? digitalAssetsCount > 0 : !!(inventory && inventory.quantityAvailable > 0)
    const inventoryCount = isDigital ? digitalAssetsCount : (inventory?.quantityAvailable || 0)
    const imageSource = (Array.isArray(item.media) && item.media[0]?.url) ? { uri: item.media[0].url } : PLACEHOLDER_IMAGE
    return {
      id: item.id, title: item.title, slug: item.slug, status: item.status,
      visibility: item.visibility, itemType: item.itemType, image: imageSource,
      basePrice: Math.round(rawBase), finalPrice: Math.round(effectiveFinalPrice),
      discountTotal: Math.round(rawDiscount), discounts: item.discountPricing?.discounts ?? [],
      currency: price?.currency === 'INR' ? '₹' : (price?.currency ?? ''),
      taxMode: priceData?.taxMode, priceType: priceData?.priceType,
      inStock, inventoryCount, category: category?.name ?? null,
      featured: featuredAttr?.value === true, shortDescription: resolvedDescription,
    }
  }

  const fetchProducts = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      else           setContentLoading(true)
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const sortParams = getSortParams(sortOption)
      const res  = await fetch(
        `${BASE_URL}/customer/business/${businessId}/products?${sortParams}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      const rows  = json?.data?.rows  ?? []
      const count = json?.data?.count ?? rows.length
      setProducts(rows.map(mapProduct))
      setTotalCount(count)
      setCurrentPage(1)
    } catch (e) { console.log('Product fetch error', e) }
    finally { setLoading(false); setContentLoading(false); setRefreshing(false) }
  }

  const searchProducts = async query => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      setSearching(true); setContentLoading(true)
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const sortParams = getSortParams(sortOption)
      const res  = await fetch(
        `${BASE_URL}/customer/business/${businessId}/search/items?q=${encodeURIComponent(query)}&limit=50${sortParams}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, signal: controller.signal }
      )
      const json  = await res.json()
      const items = json?.items ?? []
      const mapped = items.map(item => {
        const price              = item.prices?.[0]
        const inventory          = Array.isArray(item.inventories) ? item.inventories[0] : undefined
        const category           = Array.isArray(item.Categories)  ? item.Categories[0]  : undefined
        const featuredAttr       = Array.isArray(item.attributes) ? item.attributes.find(a => a.key === 'is_featured')      : undefined
        const shortDescAttr      = Array.isArray(item.attributes) ? item.attributes.find(a => a.key === 'short_description') : undefined
        const digitalAssetsCount = Array.isArray(item.digitalAssets) ? item.digitalAssets.length : 0
        const isDigital          = item.itemType === 'digital'
        const rawAmount          = Number(price?.amount ?? 0)
        return {
          id: item.id, title: item.title, slug: item.slug, itemType: item.itemType,
          image: (Array.isArray(item.media) && item.media[0]?.url) ? { uri: item.media[0].url } : PLACEHOLDER_IMAGE,
          basePrice: rawAmount, finalPrice: rawAmount, discountTotal: 0, discounts: [],
          currency: price?.currency === 'INR' ? '₹' : (price?.currency ?? ''),
          taxMode: price?.taxMode, priceType: price?.priceType,
          inStock: isDigital ? digitalAssetsCount > 0 : !!(inventory && inventory.quantityAvailable > 0),
          inventoryCount: isDigital ? digitalAssetsCount : (inventory?.quantityAvailable || 0),
          category: category?.name ?? null, featured: featuredAttr?.value === true,
          shortDescription: shortDescAttr?.value || item.description || null,
        }
      })
      setProducts(mapped); setTotalCount(mapped.length); setCurrentPage(1)
    } catch (e) { if (e.name !== 'AbortError') console.log('Search error', e) }
    finally { setSearching(false); setContentLoading(false) }
  }

  const handleSearchChange = text => {
    setSearchQuery(text)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (text.trim().length === 0) { fetchProducts(false); return }
    if (text.trim().length < 3) return
    searchTimeoutRef.current = setTimeout(() => searchProducts(text.trim()), 400)
  }

  const onRefresh = () => { setRefreshing(true); fetchProducts(false) }

  const filteredProducts = (() => {
    let base = products
    if (selectedFilter === 'digital')  base = base.filter(p => p.itemType === 'digital')
    if (selectedFilter === 'physical') base = base.filter(p => p.itemType === 'physical')
    if (selectedFilter === 'in_stock') base = base.filter(p => p.inStock === true)
    if (selectedFilter === 'featured') base = base.filter(p => p.featured === true)
    return base
  })()

  const totalPages    = Math.ceil(filteredProducts.length / PAGE_SIZE)
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const handleSortSelect = key => setSortOption(prev => (prev === key ? null : key))
  const handlePageChange = page => {
    setCurrentPage(page)
    listRef.current?.scrollToOffset?.({ offset: 0, animated: true })
  }

  // ── Render item ───────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }) => {
    const isDigital = item.itemType === 'digital'
    const taxLabel  = item.taxMode === 'inclusive' ? 'Incl. All Taxes' : item.taxMode === 'exclusive' ? 'Excl. Tax' : ''
    const isFree    = item.finalPrice === 0
    const discPct   = item.discountTotal > 0 && item.basePrice > 0
      ? Math.round((item.discountTotal / item.basePrice) * 100)
      : 0

    return (
      <Animated.View style={[styles.cardWrapper, {
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }]}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ProductDetail', { itemId: item.id })}
        >
          {/* Image */}
          <View style={styles.imgWrap}>
            <Image source={item.image} style={styles.productImg} />

            {/* Discount % badge — top left, Flipkart style */}
            {discPct > 0 && (
              <View style={styles.discBadge}>
                <Text style={styles.discBadgeText}>{discPct}% off</Text>
              </View>
            )}

            {/* Heart */}
            <WishlistHeart active={wishlistIds.has(item.id)} onPress={() => toggleWishlist(item.id)} />

            {/* Featured star */}
            {item.featured && (
              <View style={styles.featuredDot}>
                <Icon name="star" size={ms(11)} color={color.secondary} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            {/* Category */}
            {!!item.category && (
              <Text style={styles.categoryTag} numberOfLines={1}>{item.category}</Text>
            )}

            {/* Title + desc */}
            <AutoScrollTitleDesc
              title={item.title}
              description={item.shortDescription}
              style={styles.productName}
              height={36}
            />

            {/* Price block — Flipkart layout */}
            <View style={styles.priceBlock}>
              {isFree ? (
                <Text style={styles.freeText}>Free</Text>
              ) : item.discountTotal > 0 ? (
                <View>
                  <View style={styles.priceRow}>
                    <Text style={styles.finalPrice}>{item.currency}{item.finalPrice}</Text>
                    <Text style={styles.basePrice}>{item.currency}{item.basePrice}</Text>
                  </View>
                  {!!taxLabel && <Text style={styles.taxLabel}>{taxLabel}</Text>}
                </View>
              ) : (
                <View>
                  <Text style={styles.finalPrice}>{item.currency}{item.finalPrice}</Text>
                  {!!taxLabel && <Text style={styles.taxLabel}>{taxLabel}</Text>}
                </View>
              )}
            </View>

            {/* Stock + type pills */}
            <View style={styles.pillRow}>
              <View style={[styles.stockPill, { backgroundColor: item.inStock ? '#E8F5E9' : '#FFEBEE' }]}>
                <Icon
                  name={item.inStock ? 'check-circle' : 'close-circle'}
                  size={ms(9)}
                  color={item.inStock ? '#2E7D32' : '#C62828'}
                />
                <Text style={[styles.stockText, { color: item.inStock ? '#2E7D32' : '#C62828' }]}>
                  {item.inStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>
              <View style={[styles.typePill, { backgroundColor: isDigital ? color.primary + 20 : color.background }]}>
                <Icon name={isDigital ? 'download' : 'cube-outline'} size={ms(9)} color={color.primary} />
                <Text style={styles.typePillText}>{isDigital ? 'Digital' : 'Physical'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }, [wishlistIds, fadeAnim])

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <Icon name="package-variant-closed" size={ms(44)} color={color.primary} />
      </View>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try different keywords' : 'Check back later for new items'}
      </Text>
    </View>
  )

  // ── Loading skeleton screen ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explore Products</Text>
          <View style={{ width: s(36) }} />
        </View>
        {/* Search skeleton */}
        <View style={styles.searchStrip}>
          <View style={[styles.searchBar, { opacity: 0.5 }]}>
            <Icon name="magnify" size={ms(18)} color="#BDBDBD" />
            <Text style={{ color: '#BDBDBD', fontSize: ms(13), flex: 1 }}>Search products…</Text>
          </View>
        </View>
        <SkeletonGrid />
      </View>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Explore Products</Text>
          <Text style={styles.headerSub}>
            {filteredProducts.length !== products.length
              ? `${filteredProducts.length} of ${products.length} items`
              : `${totalCount} items`}
          </Text>
        </View>
        <View style={{ width: s(36) }} />
      </Animated.View>

      {/* ── Search bar — continues primary bg ── */}
      <View style={styles.searchStrip}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={ms(18)} color="#999" />
          <TextInput
            placeholder="Search products…"
            value={searchQuery}
            onChangeText={handleSearchChange}
            style={styles.searchInput}
            placeholderTextColor="#BDBDBD"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          {searching && <ActivityIndicator size="small" color={color.primary} style={{ marginLeft: s(6) }} />}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity onPress={() => handleSearchChange('')} style={{ padding: s(4) }}>
              <Icon name="close-circle" size={ms(16)} color="#BDBDBD" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter + Sort row ── */}
      <View style={styles.filterRow}>
        <Dropdown
          label="Filter"
          icon="filter-variant"
          options={filterOptions}
          selectedKey={selectedFilter}
          onSelect={val => { setSelectedFilter(val); setCurrentPage(1) }}
        />

        {selectedFilter !== 'all' && (
          <TouchableOpacity style={styles.activePill} onPress={() => setSelectedFilter('all')}>
            <Text style={styles.activePillText} numberOfLines={1}>
              {filterOptions.find(f => f.key === selectedFilter)?.shortLabel}
            </Text>
            <Icon name="close-circle" size={ms(12)} color={color.primary} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1, minWidth: s(4) }} />

        <Dropdown
          label="Sort"
          icon="sort"
          options={sortOptions}
          selectedKey={sortOption}
          onSelect={handleSortSelect}
        />
      </View>

      {/* ── Product grid ── */}
      {contentLoading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[color.primary]} tintColor={color.primary} />}
        >
          <SkeletonGrid />
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={pagedProducts}
          keyExtractor={item => item.id?.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.productList}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[color.primary]} tintColor={color.primary} />}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          }
        />
      )}

      <ProductBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        product={selectedProduct}
      />
    </View>
  )
}

// ─── Styles — ONLY color.* values ────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '13@vs', paddingHorizontal: '14@s',
    elevation: 4, gap: '10@s',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  headerBtn:   { width: '36@s', height: '36@s', borderRadius: '18@ms', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '17@ms', fontFamily: FONTS.Bold, color: '#fff' },
  headerSub:   { fontSize: '11@ms', color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.Medium, marginTop: '1@vs' },

  // ── Search strip (continues primary) ─────────────────────────────────────
  searchStrip: {
    backgroundColor: color.primary,
    paddingHorizontal: '14@s', paddingBottom: '14@vs', paddingTop: '4@vs',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    backgroundColor: '#fff', borderRadius: '8@ms',
    paddingHorizontal: '12@s', height: '42@vs',
  },
  searchInput: {
    flex: 1, fontSize: '13@ms', fontFamily: FONTS.Medium,
    backgroundColor: 'transparent', padding: 0, height: '42@vs', color: color.text,
  },

  // ── Filter row ────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: '14@s', paddingVertical: '9@vs',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB',
    gap: '8@s',
  },

  // Dropdown button
  dropBtn: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    borderWidth: 1.5, borderColor: color.primary,
    borderRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '6@vs',
    flexShrink: 0,
  },
  dropBtnActive:      { backgroundColor: color.primary },
  dropBtnLabel:       { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.primary },
  dropBtnLabelActive: { color: '#fff' },

  // Active filter pill
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    backgroundColor: color.primary + 20,
    borderRadius: '20@ms', paddingHorizontal: '8@s', paddingVertical: '4@vs',
    maxWidth: '80@s', flexShrink: 1,
    borderWidth: 1, borderColor: color.primary,
  },
  activePillText: { fontSize: '11@ms', color: color.primary, fontFamily: FONTS.Medium, flexShrink: 1 },

  // Dropdown modal
  ddOverlay: { flex: 1 },
  ddMenu: {
    position: 'absolute', backgroundColor: '#fff',
    borderRadius: '10@ms', elevation: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10,
    overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB',
  },
  ddItem:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: '14@s', paddingVertical: '11@vs' },
  ddItemBorder:    { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  ddItemActive:    { backgroundColor: color.primary + 20 },
  ddItemText:      { fontSize: '13@ms', color: color.text, fontFamily: FONTS.Medium, flex: 1 },
  ddItemTextActive:{ color: color.primary, fontFamily: FONTS.Bold },

  // ── Product list ──────────────────────────────────────────────────────────
  productList:   { paddingHorizontal: '10@s', paddingTop: '10@vs', paddingBottom: '24@vs' },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: '4@s' },
  cardWrapper:   { width: '48.5%', marginBottom: '10@vs' },

  // ── Card — Flipkart flat style ─────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: '6@ms',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    height: '280@vs',
    justifyContent:'center',
  },

  // Image
  imgWrap: {
    position: 'relative',
    backgroundColor: color.WHITE,
    height: '140@vs',
    padding: '12@vs',
  },
  productImg: { width: '100%', height: '100%', resizeMode: 'contain' },

  // Discount badge — top left, Flipkart green
  discBadge: {
    position: 'absolute', top: '6@vs', left: '6@s',
    backgroundColor: '#2E7D32',
    paddingHorizontal: '5@s', paddingVertical: '2@vs',
    borderRadius: '4@ms',
  },
  discBadgeText: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Heart button
  heartBtn: {
    position: 'absolute', top: '6@vs', right: '6@s',
    width: '28@s', height: '28@s', borderRadius: '14@ms',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },

  // Featured dot
  featuredDot: {
    position: 'absolute', bottom: '6@vs', left: '6@s',
    width: '20@s', height: '20@s', borderRadius: '10@ms',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1,
  },

  // Card info
  cardInfo:    { padding: '8@s', paddingBottom: '10@vs' },
  categoryTag: { fontSize: '10@ms', color: '#888', fontFamily: FONTS.Medium, marginBottom: '4@vs' },
  productName: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '17@ms' },

  // Price block
  priceBlock: { marginTop: '6@vs', marginBottom: '6@vs' },
  priceRow:   { flexDirection: 'row', alignItems: 'center', gap: '6@s', flexWrap: 'wrap' },
  finalPrice: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  basePrice:  { fontSize: '11@ms', color: '#BDBDBD', textDecorationLine: 'line-through', fontFamily: FONTS.Medium },
  freeText:   { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  taxLabel:   { fontSize: '9@ms', color: '#888', marginTop: '1@vs' },

  // Stock + type pills
  pillRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: '4@s' },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: '3@s', paddingHorizontal: '5@s', paddingVertical: '2@vs', borderRadius: '4@ms' },
  stockText: { fontSize: '9@ms', fontFamily: FONTS.Bold },
  typePill:  { flexDirection: 'row', alignItems: 'center', gap: '3@s', borderRadius: '4@ms', paddingHorizontal: '5@s', paddingVertical: '2@vs', borderWidth: 1, borderColor: '#E0E0E0' },
  typePillText: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: color.primary },

  // ── Empty ──────────────────────────────────────────────────────────────────
  emptyWrap:    { alignItems: 'center', paddingTop: '70@vs', paddingHorizontal: '40@s' },
  emptyIconBox: { width: '80@s', height: '80@s', borderRadius: '40@ms', backgroundColor: color.primary + 20, justifyContent: 'center', alignItems: 'center', marginBottom: '16@vs' },
  emptyTitle:   { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs' },
  emptySubtitle:{ fontSize: '13@ms', color: '#888', textAlign: 'center' },

  // ── Pagination ────────────────────────────────────────────────────────────
  paginationBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: '16@vs', gap: '6@s', flexWrap: 'wrap' },
  pageBtn:           { width: '36@s', height: '36@s', borderRadius: '6@ms', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' },
  pageBtnActive:     { backgroundColor: color.primary, borderColor: color.primary },
  pageBtnDisabled:   { backgroundColor: color.background, borderColor: '#EBEBEB' },
  pageBtnText:       { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  pageBtnTextActive: { color: '#fff' },
  pageDots:          { fontSize: '15@ms', color: '#BDBDBD', paddingHorizontal: '2@s' },
})