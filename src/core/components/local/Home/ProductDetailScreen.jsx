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
  Platform,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import noimage from '../../../assets/images/Categories/preloader.gif'
import AsyncStorage from '@react-native-async-storage/async-storage'
import ProductTiles from '../Categories/ProductRAMs'
import color from '../../../utils/color'
import { SafeAreaView } from 'react-native-safe-area-context'

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

  useEffect(() => { fetchProduct() }, [])

  // Pulse animation — logic unchanged
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }, [loading, product])

  // ── All logic unchanged ────────────────────────────────────────────────────
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
      <View style={S.loaderWrap}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <ActivityIndicator size="large" color={color.primary} />
        <Text style={S.loadingText}>Loading product…</Text>
      </View>
    )
  }

  if (!product) return null

  const shortDescAttr = Object.values(product.attributes || {}).find(a => a.key === 'short_description')
  const resolvedDescription = shortDescAttr?.value || product.description || null
  const activecategory = product.Categories?.id || product.Categories?.[0]?.id || null
  const isDigital = product.itemType === 'digital'
  const digitalStockCount = product.digitalAssets?.length || 0
  const physicalStockQty = product.inventories?.[0]?.quantityAvailable ?? 0
  const inStock = isDigital ? digitalStockCount > 0 : physicalStockQty > 0

  const selectableAttributes = Object.values(product.attributes || {}).filter(
    attr => attr.isSelectable === true && getAttributeOptions(attr).length > 0
  )

  // Pricing
  const priceObj = product.prices?.[0]
  const rawBase = product.discountPricing?.basePrice ?? priceObj?.amount ?? 0
  const rawFinal = product.discountPricing?.finalPrice ?? priceObj?.amount ?? 0
  const rawDiscount = product.discountPricing?.discountTotal ?? 0
  const basePrice = Math.round(rawBase)
  const finalPrice = Math.round(rawFinal)
  const discountTotal = Math.round(rawDiscount)
  const currency = priceObj?.currency === 'INR' ? '₹' : ''
  const discountPercent = basePrice > 0 ? Math.round((discountTotal / basePrice) * 100) : 0
  const discountSummary = product.discountPricing?.discountSummary ?? product.discountSummary ?? []
  const primaryImage = activeImage || product.media?.find(m => m.role === 'primary')?.url || null

  const getDiscountIcon = cat => ({ promotion: 'tag-multiple', coupon: 'ticket-confirmation', dealer: 'star-circle' }[cat] ?? 'percent-circle')
  const getDiscountColor = cat => ({ promotion: '#E65100', coupon: '#6A1B9A', dealer: '#1B5E20' }[cat] ?? color.primary)

  const renderSelectableAttribute = attr => {
    const options = getAttributeOptions(attr)
    return (
      <View key={attr.key} style={S.attrSection}>
        <Text style={S.attrLabel}>
          {attr.label}
          {attr.isRequiredInCart && <Text style={{ color: '#C62828' }}> *</Text>}
        </Text>
        <View style={S.optionRow}>
          {options.map(option => {
            const selected = selectedAttrs[attr.key] === option
            return (
              <TouchableOpacity
                key={option}
                onPress={() => setSelectedAttrs(prev => ({ ...prev, [attr.key]: option }))}
                style={[S.optionChip, selected && S.optionChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[S.optionText, selected && S.optionTextActive]}>{option}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

  const renderKeyValue = obj =>
    Object.entries(obj || {}).map(([key, value]) => (
      <View key={key} style={S.specRow}>
        <Text style={S.specKey}>{key}</Text>
        <Text style={S.specVal}>{String(value)}</Text>
      </View>
    ))

  const renderAttribute = attr => {
    if (!attr?.isPublic || attr?.value == null) return null
    const { label, dataType, value } = attr
    return (
      <View key={attr.key} style={S.attrSection}>
        <Text style={S.attrLabel}>{label}</Text>
        {dataType === 'string' && <Text style={S.descText}>{value}</Text>}
        {dataType === 'boolean' && <Text style={S.descText}>{value ? 'Yes' : 'No'}</Text>}
        {dataType === 'array' && value.map((v, i) => (
          <View key={i} style={S.bulletRow}>
            <Icon name="circle-small" size={ms(16)} color="#888" />
            <Text style={S.bulletText}>{v}</Text>
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
        payload.push({ attributeDefinitionId: attr.attributeDefinitionId, sourceType: attr.source, value: selectedValue })
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
      const res = await fetch(BASE_URL + url, { method: wishlist ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Wishlist error')
      setWishlist(prev => !prev)
    } catch (e) { console.log('Wishlist error', e) }
  }

  const addToCart = async () => {
    if (isDigital && digitalStockCount === 0) { alert('This digital product is currently out of stock'); return }
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    const selectedAttributes = buildSelectedAttributesPayload()
    const res = await fetch(
      `${BASE_URL}/customer/business/${businessId}/items/${itemId}/cart/add`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ quantity: 1, selectedAttributes }) }
    )
    const json = await res.json()
    if (!res.ok) throw json
    navigation.navigate('CartScreen')
  }

  const handleAddToCart = async () => {
    try { setCartLoading(true); await addToCart() }
    catch (err) {
      if (err?.code === 'MISSING_REQUIRED_ATTRIBUTE') alert('Please select all required options')
      else if (err?.code === 'OUT_OF_STOCK') alert('Item is out of stock')
      else if (err?.code === 'INVALID_ATTRIBUTES') alert('Invalid selection')
      else alert(err.message || 'Something went wrong')
    }
    finally { setCartLoading(false) }
  }

  const handleBuyNow = async () => {
    try {
      setBuyLoading(true)
      const selectedAttributes = buildSelectedAttributesPayload()
      navigation.navigate('BuyInstantScreen', { itemId, product, selectedAttributes, quantity: 1, isDigital })
    } catch (err) {
      alert(err.message || 'Please select required options')
    } finally {
      setBuyLoading(false)
    }
  }

  return (
      <View style={S.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={S.headerTitle} numberOfLines={1}>Product Details</Text>
          <TouchableOpacity style={S.headerBtn}>
            <Icon name="share-variant-outline" size={ms(20)} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(110) }}>
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ── Image section ── */}
            <View style={S.imageSection}>
              {/* Discount ribbon top-left */}
              {discountPercent > 0 && (
                <View style={S.discRibbon}>
                  <Text style={S.discRibbonNum}>{discountPercent}%</Text>
                  <Text style={S.discRibbonOff}>OFF</Text>
                </View>
              )}

              <Image
                source={primaryImage ? { uri: primaryImage } : noimage}
                style={S.productImg}
              />

              {/* Wishlist */}
              <TouchableOpacity onPress={toggleWishlist} style={S.wishBtn} activeOpacity={0.8}>
                <Icon
                  name={wishlist ? 'heart' : 'heart-outline'}
                  size={ms(22)}
                  color={wishlist ? '#C62828' : '#888'}
                />
              </TouchableOpacity>

              {/* Dot indicators */}
              {galleryImages.length > 0 && (
                <View style={S.dotRow}>
                  {galleryImages.map((_, i) => (
                    <View key={i} style={[S.dot, imageIndex === i && S.dotActive]} />
                  ))}
                </View>
              )}
            </View>

            {/* ── Gallery thumbnails ── */}
            {galleryImages.length > 0 && (
              <ScrollView
                ref={galleryRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={S.galleryRow}
              >
                {galleryImages.map((img, i) => (
                  <TouchableOpacity
                    key={img.id}
                    onPress={() => { setActiveImage(img.url); setImageIndex(i) }}
                    activeOpacity={0.75}
                  >
                    <Image
                      source={{ uri: img.url }}
                      style={[S.thumb, imageIndex === i && S.thumbActive]}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* ── Product info card ── */}
            <View style={S.infoCard}>
              {/* Category chips */}
              {product.Categories?.length > 0 && (
                <View style={S.catRow}>
                  {product.Categories.map(cat => (
                    <View key={cat.id} style={S.catChip}>
                      <Icon name="tag-outline" size={ms(11)} color="#888" />
                      <Text style={S.catChipText}>{cat.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Title */}
              <Text style={S.productTitle}>{product.title}</Text>

              {/* ── Price block — Flipkart layout ── */}
              <View style={S.priceBlock}>
                {discountTotal > 0 ? (
                  <>
                    {/* Final price large */}
                    <View style={S.priceTopRow}>
                      <Text style={S.finalPriceLg}>{currency}{finalPrice}</Text>
                      {/* Savings badge */}
                      <Animated.View style={[S.savingsBadge, { transform: [{ scale: pulsAnim }] }]}>
                        <Text style={S.savingsBadgeText}>{discountPercent}% off</Text>
                      </Animated.View>
                    </View>
                    {/* MRP strikethrough row */}
                    <View style={S.mrpRow}>
                      <Text style={S.mrpLabel}>MRP </Text>
                      <Text style={S.mrpValue}>{currency}{basePrice}</Text>
                      <Text style={S.saveText}>Save {currency}{discountTotal}</Text>
                    </View>
                    <Text style={S.taxNote}>Inclusive of all taxes</Text>
                  </>
                ) : (
                  <>
                    <Text style={S.finalPriceLg}>{currency}{finalPrice}</Text>
                    <Text style={S.taxNote}>Inclusive of all taxes</Text>
                  </>
                )}
              </View>

              {/* Stock + type row */}
              <View style={S.pillRow}>
                <View style={[S.stockPill, { backgroundColor: inStock ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Icon
                    name={inStock ? 'check-circle' : 'close-circle'}
                    size={ms(13)}
                    color={inStock ? '#2E7D32' : '#C62828'}
                  />
                  <Text style={[S.pillText, { color: inStock ? '#2E7D32' : '#C62828' }]}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </View>
                <View style={[S.typePill, { backgroundColor: isDigital ? color.secondarylight : color.background }]}>
                  <Icon name={isDigital ? 'download' : 'cube-outline'} size={ms(13)} color={color.primary} />
                  <Text style={[S.pillText, { color: color.primary }]}>
                    {isDigital ? 'Digital' : 'Physical'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Offers & Savings card ── */}
            {discountTotal > 0 && (
              <View style={S.card}>
                {/* Header */}
                <TouchableOpacity
                  style={S.offersHead}
                  onPress={() => setOfferExpanded(p => !p)}
                  activeOpacity={0.8}
                >
                  <View style={S.offersHeadLeft}>
                    <View style={S.offersIconWrap}>
                      <Icon name="sale" size={ms(18)} color="#fff" />
                    </View>
                    <View>
                      <Text style={S.offersTitle}>Offers & Savings</Text>
                      <Text style={S.offersSub}>You save {currency}{discountTotal}</Text>
                    </View>
                  </View>
                  <Icon name={offerExpanded ? 'chevron-up' : 'chevron-down'} size={ms(20)} color={color.primary} />
                </TouchableOpacity>

                {offerExpanded && (
                  <View style={S.offersBody}>
                    {/* Big savings highlight — 3-col */}
                    <View style={S.bigSavRow}>
                      <View style={S.bigSavCol}>
                        <Text style={S.bigSavAmt}>{currency}{discountTotal}</Text>
                        <Text style={S.bigSavLabel}>Savings</Text>
                      </View>
                      <View style={S.bigSavDiv} />
                      <View style={S.bigSavCol}>
                        <Text style={S.bigSavPct}>{discountPercent}%</Text>
                        <Text style={S.bigSavLabel}>Discount</Text>
                      </View>
                      <View style={S.bigSavDiv} />
                      <View style={S.bigSavCol}>
                        <Text style={S.bigSavAmt}>{currency}{finalPrice}</Text>
                        <Text style={S.bigSavLabel}>You Pay</Text>
                      </View>
                    </View>

                    {/* Discount breakdown */}
                    <View style={S.discList}>
                      <Text style={S.discListHead}>Applied Discounts</Text>
                      {discountSummary.length > 0 ? discountSummary.map((disc, idx) => {
                        const iconName = getDiscountIcon(disc.category)
                        const iconColor = getDiscountColor(disc.category)
                        return (
                          <View key={disc.discountId ?? idx} style={S.discItem}>
                            <View style={[S.discIconCircle, { backgroundColor: iconColor + '18' }]}>
                              <Icon name={iconName} size={ms(16)} color={iconColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={S.discName} numberOfLines={1}>{disc.name}</Text>
                              <View style={[S.discCatPill, { backgroundColor: iconColor + '20' }]}>
                                <Text style={[S.discCatText, { color: iconColor }]}>{disc.category?.toUpperCase()}</Text>
                              </View>
                            </View>
                            <Text style={[S.discAmt, { color: iconColor }]}>−{currency}{Math.round(disc.totalApplied)}</Text>
                          </View>
                        )
                      }) : (
                        <View style={S.discItem}>
                          <View style={[S.discIconCircle, { backgroundColor: '#E6510018' }]}>
                            <Icon name="tag-multiple" size={ms(16)} color="#E65100" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={S.discName}>Special Price</Text>
                            <View style={[S.discCatPill, { backgroundColor: '#E6510020' }]}>
                              <Text style={[S.discCatText, { color: '#E65100' }]}>PROMOTION</Text>
                            </View>
                          </View>
                          <Text style={[S.discAmt, { color: '#E65100' }]}>−{currency}{discountTotal}</Text>
                        </View>
                      )}
                    </View>

                    {/* Price bar */}
                    <View style={S.barWrap}>
                      <View style={S.barTrack}>
                        <View style={[S.barFill, { width: `${100 - discountPercent}%` }]} />
                      </View>
                      <View style={S.barLabels}>
                        <Text style={S.barPayText}>You pay {discountPercent}% less</Text>
                        <Text style={S.barMrpText}>MRP {currency}{basePrice}</Text>
                      </View>
                    </View>

                    {/* Nudge */}
                    <View style={S.nudge}>
                      <Icon name="fire" size={ms(14)} color="#C62828" />
                      <Text style={S.nudgeText}>Don't miss out — this deal may not last!</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ── Selectable attributes ── */}
            {selectableAttributes.length > 0 && (
              <View style={S.card}>
                <View style={S.sectionHead}>
                  <Icon name="tune-variant" size={ms(18)} color={color.primary} />
                  <Text style={S.sectionTitle}>Customize Your Product</Text>
                </View>
                {selectableAttributes.map(renderSelectableAttribute)}
              </View>
            )}

            {/* ── Product details (attributes) ── */}
            {Object.values(product.attributes || {}).filter(a => !a.isSelectable && a.isPublic).length > 0 && (
              <View style={S.card}>
                <View style={S.sectionHead}>
                  <Icon name="information-outline" size={ms(18)} color={color.primary} />
                  <Text style={S.sectionTitle}>Product Details</Text>
                </View>
                {Object.values(product.attributes).filter(a => !a.isSelectable).map(renderAttribute)}
              </View>
            )}

            {/* ── Description ── */}
            {resolvedDescription && (
              <View style={S.card}>
                <View style={S.sectionHead}>
                  <Icon name="format-list-bulleted" size={ms(18)} color={color.primary} />
                  <Text style={S.sectionTitle}>Description</Text>
                </View>
                <Text style={S.descText}>{resolvedDescription}</Text>
              </View>
            )}

            {/* ── Delivery & Returns ── */}
            <View style={S.card}>
              <View style={S.deliveryItem}>
                <Icon name="clock-outline" size={ms(20)} color="#2E7D32" />
                <View style={{ flex: 1 }}>
                  <Text style={S.deliveryTitle}>{isDigital ? 'Instant Delivery' : 'Fast Delivery'}</Text>
                  <Text style={S.deliverySub}>
                    {isDigital ? 'Download immediately after purchase' : 'Delivered in 3–5 business days'}
                  </Text>
                </View>
              </View>
              <View style={S.divider} />
              <View style={S.deliveryItem}>
                <Icon name="shield-check-outline" size={ms(20)} color={color.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={S.deliveryTitle}>{isDigital ? 'No Returns' : '7 Days Return'}</Text>
                  <Text style={S.deliverySub}>
                    {isDigital ? 'Digital products cannot be returned' : 'Return within 7 days of delivery'}
                  </Text>
                </View>
              </View>
              <View style={S.divider} />
              <View style={S.deliveryItem}>
                <Icon name="cash" size={ms(20)} color="#E65100" />
                <View style={{ flex: 1 }}>
                  <Text style={S.deliveryTitle}>{isDigital ? 'Online Payment Only' : 'Cash on Delivery'}</Text>
                  <Text style={S.deliverySub}>
                    {isDigital ? 'Pay securely with UPI, cards or wallets' : 'Pay when you receive the product'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Similar products ── */}
            <View style={S.card}>
              <View style={S.sectionHead}>
                <Icon name="tag-multiple-outline" size={ms(18)} color={color.primary} />
                <Text style={S.sectionTitle}>Similar Products</Text>
              </View>
            </View>
            <ProductTiles categoryId={activecategory} />

          </Animated.View>
        </ScrollView>

        {/* ── Bottom bar — Flipkart: yellow Add to Cart + blue Buy Now ── */}
        <View style={S.bottomBar}>
          {inStock ? (
            <>
              {/* Add to Cart — outlined / yellow bg */}
              <TouchableOpacity
                style={S.addToCartBtn}
                onPress={handleAddToCart}
                activeOpacity={0.85}
                disabled={cartLoading}
              >
                {cartLoading ? (
                  <ActivityIndicator color={color.text} />
                ) : (
                  <>
                    <Icon name="cart-plus" size={ms(20)} color={color.text} />
                    <Text style={S.addToCartText}>Add to Cart</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Buy Now — primary filled */}
              <TouchableOpacity
                style={S.buyNowBtn}
                onPress={handleBuyNow}
                activeOpacity={0.9}
                disabled={buyLoading}
              >
                {buyLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    {discountTotal > 0 && (
                      <Text style={S.buyNowMrp}>{currency}{basePrice}</Text>
                    )}
                    <Text style={S.buyNowPrice}>{currency}{finalPrice}</Text>
                    <Text style={S.buyNowLabel}>Buy Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={S.outOfStockBtn} disabled>
              <Icon name="close-circle-outline" size={ms(22)} color="#BDBDBD" />
              <Text style={S.outOfStockText}>Out of Stock</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
  )
}

// ─── Styles — ONLY color.* values ────────────────────────────────────────────
const S = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.WHITE },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: color.background },
  loadingText: { marginTop: '16@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: '14@s',
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '13@vs',
    backgroundColor: color.primary,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  headerBtn: { width: '36@s', height: '36@s', borderRadius: '18@ms', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: '17@ms', fontFamily: FONTS.Bold, color: '#fff', textAlign: 'center' },

  // ── Image section ─────────────────────────────────────────────────────────
  imageSection: {
    position: 'relative',
    backgroundColor: '#fff',
    paddingVertical: '32@vs',
    paddingHorizontal: '20@s',
    alignItems: 'center',
  },
  productImg: { width: '100%', height: '280@vs', resizeMode: 'contain' },
  discRibbon: {
    position: 'absolute', top: '16@vs', left: 0, zIndex: 10,
    backgroundColor: '#2E7D32',
    paddingHorizontal: '10@s', paddingVertical: '5@vs',
    borderTopRightRadius: '8@ms', borderBottomRightRadius: '8@ms',
    alignItems: 'center',
  },
  discRibbonNum: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#fff', lineHeight: '19@ms' },
  discRibbonOff: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: '#C8E6C9', letterSpacing: 1 },
  wishBtn: {
    position: 'absolute', top: '16@vs', right: '16@s',
    width: '38@s', height: '38@s', borderRadius: '19@ms',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  dotRow: { position: 'absolute', bottom: '10@vs', flexDirection: 'row', gap: '5@s', alignSelf: 'center' },
  dot: { width: '5@s', height: '5@s', borderRadius: '3@ms', backgroundColor: '#BDBDBD' },
  dotActive: { width: '18@s', backgroundColor: color.primary },

  // Gallery
  galleryRow: { paddingHorizontal: '14@s', paddingVertical: '12@vs', backgroundColor: '#fff', gap: '8@s', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  thumb: { width: '60@s', height: '60@s', borderRadius: '6@ms', backgroundColor: color.background, borderWidth: 1.5, borderColor: '#E0E0E0' },
  thumbActive: { borderColor: color.primary, borderWidth: 2 },

  // ── Info card ─────────────────────────────────────────────────────────────
  infoCard: { backgroundColor: '#fff', padding: '14@s', marginTop: '8@vs' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: '6@s', marginBottom: '10@vs' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: color.background, paddingHorizontal: '8@s', paddingVertical: '3@vs', borderRadius: '4@ms' },
  catChipText: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium },
  productTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '26@ms', marginBottom: '12@vs' },

  // Price block
  priceBlock: { marginBottom: '12@vs' },
  priceTopRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s', marginBottom: '5@vs' },
  finalPriceLg: { fontSize: '26@ms', fontFamily: FONTS.Bold, color: color.text },
  savingsBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: '8@s', paddingVertical: '3@vs', borderRadius: '4@ms',
  },
  savingsBadgeText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#fff' },
  mrpRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '3@vs' },
  mrpLabel: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  mrpValue: { fontSize: '13@ms', color: '#BDBDBD', textDecorationLine: 'line-through', fontFamily: FONTS.Medium },
  saveText: { fontSize: '13@ms', color: '#2E7D32', fontFamily: FONTS.Bold },
  taxNote: { fontSize: '11@ms', color: '#BDBDBD', marginTop: '2@vs' },

  // Pills
  pillRow: { flexDirection: 'row', gap: '10@s', marginTop: '2@vs' },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: '5@s', paddingHorizontal: '10@s', paddingVertical: '5@vs', borderRadius: '20@ms' },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: '5@s', paddingHorizontal: '10@s', paddingVertical: '5@vs', borderRadius: '20@ms' },
  pillText: { fontSize: '12@ms', fontFamily: FONTS.Bold },

  // ── Generic section card ──────────────────────────────────────────────────
  card: { backgroundColor: '#fff', marginTop: '8@vs', paddingHorizontal: '14@s', paddingVertical: '14@vs' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginBottom: '14@vs' },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },

  // Offers card
  offersHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: '12@vs', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    marginBottom: '12@vs',
  },
  offersHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  offersIconWrap: {
    width: '34@s', height: '34@s', borderRadius: '17@ms',
    backgroundColor: color.primary, justifyContent: 'center', alignItems: 'center',
  },
  offersTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  offersSub: { fontSize: '12@ms', color: '#2E7D32', fontFamily: FONTS.Bold, marginTop: '2@vs' },
  offersBody: {},

  // Big savings
  bigSavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: color.secondarylight, borderRadius: '8@ms', paddingVertical: '12@vs',
    marginBottom: '14@vs',
  },
  bigSavCol: { alignItems: 'center' },
  bigSavDiv: { width: 1, height: '28@vs', backgroundColor: '#E0E0E0' },
  bigSavAmt: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#E65100' },
  bigSavPct: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  bigSavLabel: { fontSize: '10@ms', color: '#888', marginTop: '2@vs' },

  // Discount list
  discList: { marginBottom: '12@vs' },
  discListHead: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginBottom: '8@vs', textTransform: 'uppercase', letterSpacing: 0.5 },
  discItem: { flexDirection: 'row', alignItems: 'center', gap: '10@s', marginBottom: '10@vs' },
  discIconCircle: { width: '34@s', height: '34@s', borderRadius: '17@ms', justifyContent: 'center', alignItems: 'center' },
  discName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '3@vs' },
  discCatPill: { alignSelf: 'flex-start', borderRadius: '4@ms', paddingHorizontal: '6@s', paddingVertical: '2@vs' },
  discCatText: { fontSize: '9@ms', fontFamily: FONTS.Bold, letterSpacing: 0.6 },
  discAmt: { fontSize: '13@ms', fontFamily: FONTS.Bold },

  // Bar
  barWrap: { marginBottom: '10@vs' },
  barTrack: { height: '7@vs', backgroundColor: '#E0E0E0', borderRadius: '4@ms', overflow: 'hidden', marginBottom: '5@vs' },
  barFill: { height: '100%', backgroundColor: color.primary, borderRadius: '4@ms' },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barPayText: { fontSize: '11@ms', color: color.primary, fontFamily: FONTS.Bold },
  barMrpText: { fontSize: '11@ms', color: '#BDBDBD' },

  // Nudge
  nudge: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: color.secondarylight, borderRadius: '6@ms',
    paddingHorizontal: '10@s', paddingVertical: '8@vs',
  },
  nudgeText: { fontSize: '12@ms', color: color.text, fontFamily: FONTS.Medium, flex: 1 },

  // Attributes
  attrSection: { marginBottom: '16@vs' },
  attrLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: '8@s' },
  optionChip: {
    paddingVertical: '8@vs', paddingHorizontal: '14@s',
    borderRadius: '4@ms', borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  optionChipActive: { backgroundColor: color.primary, borderColor: color.primary },
  optionText: { fontSize: '13@ms', color: '#555', fontFamily: FONTS.Medium },
  optionTextActive: { color: '#fff', fontFamily: FONTS.Bold },

  descText: { fontSize: '13@ms', color: '#555', lineHeight: '20@ms' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: '5@vs' },
  bulletText: { fontSize: '13@ms', color: '#555', lineHeight: '20@ms', flex: 1 },
  specRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: '9@vs', borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  specKey: { flex: 1, fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  specVal: { flex: 1, fontSize: '13@ms', color: color.text, textAlign: 'right', fontFamily: FONTS.Medium },

  deliveryItem: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s' },
  deliveryTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '2@vs' },
  deliverySub: { fontSize: '12@ms', color: '#888', lineHeight: '17@ms' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '12@vs' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 6,
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
  },

  addToCartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center',
    backgroundColor: color.secondary,
    paddingVertical: '14@vs', gap: '6@s',
  },
  addToCartText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },

  // Buy Now — color.primary (blue)
  buyNowBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    backgroundColor: color.primary,
    paddingVertical: '10@vs',
  },
  buyNowMrp: { fontSize: '10@ms', color: 'rgba(255,255,255,0.55)', textDecorationLine: 'line-through', fontFamily: FONTS.Medium },
  buyNowPrice: { fontSize: '17@ms', fontFamily: FONTS.Bold, color: '#fff', lineHeight: '21@ms' },
  buyNowLabel: { fontSize: '12@ms', color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.Medium },

  outOfStockBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.background, paddingVertical: '14@vs', gap: '8@s',
  },
  outOfStockText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#BDBDBD' },
})