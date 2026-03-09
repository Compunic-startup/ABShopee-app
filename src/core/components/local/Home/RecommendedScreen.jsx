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
} from 'react-native'
import { TextInput } from 'react-native-paper'
import { ScaledSheet, moderateScale, scale, verticalScale } from 'react-native-size-matters'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import ProductBottomSheet from './ProductAddSheet'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'
import FONTS from '../../../utils/fonts'

const { width } = Dimensions.get('window')
const PAGE_SIZE = 10

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
    <View style={skeletonStyles.card}>
      <Animated.View style={[skeletonStyles.image, { opacity }]} />
      <View style={skeletonStyles.body}>
        <Animated.View style={[skeletonStyles.badgeRow, { opacity }]}>
          <Animated.View style={[skeletonStyles.pill, { width: 56 }]} />
          <Animated.View style={[skeletonStyles.pill, { width: 46 }]} />
        </Animated.View>
        <Animated.View style={[skeletonStyles.line, { width: '90%', opacity }]} />
        <Animated.View style={[skeletonStyles.line, { width: '65%', opacity }]} />
        <Animated.View style={[skeletonStyles.priceBlock, { opacity }]} />
      </View>
    </View>
  )
}

const skeletonStyles = ScaledSheet.create({
  card: {
    width: '48%',
    marginBottom: '14@vs',
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '135@vs',
    backgroundColor: '#E8ECF0',
  },
  body: { padding: '10@s' },
  badgeRow: { flexDirection: 'row', gap: '6@s', marginBottom: '8@vs' },
  pill: {
    height: '16@vs',
    borderRadius: '8@ms',
    backgroundColor: '#DDE3EA',
  },
  line: {
    height: '11@vs',
    borderRadius: '6@ms',
    backgroundColor: '#DDE3EA',
    marginBottom: '6@vs',
  },
  priceBlock: {
    height: '18@vs',
    width: '55%',
    borderRadius: '6@ms',
    backgroundColor: '#DDE3EA',
    marginTop: '4@vs',
  },
})

function SkeletonGrid() {
  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: scale(14),
      paddingTop: verticalScale(10),
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  )
}

// ─── AutoScroll Title/Desc ────────────────────────────────────────────────────
function AutoScrollTitleDesc({ title, description, style, height = 38 }) {
  const translateTitle = useRef(new Animated.Value(0)).current
  const translateDesc = useRef(new Animated.Value(height)).current
  const titleOpacity = useRef(new Animated.Value(1)).current
  const descOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!description) return
    Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(translateTitle, { toValue: -height, duration: 800, useNativeDriver: true }),
          Animated.timing(titleOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateDesc, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(descOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.delay(1800),
        Animated.parallel([
          Animated.timing(translateDesc, { toValue: height, duration: 0, useNativeDriver: true }),
          Animated.timing(descOpacity, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(translateTitle, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(titleOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start()
  }, [description])

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.Text
        style={[style, { position: 'absolute', transform: [{ translateY: translateTitle }], opacity: titleOpacity }]}
        numberOfLines={2}
      >
        {title}
      </Animated.Text>
      {!!description && (
        <Animated.Text
          style={[style, { position: 'absolute', transform: [{ translateY: translateDesc }], opacity: descOpacity, fontSize: 11, color: '#666' }]}
          numberOfLines={2}
        >
          {description}
        </Animated.Text>
      )}
    </View>
  )
}

// ─── Reusable Dropdown ────────────────────────────────────────────────────────
function Dropdown({ label, icon, options, selectedKey, onSelect }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const anchorRef = useRef(null)

  const open = () => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      const menuWidth = Math.max(w, moderateScale(175))
      // Clamp so menu never overflows right edge
      const safeLeft = Math.min(x, width - menuWidth - scale(10))
      setPos({ top: y + h + 4, left: Math.max(scale(8), safeLeft), width: menuWidth })
      setVisible(true)
    })
  }

  const selectedOption = options.find(o => o.key === selectedKey)
  const isActive = selectedKey !== null && selectedKey !== undefined && selectedKey !== 'all'

  return (
    <>
      <TouchableOpacity
        ref={anchorRef}
        style={[styles.dropdownBtn, isActive && styles.dropdownBtnActive]}
        onPress={open}
        activeOpacity={0.8}
      >
        <Icon name={icon} size={12} color={isActive ? '#fff' : '#0B77A7'} />
        <Text style={[styles.dropdownBtnLabel, isActive && styles.dropdownBtnLabelActive]} numberOfLines={1}>
          {isActive && selectedOption ? (selectedOption.shortLabel || selectedOption.label) : label}
        </Text>
        <Icon name="chevron-down" size={12} color={isActive ? '#fff' : '#0B77A7'} />
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
                  {opt.icon && (
                    <Icon name={opt.icon} size={15} color={sel ? '#0B77A7' : '#666'} style={{ marginRight: scale(8) }} />
                  )}
                  <Text style={[styles.ddItemText, sel && styles.ddItemTextActive]}>{opt.label}</Text>
                  {sel && <Icon name="check" size={13} color="#0B77A7" style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

// ─── Pagination Bar ───────────────────────────────────────────────────────────
function PaginationBar({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  // Build compact page array with ellipsis
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
        <Icon name="chevron-left" size={18} color={currentPage === 1 ? '#ccc' : '#0B77A7'} />
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
        <Icon name="chevron-right" size={18} color={currentPage === totalPages ? '#ccc' : '#0B77A7'} />
      </TouchableOpacity>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_IMAGE = noimage

export default function ExploreInventoryScreen() {
  const navigation = useNavigation()
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)          // full-screen initial load
  const [contentLoading, setContentLoading] = useState(false) // skeleton overlay for search/sort
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)       // spinner in search bar
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortOption, setSortOption] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const searchTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [headerAnim] = useState(new Animated.Value(0))
  const listRef = useRef(null)

  // ── Option lists ──────────────────────────────────────────────────────────
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

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      fetchProducts(true)
    }, [])
  )

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

  // Reset page on filter/sort/search change
  useEffect(() => {
    setCurrentPage(1)
    listRef.current?.scrollToOffset?.({ offset: 0, animated: false })
  }, [selectedFilter, sortOption, searchQuery])

  // ── WishlistHeart ─────────────────────────────────────────────────────────
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
            ? <ActivityIndicator size="small" color="#FF5252" />
            : <Icon name={active ? 'heart' : 'heart-outline'} size={19} color={active ? '#FF5252' : '#888'} />
          }
        </Animated.View>
      </TouchableOpacity>
    )
  }

  // ── Wishlist toggle ───────────────────────────────────────────────────────
  const toggleWishlist = async itemId => {
    const isWishlisted = wishlistIds.has(itemId)
    try {
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
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
    } catch (e) {
      ToastAndroid.show('Wishlist action failed', ToastAndroid.SHORT)
    }
  }

  // ── Map API row → product ─────────────────────────────────────────────────
  const mapProduct = item => {
    const price              = item.prices?.[0]
    const priceData          = item?.prices?.[0]
    const inventory          = item.inventories?.[0]
    const digitalAssetsCount = item.digitalAssets?.length || 0
    const category           = item.Categories?.[0]
    const featuredAttr       = item.attributes?.find(a => a.key === 'is_featured')
    const shortDescAttr      = item.attributes?.find(a => a.key === 'short_description')
    const resolvedDescription = shortDescAttr?.value || item.description || null
    const rawBase     = item.discountPricing?.basePrice     ?? price?.amount ?? 0
    const rawFinal    = item.discountPricing?.finalPrice    ?? price?.amount ?? 0
    const rawDiscount = item.discountPricing?.discountTotal ?? 0

    return {
      id: item.id, title: item.title, itemType: item.itemType,
      image: item.media?.[0]?.url ? { uri: item.media[0].url } :  PLACEHOLDER_IMAGE,
      basePrice: Math.round(rawBase), finalPrice: Math.round(rawFinal), discountTotal: Math.round(rawDiscount),
      discounts: item.discountPricing?.discounts ?? [],
      currency: price?.currency === 'INR' ? '₹' : '',
      taxMode: priceData?.taxMode, priceType: priceData?.priceType,
      inStock: item.itemType === 'digital' ? digitalAssetsCount > 0 : inventory && inventory.quantityAvailable > 0,
      inventoryCount: item.itemType === 'digital' ? digitalAssetsCount : inventory?.quantityAvailable || 0,
      category: category?.name, featured: featuredAttr?.value === true,
      shortDescription: resolvedDescription,
    }
  }

  // ── Fetch all products ────────────────────────────────────────────────────
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

      const mapped = (json?.data?.rows || []).map(mapProduct)
      setProducts(mapped)
      setCurrentPage(1)
    } catch (e) {
      console.log('Product fetch error', e)
      ToastAndroid.show('Failed to load products', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
      setContentLoading(false)
      setRefreshing(false)
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────
  const searchProducts = async query => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setSearching(true)
      setContentLoading(true)
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const sortParams = getSortParams(sortOption)

      const res  = await fetch(
        `${BASE_URL}/customer/business/${businessId}/search/items?q=${encodeURIComponent(query)}&limit=50${sortParams}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, signal: controller.signal }
      )
      const json = await res.json()

      const mapped = (json?.items || []).map(item => {
        const price         = item.prices?.[0]
        const inventory     = item.inventories?.[0]
        const category      = item.Categories?.[0]
        const featuredAttr  = item.attributes?.find(a => a.key === 'is_featured')
        const shortDescAttr = item.attributes?.find(a => a.key === 'short_description')
        return {
          id: item.id, title: item.title, itemType: item.itemType,
          image: item.media?.[0]?.url ? { uri: item.media[0].url } : PLACEHOLDER_IMAGE ,
          basePrice: price?.amount ?? 0, finalPrice: price?.amount ?? 0, discountTotal: 0,
          discounts: [], currency: price?.currency === 'INR' ? '₹' : '',
          inStock: inventory && inventory.quantityAvailable > 0,
          inventoryCount: inventory?.quantityAvailable || 0,
          category: category?.name, featured: featuredAttr?.value === true,
          shortDescription: shortDescAttr?.value || item.description || null,
        }
      })
      setProducts(mapped)
      setCurrentPage(1)
    } catch (e) {
      if (e.name !== 'AbortError') console.log('Search error', e)
    } finally {
      setSearching(false)
      setContentLoading(false)
    }
  }

  const handleSearchChange = text => {
    setSearchQuery(text)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (text.trim().length === 0) { fetchProducts(false); return }
    if (text.trim().length < 3) return
    searchTimeoutRef.current = setTimeout(() => searchProducts(text.trim()), 400)
  }

  const onRefresh = () => { setRefreshing(true); fetchProducts(false) }

  // ── Client-side filter + paginate ─────────────────────────────────────────
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
    const taxLabel =
      item.taxMode === 'inclusive' ? 'Incl. All Taxes' :
      item.taxMode === 'exclusive' ? 'Excl. Tax' : ''

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ProductDetail', { itemId: item.id })}
        >
          <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.productImage} />
            <View style={[styles.badge, { backgroundColor: isDigital ? '#1565C0' : '#2E7D32' }]}>
              <Icon name={isDigital ? 'download' : 'cube-outline'} size={9} color="#fff" />
              <Text style={styles.badgeText}>{isDigital ? 'Digital' : 'Physical'}</Text>
            </View>
            <WishlistHeart active={wishlistIds.has(item.id)} onPress={() => toggleWishlist(item.id)} />
            {item.featured && (
              <View style={styles.featuredStar}><Icon name="star" size={13} color="#FFD700" /></View>
            )}
          </View>

          <View style={styles.productInfo}>
            <View style={styles.metaRow}>
              <View style={[styles.stockBadge, { backgroundColor: item.inStock ? '#E8F5E9' : '#FFEBEE' }]}>
                <Icon name={item.inStock ? 'check-circle' : 'close-circle'} size={9} color={item.inStock ? '#4CAF50' : '#F44336'} />
                <Text style={[styles.stockText, { color: item.inStock ? '#4CAF50' : '#F44336' }]}>
                  {item.inStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>
              {!!item.category && (
                <View style={styles.categoryBadge}>
                  <Icon name="tag-outline" size={9} color="#0B77A7" />
                  <Text style={styles.category} numberOfLines={1}>{item.category}</Text>
                </View>
              )}
            </View>

            <AutoScrollTitleDesc
              title={item.title}
              description={item.shortDescription}
              style={styles.productName}
              height={38}
            />

            <View style={styles.priceContainer}>
              {item.discountTotal > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={styles.basePrice}>{item.currency}{item.basePrice}</Text>
                    <Text style={styles.finalPrice}> {item.currency}{item.finalPrice}</Text>
                  </View>
                  {!!taxLabel && <Text style={styles.taxLabel}>{taxLabel}</Text>}
                  <Text style={styles.savings}>Save {item.currency}{item.discountTotal}</Text>
                </>
              ) : (
                <Text style={styles.finalPrice}>{item.currency}{item.finalPrice}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }, [wishlistIds, fadeAnim])

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="package-variant-closed" size={90} color="#D0D8E4" />
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try different keywords' : 'Check back later for new items'}
      </Text>
    </View>
  )

  // ── Full-screen skeleton (first load) ─────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />
        <SkeletonGrid />
      </View>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Skeleton OR Product Grid ──────────────────────────────────────── */}
      {contentLoading ? (
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0B77A7']}
              tintColor="#0B77A7"
            />
          }
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    backgroundColor: '#0B77A7',
    elevation: 4,
  },
  backBtn: {
    width: '40@s', height: '40@s', borderRadius: '20@s',
    justifyContent: 'center', alignItems: 'center',
  },
  headerContent: { flex: 1, marginLeft: '10@s' },
  headerTitle: { fontSize: '17@ms', fontFamily: FONTS.Bold, color: '#fff' },
  headerSubtitle: { fontSize: '11@ms', color: 'rgba(255,255,255,0.75)', marginTop: '1@vs' },
  cartBtn: {
    width: '40@s', height: '40@s', borderRadius: '20@s',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#FF5252', width: '17@s', height: '17@s',
    borderRadius: '8.5@s', justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { fontSize: '9@ms', color: '#fff', fontFamily: FONTS.Bold },

  // ── Search ───────────────────────────────────────────────────────────────
  searchContainer: { paddingHorizontal: '14@s', paddingVertical: '10@vs' },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: '22@ms',
    paddingHorizontal: '12@s',
    height: '42@vs',
    borderWidth: 1,
    borderColor: '#DDE3EA',
  },
  searchIcon: { marginRight: '6@s' },
  searchInput: {
    flex: 1, fontSize: '13@ms', fontFamily: FONTS.Medium,
    backgroundColor: 'transparent', padding: 0, height: '42@vs',
  },
  loadingIcon: { marginLeft: '6@s' },

  // ── Filter / Sort Row — KEY FIX: no overflow, compact buttons ───────────
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '14@s',
    paddingVertical: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    gap: '6@s',
    // No flexWrap so row stays single-line; buttons shrink via flexShrink
  },

  // Dropdown trigger — compact, will NOT overflow
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '3@s',
    borderWidth: 1.5,
    borderColor: '#0B77A7',
    borderRadius: '8@ms',
    paddingHorizontal: '8@s',
    paddingVertical: '5@vs',
    flexShrink: 0,          // don't let it grow unbounded
    maxWidth: '110@s',      // hard cap so it never overflows
  },
  dropdownBtnActive: { backgroundColor: '#0B77A7' },
  dropdownBtnLabel: {
    fontSize: '11@ms',
    fontFamily: FONTS.SemiBold,
    color: '#0B77A7',
    flexShrink: 1,
  },
  dropdownBtnLabelActive: { color: '#fff' },

  // Active filter pill (compact)
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '3@s',
    backgroundColor: '#E3F2FD',
    borderRadius: '10@ms',
    paddingHorizontal: '7@s',
    paddingVertical: '4@vs',
    maxWidth: '76@s',
    flexShrink: 1,
  },
  activePillText: { fontSize: '10@ms', color: '#0B77A7', fontFamily: FONTS.Medium, flexShrink: 1 },

  // Dropdown modal / menu
  ddOverlay: { flex: 1 },
  ddMenu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAF0F6',
  },
  ddItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '14@s',
    paddingVertical: '11@vs',
  },
  ddItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F5F8' },
  ddItemActive: { backgroundColor: '#EBF6FB' },
  ddItemText: { fontSize: '13@ms', color: '#333', fontFamily: FONTS.Regular, flex: 1 },
  ddItemTextActive: { color: '#0B77A7', fontFamily: FONTS.SemiBold },

  // ── Product list ─────────────────────────────────────────────────────────
  productList: { padding: '14@s', paddingTop: '10@vs', paddingBottom: '24@vs' },
  columnWrapper: { justifyContent: 'space-between' },
  cardWrapper: { width: '48.5%', marginBottom: '12@vs' },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: '10@ms',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#DCDCDC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  imageContainer: { position: 'relative', backgroundColor: '#fff', height: '135@vs' , padding:'20@vs'},
  productImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  badge: {
    position: 'absolute', top: '7@vs', left: '7@s',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: '6@s', paddingVertical: '3@vs',
    borderRadius: '10@ms', gap: '3@s',
  },
  badgeText: { fontSize: '8.5@ms', fontFamily: FONTS.Bold, color: '#fff' },
  heartBtn: {
    position: 'absolute', top: '7@vs', right: '7@s',
    width: '30@s', height: '30@s', borderRadius: '15@s',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3,
  },
  featuredStar: {
    position: 'absolute', bottom: '7@vs', left: '7@s',
    backgroundColor: '#fff', width: '22@s', height: '22@s',
    borderRadius: '11@s', justifyContent: 'center', alignItems: 'center', elevation: 2,
  },

  // ── Product info ─────────────────────────────────────────────────────────
  productInfo: { padding: '10@s' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4@s',
    marginBottom: '6@vs',
  },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: '5@s', paddingVertical: '2@vs',
    borderRadius: '7@ms', gap: '3@s',
  },
  stockText: { fontSize: '9@ms', fontFamily: FONTS.Bold },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: '5@s', paddingVertical: '2@vs',
    borderRadius: '7@ms', gap: '2@s', flexShrink: 1,
  },
  category: { fontSize: '9@ms', color: '#0B77A7', fontFamily: FONTS.Bold, flexShrink: 1 },
  productName: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', lineHeight: '17@vs' },
  priceContainer: { marginTop: '5@vs' },
  basePrice: {
    fontSize: '11@ms', color: '#9E9E9E',
    textDecorationLine: 'line-through', fontFamily: FONTS.Medium,
  },
  finalPrice: { fontSize: '14@ms', color: '#1565C0', fontFamily: FONTS.Bold },
  taxLabel: { fontSize: '9.5@ms', color: '#00838F', marginTop: '1@vs' },
  savings: { fontSize: '10@ms', color: '#2E7D32', marginTop: '2@vs', fontFamily: FONTS.SemiBold },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingTop: '70@vs', paddingHorizontal: '40@s',
  },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginTop: '16@vs', marginBottom: '8@vs' },
  emptySubtitle: { fontSize: '13@ms', color: '#888', textAlign: 'center' },

  // ── Pagination ────────────────────────────────────────────────────────────
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '16@vs',
    gap: '6@s',
    flexWrap: 'wrap',
  },
  pageBtn: {
    width: '36@s', height: '36@s', borderRadius: '8@ms',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE3EA', elevation: 1,
  },
  pageBtnActive: { backgroundColor: '#0B77A7', borderColor: '#0B77A7' },
  pageBtnDisabled: { backgroundColor: '#F5F7FA', borderColor: '#EAECEF' },
  pageBtnText: { fontSize: '13@ms', fontFamily: FONTS.SemiBold, color: '#444' },
  pageBtnTextActive: { color: '#fff' },
  pageDots: { fontSize: '15@ms', color: '#aaa', paddingHorizontal: '2@s' },
})
