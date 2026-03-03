import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  StatusBar,
  RefreshControl,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'

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

export default function WishlistScreen() {
  const navigation = useNavigation()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [removingItems, setRemovingItems] = useState(new Set())
  const [addingToCart, setAddingToCart] = useState(new Set())
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    fetchWishlist()
  }, [])

  useEffect(() => {
    if (!loading && wishlist.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }
  }, [loading, wishlist])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/wishlist`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const json = await res.json()
      setWishlist(json.data?.rows || [])
    } catch (err) {
      console.log('Wishlist fetch error:', err)
      Alert.alert('Error', 'Unable to load wishlist')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchWishlist()
  }

  const removeFromWishlist = async itemId => {
    setRemovingItems(prev => new Set(prev).add(itemId))

    try {
      const token = await AsyncStorage.getItem('userToken')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/items/${itemId}/wishlist/remove`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      console.log(res)

      if (!res.ok) throw new Error('Remove failed')
      

      // Optimistic update
      setWishlist(prev => prev.filter(item => item.id !== itemId))
    } catch (err) {
      // Refetch on error
      await fetchWishlist()
    } finally {
      setRemovingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const addToCart = async item => {
    setAddingToCart(prev => new Set(prev).add(item.id))

    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/items/${item.id}/cart/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: 1,
            selectedAttributes: [],
          }),
        }
      )

      const json = await res.json()
      console.log(json)

      if (!res.ok) throw json

      Alert.alert('Success', 'Item added to cart', [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'Go to Cart',
          onPress: () => navigation.navigate('CartScreen'),
        },
      ])
    } catch (err) {
      if (err?.code === 'MISSING_REQUIRED_ATTRIBUTE') {
        Alert.alert(
          'Select Options',
          'This product requires you to select options',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'View Product',
              onPress: () =>
                navigation.navigate('ProductDetail', { itemId: item.id }),
            },
          ]
        )
      } else if (err?.code === 'OUT_OF_STOCK') {
        Alert.alert('Out of Stock', 'This item is currently unavailable')
      } else {
        Alert.alert('Error', 'Unable to add to cart')
      }
    } finally {
      setAddingToCart(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  const moveAllToCart = async () => {
    const inStockItems = wishlist.filter(item => {
      const isDigital = item.itemType === 'digital'

      const stock = isDigital
        ? item.digitalAssets?.length ?? 0
        : item.inventories?.[0]?.quantityAvailable ?? 0

      return stock > 0
    })


    if (inStockItems.length === 0) {
      Alert.alert('No Items', 'No in-stock items to move to cart')
      return
    }

    Alert.alert(
      'Move All to Cart',
      `Move ${inStockItems.length} in-stock items to cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move All',
          onPress: async () => {
            for (const item of inStockItems) {
              await addToCart(item)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0B77A7" />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.headerSubtitle}>
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareBtn}>
          <Icon name="share-variant" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={100} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>
            Save items you love to buy them later
          </Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() => navigation.navigate('ExploreInventoryScreen')}
            activeOpacity={0.8}
          >
            <Text style={styles.shopNowText}>Start Shopping</Text>
            <Icon name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Action Bar */}
          {wishlist.length > 0 && (
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.moveAllBtn}
                onPress={moveAllToCart}
                activeOpacity={0.8}
              >
                <Icon name="cart-plus" size={20} color="#0B77A7" />
                <Text style={styles.moveAllText}>Move All to Cart</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Wishlist Items */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
              {wishlist.map((item, index) => {
                const imageUrl = item.media?.[0]?.url
                const price = item.prices?.[0]?.amount
                const isDigital = item.itemType === 'digital'
                const stock = isDigital
                  ? item.digitalAssets?.length ?? 0
                  : item.inventories?.[0]?.quantityAvailable ?? 0

                const shortDescAttr = item.attributes?.find(
                  a => a.key === 'short_description'
                )
                const isRemoving = removingItems.has(item.id)
                const isAddingCart = addingToCart.has(item.id)

                return (
                  <View key={item.id} style={styles.card}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('ProductDetail', {
                          itemId: item.id,
                        })
                      }
                      activeOpacity={0.9}
                    >
                      <View style={styles.cardContent}>
                        {/* Product Image */}
                        <View style={styles.imageContainer}>
                          <Image
                            source={imageUrl ? { uri: imageUrl } : noimage}
                            style={styles.productImage}
                          />

                          {/* Digital Badge */}
                          {isDigital && (
                            <View style={styles.digitalBadge}>
                              <Icon name="download" size={10} color="#fff" />
                            </View>
                          )}

                          {/* Remove Button */}
                          <TouchableOpacity
                            style={styles.removeIconBtn}
                            onPress={() => removeFromWishlist(item.id)}
                            disabled={isRemoving}
                            activeOpacity={0.7}
                          >
                            {isRemoving ? (
                              <ActivityIndicator size="small" color="#FF5252" />
                            ) : (
                              <Icon
                                name="heart"
                                size={20}
                                color="#FF5252"
                              />
                            )}
                          </TouchableOpacity>
                        </View>

                        {/* Product Info */}
                        <View style={styles.productInfo}>
                          {/* Category */}
                          {item.Categories?.length > 0 && (
                            <View style={styles.categoryBadge}>
                              <Icon
                                name="tag-outline"
                                size={10}
                                color="#0B77A7"
                              />
                              <Text style={styles.categoryText}>
                                {item.Categories.map(c => c.name).join(' • ')}
                              </Text>
                            </View>
                          )}

                          {/* Title & Description */}
                          <AutoScrollTitleDesc
                            title={item.title}
                            description={shortDescAttr?.value}
                            style={styles.productTitle}
                            height={38}
                          />

                          {/* Price & Stock Row */}
                          <View style={styles.priceStockRow}>
                            <Text style={styles.price}>₹{price}</Text>
                            <View
                              style={[
                                styles.stockBadge,
                                {
                                  backgroundColor: stock > 0
                                    ? '#E8F5E9'
                                    : '#FFEBEE',
                                },
                              ]}
                            >
                              <Icon
                                name={
                                  stock > 0 ? 'check-circle' : 'close-circle'
                                }
                                size={10}
                                color={stock > 0 ? '#4CAF50' : '#F44336'}
                              />
                              <Text
                                style={[
                                  styles.stockText,
                                  {
                                    color: stock > 0 ? '#4CAF50' : '#F44336',
                                  },
                                ]}
                              >
                                {stock > 0 ? 'In Stock' : 'Out of Stock'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={() => removeFromWishlist(item.id)}
                        style={styles.removeBtn}
                        disabled={isRemoving}
                        activeOpacity={0.7}
                      >
                        {isRemoving ? (
                          <ActivityIndicator size="small" color="#FF5252" />
                        ) : (
                          <>
                            <Icon name="delete-outline" size={18} color="#FF5252" />
                            <Text style={styles.removeBtnText}>Remove</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => addToCart(item)}
                        style={[
                          styles.addToCartBtn,
                          stock === 0 && styles.addToCartBtnDisabled,
                        ]}
                        disabled={stock === 0 || isAddingCart}
                        activeOpacity={0.8}
                      >
                        {isAddingCart ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Icon name="cart-plus" size={18} color="#fff" />
                            <Text style={styles.addToCartText}>
                              Add to Cart
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </Animated.View>
          </ScrollView>
        </>
      )}
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
  shareBtn: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Action Bar
  actionBar: {
    backgroundColor: '#fff',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  moveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: '10@vs',
    borderRadius: '10@ms',
    gap: '8@s',
  },
  moveAllText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
  },

  // Scroll Content
  scrollContent: {
    padding: '16@s',
    paddingBottom: '24@vs',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: '16@ms',
    marginBottom: '14@vs',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: '14@s',
  },

  // Image Container
  imageContainer: {
    position: 'relative',
    width: '100@s',
    height: '100@s',
    borderRadius: '12@ms',
    backgroundColor: '#FAFAFA',
    marginRight: '12@s',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: '12@ms',
    resizeMode: 'contain',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: '12@ms',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitalBadge: {
    position: 'absolute',
    bottom: '6@vs',
    right: '6@s',
    backgroundColor: '#1976D2',
    width: '20@s',
    height: '20@s',
    borderRadius: '10@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIconBtn: {
    position: 'absolute',
    top: '6@vs',
    right: '6@s',
    width: '28@s',
    height: '28@s',
    borderRadius: '14@s',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  // Product Info
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
    borderRadius: '10@ms',
    marginBottom: '6@vs',
    gap: '4@s',
  },
  categoryText: {
    fontSize: '10@ms',
    color: '#0B77A7',
    fontFamily: FONTS.Bold,
  },
  productTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    lineHeight: '18@vs',
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6@vs',
  },
  price: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
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

  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: '10@s',
    padding: '14@s',
    paddingTop: '0@vs',
  },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '10@vs',
    borderRadius: '10@ms',
    borderWidth: 1.5,
    borderColor: '#FFE5E5',
    backgroundColor: '#FFF5F5',
    gap: '6@s',
  },
  removeBtnText: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#FF5252',
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '10@vs',
    borderRadius: '10@ms',
    backgroundColor: '#0B77A7',
    gap: '6@s',
    elevation: 2,
    shadowColor: '#0B77A7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addToCartBtnDisabled: {
    backgroundColor: '#B0BEC5',
    elevation: 0,
  },
  addToCartText: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '40@s',
  },
  emptyTitle: {
    fontSize: '22@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginTop: '24@vs',
    marginBottom: '8@vs',
  },
  emptySubtitle: {
    fontSize: '14@ms',
    color: '#666',
    textAlign: 'center',
    marginBottom: '32@vs',
  },
  shopNowBtn: {
    flexDirection: 'row',
    backgroundColor: '#0B77A7',
    paddingHorizontal: '32@s',
    paddingVertical: '14@vs',
    borderRadius: '30@ms',
    alignItems: 'center',
    gap: '8@s',
    elevation: 4,
    shadowColor: '#0B77A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shopNowText: {
    color: '#fff',
    fontFamily: FONTS.Bold,
    fontSize: '16@ms',
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
