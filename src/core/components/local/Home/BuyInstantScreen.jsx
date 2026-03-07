import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ToastAndroid,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { TextInput } from 'react-native-paper'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import { openRazorpay } from '../../global/razorpaymodule'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'

// ─── Reusable skeleton box with pulse animation ────────────────────────────
function SkeletonBox({ width, height, borderRadius = 6, style }) {
  const pulse = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.75, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#D1D5DB', opacity: pulse },
        style,
      ]}
    />
  )
}

// ─── Skeleton for price breakdown rows ────────────────────────────────────
function PriceBreakdownSkeleton() {
  const rows = [
    { left: 130, right: 70 },
    { left: 160, right: 80 },
    { left: 110, right: 60 },
    { left: 145, right: 75 },
    { left: 120, right: 65 },
  ]
  return (
    <View style={{ gap: 14, paddingVertical: 6 }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox width={r.left} height={13} />
          <SkeletonBox width={r.right} height={13} />
        </View>
      ))}
    </View>
  )
}

// ─── Free Gift Card Component ──────────────────────────────────────────────
function FreeGiftCard({ item }) {
  return (
    <View style={freeGiftStyles.card}>
      {/* Gold top accent */}
      <View style={freeGiftStyles.topAccent} />

      <View style={freeGiftStyles.inner}>
        {/* Image */}
        <View style={freeGiftStyles.imageWrap}>
          <Image
            source={item.media?.url ? { uri: item.media.url } : noimage}
            style={freeGiftStyles.image}
          />
          {/* FREE GIFT badge */}
          <View style={freeGiftStyles.badgeWrap}>
            <View style={freeGiftStyles.badge}>
              <Icon name="gift" size={9} color="#fff" />
              <Text style={freeGiftStyles.badgeText}>FREE</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={freeGiftStyles.details}>
          <Text style={freeGiftStyles.title} numberOfLines={2}>
            {item.itemSnapshot?.title}
          </Text>

          <View style={freeGiftStyles.footer}>
            <View style={freeGiftStyles.qtyPill}>
              <Icon name="package-variant" size={11} color="#0b4bb8" />
              <Text style={freeGiftStyles.qtyText}>Qty: {item.quantity}</Text>
            </View>
            <View style={freeGiftStyles.complimentaryPill}>
              <Icon name="check-circle" size={11} color="#fff" />
              <Text style={freeGiftStyles.complimentaryText}>Complimentary</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom note */}
      <View style={freeGiftStyles.note}>
        <Icon name="information-outline" size={12} color="#0b4bb8" />
        <Text style={freeGiftStyles.noteText}>
          This item is a free gift and cannot be modified
        </Text>
      </View>
    </View>
  )
}

const freeGiftStyles = ScaledSheet.create({
  card: {
    backgroundColor: '#f5f9ff',
    borderRadius: '12@ms',
    borderWidth: 1.5,
    borderColor: '#1743d4',
    overflow: 'hidden',
    marginBottom: '10@vs',
    elevation: 3,
    shadowColor: '#1743d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  topAccent: {
    height: '3@vs',
    backgroundColor: '#1743d4',
  },
  inner: {
    flexDirection: 'row',
    padding: '12@s',
    gap: '12@s',
  },
  imageWrap: {
    position: 'relative',
    width: '70@s',
    height: '70@s',
    borderRadius: '10@ms',
    backgroundColor: '#e1f4ff',
    borderWidth: 1,
    borderColor: '#7092f0',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: '10@ms',
    resizeMode: 'contain',
  },
  badgeWrap: {
    position: 'absolute',
    bottom: '-1@vs',
    left: '-1@s',
    right: '-1@s',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '3@s',
    backgroundColor: '#0a69c8',
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
    borderRadius: '5@ms',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  badgeText: {
    fontSize: '8@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#00183d',
    lineHeight: '18@vs',
    marginBottom: '6@vs',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    flexWrap: 'wrap',
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    backgroundColor: '#cdd8ff',
    borderRadius: '8@ms',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
    borderWidth: 1,
    borderColor: '#7092f0',
  },
  qtyText: {
    fontSize: '11@ms',
    fontFamily: FONTS.Bold,
    color: '#0b4bb8',
  },
  complimentaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    backgroundColor: '#0a69c8',
    borderRadius: '8@ms',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
  },
  complimentaryText: {
    fontSize: '10@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    letterSpacing: 0.3,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    backgroundColor: '#dceaff',
    paddingHorizontal: '12@s',
    paddingVertical: '7@vs',
    borderTopWidth: 1,
    borderTopColor: '#8abbed',
  },
  noteText: {
    fontSize: '11@ms',
    color: '#105a8b',
    fontFamily: FONTS.Medium,
    flex: 1,
  },
})

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function BuyInstantScreen() {
  const navigation = useNavigation()
  const { params } = useRoute()
  const [email, setEmail] = useState('')
  const [placing, setPlacing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fadeAnim] = useState(new Animated.Value(0))

  const {
    itemId,
    product,
    selectedAttributes = [],
    quantity = 1,
    isDigital,
  } = params

  const [qty, setQty] = useState(quantity)
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')

  // ─── Address state ────────────────────────────────────────────────────────
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  })

  const setAddressField = (field, value) =>
    setAddress(prev => ({ ...prev, [field]: value }))

  // ─── Coupon / Dealer code ─────────────────────────────────────────────────
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [showDealerInput, setShowDealerInput] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [dealerInput, setDealerInput] = useState('')
  const [appliedCode, setAppliedCode] = useState(null)
  const [appliedCodeType, setAppliedCodeType] = useState(null)
  const [applyingCode, setApplyingCode] = useState(false)

  const toast = (msg) => ToastAndroid.show(msg, ToastAndroid.SHORT)

  const price = product.prices?.[0]?.amount || 0
  const image =
    product.media?.find(m => m.role === 'primary')?.url ||
    product.media?.[0]?.url

  // ─── injectedItems = free gift items from preview ─────────────────────────
  const injectedItems = preview?.injectedItems ?? []
  const freeGiftItems = injectedItems.filter(i => i.isFreeGift)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
  }, [])

  const incrementQty = () => setQty(prev => prev + 1)
  const decrementQty = () => { if (qty > 1) setQty(prev => prev - 1) }

  // ─── Fetch preview (with optional code) ──────────────────────────────────
  const fetchPreview = async (code = appliedCode) => {
    setLoading(true)
    const payload = {
      quantity: qty,
      ...(code ? { code } : {}),
    }
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/items/${itemId}/buy-now/preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const json = await res.json()
      console.log('BUY NOW PREVIEW', json)

      if (!res.ok) throw json

      setPreview(json.data)
      return json
    } catch (err) {
      toast(err?.message || 'Unable to load item')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreview()
  }, [qty])

  // ─── Apply code ───────────────────────────────────────────────────────────
  const applyCode = async type => {
    const code = (type === 'coupon' ? couponInput : dealerInput).trim()

    if (!code) {
      toast('Please enter a code')
      return
    }

    try {
      setApplyingCode(true)
      const json = await fetchPreview(code)

      if (json?.data) {
        setAppliedCode(code)
        setAppliedCodeType(type)
        setShowCouponInput(false)
        setShowDealerInput(false)
        toast(type === 'coupon' ? 'Coupon applied! 🎉' : 'Dealer code applied! 🎉')
      } else {
        toast('Invalid code, please try again')
      }
    } catch (err) {
      toast(err?.message || 'Failed to apply code')
    } finally {
      setApplyingCode(false)
    }
  }

  // ─── Remove code ──────────────────────────────────────────────────────────
  const removeCode = async () => {
    setAppliedCode(null)
    setAppliedCodeType(null)
    setCouponInput('')
    setDealerInput('')
    await fetchPreview(null)
    toast('Code removed')
  }

  // ─── Address validation ───────────────────────────────────────────────────
  const validateAddress = () => {
    const { name, phone, line1, city, state, pincode } = address
    if (!name.trim()) { toast('Enter full name'); return false }
    if (!phone.trim() || phone.trim().length < 10) { toast('Enter valid 10-digit phone number'); return false }
    if (!line1.trim()) { toast('Enter address line 1'); return false }
    if (!city.trim()) { toast('Enter city'); return false }
    if (!state.trim()) { toast('Enter state'); return false }
    if (!pincode.trim() || pincode.trim().length !== 6) { toast('Enter valid 6-digit pincode'); return false }
    return true
  }

  // ─── Place order ──────────────────────────────────────────────────────────
  const placeBuyNowOrder = async () => {
    if (placing) return

    if (isDigital && !email) {
      toast('Please enter email for digital delivery')
      return
    }
    if (isDigital && !email.includes('@')) {
      toast('Please enter a valid email address')
      return
    }
    if (!isDigital && !validateAddress()) {
      return
    }

    try {
      setPlacing(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const payload = {
        variantId: product.variantId ?? null,
        quantity: qty,
        selectedAttributes,
        ...(appliedCode ? { code: appliedCode } : {}),
        ...(isDigital
          ? { itemType: 'digital', email }
          : {
            addresses: [
              {
                type: 'shipping',
                addressSnapshot: {
                  line1: address.line1,
                  city: address.city,
                  state: address.state,
                  country: 'IN',
                  pincode: address.pincode,
                },
                contactSnapshot: {
                  name: address.name,
                  phone: address.phone,
                  email: address.email,
                },
              },
            ],
            itemType: 'physical',
          }),
        payment: { method: 'RAZORPAY' },
      }

      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/orders/${itemId}/place`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const json = await res.json()
      console.log('Place order response', json)
      if (!res.ok) throw json

      const razorpayEmail = isDigital
        ? email
        : payload.addresses?.[0]?.contactSnapshot?.email

      openRazorpay({
        razorpayOrder: json.razorpay,
        orderId: json.orderId,
        navigation,
        email: razorpayEmail,
      })

      navigation.replace('OrderPlacedAnimation')
    } catch (e) {
      toast(e?.message || 'Order failed')
    } finally {
      setPlacing(false)
    }
  }

  // ─── Derived preview values ───────────────────────────────────────────────
  const unitPrice = preview?.pricing?.unitPrice ?? price
  const discountedUnitPrice = preview?.discountPricing?.finalUnitPrice ?? unitPrice
  const baseSubtotal = preview?.pricing?.baseSubtotal ?? price * qty
  const totalDiscount = preview?.totalDiscount ?? 0
  const finalSubtotal = preview?.discountPricing?.finalSubtotal ?? baseSubtotal
  const taxTotal = preview?.taxBreakdown?.taxTotal ?? 0
  const totalPayable = preview?.totalPayable ?? finalSubtotal + taxTotal
  const discountSummary = preview?.discountSummary ?? []
  const taxComponents = preview?.taxBreakdown?.components ?? {}
  const taxMode = preview?.taxBreakdown?.taxMode ?? 'exclusive'
  const hasDiscount = totalDiscount > 0
  const activeTaxComponents = Object.entries(taxComponents).filter(([, v]) => v.amount > 0)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight}>
          <Icon name="lock-outline" size={20} color="#fff" />
          <Text style={styles.secureText}>Secure</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Product Card ─────────────────────────────────────────────── */}
          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <Icon name="package-variant" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>

            <View style={styles.productContent}>
              <View style={styles.imageContainer}>
                <Image
                  source={image ? { uri: image } : noimage}
                  style={styles.productImage}
                />
                {isDigital && (
                  <View style={styles.digitalBadge}>
                    <Icon name="download" size={12} color="#fff" />
                    <Text style={styles.badgeText}>Digital</Text>
                  </View>
                )}
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>

                {product.category && (
                  <View style={styles.categoryBadge}>
                    <Icon name="tag-outline" size={12} color="#666" />
                    <Text style={styles.categoryText}>{product.category}</Text>
                  </View>
                )}

                {hasDiscount ? (
                  <View style={styles.unitPriceRow}>
                    <Text style={styles.unitPriceStrike}>₹{unitPrice}</Text>
                    <Text style={styles.unitPriceDiscounted}>₹{discountedUnitPrice} per unit</Text>
                  </View>
                ) : (
                  <Text style={styles.unitPrice}>₹{unitPrice} per unit</Text>
                )}
              </View>
            </View>

            {/* Quantity */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.qtyBox}>
                <TouchableOpacity onPress={decrementQty} style={styles.qtyButton} activeOpacity={0.7}>
                  <Icon name="minus" size={18} color="#0B77A7" />
                </TouchableOpacity>
                <View style={styles.qtyDisplay}>
                  <Text style={styles.qtyText}>{qty}</Text>
                </View>
                <TouchableOpacity onPress={incrementQty} style={styles.qtyButton} activeOpacity={0.7}>
                  <Icon name="plus" size={18} color="#0B77A7" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ── Price Breakdown: skeleton while loading ───────────────── */}
            {loading
              ? <PriceBreakdownSkeleton />
              : (
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Item Total (MRP)</Text>
                    <Text style={styles.priceValue}>₹{baseSubtotal.toFixed(2)}</Text>
                  </View>

                  {hasDiscount && (
                    <>
                      {discountSummary.map((d, i) => (
                        <View key={i} style={styles.priceRow}>
                          <View style={styles.discountLabelRow}>
                            <Icon name="tag" size={13} color="#4CAF50" />
                            <Text style={styles.discountLabel} numberOfLines={1}>{d.name}</Text>
                          </View>
                          <Text style={styles.discountValue}>-₹{d.totalApplied.toFixed(2)}</Text>
                        </View>
                      ))}
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Price after discount</Text>
                        <Text style={styles.priceValue}>₹{finalSubtotal.toFixed(2)}</Text>
                      </View>
                    </>
                  )}

                  {appliedCode && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: '#4CAF50' }]}>
                        {appliedCodeType === 'coupon' ? 'Coupon' : 'Dealer Code'} ({appliedCode})
                      </Text>
                      <Text style={[styles.priceValue, { color: '#4CAF50' }]}>Applied ✓</Text>
                    </View>
                  )}

                  {/* Free gift row in bill */}
                  {!loading && freeGiftItems.length > 0 && (
                    <View style={styles.priceRow}>
                      <View style={styles.discountLabelRow}>
                        <Icon name="gift" size={13} color="#0b4bb8" />
                        <Text style={[styles.priceLabel, { color: '#0b4bb8', flex: 1, marginLeft: 4 }]}>
                          Free Gift{freeGiftItems.length > 1 ? 's' : ''} ({freeGiftItems.length})
                        </Text>
                      </View>
                      <Text style={[styles.priceValue, { color: '#0b4bb8', fontFamily: FONTS.Bold }]}>FREE</Text>
                    </View>
                  )}

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Delivery Charges</Text>
                    <Text style={styles.priceFree}>FREE</Text>
                  </View>

                  {activeTaxComponents.length > 0 && (
                    <>
                      <View style={styles.taxHeader}>
                        <Icon name="receipt" size={13} color="#888" />
                        <Text style={styles.taxHeaderText}>
                          Taxes ({taxMode === 'exclusive' ? 'excluded from price' : 'included in price'})
                        </Text>
                      </View>
                      {activeTaxComponents.map(([key, val]) => (
                        <View key={key} style={styles.priceRow}>
                          <Text style={styles.taxLabel}>{key.toUpperCase()} @ {val.rate}%</Text>
                          <Text style={styles.taxValue}>₹{val.amount.toFixed(2)}</Text>
                        </View>
                      ))}
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Total Tax</Text>
                        <Text style={styles.priceValue}>₹{taxTotal.toFixed(2)}</Text>
                      </View>
                    </>
                  )}
                </View>
              )
            }

            <View style={styles.divider} />

            {/* ── Total ─────────────────────────────────────────────────── */}
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Amount</Text>
                {!loading && hasDiscount && (
                  <Text style={styles.savingsNote}>You save ₹{totalDiscount.toFixed(2)}!</Text>
                )}
              </View>
              {loading
                ? <SkeletonBox width={110} height={28} borderRadius={8} />
                : <Text style={styles.totalAmount}>₹{totalPayable.toFixed(2)}</Text>
              }
            </View>
          </View>

          {/* ── Free Gift Section ─────────────────────────────────────────── */}
          {!loading && freeGiftItems.length > 0 && (
            <View style={styles.freeGiftSection}>
              <View style={styles.freeGiftSectionHeader}>
                <View style={styles.freeGiftHeaderLeft}>
                  <Icon name="gift-open" size={20} color="#0b4bb8" />
                  <Text style={styles.freeGiftSectionTitle}>
                    Your Free Gift{freeGiftItems.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.freeGiftCountPill}>
                  <Text style={styles.freeGiftCountText}>{freeGiftItems.length}</Text>
                </View>
              </View>

              {freeGiftItems.map(item => (
                <FreeGiftCard key={item.cartItemId} item={item} />
              ))}
            </View>
          )}

          {/* ── Skeleton placeholder for free gift while loading ─────────── */}
          {loading && (
            <View style={[styles.freeGiftSection, { opacity: 0.5 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <SkeletonBox width={20} height={20} borderRadius={10} />
                <SkeletonBox width={140} height={14} />
              </View>
              <SkeletonBox width="100%" height={100} borderRadius={12} />
            </View>
          )}

          {/* ── Offers & Discounts ────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="ticket-percent-outline" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Offers & Discounts</Text>
            </View>

            {/* Applied code banner */}
            {appliedCode && (
              <View style={styles.appliedCodeBanner}>
                <View style={styles.appliedCodeLeft}>
                  <Icon
                    name={appliedCodeType === 'coupon' ? 'ticket-confirmation' : 'star-circle'}
                    size={18}
                    color="#4CAF50"
                  />
                  <View>
                    <Text style={styles.appliedCodeLabel}>
                      {appliedCodeType === 'coupon' ? 'Coupon' : 'Dealer Code'} Applied
                    </Text>
                    <Text style={styles.appliedCodeValue}>{appliedCode}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={removeCode} style={styles.removeCodeBtn}>
                  <Icon name="close-circle" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            )}

            {/* Coupon row */}
            {appliedCodeType !== 'dealer' && (
              <>
                <TouchableOpacity
                  style={styles.offerItem}
                  onPress={() => {
                    if (appliedCodeType === 'coupon') return
                    setShowCouponInput(prev => !prev)
                    setShowDealerInput(false)
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.offerLeft}>
                    <Icon name="ticket-confirmation-outline" size={20} color="#FF9800" />
                    <Text style={styles.offerText}>
                      {appliedCodeType === 'coupon' ? 'Coupon Applied ✓' : 'Apply Coupon Code'}
                    </Text>
                  </View>
                  {appliedCodeType !== 'coupon' && (
                    <Icon name={showCouponInput ? 'chevron-up' : 'chevron-right'} size={22} color="#999" />
                  )}
                </TouchableOpacity>

                {showCouponInput && !appliedCode && (
                  <View style={styles.codeInputRow}>
                    <RNTextInput
                      style={styles.codeInput}
                      placeholder="Enter coupon code"
                      placeholderTextColor="#bbb"
                      value={couponInput}
                      onChangeText={setCouponInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={[styles.applyBtn, (!couponInput.trim() || applyingCode) && styles.applyBtnDisabled]}
                      disabled={!couponInput.trim() || applyingCode}
                      onPress={() => applyCode('coupon')}
                      activeOpacity={0.8}
                    >
                      {applyingCode
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.applyBtnText}>Apply</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <View style={styles.offerDivider} />

            {/* Dealer code row */}
            {appliedCodeType !== 'coupon' && (
              <>
                <TouchableOpacity
                  style={styles.offerItem}
                  onPress={() => {
                    if (appliedCodeType === 'dealer') return
                    setShowDealerInput(prev => !prev)
                    setShowCouponInput(false)
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.offerLeft}>
                    <Icon name="star-circle-outline" size={20} color="#4CAF50" />
                    <Text style={styles.offerText}>
                      {appliedCodeType === 'dealer' ? 'Dealer Code Applied ✓' : 'Use Dealer Code'}
                    </Text>
                  </View>
                  {appliedCodeType !== 'dealer' && (
                    <Icon name={showDealerInput ? 'chevron-up' : 'chevron-right'} size={22} color="#999" />
                  )}
                </TouchableOpacity>

                {showDealerInput && !appliedCode && (
                  <View style={styles.codeInputRow}>
                    <RNTextInput
                      style={styles.codeInput}
                      placeholder="Enter dealer code"
                      placeholderTextColor="#bbb"
                      value={dealerInput}
                      onChangeText={setDealerInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={[styles.applyBtn, (!dealerInput.trim() || applyingCode) && styles.applyBtnDisabled]}
                      disabled={!dealerInput.trim() || applyingCode}
                      onPress={() => applyCode('dealer')}
                      activeOpacity={0.8}
                    >
                      {applyingCode
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.applyBtnText}>Apply</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          {/* ── Delivery Address / Digital ────────────────────────────────── */}
          {!isDigital ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="map-marker" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>

              {/* Full Name */}
              <TextInput
                mode="outlined"
                label="Full Name"
                placeholder="John Doe"
                value={address.name}
                onChangeText={v => setAddressField('name', v)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="account-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Phone */}
              <TextInput
                mode="outlined"
                label="Phone Number"
                placeholder="9876543210"
                value={address.phone}
                onChangeText={v => setAddressField('phone', v)}
                keyboardType="phone-pad"
                maxLength={10}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="phone-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Email (optional) */}
              <TextInput
                mode="outlined"
                label="Email"
                placeholder="you@example.com"
                value={address.email}
                onChangeText={v => setAddressField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="email-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Address Line 1 */}
              <TextInput
                mode="outlined"
                label="Address Line 1"
                placeholder="House / Flat No., Street"
                value={address.line1}
                onChangeText={v => setAddressField('line1', v)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="home-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Address Line 2 (optional) */}
              <TextInput
                mode="outlined"
                label="Address Line 2 (optional)"
                placeholder="Landmark, Area, Colony"
                value={address.line2}
                onChangeText={v => setAddressField('line2', v)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="map-marker-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* City + State */}
              <View style={styles.addressRowDouble}>
                <TextInput
                  mode="outlined"
                  label="City"
                  placeholder="Indore"
                  value={address.city}
                  onChangeText={v => setAddressField('city', v)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#0B77A7"
                  style={[styles.addressInput, styles.addressInputHalf]}
                />
                <TextInput
                  mode="outlined"
                  label="State"
                  placeholder="MP"
                  value={address.state}
                  onChangeText={v => setAddressField('state', v)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#0B77A7"
                  style={[styles.addressInput, styles.addressInputHalf]}
                />
              </View>

              {/* Pincode */}
              <TextInput
                mode="outlined"
                label="Pincode"
                placeholder="452001"
                value={address.pincode}
                onChangeText={v => setAddressField('pincode', v)}
                keyboardType="number-pad"
                maxLength={6}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="postage-stamp" color="#999" />}
                style={styles.addressInput}
              />

              <View style={styles.deliveryInfoBox}>
                <Icon name="truck-fast" size={20} color="#4CAF50" />
                <Text style={styles.deliveryInfoText}>Expected delivery in 3-5 business days</Text>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="email-outline" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Digital Delivery</Text>
              </View>

              <Text style={styles.emailNote}>Enter your email to receive the digital product</Text>

              <TextInput
                mode="outlined"
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.emailInput}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="email" />}
                theme={{ roundness: 12 }}
              />

              <View style={styles.digitalInfoBox}>
                <Icon name="download-circle" size={20} color="#1976D2" />
                <Text style={styles.digitalInfoText}>
                  Digital Product Keys will be sent instantly after payment (Check Your Spam Folder, If not found in Inbox)
                </Text>
              </View>
            </View>
          )}

          {/* ── Payment ───────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="credit-card-outline" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('ONLINE')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.radioOuter, paymentMethod === 'ONLINE' && styles.radioOuterActive]}>
                  {paymentMethod === 'ONLINE' && <View style={styles.radioInner} />}
                </View>
                <Icon name="cellphone" size={22} color="#0B77A7" />
                <View>
                  <Text style={styles.paymentTitle}>Pay Online</Text>
                  <Text style={styles.paymentSubtitle}>UPI, Cards, Net Banking, Wallets</Text>
                </View>
              </View>
            </TouchableOpacity>

            {!isDigital && (
              <TouchableOpacity
                style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('COD')}
                activeOpacity={0.7}
              >
                <View style={styles.paymentLeft}>
                  <View style={[styles.radioOuter, paymentMethod === 'COD' && styles.radioOuterActive]}>
                    {paymentMethod === 'COD' && <View style={styles.radioInner} />}
                  </View>
                  <Icon name="cash" size={22} color="#4CAF50" />
                  <View>
                    <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                    <Text style={styles.paymentSubtitle}>Pay when you receive</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Security Banner */}
          <View style={styles.securityBanner}>
            <Icon name="shield-check" size={24} color="#4CAF50" />
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Safe & Secure Payments</Text>
              <Text style={styles.securitySubtitle}>100% Payment Protection. Easy Returns</Text>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Bottom Bar ────────────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomLabel}>Total Amount</Text>
          {loading
            ? <SkeletonBox width={110} height={26} borderRadius={8} style={{ marginTop: 2 }} />
            : <Text style={styles.bottomTotal}>₹{totalPayable.toFixed(2)}</Text>
          }
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, (placing || loading) && styles.placeOrderBtnDisabled]}
          disabled={placing || loading}
          onPress={placeBuyNowOrder}
          activeOpacity={0.9}
        >
          {placing ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.placeOrderText}>Processing...</Text>
            </>
          ) : (
            <>
              <Icon name="check-circle" size={20} color="#fff" />
              <Text style={styles.placeOrderText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {placing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0B77A7" />
            <Text style={styles.loadingText}>Processing your order...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: '16@s', paddingVertical: '12@vs', backgroundColor: '#0B77A7',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  backBtn: { width: '40@s', height: '40@s', borderRadius: '20@s', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: '4@s' },
  secureText: { fontSize: '12@ms', color: '#fff', fontFamily: FONTS.Medium },

  productCard: {
    backgroundColor: '#fff', margin: '16@s', borderRadius: '16@ms', padding: '16@s',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '16@vs', gap: '10@s' },
  productContent: { flexDirection: 'row', marginBottom: '16@vs' },
  imageContainer: { position: 'relative', width: '100@s', height: '100@s', borderRadius: '12@ms', backgroundColor: '#FAFAFA', marginRight: '12@s' },
  productImage: { width: '100%', height: '100%', borderRadius: '12@ms', resizeMode: 'contain' },
  digitalBadge: { position: 'absolute', top: '6@vs', left: '6@s', flexDirection: 'row', alignItems: 'center', backgroundColor: '#1976D2', paddingHorizontal: '6@s', paddingVertical: '3@vs', borderRadius: '8@ms', gap: '3@s' },
  badgeText: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: '#fff' },
  productInfo: { flex: 1, justifyContent: 'space-between' },
  productTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', lineHeight: '20@vs', marginBottom: '6@vs' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F5F5F5', paddingHorizontal: '8@s', paddingVertical: '3@vs', borderRadius: '10@ms', gap: '4@s', marginBottom: '6@vs' },
  categoryText: { fontSize: '11@ms', color: '#666', fontFamily: FONTS.Medium },
  unitPrice: { fontSize: '13@ms', color: '#666', fontFamily: FONTS.Medium },
  unitPriceRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', flexWrap: 'wrap' },
  unitPriceStrike: { fontSize: '12@ms', color: '#aaa', fontFamily: FONTS.Medium, textDecorationLine: 'line-through' },
  unitPriceDiscounted: { fontSize: '13@ms', color: '#4CAF50', fontFamily: FONTS.Bold },

  quantitySection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16@vs' },
  quantityLabel: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: '25@ms', paddingHorizontal: '4@s', paddingVertical: '4@vs' },
  qtyButton: { width: '36@s', height: '36@s', borderRadius: '18@s', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  qtyDisplay: { paddingHorizontal: '20@s' },
  qtyText: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },

  priceBreakdown: { marginBottom: '12@vs' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10@vs' },
  priceLabel: { fontSize: '13@ms', color: '#666' },
  priceValue: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#1a1a1a' },
  priceFree: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#4CAF50' },
  discountLabelRow: { flexDirection: 'row', alignItems: 'center', gap: '5@s', flex: 1, marginRight: '8@s' },
  discountLabel: { fontSize: '12@ms', color: '#4CAF50', fontFamily: FONTS.Medium, flex: 1 },
  discountValue: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#4CAF50' },
  taxHeader: { flexDirection: 'row', alignItems: 'center', gap: '5@s', marginBottom: '6@vs', marginTop: '4@vs' },
  taxHeaderText: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },
  taxLabel: { fontSize: '12@ms', color: '#888' },
  taxValue: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  savingsNote: { fontSize: '12@ms', color: '#4CAF50', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  totalAmount: { fontSize: '22@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },

  // ── Free Gift Section ─────────────────────────────────────────────────────
  freeGiftSection: {
    marginHorizontal: '16@s',
    marginBottom: '16@vs',
  },
  freeGiftSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10@vs',
    paddingHorizontal: '2@s',
  },
  freeGiftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
  },
  freeGiftSectionTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#004f7a',
    letterSpacing: 0.3,
  },
  freeGiftCountPill: {
    backgroundColor: '#cdd8ff',
    borderRadius: '10@ms',
    paddingHorizontal: '8@s',
    paddingVertical: '2@vs',
    borderWidth: 1,
    borderColor: '#1795d4',
  },
  freeGiftCountText: {
    fontSize: '11@ms',
    fontFamily: FONTS.Bold,
    color: '#0b7eb8',
  },

  card: {
    backgroundColor: '#fff', marginHorizontal: '16@s', marginBottom: '16@vs',
    borderRadius: '16@ms', padding: '16@s', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '16@vs', gap: '10@s' },
  sectionTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },

  // ── Address form ──────────────────────────────────────────────────────────
  addressInput: { marginBottom: '10@vs', backgroundColor: '#fff' },
  addressRowDouble: { flexDirection: 'row', gap: '10@s' },
  addressInputHalf: { flex: 1 },

  deliveryInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F8F4', padding: '12@s', borderRadius: '10@ms', gap: '10@s', marginTop: '4@vs' },
  deliveryInfoText: { flex: 1, fontSize: '13@ms', color: '#4CAF50', fontFamily: FONTS.Medium },

  offerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: '10@vs' },
  offerLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  offerText: { fontSize: '14@ms', color: '#333', fontFamily: FONTS.Medium },
  offerDivider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: '4@vs' },

  appliedCodeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F1F8F4', borderRadius: '10@ms', padding: '12@s',
    marginBottom: '10@vs', borderWidth: 1, borderColor: '#C8E6C9',
  },
  appliedCodeLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  appliedCodeLabel: { fontSize: '11@ms', color: '#4CAF50', fontFamily: FONTS.Medium },
  appliedCodeValue: { fontSize: '14@ms', color: '#1a1a1a', fontFamily: FONTS.Bold, marginTop: '1@vs' },
  removeCodeBtn: { padding: '4@s' },

  codeInputRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s', marginTop: '8@vs', marginBottom: '4@vs' },
  codeInput: {
    flex: 1, height: '46@vs', borderWidth: 1.5, borderColor: '#D0D0D0',
    borderRadius: '10@ms', paddingHorizontal: '12@s', fontSize: '14@ms',
    color: '#1a1a1a', backgroundColor: '#FAFAFA', fontFamily: FONTS.Medium,
  },
  applyBtn: { backgroundColor: '#0B77A7', paddingHorizontal: '18@s', height: '46@vs', borderRadius: '10@ms', justifyContent: 'center', alignItems: 'center', minWidth: '72@s' },
  applyBtnDisabled: { backgroundColor: '#B0BEC5' },
  applyBtnText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '14@ms' },

  emailNote: { fontSize: '13@ms', color: '#666', marginBottom: '12@vs' },
  emailInput: { backgroundColor: '#fff', marginBottom: '12@vs' },
  digitalInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', padding: '12@s', borderRadius: '10@ms', gap: '10@s' },
  digitalInfoText: { flex: 1, fontSize: '13@ms', color: '#1976D2', fontFamily: FONTS.Medium },

  paymentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '14@s', borderRadius: '12@ms', borderWidth: 2, borderColor: '#E8E8E8', marginBottom: '12@vs' },
  paymentOptionActive: { borderColor: '#0B77A7', backgroundColor: '#F0F8FB' },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s', flex: 1 },
  radioOuter: { width: '22@s', height: '22@s', borderRadius: '11@s', borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: '#0B77A7' },
  radioInner: { width: '12@s', height: '12@s', borderRadius: '6@s', backgroundColor: '#0B77A7' },
  paymentTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  paymentSubtitle: { fontSize: '12@ms', color: '#666', marginTop: '2@vs' },

  securityBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F8F4', marginHorizontal: '16@s', marginBottom: '16@vs', padding: '14@s', borderRadius: '12@ms', gap: '12@s' },
  securityTextContainer: { flex: 1 },
  securityTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '2@vs' },
  securitySubtitle: { fontSize: '12@ms', color: '#666' },

  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: '14@vs' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: '16@s', backgroundColor: '#fff', elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8,
    borderTopLeftRadius: '20@ms', borderTopRightRadius: '20@ms',
  },
  bottomLeft: { flex: 1 },
  bottomLabel: { fontSize: '12@ms', color: '#666', marginBottom: '2@vs' },
  bottomTotal: { fontSize: '22@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  placeOrderBtn: { flexDirection: 'row', backgroundColor: '#0B77A7', paddingHorizontal: '28@s', paddingVertical: '14@vs', borderRadius: '30@ms', alignItems: 'center', gap: '8@s', elevation: 4, shadowColor: '#0B77A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  placeOrderBtnDisabled: { opacity: 0.7 },
  placeOrderText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '16@ms' },

  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loadingCard: { backgroundColor: '#fff', padding: '32@s', borderRadius: '16@ms', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  loadingText: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginTop: '16@vs' },
  loadingSubtext: { fontSize: '13@ms', color: '#666', marginTop: '4@vs' },
})