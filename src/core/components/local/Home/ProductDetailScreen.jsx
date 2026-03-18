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
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import noimage from '../../../assets/images/Categories/preloader.gif'
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
  const [offerExpanded, setOfferExpanded] = useState(true)
  const [pulsAnim] = useState(new Animated.Value(1))

  const [cartLoading, setCartLoading] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)

  const galleryRef = useRef(null)
  const scrollViewRef = useRef(null)

  const galleryImages = product?.media?.filter(m => m.role === 'gallery') || []

  useEffect(() => {
    fetchProduct()
  }, [])

  // Pulse animation for savings badge
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulsAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
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
        { headers: { Authorization: `Bearer ${token}` } }
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
      galleryRef.current?.scrollTo({ x: index * 76, animated: true })
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
  const resolvedDescription = shortDescAttr?.value || product.description || null

  const isDigital = product.itemType === 'digital'
  const digitalStockCount = product.digitalAssets?.length || 0
  const physicalStockQty = product.inventories?.[0]?.quantityAvailable ?? 0
  const inStock = isDigital ? digitalStockCount > 0 : physicalStockQty > 0

  const selectableAttributes = Object.values(product.attributes || {}).filter(
    attr => attr.isSelectable === true && getAttributeOptions(attr).length > 0
  )

  // ─── Pricing ──────────────────────────────────────────────────────────────
  const priceObj = product.prices?.[0]
  const rawBase = product.discountPricing?.basePrice ?? priceObj?.amount ?? 0
  const rawFinal = product.discountPricing?.finalPrice ?? priceObj?.amount ?? 0
  const rawDiscount = product.discountPricing?.discountTotal ?? 0
  const basePrice = Math.round(rawBase)
  const finalPrice = Math.round(rawFinal)
  const discountTotal = Math.round(rawDiscount)
  const currency = priceObj?.currency === 'INR' ? '₹' : ''
  const discountPercent = basePrice > 0 ? Math.round((discountTotal / basePrice) * 100) : 0

  // ─── Discount summary from product ────────────────────────────────────────
  const discountSummary = product.discountPricing?.discountSummary ?? product.discountSummary ?? []

  const primaryImage =
    activeImage || product.media?.find(m => m.role === 'primary')?.url || null

  const getDiscountIcon = category => {
    switch (category) {
      case 'promotion': return 'tag-multiple'
      case 'coupon': return 'ticket-confirmation'
      case 'dealer': return 'star-circle'
      default: return 'percent-circle'
    }
  }
  const getDiscountColor = category => {
    switch (category) {
      case 'promotion': return '#FF6D00'
      case 'coupon': return '#7B1FA2'
      case 'dealer': return '#1B5E20'
      default: return '#0B77A7'
    }
  }

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
                onPress={() => setSelectedAttrs(prev => ({ ...prev, [attr.key]: option }))}
                style={[styles.optionChip, selected && styles.optionChipSelected]}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

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
        {dataType === 'string' && <Text style={styles.description}>{value}</Text>}
        {dataType === 'boolean' && <Text style={styles.description}>{value ? 'Yes' : 'No'}</Text>}
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
    const attrs = Object.values(product.attributes || {}).filter(a => a.isSelectable === true)
    const payload = []
    for (const attr of attrs) {
      const selectedValue = selectedAttrs[attr.key]
      if (attr.isRequiredInCart && selectedValue == null) throw new Error(`Please select ${attr.label}`)
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
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const url = wishlist
        ? `/customer/business/${businessId}/items/${itemId}/wishlist/remove`
        : `/customer/business/${businessId}/items/${itemId}/wishlist/add`
      const res = await fetch(BASE_URL + url, {
        method: wishlist ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ quantity: 1, selectedAttributes }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw json
      navigation.navigate('CartScreen')
    } catch (err) {
      if (err?.code === 'MISSING_REQUIRED_ATTRIBUTE') alert('Please select all required options')
      else if (err?.code === 'OUT_OF_STOCK') alert('Item is out of stock')
      else if (err?.code === 'INVALID_ATTRIBUTES') alert('Invalid selection')
      else alert(err.message || 'Something went wrong')
    }
  }

  const handleAddToCart = async () => {
    try {
      setCartLoading(true)
      await addToCart()
    } finally {
      setCartLoading(false)
    }
  }

  const handleBuyNow = async () => {
    try {
      setBuyLoading(true)

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
    } finally {
      setBuyLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
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
            {/* Discount % ribbon — top-left */}
            {discountPercent > 0 && (
              <View style={styles.discountRibbon}>
                <Text style={styles.discountRibbonText}>{discountPercent}%</Text>
                <Text style={styles.discountRibbonOff}>OFF</Text>
              </View>
            )}

            <Image
              source={primaryImage ? { uri: primaryImage } : noimage}
              style={styles.productImage}
            />

            <TouchableOpacity onPress={toggleWishlist} style={styles.wishlistBtn} activeOpacity={0.8}>
              <Icon name={wishlist ? 'heart' : 'heart-outline'} size={24} color={wishlist ? '#FF5252' : '#666'} />
            </TouchableOpacity>

            {galleryImages.length > 0 && (
              <View style={styles.imageIndicators}>
                {galleryImages.map((_, index) => (
                  <View key={index} style={[styles.indicator, imageIndex === index && styles.activeIndicator]} />
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
                  onPress={() => { setActiveImage(img.url); setImageIndex(index) }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={[styles.galleryImage, imageIndex === index && styles.activeGalleryImage]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ─── Product Info Card ─────────────────────────────────────────── */}
          <View style={styles.infoCard}>

            {/* Category chips */}
            {product.Categories?.length > 0 && (
              <View style={styles.categoryContainer}>
                {product.Categories.map(cat => (
                  <View key={cat.id} style={styles.categoryChip}>
                    <Icon name="tag-outline" size={12} color="#0B77A7" />
                    <Text style={styles.categoryText}>{cat.name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Title */}
            <Text style={styles.productTitle}>{product.title}</Text>

            {/* ── Price Block ──────────────────────────────────────────────── */}
            {discountTotal > 0 ? (
              <View style={styles.priceBlock}>
                {/* Top row: final price + savings badge */}
                <View style={styles.priceTopRow}>
                  <Text style={styles.finalPriceLarge}>{currency}{finalPrice}</Text>
                  <Animated.View style={[styles.savingsBadge, { transform: [{ scale: pulsAnim }] }]}>
                    <Icon name="lightning-bolt" size={13} color="#fff" />
                    <Text style={styles.savingsBadgeText}>Save {currency}{discountTotal}</Text>
                  </Animated.View>
                </View>

                {/* MRP row */}
                <View style={styles.mrpRow}>
                  <Text style={styles.mrpLabel}>MRP: </Text>
                  <Text style={styles.mrpValue}>{currency}{basePrice}</Text>
                  <View style={styles.offPill}>
                    <Text style={styles.offPillText}>{discountPercent}% OFF</Text>
                  </View>
                </View>

                {/* Inclusive tax note */}
                <Text style={styles.taxNote}>Inclusive of all taxes</Text>
              </View>
            ) : (
              <View style={styles.priceBlock}>
                <Text style={styles.finalPriceLarge}>{currency}{finalPrice}</Text>
                <Text style={styles.taxNote}>Inclusive of all taxes</Text>
              </View>
            )}

            {/* Stock + Type row */}
            <View style={styles.stockTypeRow}>
              <View style={[styles.stockPill, { backgroundColor: inStock ? '#E8F5E9' : '#FFEBEE' }]}>
                <Icon name={inStock ? 'check-circle' : 'close-circle'} size={14} color={inStock ? '#4CAF50' : '#FF5252'} />
                <Text style={[styles.stockPillText, { color: inStock ? '#4CAF50' : '#FF5252' }]}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>
              <View style={[styles.typePill, { backgroundColor: isDigital ? '#E3F2FD' : '#E8F5E9' }]}>
                <Icon name={isDigital ? 'download' : 'cube-outline'} size={14} color={isDigital ? '#1976D2' : '#388E3C'} />
                <Text style={[styles.typePillText, { color: isDigital ? '#1976D2' : '#388E3C' }]}>
                  {isDigital ? 'Digital' : 'Physical'}
                </Text>
              </View>
            </View>

            {/* Rating row */}
            <View style={styles.ratingRow}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Icon key={star} name={star <= 4 ? 'star' : 'star-outline'} size={16} color="#FFC107" />
                ))}
                <Text style={styles.ratingText}>4.0</Text>
              </View>
              <Text style={styles.reviewCount}>128 reviews</Text>
            </View>
          </View>

          {/* ─── Offers & Savings Card ─────────────────────────────────────── */}
          {discountTotal > 0 && (
            <View style={styles.offersCard}>
              {/* Card header */}
              <TouchableOpacity
                style={styles.offersCardHeader}
                onPress={() => setOfferExpanded(p => !p)}
                activeOpacity={0.8}
              >
                <View style={styles.offersCardHeaderLeft}>
                  <View style={styles.offersIconWrap}>
                    <Icon name="sale" size={20} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.offersCardTitle}>Offers & Savings</Text>
                    <Text style={styles.offersCardSubtitle}>
                      You save {currency}{discountTotal} on this product
                    </Text>
                  </View>
                </View>
                <Icon
                  name={offerExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color="#FF6D00"
                />
              </TouchableOpacity>

              {offerExpanded && (
                <View style={styles.offersCardBody}>

                  {/* Big savings highlight */}
                  <View style={styles.bigSavingsRow}>
                    <View style={styles.bigSavingsLeft}>
                      <Text style={styles.bigSavingsAmount}>{currency}{discountTotal}</Text>
                      <Text style={styles.bigSavingsLabel}>Total Savings</Text>
                    </View>
                    <View style={styles.bigSavingsDivider} />
                    <View style={styles.bigSavingsRight}>
                      <Text style={styles.bigSavingsPercent}>{discountPercent}%</Text>
                      <Text style={styles.bigSavingsLabel}>Discount</Text>
                    </View>
                    <View style={styles.bigSavingsDivider} />
                    <View style={styles.bigSavingsRight}>
                      <Text style={styles.bigSavingsAmount}>{currency}{finalPrice}</Text>
                      <Text style={styles.bigSavingsLabel}>You Pay</Text>
                    </View>
                  </View>

                  {/* Discount breakdown list */}
                  {discountSummary.length > 0 ? (
                    <View style={styles.discountList}>
                      <Text style={styles.discountListHeading}>Applied Discounts</Text>
                      {discountSummary.map((disc, idx) => {
                        const iconName = getDiscountIcon(disc.category)
                        const iconColor = getDiscountColor(disc.category)
                        return (
                          <View key={disc.discountId ?? idx} style={styles.discountItem}>
                            <View style={[styles.discountIconCircle, { backgroundColor: iconColor + '18' }]}>
                              <Icon name={iconName} size={17} color={iconColor} />
                            </View>
                            <View style={styles.discountItemText}>
                              <Text style={styles.discountItemName} numberOfLines={1}>
                                {disc.name}
                              </Text>
                              <View style={[styles.discountCategoryPill, { backgroundColor: iconColor + '20' }]}>
                                <Text style={[styles.discountCategoryText, { color: iconColor }]}>
                                  {disc.category?.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.discountItemAmt, { color: iconColor }]}>
                              −{currency}{Math.round(disc.totalApplied)}
                            </Text>
                          </View>
                        )
                      })}
                    </View>
                  ) : (
                    // Generic promotion row when no detailed summary
                    <View style={styles.discountList}>
                      <View style={styles.discountItem}>
                        <View style={[styles.discountIconCircle, { backgroundColor: '#FF6D0018' }]}>
                          <Icon name="tag-multiple" size={17} color="#FF6D00" />
                        </View>
                        <View style={styles.discountItemText}>
                          <Text style={styles.discountItemName}>Special Price</Text>
                          <View style={[styles.discountCategoryPill, { backgroundColor: '#FF6D0020' }]}>
                            <Text style={[styles.discountCategoryText, { color: '#FF6D00' }]}>PROMOTION</Text>
                          </View>
                        </View>
                        <Text style={[styles.discountItemAmt, { color: '#FF6D00' }]}>
                          −{currency}{discountTotal}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Price comparison bar */}
                  <View style={styles.priceBarWrap}>
                    <View style={styles.priceBarTrack}>
                      <View
                        style={[
                          styles.priceBarFill,
                          { width: `${100 - discountPercent}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.priceBarLabels}>
                      <Text style={styles.priceBarPayText}>You Pay {discountPercent}% less</Text>
                      <Text style={styles.priceBarMrpText}>MRP {currency}{basePrice}</Text>
                    </View>
                  </View>

                  {/* CTA nudge */}
                  <View style={styles.offerNudge}>
                    <Icon name="fire" size={16} color="#F44336" />
                    <Text style={styles.offerNudgeText}>
                      Don't miss out — this deal may not last!
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

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
          {Object.values(product.attributes || {}).filter(attr => !attr.isSelectable && attr.isPublic).length > 0 && (
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

          {/* Description */}
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
                <Text style={styles.deliveryTitle}>{isDigital ? 'Instant Delivery' : 'Fast Delivery'}</Text>
                <Text style={styles.deliverySubtitle}>
                  {isDigital ? 'Download immediately after purchase' : 'Delivered in 3-5 business days'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.deliveryItem}>
              <Icon name="shield-check-outline" size={20} color="#0B77A7" />
              <View style={styles.deliveryTextContainer}>
                <Text style={styles.deliveryTitle}>{isDigital ? 'No Returns' : '7 Days Return'}</Text>
                <Text style={styles.deliverySubtitle}>
                  {isDigital ? 'Digital products cannot be returned' : 'Return within 7 days of delivery'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.deliveryItem}>
              <Icon name="cash" size={20} color="#FF9800" />
              <View style={styles.deliveryTextContainer}>
                <Text style={styles.deliveryTitle}>{isDigital ? 'Online Payment Only' : 'Cash on Delivery'}</Text>
                <Text style={styles.deliverySubtitle}>
                  {isDigital ? 'Pay securely with UPI, cards or wallets' : 'Pay when you receive the product'}
                </Text>
              </View>
            </View>
          </View>

          {/* Similar Products */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="tag-multiple-outline" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Similar Products</Text>
            </View>
            <Text style={styles.comingSoon}>Coming soon...</Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ─── Bottom Action Bar ─────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {inStock ? (
          <>
            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={handleAddToCart}
              activeOpacity={0.8}
              disabled={cartLoading}
            >
              {cartLoading ? (
                <ActivityIndicator color="#0B77A7" />
              ) : (
                <>
                  <Icon name="cart-outline" size={22} color="#0B77A7" />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </>
              )}
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.buyNowBtn}
              onPress={handleBuyNow}
              activeOpacity={0.9}
              disabled={buyLoading}
            >
              {buyLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {discountTotal > 0 && (
                    <Text style={styles.buyNowMrp}>{currency}{basePrice}</Text>
                  )}
                  <Text style={styles.buyNowPrice}>{currency}{finalPrice}</Text>
                  <Text style={styles.buyNowText}>Buy Now</Text>
                </>
              )}
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: '16@vs', fontSize: '14@ms', color: '#666', fontFamily: FONTS.Medium },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: '16@s', paddingVertical: '12@vs', backgroundColor: '#0B77A7',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  headerBtn: { width: '40@s', height: '40@s', borderRadius: '20@s', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff', flex: 1, textAlign: 'center' },

  // ── Image ─────────────────────────────────────────────────────────────────
  imageSection: { position: 'relative', padding: '40@vs', backgroundColor: '#fff' },
  productImage: { width: '100%', height: '300@vs', resizeMode: 'contain' },
  wishlistBtn: {
    position: 'absolute', top: '16@vs', right: '16@s',
    width: '44@s', height: '44@s', borderRadius: '22@s',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  imageIndicators: {
    position: 'absolute', bottom: '16@vs', flexDirection: 'row', alignSelf: 'center', gap: '6@s',
  },
  indicator: { width: '6@s', height: '6@s', borderRadius: '3@s', backgroundColor: '#D0D0D0' },
  activeIndicator: { width: '20@s', backgroundColor: '#0B77A7' },

  // Discount ribbon on image
  discountRibbon: {
    position: 'absolute', top: '16@vs', left: 0, zIndex: 10,
    backgroundColor: '#E53935', paddingHorizontal: '10@s', paddingVertical: '6@vs',
    borderTopRightRadius: '12@ms', borderBottomRightRadius: '12@ms',
    alignItems: 'center', elevation: 4,
  },
  discountRibbonText: { fontSize: '17@ms', fontFamily: FONTS.Bold, color: '#fff', lineHeight: '20@ms' },
  discountRibbonOff: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#FFCDD2', letterSpacing: 1 },

  // Gallery
  galleryContainer: { paddingHorizontal: '16@s', paddingVertical: '12@vs', backgroundColor: '#fff', gap: '8@s' },
  galleryImage: { width: '64@s', height: '64@s', borderRadius: '8@ms', backgroundColor: '#F5F5F5', borderWidth: 2, borderColor: 'transparent' },
  activeGalleryImage: { borderColor: '#0B77A7' },

  // ── Info Card ─────────────────────────────────────────────────────────────
  infoCard: { backgroundColor: '#fff', padding: '16@s', marginTop: '8@vs' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: '8@s', marginBottom: '12@vs' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: '10@s', paddingVertical: '4@vs', borderRadius: '12@ms', gap: '4@s' },
  categoryText: { fontSize: '11@ms', color: '#0B77A7', fontFamily: FONTS.Medium },
  productTitle: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', lineHeight: '28@ms', marginBottom: '14@vs' },

  // Price block
  priceBlock: { marginBottom: '14@vs' },
  priceTopRow: { flexDirection: 'row', alignItems: 'center', gap: '12@s', marginBottom: '6@vs' },
  finalPriceLarge: { fontSize: '28@ms', fontFamily: FONTS.Bold, color: '#1976D2' },
  savingsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    backgroundColor: '#E53935', paddingHorizontal: '10@s', paddingVertical: '5@vs',
    borderRadius: '20@ms', elevation: 2,
  },
  savingsBadgeText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#fff' },
  mrpRow: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginBottom: '4@vs' },
  mrpLabel: { fontSize: '13@ms', color: '#999' },
  mrpValue: { fontSize: '14@ms', color: '#999', textDecorationLine: 'line-through', fontFamily: FONTS.Medium },
  offPill: { backgroundColor: '#FFF3E0', paddingHorizontal: '8@s', paddingVertical: '2@vs', borderRadius: '6@ms' },
  offPillText: { fontSize: '12@ms', color: '#E65100', fontFamily: FONTS.Bold },
  taxNote: { fontSize: '11@ms', color: '#aaa', marginTop: '2@vs' },

  // Stock + type
  stockTypeRow: { flexDirection: 'row', gap: '10@s', marginBottom: '14@vs' },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: '5@s', paddingHorizontal: '10@s', paddingVertical: '5@vs', borderRadius: '20@ms' },
  stockPillText: { fontSize: '12@ms', fontFamily: FONTS.Bold },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: '5@s', paddingHorizontal: '10@s', paddingVertical: '5@vs', borderRadius: '20@ms' },
  typePillText: { fontSize: '12@ms', fontFamily: FONTS.Bold },

  // Rating
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12@vs', borderTopWidth: 1, borderColor: '#E8E8E8' },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: '2@s' },
  ratingText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginLeft: '6@s' },
  reviewCount: { fontSize: '13@ms', color: '#666' },

  // ── Offers & Savings Card ──────────────────────────────────────────────────
  offersCard: {
    marginHorizontal: '16@s', marginTop: '10@vs', borderRadius: '16@ms',
    overflow: 'hidden', elevation: 3,
    shadowColor: '#FF6D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  offersCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF8F0', paddingHorizontal: '16@s', paddingVertical: '14@vs',
    borderWidth: 1.5, borderColor: '#FFD0A0',
    borderTopLeftRadius: '16@ms', borderTopRightRadius: '16@ms',
  },
  offersCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s' },
  offersIconWrap: {
    width: '38@s', height: '38@s', borderRadius: '19@s',
    backgroundColor: '#FF6D00', justifyContent: 'center', alignItems: 'center',
  },
  offersCardTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#BF360C' },
  offersCardSubtitle: { fontSize: '12@ms', color: '#E64A19', marginTop: '2@vs' },

  offersCardBody: {
    backgroundColor: '#fff', borderWidth: 1.5, borderTopWidth: 0,
    borderColor: '#FFD0A0',
    borderBottomLeftRadius: '16@ms', borderBottomRightRadius: '16@ms',
    paddingHorizontal: '16@s', paddingBottom: '16@vs', paddingTop: '12@vs',
  },

  // Big savings highlight
  bigSavingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#FFF3E0', borderRadius: '12@ms', paddingVertical: '14@vs',
    marginBottom: '14@vs',
  },
  bigSavingsLeft: { alignItems: 'center' },
  bigSavingsRight: { alignItems: 'center' },
  bigSavingsDivider: { width: 1, height: '32@vs', backgroundColor: '#FFCC80' },
  bigSavingsAmount: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#E65100' },
  bigSavingsPercent: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  bigSavingsLabel: { fontSize: '11@ms', color: '#999', marginTop: '2@vs' },

  // Discount list
  discountList: { marginBottom: '14@vs' },
  discountListHeading: { fontSize: '12@ms', color: '#999', fontFamily: FONTS.Medium, marginBottom: '8@vs', textTransform: 'uppercase', letterSpacing: 0.5 },
  discountItem: { flexDirection: 'row', alignItems: 'center', gap: '12@s', marginBottom: '10@vs' },
  discountIconCircle: { width: '36@s', height: '36@s', borderRadius: '18@s', justifyContent: 'center', alignItems: 'center' },
  discountItemText: { flex: 1 },
  discountItemName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '3@vs' },
  discountCategoryPill: { alignSelf: 'flex-start', borderRadius: '4@ms', paddingHorizontal: '6@s', paddingVertical: '2@vs' },
  discountCategoryText: { fontSize: '9@ms', fontFamily: FONTS.Bold, letterSpacing: 0.6 },
  discountItemAmt: { fontSize: '14@ms', fontFamily: FONTS.Bold },

  // Price bar
  priceBarWrap: { marginBottom: '12@vs' },
  priceBarTrack: { height: '8@vs', backgroundColor: '#FFCCBC', borderRadius: '4@ms', overflow: 'hidden', marginBottom: '6@vs' },
  priceBarFill: { height: '100%', backgroundColor: '#FF6D00', borderRadius: '4@ms' },
  priceBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  priceBarPayText: { fontSize: '11@ms', color: '#FF6D00', fontFamily: FONTS.Bold },
  priceBarMrpText: { fontSize: '11@ms', color: '#aaa' },

  // Nudge
  offerNudge: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: '#FFF8E1', borderRadius: '8@ms', paddingHorizontal: '12@s', paddingVertical: '8@vs',
    borderWidth: 1, borderColor: '#FFE082',
  },
  offerNudgeText: { fontSize: '12@ms', color: '#E65100', fontFamily: FONTS.Medium, flex: 1 },

  // ── Section Card ──────────────────────────────────────────────────────────
  sectionCard: { backgroundColor: '#fff', marginTop: '8@vs', padding: '16@s' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '16@vs' },
  sectionTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginLeft: '10@s' },

  attributeSection: { marginBottom: '20@vs' },
  attributeLabel: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '10@vs' },
  required: { color: '#FF5252' },
  optionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: '10@s' },
  optionChip: { paddingVertical: '10@vs', paddingHorizontal: '16@s', borderRadius: '20@ms', borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  optionChipSelected: { backgroundColor: '#0B77A7', borderColor: '#0B77A7' },
  optionText: { fontSize: '13@ms', color: '#444', fontFamily: FONTS.Medium },
  optionTextSelected: { color: '#fff', fontFamily: FONTS.Bold },

  description: { fontSize: '13@ms', color: '#555', lineHeight: '20@vs' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: '6@vs' },
  bulletText: { fontSize: '13@ms', color: '#555', lineHeight: '20@vs', flex: 1 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: '10@vs', borderBottomWidth: 1, borderColor: '#F0F0F0' },
  specKey: { flex: 1, fontSize: '13@ms', color: '#666', fontFamily: FONTS.Medium },
  specValue: { flex: 1, fontSize: '13@ms', color: '#1a1a1a', textAlign: 'right', fontFamily: FONTS.Medium },

  deliveryItem: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s' },
  deliveryTextContainer: { flex: 1 },
  deliveryTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '2@vs' },
  deliverySubtitle: { fontSize: '12@ms', color: '#666', lineHeight: '18@vs' },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: '14@vs' },
  comingSoon: { fontSize: '13@ms', color: '#999', fontStyle: 'italic' },

  // ── Bottom Bar ────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: '12@s',
    backgroundColor: '#fff', elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8,
    borderTopLeftRadius: '20@ms', borderTopRightRadius: '20@ms', gap: '12@s',
  },
  addToCartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#0B77A7',
    paddingVertical: '14@vs', borderRadius: '12@ms', gap: '6@s',
  },
  addToCartText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },
  buyNowBtn: {
    flex: 1, backgroundColor: '#0B77A7', paddingVertical: '8@vs',
    borderRadius: '12@ms', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#0B77A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  buyNowMrp: { fontSize: '11@ms', color: '#90CAF9', textDecorationLine: 'line-through', fontFamily: FONTS.Medium },
  buyNowPrice: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff', lineHeight: '22@ms' },
  buyNowText: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#B3E5FC' },
  outOfStockBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECEFF1', paddingVertical: '14@vs', borderRadius: '12@ms', gap: '8@s' },
  outOfStockText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#90A4AE' },
})

