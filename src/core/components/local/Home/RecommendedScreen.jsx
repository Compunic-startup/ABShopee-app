import React, { useEffect, useState, useRef } from 'react'
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
} from 'react-native'
import { TextInput } from 'react-native-paper'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import ProductBottomSheet from './ProductAddSheet'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

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
          Animated.timing(translateTitle, {
            toValue: -height,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateDesc, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(descOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1800),
        Animated.parallel([
          Animated.timing(translateDesc, {
            toValue: height,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(descOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(translateTitle, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start()
  }, [description])

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.Text
        style={[
          style,
          {
            position: 'absolute',
            transform: [{ translateY: translateTitle }],
            opacity: titleOpacity,
          },
        ]}
        numberOfLines={2}
      >
        {title}
      </Animated.Text>

      {!!description && (
        <Animated.Text
          style={[
            style,
            {
              position: 'absolute',
              transform: [{ translateY: translateDesc }],
              opacity: descOpacity,
              fontSize: 11,
              color: '#666',
            },
          ]}
          numberOfLines={2}
        >
          {description}
        </Animated.Text>
      )}
    </View>
  )
}

const PLACEHOLDER_IMAGE =
  'https://cdn3d.iconscout.com/3d/premium/thumb/super-mario-block-11279445-9032287.png'

export default function ExploreInventoryScreen() {
  const navigation = useNavigation()
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const searchTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [headerAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (!loading && products.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [loading, products])

  const WishlistHeart = ({ active, onPress, itemId }) => {
    const scale = useRef(new Animated.Value(1)).current
    const [isProcessing, setIsProcessing] = useState(false)

    const handlePress = async () => {
      setIsProcessing(true)

      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.3,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start()

      await onPress()
      setIsProcessing(false)
    }

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.heartBtn}
        disabled={isProcessing}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FF5252" />
          ) : (
            <Icon
              name={active ? 'heart' : 'heart-outline'}
              size={20}
              color={active ? '#FF5252' : '#666'}
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    )
  }

  const toggleWishlist = async itemId => {
    const isWishlisted = wishlistIds.has(itemId)

    try {
      const url = isWishlisted
        ? `/customer/business/${businessId}/items/${itemId}/wishlist/remove`
        : `/customer/business/${businessId}/items/${itemId}/wishlist/add`

      const token = await AsyncStorage.getItem('userToken');

      const res = await fetch(BASE_URL + url, {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('wishlist failed')

      ToastAndroid.show(
        isWishlisted ? 'Removed from wishlist ♡' : 'Added to wishlist ♥',
        ToastAndroid.SHORT
      )

      setWishlistIds(prev => {
        const next = new Set(prev)
        isWishlisted ? next.delete(itemId) : next.add(itemId)
        return next
      })
    } catch (e) {
      ToastAndroid.show('Wishlist action failed', ToastAndroid.SHORT)
    }
  }

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const businessId =  await AsyncStorage.getItem('businessId')
      setLoading(true)
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/products`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const json = await res.json()
      console.log(json)

      const mapped = json?.data?.rows?.map(item => {
        const price = item.prices?.[0]
        const inventory = item.inventories?.[0]
        const digitalAssetsCount = item.digitalAssets?.length || 0
        const category = item.Categories?.[0]
        const featuredAttr = item.attributes?.find(
          a => a.key === 'is_featured'
        )
        const shortDescAttr = item.attributes?.find(
          a => a.key === 'short_description'
        )

        const resolvedDescription =
          shortDescAttr?.value ||
          item.description ||
          null


        const rawBase = item.discountPricing?.basePrice ?? price?.amount ?? 0
        const rawFinal = item.discountPricing?.finalPrice ?? price?.amount ?? 0
        const rawDiscount = item.discountPricing?.discountTotal ?? 0

        return {
          id: item.id,
          title: item.title,
          itemType: item.itemType,
          image: item.media?.[0]?.url
            ? { uri: item.media[0].url }
            : { uri: PLACEHOLDER_IMAGE },

          basePrice: Math.round(rawBase),
          finalPrice: Math.round(rawFinal),
          discountTotal: Math.round(rawDiscount),
          discounts: item.discountPricing?.discounts ?? [],
          currency: price?.currency === 'INR' ? '₹' : '',
          inStock:
            item.itemType === 'digital'
              ? digitalAssetsCount > 0
              : inventory && inventory.quantityAvailable > 0,
          inventoryCount:
            item.itemType === 'digital'
              ? digitalAssetsCount
              : inventory?.quantityAvailable || 0,
          category: category?.name,
          featured: featuredAttr?.value === true,
          shortDescription: resolvedDescription,
        }
      })

      setProducts(mapped)
    } catch (e) {
      console.log('Product fetch error', e)
      ToastAndroid.show('Failed to load products', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const searchProducts = async query => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setSearching(true)
      const token = await AsyncStorage.getItem('userToken');
      const businessId =  await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/search/items?q=${encodeURIComponent(
          query
        )}&limit=20`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal
        }
      )

      const json = await res.json()
      console.log('Search results', json)

      const mapped = json?.items?.map(item => {
        const price = item.prices?.[0]
        const inventory = item.inventories?.[0]
        const category = item.Categories?.[0]
        const featuredAttr = item.attributes?.find(a => a.key === 'is_featured')
        const shortDescAttr = item.attributes?.find(
          a => a.key === 'short_description'
        )

        const resolvedDescription =
          shortDescAttr?.value ||
          item.description ||
          null

        return {
          id: item.id,
          title: item.title,
          itemType: item.itemType,
          image: item.media?.[0]?.url
            ? { uri: item.media[0].url }
            : { uri: PLACEHOLDER_IMAGE },
          price: price
            ? `${price.currency === 'INR' ? '₹' : ''}${price.amount}`
            : '—',
          inStock: inventory && inventory.quantityAvailable > 0,
          category: category?.name,
          featured: featuredAttr?.value === true,
          shortDescription: resolvedDescription,

        }
      })

      setProducts(mapped)
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.log('Search error', e)
      }
    } finally {
      setSearching(false)
    }
  }

  const handleSearchChange = text => {
    setSearchQuery(text)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (text.trim().length < 3) {
      fetchProducts()
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(text.trim())
    }, 400)
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchProducts()
  }

  const filterProducts = () => {
    if (selectedFilter === 'all') return products
    if (selectedFilter === 'digital')
      return products.filter(p => p.itemType === 'digital')
    if (selectedFilter === 'physical')
      return products.filter(p => p.itemType === 'physical')
    if (selectedFilter === 'in_stock')
      return products.filter(p => p.inStock === true)
    if (selectedFilter === 'featured')
      return products.filter(p => p.featured === true)
    return products
  }

  const filters = [
    { key: 'all', label: 'All', icon: 'view-grid' },
    { key: 'digital', label: 'Digital', icon: 'download' },
    { key: 'physical', label: 'Physical', icon: 'cube-outline' },
    { key: 'in_stock', label: 'In Stock', icon: 'check-circle' },
    { key: 'featured', label: 'Featured', icon: 'star' },
  ]

  const renderItem = ({ item, index }) => {
    const isDigital = item.itemType === 'digital'

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('ProductDetail', {
              itemId: item.id,
            })
          }
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.productImage} />

            {/* Badge */}
            <View
              style={[
                styles.badge,
                { backgroundColor: isDigital ? '#1976D2' : '#388E3C' },
              ]}
            >
              <Icon
                name={isDigital ? 'download' : 'cube-outline'}
                size={10}
                color="#fff"
              />
              <Text style={styles.badgeText}>
                {isDigital ? 'Digital' : 'Physical'}
              </Text>
            </View>

            {/* Wishlist Button */}
            <WishlistHeart
              active={wishlistIds.has(item.id)}
              onPress={() => toggleWishlist(item.id)}
              itemId={item.id}
            />

            {/* Featured Star */}
            {item.featured && (
              <View style={styles.featuredStar}>
                <Icon name="star" size={14} color="#FFD700" />
              </View>
            )}
          </View>

          <View style={styles.productInfo}>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 2 }}>
              {/* Price & Stock Row */}
              <View style={styles.priceStockRow2}>
                <View
                  style={[
                    styles.stockBadge,
                    {
                      backgroundColor: item.inStock ? '#E8F5E9' : '#FFEBEE',
                    },
                  ]}
                >
                  <Icon
                    name={item.inStock ? 'check-circle' : 'close-circle'}
                    size={10}
                    color={item.inStock ? '#4CAF50' : '#F44336'}
                  />
                  <Text
                    style={[
                      styles.stockText,
                      { color: item.inStock ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    {item.inStock ? 'In Stock' : 'Out'}
                  </Text>
                </View>
              </View>

              {/* Category */}
              {!!item.category && (
                <View style={styles.categoryBadge}>
                  <Icon name="tag-outline" size={10} color="#0B77A7" />
                  <Text style={styles.category}>{item.category}</Text>
                </View>
              )}
            </View>

            {/* Title & Description */}
            <AutoScrollTitleDesc
              title={item.title}
              description={item.shortDescription}
              style={styles.productName}
              height={38}
            />

            {/* Price & Stock Row */}
            <View style={styles.priceContainer}>
              {item.discountTotal > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.basePrice}>
                      {item.currency}{item.basePrice}
                    </Text>

                    <Text style={styles.finalPrice}>
                      {'  '}{item.currency}{item.finalPrice}
                    </Text>
                  </View>

                  <Text style={styles.savings}>
                    You save {item.currency}{item.discountTotal}
                  </Text>
                </>
              ) : (
                <Text style={styles.finalPrice}>
                  {item.currency}{item.finalPrice}
                </Text>
              )}
            </View>


            {/* Add to Cart Button
                      {item.inStock && (
                        <TouchableOpacity
                          style={styles.addToCartBtn}
                          onPress={e => {
                            e.stopPropagation()
                            navigation.navigate('ProductDetail', {
                              itemId: item.id,
                            })
                          }}
                          activeOpacity={0.8}
                        >
                          <Icon name="cart-plus" size={16} color="#0B77A7" />
                          <Text style={styles.addToCartText}>Add to Cart</Text>
                        </TouchableOpacity>
                      )} */}

          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="package-variant-closed" size={100} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try searching with different keywords'
          : 'Check back later for new items'}
      </Text>
    </View>
  )

  const filteredProducts = filterProducts()

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0B77A7" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
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
        ListEmptyComponent={!loading && renderEmpty}
      />

      <ProductBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        product={selectedProduct}
      />
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    backgroundColor: '#0B77A7',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backBtn: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: '12@s',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: '12@ms',
    color: 'rgba(255,255,255,0.8)',
    marginTop: '2@vs',
  },
  cartBtn: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5252',
    width: '18@s',
    height: '18@s',
    borderRadius: '9@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: '10@ms',
    color: '#fff',
    fontFamily: FONTS.Bold,
  },

  // Store Info Card
  storeInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: '16@s',
    marginTop: '16@vs',
    padding: '14@s',
    borderRadius: '12@ms',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  storeIconContainer: {
    width: '50@s',
    height: '50@s',
    borderRadius: '25@s',
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginBottom: '4@vs',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: '6@vs',
    gap: '4@s',
  },
  location: {
    fontSize: '11@ms',
    color: '#666',
    flex: 1,
    lineHeight: '16@vs',
  },
  storeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@s',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
  },
  metricText: {
    fontSize: '12@ms',
    color: '#1a1a1a',
    fontFamily: FONTS.Medium,
  },
  metricDivider: {
    width: 1,
    height: '12@vs',
    backgroundColor: '#E0E0E0',
  },

  // Search Container
  searchContainer: {
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: '25@ms',
    paddingHorizontal: '16@s',
    height: '44@vs',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: '8@s',
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    backgroundColor: 'transparent',
    padding: 0,
    height: '44@vs',
  },
  loadingIcon: {
    marginLeft: '8@s',
  },

  // Filters
  filterScroll: {
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    gap: '10@s',
    backgroundColor: '#fff',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '8@vs',
    borderRadius: '20@ms',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: '6@s',
  },
  filterChipActive: {
    backgroundColor: '#0B77A7',
    borderColor: '#0B77A7',
  },
  filterText: {
    fontSize: '13@ms',
    fontFamily: FONTS.Medium,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontFamily: FONTS.Bold,
  },

  // Product List
  productList: {
    padding: '16@s',
    paddingTop: '8@vs',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: '14@vs',
  },

  // Product Card
  card: {
    backgroundColor: '#fff',
    borderRadius: '7@ms',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#878787',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#FAFAFA',
    height: '140@vs',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  badge: {
    position: 'absolute',
    top: '8@vs',
    left: '8@s',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '12@ms',
    gap: '4@s',
  },
  badgeText: {
    fontSize: '9@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  heartBtn: {
    position: 'absolute',
    top: '8@vs',
    right: '8@s',
    width: '32@s',
    height: '32@s',
    borderRadius: '16@s',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  featuredStar: {
    position: 'absolute',
    bottom: '8@vs',
    left: '8@s',
    backgroundColor: '#fff',
    width: '24@s',
    height: '24@s',
    borderRadius: '12@s',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  // Product Info
  productInfo: {
    padding: '12@s',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
    borderRadius: '10@ms',
    marginBottom: '8@vs',
    gap: '4@s',
  },
  category: {
    fontSize: '10@ms',
    color: '#0B77A7',
    fontFamily: FONTS.Bold,
  },
  productName: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    lineHeight: '18@vs',
  },
  priceContainer: {
    marginTop: '6@ms',
  },

  basePrice: {
    fontSize: '12@ms',
    color: '#606060',
    textDecorationLine: 'line-through',
    marginRight: '0@ms',
    fontFamily: FONTS.SemiBold,
  },

  finalPrice: {
    fontSize: '16@ms',
    color: '#1976D2',
    fontFamily: FONTS.Bold,
  },

  savings: {
    fontSize: '11@ms',
    color: '#006e06',
    marginTop: '2@ms',
    fontFamily: FONTS.SemiBold,
  },

  discountBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: '6@ms',
  },

  discountBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: '8@ms',
    paddingVertical: '3@ms',
    borderRadius: '12@ms',
    marginRight: '6@ms',
    marginBottom: '4@ms',
  },

  discountBadgeText: {
    fontSize: '9@ms',
    color: '#E65100',
  },

  priceStockRow2: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8@vs',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
    borderRadius: '10@ms',
    gap: '3@s',
  },
  stockText: {
    fontSize: '10@ms',
    fontFamily: FONTS.Bold,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: '8@vs',
    borderRadius: '8@ms',
    gap: '6@s',
  },
  addToCartText: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '60@vs',
    paddingHorizontal: '40@s',
  },
  emptyTitle: {
    fontSize: '20@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginTop: '20@vs',
    marginBottom: '8@vs',
  },
  emptySubtitle: {
    fontSize: '13@ms',
    color: '#666',
    textAlign: 'center',
  },

  // Loading
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '60@vs',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
})
