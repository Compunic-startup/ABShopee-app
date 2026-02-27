import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import noimage from '../../../assets/images/Categories/noimage.png'
import AsyncStorage from '@react-native-async-storage/async-storage'
const { width } = Dimensions.get('window')

export default function ProductDetailScreen() {
  const navigation = useNavigation()
  const { itemId } = useRoute().params

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(null)
  const [wishlist, setWishlist] = useState(false)
  const [selectedAttrs, setSelectedAttrs] = useState({})
  const [fadeAnim] = useState(new Animated.Value(0))
  const [imageIndex, setImageIndex] = useState(0)

  const galleryRef = useRef(null)
  const scrollViewRef = useRef(null)

  const galleryImages = product?.media?.filter(m => m.role === 'gallery') || []

  useEffect(() => {
    fetchProduct()
  }, [])

  useEffect(() => {
    if (!loading && product) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }
  }, [loading, product])

  const getAttributeOptions = attr => {
    if (Array.isArray(attr.options)) return attr.options
    if (Array.isArray(attr.values)) return attr.values
    if (Array.isArray(attr.meta?.options)) return attr.meta.options
    return []
  }

  const fetchProduct = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/products/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const json = await res.json()
      console.log('Product data', json)
      setProduct(json.data)
    } catch (err) {
      console.log('Product fetch error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!galleryImages.length) return

    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % galleryImages.length
      setActiveImage(galleryImages[index].url)
      setImageIndex(index)

      galleryRef.current?.scrollTo({
        x: index * 76,
        animated: true,
      })
    }, 3500)

    return () => clearInterval(interval)
  }, [galleryImages])

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0B77A7" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    )
  }

  if (!product) return null

  const shortDescAttr = Object.values(product.attributes || {}).find(
    a => a.key === 'short_description'
  )

  const resolvedDescription =
    shortDescAttr?.value ||
    product.description ||
    null


  const isDigital = product.itemType === 'digital'
  const digitalStockCount = product.digitalAssets?.length || 0
  const physicalStockQty = product.inventories?.[0]?.quantityAvailable ?? 0
  const inStock = isDigital ? digitalStockCount > 0 : physicalStockQty > 0

  const selectableAttributes = Object.values(product.attributes || {}).filter(
    attr => attr.isSelectable === true && getAttributeOptions(attr).length > 0
  )

  const renderSelectableAttribute = attr => {
    const options = getAttributeOptions(attr)
    return (
      <View key={attr.key} style={styles.attributeSection}>
        <Text style={styles.attributeLabel}>
          {attr.label}
          {attr.isRequiredInCart && <Text style={styles.required}> *</Text>}
        </Text>

        <View style={styles.optionContainer}>
          {options.map(option => {
            const selected = selectedAttrs[attr.key] === option

            return (
              <TouchableOpacity
                key={option}
                onPress={() =>
                  setSelectedAttrs(prev => ({
                    ...prev,
                    [attr.key]: option,
                  }))
                }
                style={[
                  styles.optionChip,
                  selected && styles.optionChipSelected,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

  const primaryImage =
    activeImage || product.media?.find(m => m.role === 'primary')?.url || null

  const priceObj = product.prices?.[0]

  const rawBase =
    product.discountPricing?.basePrice ??
    priceObj?.amount ??
    0

  const rawFinal =
    product.discountPricing?.finalPrice ??
    priceObj?.amount ??
    0

  const rawDiscount =
    product.discountPricing?.discountTotal ??
    0

  const basePrice = Math.round(rawBase)
  const finalPrice = Math.round(rawFinal)
  const discountTotal = Math.round(rawDiscount)

  const currency = priceObj?.currency === 'INR' ? '₹' : ''

  const stockQty = isDigital ? digitalStockCount : physicalStockQty

  const renderKeyValue = obj =>
    Object.entries(obj || {}).map(([key, value]) => (
      <View key={key} style={styles.specRow}>
        <Text style={styles.specKey}>{key}</Text>
        <Text style={styles.specValue}>{String(value)}</Text>
      </View>
    ))

  const renderAttribute = attr => {
    if (!attr?.isPublic || attr?.value == null) return null

    const { label, dataType, value } = attr

    return (
      <View key={attr.key} style={styles.attributeSection}>
        <Text style={styles.attributeLabel}>{label}</Text>

        {dataType === 'string' && (
          <Text style={styles.description}>{value}</Text>
        )}

        {dataType === 'boolean' && (
          <Text style={styles.description}>{value ? 'Yes' : 'No'}</Text>
        )}

        {dataType === 'array' &&
          value.map((v, i) => (
            <View key={i} style={styles.bulletRow}>
              <Icon name="circle-small" size={16} color="#666" />
              <Text style={styles.bulletText}>{v}</Text>
            </View>
          ))}

        {dataType === 'json' && renderKeyValue(value)}
      </View>
    )
  }

  const buildSelectedAttributesPayload = () => {
    const attrs = Object.values(product.attributes || {}).filter(
      a => a.isSelectable === true
    )

    const payload = []

    for (const attr of attrs) {
      const selectedValue = selectedAttrs[attr.key]

      if (attr.isRequiredInCart && selectedValue == null) {
        throw new Error(`Please select ${attr.label}`)
      }

      if (selectedValue != null) {
        payload.push({
          attributeDefinitionId: attr.attributeDefinitionId,
          sourceType: attr.source,
          value: selectedValue,
        })
      }
    }

    return payload
  }

  const toggleWishlist = async () => {
    try {
      const url = wishlist
        ? `/customer/business/${businessId}/items/${itemId}/wishlist/remove`
        : `/customer/business/${businessId}/items/${itemId}/wishlist/add`

      const res = await fetch(BASE_URL + url, {
        method: wishlist ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${global.accessToken}`,
        },
      })

      if (!res.ok) throw new Error('Wishlist error')

      setWishlist(prev => !prev)
    } catch (e) {
      console.log('Wishlist error', e)
    }
  }

  const addToCart = async () => {
    try {
      if (isDigital && digitalStockCount === 0) {
        alert('This digital product is currently out of stock')
        return
      }

      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const selectedAttributes = buildSelectedAttributesPayload()

      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/items/${itemId}/cart/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: 1,
            selectedAttributes,
          }),
        }
      )

      const json = await res.json()
      console.log('Add to cart response', json)

      if (!res.ok) {
        throw json
      }

      navigation.navigate('CartScreen')
    } catch (err) {
      console.log('Add to cart error', err)

      if (err?.code === 'MISSING_REQUIRED_ATTRIBUTE') {
        alert('Please select all required options')
      } else if (err?.code === 'OUT_OF_STOCK') {
        alert('Item is out of stock')
      } else if (err?.code === 'INVALID_ATTRIBUTES') {
        alert('Invalid selection')
      } else {
        alert(err.message || 'Something went wrong')
      }
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="share-variant" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Image Section */}
          <View style={styles.imageSection}>
            <Image
              source={primaryImage ? { uri: primaryImage } : noimage}
              style={styles.productImage}
            />

            {/* Wishlist Button */}
            <TouchableOpacity
              onPress={toggleWishlist}
              style={styles.wishlistBtn}
              activeOpacity={0.8}
            >
              <Icon
                name={wishlist ? 'heart' : 'heart-outline'}
                size={24}
                color={wishlist ? '#FF5252' : '#666'}
              />
            </TouchableOpacity>

            {/* Image Indicators */}
            {galleryImages.length > 0 && (
              <View style={styles.imageIndicators}>
                {galleryImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      imageIndex === index && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Gallery Thumbnails */}
          {galleryImages.length > 0 && (
            <ScrollView
              ref={galleryRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryContainer}
            >
              {galleryImages.map((img, index) => (
                <TouchableOpacity
                  key={img.id}
                  onPress={() => {
                    setActiveImage(img.url)
                    setImageIndex(index)
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={[
                      styles.galleryImage,
                      imageIndex === index && styles.activeGalleryImage,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Product Info Card */}
          <View style={styles.infoCard}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* Categories */}
              {product.Categories?.length > 0 && (
                <View style={styles.categoryContainer}>
                  {product.Categories.map((cat, index) => (
                    <View key={cat.id} style={styles.categoryChip}>
                      <Icon name="tag-outline" size={12} color="#0B77A7" />
                      <Text style={styles.categoryText}>{cat.name}</Text>
                    </View>
                  ))}
                </View>
              )}
              {/* <View style={[
                styles.typeBadge,
                { backgroundColor: isDigital ? '#E3F2FD' : '#E8F5E9' },
              ]}>

                <Icon
                  name={isDigital ? 'download' : 'cube-outline'}
                  size={16}
                  color={isDigital ? '#1976D2' : '#388E3C'}
                />
                <Text
                  style={[
                    styles.typeText,
                    { color: isDigital ? '#1976D2' : '#388E3C' },
                  ]}
                >
                  {isDigital ? 'Digital' : 'Physical'}
                </Text>
              </View> */}
            </View>

            {/* Title */}
            <Text style={styles.productTitle}>{product.title}</Text>

            {/* Price & Stock Row */}
            <View style={styles.priceStockRow}>
              <View style={styles.priceContainer}>
                {discountTotal > 0 ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.basePrice}>
                        {currency}{basePrice}
                      </Text>

                      <Text style={styles.productPrice}>
                        {'  '}{currency}{finalPrice}
                      </Text>
                    </View>

                    <Text style={styles.savings}>
                      You save {currency}{discountTotal}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.productPrice}>
                    {currency}{finalPrice}
                  </Text>
                )}
              </View>

              <View style={[
                styles.typeBadge,
                { backgroundColor: isDigital ? '#E3F2FD' : '#E8F5E9' },
              ]}>

                <Text
                  style={[
                    styles.stockText,
                    { color: inStock ? '#4CAF50' : '#FF5252' },
                  ]}
                >
                  <Icon
                    name={inStock ? 'check-circle' : 'close-circle'}
                    size={14}
                    color={inStock ? '#4CAF50' : '#FF5252'}
                  />{' '}
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>

            </View>

            {/* Rating & Reviews (Placeholder) */}
            <View style={styles.ratingRow}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Icon
                    key={star}
                    name={star <= 4 ? 'star' : 'star-outline'}
                    size={16}
                    color="#FFC107"
                  />
                ))}
                <Text style={styles.ratingText}>4.0</Text>
              </View>
              <Text style={styles.reviewCount}>128 reviews</Text>
            </View>
          </View>

          {/* Selectable Attributes */}
          {selectableAttributes.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="tune-variant" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Customize Your Product</Text>
              </View>
              {selectableAttributes.map(renderSelectableAttribute)}
            </View>
          )}

          {/* Product Details */}
          {Object.values(product.attributes || {}).filter(
            attr => !attr.isSelectable && attr.isPublic
          ).length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="information-outline" size={22} color="#0B77A7" />
                  <Text style={styles.sectionTitle}>Product Details</Text>
                </View>
                {Object.values(product.attributes)
                  .filter(attr => !attr.isSelectable)
                  .map(renderAttribute)}
              </View>
            )}

          {/* Features Section (if description exists) */}
          {resolvedDescription && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="format-list-bulleted" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.description}>{resolvedDescription}</Text>
            </View>
          )}

          {/* Delivery & Returns */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="truck-delivery-outline" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Delivery & Returns</Text>
            </View>

            <View style={styles.deliveryItem}>
              <Icon name="clock-outline" size={20} color="#4CAF50" />
              <View style={styles.deliveryTextContainer}>
                <Text style={styles.deliveryTitle}>
                  {isDigital ? 'Instant Delivery' : 'Fast Delivery'}
                </Text>
                <Text style={styles.deliverySubtitle}>
                  {isDigital
                    ? 'Download immediately after purchase'
                    : 'Delivered in 3-5 business days'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.deliveryItem}>
              <Icon name="shield-check-outline" size={20} color="#0B77A7" />
              <View style={styles.deliveryTextContainer}>
                <Text style={styles.deliveryTitle}>
                  {isDigital ? 'No Returns' : '7 Days Return'}
                </Text>
                <Text style={styles.deliverySubtitle}>
                  {isDigital
                    ? 'Digital products cannot be returned'
                    : 'Return within 7 days of delivery'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.deliveryItem}>
              <Icon name="cash" size={20} color="#FF9800" />
              <View style={styles.deliveryTextContainer}>
                <Text style={styles.deliveryTitle}>
                  {isDigital ? 'Online Payment Only' : 'Cash on Delivery'}
                </Text>
                <Text style={styles.deliverySubtitle}>
                  {isDigital
                    ? 'Pay securely with UPI, cards or wallets'
                    : 'Pay when you receive the product'}
                </Text>
              </View>
            </View>
          </View>

          {/* Similar Products Placeholder */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="tag-multiple-outline" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Similar Products</Text>
            </View>
            <Text style={styles.comingSoon}>Coming soon...</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {inStock ? (
          <>
            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={addToCart}
              activeOpacity={0.8}
            >
              <Icon name="cart-outline" size={22} color="#0B77A7" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buyNowBtn}
              onPress={() => {
                try {
                  const selectedAttributes = buildSelectedAttributesPayload()

                  navigation.navigate('BuyInstantScreen', {
                    itemId,
                    product,
                    selectedAttributes,
                    quantity: 1,
                    isDigital,
                  })
                } catch (err) {
                  alert(err.message || 'Please select required options')
                }
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.buyNowPrice}>
                {currency}{finalPrice}
              </Text>
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.outOfStockBtn} disabled>
            <Icon name="close-circle-outline" size={24} color="#90A4AE" />
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </TouchableOpacity>
        )}
      </View>
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
  headerBtn: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },

  // Image Section
  imageSection: {
    backgroundColor: '#fff',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '320@vs',
    resizeMode: 'contain',
    backgroundColor: '#FAFAFA',
  },
  wishlistBtn: {
    position: 'absolute',
    top: '16@vs',
    right: '16@s',
    width: '44@s',
    height: '44@s',
    borderRadius: '22@s',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: '16@vs',
    flexDirection: 'row',
    alignSelf: 'center',
    gap: '6@s',
  },
  indicator: {
    width: '6@s',
    height: '6@s',
    borderRadius: '3@s',
    backgroundColor: '#D0D0D0',
  },
  activeIndicator: {
    width: '20@s',
    backgroundColor: '#0B77A7',
  },

  // Gallery
  galleryContainer: {
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    backgroundColor: '#fff',
    gap: '8@s',
  },
  galleryImage: {
    width: '64@s',
    height: '64@s',
    borderRadius: '8@ms',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeGalleryImage: {
    borderColor: '#0B77A7',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    padding: '16@s',
    marginTop: '8@vs',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8@s',
    marginBottom: '12@vs',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: '10@s',
    paddingVertical: '4@vs',
    borderRadius: '12@ms',
    gap: '4@s',
  },
  categoryText: {
    fontSize: '11@ms',
    color: '#0B77A7',
    fontFamily: FONTS.Medium,
  },
  productTitle: {
    fontSize: '20@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    lineHeight: '28@ms',
    marginBottom: '12@vs',
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  basePrice: {
    fontSize: '16@ms',
    color: '#606060',
    textDecorationLine: 'line-through',
    marginRight: '0@ms',
    fontFamily: FONTS.SemiBold,
  },

  productPrice: {
    fontSize: '22@ms',
    color: '#1976D2',
    fontFamily: FONTS.Bold,
  },

  savings: {
    fontSize: '13@ms',
    color: '#006e06',
    marginTop: '2@ms',
    fontFamily: FONTS.SemiBold,
  },

  stockText: {
    fontSize: '13@ms',
    fontFamily: FONTS.Medium,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '16@ms',
    gap: '6@s',
  },
  typeText: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '12@vs',
    borderTopWidth: 1,
    borderColor: '#E8E8E8',
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '2@s',
  },
  ratingText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginLeft: '6@s',
  },
  reviewCount: {
    fontSize: '13@ms',
    color: '#666',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#fff',
    marginTop: '8@vs',
    padding: '16@s',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  sectionTitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginLeft: '10@s',
  },

  // Attributes
  attributeSection: {
    marginBottom: '20@vs',
  },
  attributeLabel: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginBottom: '10@vs',
  },
  required: {
    color: '#FF5252',
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '10@s',
  },
  optionChip: {
    paddingVertical: '10@vs',
    paddingHorizontal: '16@s',
    borderRadius: '20@ms',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  optionChipSelected: {
    backgroundColor: '#0B77A7',
    borderColor: '#0B77A7',
  },
  optionText: {
    fontSize: '13@ms',
    color: '#444',
    fontFamily: FONTS.Medium,
  },
  optionTextSelected: {
    color: '#fff',
    fontFamily: FONTS.Bold,
  },

  // Description & Details
  description: {
    fontSize: '13@ms',
    color: '#555',
    lineHeight: '20@vs',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: '6@vs',
  },
  bulletText: {
    fontSize: '13@ms',
    color: '#555',
    lineHeight: '20@vs',
    flex: 1,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: '10@vs',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  specKey: {
    flex: 1,
    fontSize: '13@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  specValue: {
    flex: 1,
    fontSize: '13@ms',
    color: '#1a1a1a',
    textAlign: 'right',
    fontFamily: FONTS.Medium,
  },

  // Delivery
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '12@s',
  },
  deliveryTextContainer: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginBottom: '2@vs',
  },
  deliverySubtitle: {
    fontSize: '12@ms',
    color: '#666',
    lineHeight: '18@vs',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: '14@vs',
  },
  comingSoon: {
    fontSize: '13@ms',
    color: '#999',
    fontStyle: 'italic',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: '12@s',
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopLeftRadius: '20@ms',
    borderTopRightRadius: '20@ms',
    gap: '12@s',
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0B77A7',
    paddingVertical: '14@vs',
    borderRadius: '12@ms',
    gap: '6@s',
  },
  addToCartText: {
    fontSize: '15@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
  },
  buyNowBtn: {
    flex: 1,
    backgroundColor: '#0B77A7',
    paddingVertical: '8@vs',
    borderRadius: '12@ms',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0B77A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buyNowText: {
    fontSize: '16@ms',
    fontFamily: FONTS.Medium,
    color: '#fff',
  },
  buyNowPrice: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  outOfStockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF1',
    paddingVertical: '14@vs',
    borderRadius: '12@ms',
    gap: '8@s',
  },
  outOfStockText: {
    fontSize: '15@ms',
    fontFamily: FONTS.Bold,
    color: '#90A4AE',
  },

  // Loading
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
})
