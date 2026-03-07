import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Animated,
  StatusBar,
  TextInput as RNTextInput,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Image } from 'react-native'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import { openRazorpay } from '../../global/razorpaymodule'
import { TextInput } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'

// ─── Free Gift Badge Component ────────────────────────────────────────────────
const FreeGiftBadge = () => (
  <View style={styles.freeGiftBadgeWrap}>
    <View style={styles.freeGiftBadge}>
      <Icon name="gift" size={11} color="#fff" />
      <Text style={styles.freeGiftBadgeText}>FREE GIFT</Text>
    </View>
  </View>
)

export default function CartScreen() {
  const navigation = useNavigation()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')
  const [fadeAnim] = useState(new Animated.Value(0))
  const [digitalEmail, setDigitalEmail] = useState('')
  const [businessId, setBusinessId] = useState(null)
  const [placing, setPlacing] = useState(false)

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

  // ─── Coupon / Dealer code ─────────────────────────────────────────────────
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [showDealerInput, setShowDealerInput] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [dealerInput, setDealerInput] = useState('')
  const [appliedCode, setAppliedCode] = useState(null)
  const [appliedCodeType, setAppliedCodeType] = useState(null)
  const [applyingCode, setApplyingCode] = useState(false)

  // ─── Derived flags ────────────────────────────────────────────────────────
  const hasOnlyDigital =
    cart?.items?.length > 0 &&
    cart.items.every(i => i.itemSnapshot?.itemType === 'digital')

  const hasDigitalItem = cart?.items?.some(
    i => i.itemSnapshot?.itemType === 'digital'
  )

  const hasPhysicalItem = cart?.items?.some(
    i => i.itemSnapshot?.itemType !== 'digital'
  )

  // Separate free gifts from regular items
  const regularItems = cart?.items?.filter(i => !i.isFreeGift) ?? []
  const freeGiftItems = cart?.items?.filter(i => i.isFreeGift) ?? []

  // ─── Address field helper ─────────────────────────────────────────────────
  const setAddressField = (field, value) =>
    setAddress(prev => ({ ...prev, [field]: value }))

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadInitialData = async () => {
      const id = await AsyncStorage.getItem('businessId')
      setBusinessId(id)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (businessId) fetchCart()
  }, [businessId])

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }
  }, [loading])

  // ─── Fetch cart ───────────────────────────────────────────────────────────
  const fetchCart = async (code = appliedCode) => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const url = code
        ? `${BASE_URL}/customer/business/${bId}/cart?code=${encodeURIComponent(code)}`
        : `${BASE_URL}/customer/business/${bId}/cart`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      console.log('CART DATA', json)
      setCart(json.data)
      return json
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Apply code ───────────────────────────────────────────────────────────
  const applyCode = async type => {
    const code = (type === 'coupon' ? couponInput : dealerInput).trim()
    if (!code) {
      ToastAndroid.show('Please enter a code', ToastAndroid.SHORT)
      return
    }
    try {
      setApplyingCode(true)
      const json = await fetchCart(code)
      if (json?.data) {
        setAppliedCode(code)
        setAppliedCodeType(type)
        setShowCouponInput(false)
        setShowDealerInput(false)
        ToastAndroid.show(
          type === 'coupon' ? 'Coupon applied! 🎉' : 'Dealer code applied! 🎉',
          ToastAndroid.SHORT
        )
      } else {
        ToastAndroid.show('Invalid code, please try again', ToastAndroid.SHORT)
      }
    } catch (err) {
      ToastAndroid.show(err?.message || 'Failed to apply code', ToastAndroid.SHORT)
    } finally {
      setApplyingCode(false)
    }
  }

  // ─── Remove applied code ──────────────────────────────────────────────────
  const removeCode = async () => {
    setAppliedCode(null)
    setAppliedCodeType(null)
    setCouponInput('')
    setDealerInput('')
    await fetchCart(null)
    ToastAndroid.show('Code removed', ToastAndroid.SHORT)
  }

  // ─── Totals (exclude free gifts from price calc) ──────────────────────────
  const getCartTotals = () => {
    if (!cart?.items) {
      return {
        baseTotal: 0, finalTotal: 0, totalSavings: 0,
        taxTotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0,
      }
    }
    return cart.items
      .filter(item => !item.isFreeGift)
      .reduce(
        (acc, item) => {
          const base = item.discountPricing?.baseItemTotal ?? item.pricing?.itemTotal ?? 0
          const final = item.discountPricing?.finalItemTotal ?? item.pricing?.itemTotal ?? 0
          const discount = item.discountPricing?.discountTotal ?? 0
          const tax = item.taxBreakdown ?? {}

          acc.baseTotal += base
          acc.finalTotal += final
          acc.totalSavings += discount
          acc.taxTotal += tax.taxTotal ?? 0
          acc.taxableAmount += tax.taxableAmount ?? 0
          acc.cgst += tax.components?.cgst?.amount ?? 0
          acc.sgst += tax.components?.sgst?.amount ?? 0
          acc.igst += tax.components?.igst?.amount ?? 0
          return acc
        },
        { baseTotal: 0, finalTotal: 0, totalSavings: 0, taxTotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0 }
      )
  }

  const { baseTotal, finalTotal, totalSavings, taxTotal, taxableAmount, cgst, sgst, igst } = getCartTotals()
  const grandTotal = cart?.totalPrice?.amount ?? finalTotal + taxTotal

  // ─── Discount summary from API ────────────────────────────────────────────
  const discountSummary = cart?.discountSummary ?? []
  const totalDiscount = cart?.totalDiscount ?? 0

  // ─── Attribute helper ─────────────────────────────────────────────────────
  const buildAttributesFromCartItem = cartItem =>
    (cartItem.selectedAttributes?.attributes || []).map(attr => ({
      attributeDefinitionId: attr.definitionId,
      sourceType: attr.source,
      value: attr.selectedValue,
    }))

  // ─── Quantity controls ────────────────────────────────────────────────────
  const updateQty = async (item, delta) => {
    try {
      const selectedAttributes = buildAttributesFromCartItem(item)
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')

      const res = await fetch(
        `${BASE_URL}/customer/business/${bId}/items/${item.itemId}/cart/add`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ quantity: delta, selectedAttributes }),
        }
      )
      if (!res.ok) throw await res.json()
      await fetchCart()
    } catch (err) {
      console.log('Qty update error', err)
      ToastAndroid.show('Unable to update quantity', ToastAndroid.SHORT)
    }
  }

  // ─── Remove item ──────────────────────────────────────────────────────────
  const removeItem = async cartItemId => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')

      const res = await fetch(
        `${BASE_URL}/customer/business/${bId}/items/cart/${cartItemId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw await res.json()
      await fetchCart()
      ToastAndroid.show('Item removed', ToastAndroid.SHORT)
    } catch (err) {
      console.log('Remove error', err)
      ToastAndroid.show('Unable to remove item', ToastAndroid.SHORT)
    }
  }

  // ─── Clear cart ───────────────────────────────────────────────────────────
  const clearCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')

      const res = await fetch(
        `${BASE_URL}/customer/business/${bId}/cart/clear`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw await res.json()
      await fetchCart()
      ToastAndroid.show('Cart cleared', ToastAndroid.SHORT)
    } catch (err) {
      console.log('Clear cart error', err)
      ToastAndroid.show('Unable to clear cart', ToastAndroid.SHORT)
    }
  }

  // ─── Build order payload ──────────────────────────────────────────────────
  const buildOrderPayload = ({ cartId, cartItems, paymentMethod, address, email, code }) => {
    const hasPhysical = cartItems.some(i => i.itemSnapshot?.itemType !== 'digital')
    const hasDigital = cartItems.some(i => i.itemSnapshot?.itemType === 'digital')

    const payload = {
      cartId,
      payment: { method: paymentMethod },
      itemType: hasPhysical ? 'physical' : 'digital',
      ...(code ? { code } : {}),
    }

    if (hasPhysical) {
      payload.addresses = [
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
      ]
    }
    if (hasDigital) {
      payload.email = email
    } else {
      payload.addresses = [
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
            email: hasDigital ? email : address.email,
          },
        },
      ]
    }

    return payload
  }

  // ─── Address validation ───────────────────────────────────────────────────
  const validateAddress = () => {
    const { name, phone, line1, city, state, pincode } = address
    if (!name.trim()) { ToastAndroid.show('Enter full name', ToastAndroid.SHORT); return false }
    if (!phone.trim() || phone.trim().length < 10) { ToastAndroid.show('Enter valid 10-digit phone number', ToastAndroid.SHORT); return false }
    if (!line1.trim()) { ToastAndroid.show('Enter address line 1', ToastAndroid.SHORT); return false }
    if (!city.trim()) { ToastAndroid.show('Enter city', ToastAndroid.SHORT); return false }
    if (!state.trim()) { ToastAndroid.show('Enter state', ToastAndroid.SHORT); return false }
    if (!pincode.trim() || pincode.trim().length !== 6) { ToastAndroid.show('Enter valid 6-digit pincode', ToastAndroid.SHORT); return false }
    return true
  }

  // ─── Place order ──────────────────────────────────────────────────────────
  const placeOrder = async ({ cartId, cartItems, paymentMethod }) => {
    if (placing) return
    try {
      setPlacing(true)
      const hasDigital = cartItems.some(i => i.itemSnapshot?.itemType === 'digital')
      const hasPhysical = cartItems.some(i => i.itemSnapshot?.itemType !== 'digital')

      if (hasDigital && !digitalEmail) {
        ToastAndroid.show('Enter email for digital delivery', ToastAndroid.SHORT)
        return
      }
      if (hasDigital && !digitalEmail.includes('@')) {
        ToastAndroid.show('Enter valid email address', ToastAndroid.SHORT)
        return
      }
      if (hasPhysical && !validateAddress()) {
        return
      }
      if (paymentMethod === 'COD' && hasDigital) {
        ToastAndroid.show('COD not allowed for digital items', ToastAndroid.SHORT)
        return
      }

      const token = await AsyncStorage.getItem('userToken')
      const bId = businessId ?? await AsyncStorage.getItem('businessId')

      const body = buildOrderPayload({
        cartId,
        cartItems,
        paymentMethod,
        address,
        email: digitalEmail,
        code: appliedCode,
      })

      console.log('ORDER PAYLOAD →', JSON.stringify(body, null, 2))

      const res = await fetch(
        `${BASE_URL}/customer/business/${bId}/order/place`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      )

      const json = await res.json()
      console.log('Place order response', res.status, json)
      if (!res.ok) throw json

      if (json.paymentMethod === 'RAZORPAY') {
        openRazorpay({
          razorpayOrder: json.razorpay,
          orderId: json.orderId,
          navigation,
          email: hasDigital ? digitalEmail : address.email,
        })
        return
      }

      ToastAndroid.show('Order placed successfully 🎉', ToastAndroid.SHORT)
      navigation.navigate('ExploreInventoryScreen')
    } catch (err) {
      ToastAndroid.show(err?.message || 'Unable to place order', ToastAndroid.SHORT)
    } finally {
      setPlacing(false)
      fetchCart()
    }
  }

  // ─── Category icon helper ─────────────────────────────────────────────────
  const getDiscountCategoryIcon = category => {
    switch (category) {
      case 'promotion': return 'tag-multiple'
      case 'coupon': return 'ticket-confirmation'
      case 'dealer': return 'star-circle'
      default: return 'percent'
    }
  }

  const getDiscountCategoryColor = category => {
    switch (category) {
      case 'promotion': return '#FF9800'
      case 'coupon': return '#9C27B0'
      case 'dealer': return '#4CAF50'
      default: return '#0B77A7'
    }
  }

  // ─── Render: loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0B77A7" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    )
  }

  // ─── Render: empty ────────────────────────────────────────────────────────
  if (!cart?.items || cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyCart}>
          <Icon name="cart-outline" size={120} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() => navigation.navigate('ExploreInventoryScreen')}
          >
            <Text style={styles.shopNowText}>Start Shopping</Text>
            <Icon name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ─── Render: cart ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cart?.items?.length || 0}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Regular Cart Items ──────────────────────────────────────── */}
          {regularItems.length > 0 && (
            <View style={styles.itemsContainer}>
              {regularItems.map(item => {
                const base = item.discountPricing?.baseItemTotal ?? item.pricing?.itemTotal ?? 0
                const final = item.discountPricing?.finalItemTotal ?? item.pricing?.itemTotal ?? 0
                const discount = item.discountPricing?.discountTotal ?? 0
                const unitPrice = item.discountPricing?.finalUnitPrice ?? final / item.quantity

                return (
                  <View key={item.cartItemId} style={styles.cartCard}>
                    <View style={styles.cardContent}>
                      <View style={styles.topRow}>
                        <View style={styles.imageContainer}>
                          <Image
                            source={item.media?.url ? { uri: item.media.url } : noimage}
                            style={styles.productImage}
                          />
                          {item.itemSnapshot?.itemType === 'digital' && (
                            <View style={styles.digitalBadge}>
                              <Icon name="download" size={10} color="#fff" />
                            </View>
                          )}
                        </View>

                        <View style={styles.productDetails}>
                          <Text style={styles.productTitle} numberOfLines={2}>
                            {item.itemSnapshot.title}
                          </Text>
                          {item.itemSnapshot.description && (
                            <Text style={styles.productDesc} numberOfLines={1}>
                              {item.itemSnapshot.description}
                            </Text>
                          )}
                          <View style={styles.priceRow}>
                            {discount > 0 ? (
                              <>
                                <Text style={styles.basePrice}>₹{Math.round(base)}</Text>
                                <Text style={styles.finalPrice}>₹{Math.round(final)}</Text>
                              </>
                            ) : (
                              <Text style={styles.finalPrice}>₹{Math.round(final)}</Text>
                            )}
                          </View>
                          {discount > 0 && (
                            <Text style={styles.savings}>You save ₹{Math.round(discount)}</Text>
                          )}
                          {item.quantity > 1 && (
                            <Text style={styles.unitPrice}>₹{unitPrice.toFixed(2)} each</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.qtyContainer}>
                        <TouchableOpacity onPress={() => removeItem(item.cartItemId)} style={styles.removeBtn}>
                          <Icon name="delete-outline" size={20} color="#FF5252" />
                        </TouchableOpacity>
                        <View style={styles.qtyBox}>
                          <TouchableOpacity onPress={() => updateQty(item, -1)} style={styles.qtyButton} activeOpacity={0.7}>
                            <Icon name="minus" size={16} color="#0B77A7" />
                          </TouchableOpacity>
                          <View style={styles.qtyDisplay}>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                          </View>
                          <TouchableOpacity onPress={() => updateQty(item, 1)} style={styles.qtyButton} activeOpacity={0.7}>
                            <Icon name="plus" size={16} color="#0B77A7" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* Clear Cart */}
          {regularItems.length > 1 && (
            <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart}>
              <Icon name="delete-sweep-outline" size={22} color="#FF5252" />
              <Text style={styles.clearCartText}>Clear All Items</Text>
            </TouchableOpacity>
          )}

          {/* ── Free Gift Items ─────────────────────────────────────────── */}
          {freeGiftItems.length > 0 && (
            <View style={styles.freeGiftSection}>
              {/* Section header */}
              <View style={styles.freeGiftSectionHeader}>
                <View style={styles.freeGiftHeaderLeft}>
                  <Icon name="gift-open" size={20} color="#0b81b8" />
                  <Text style={styles.freeGiftSectionTitle}>Your Free Gift{freeGiftItems.length > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.freeGiftCountPill}>
                  <Text style={styles.freeGiftCountText}>{freeGiftItems.length}</Text>
                </View>
              </View>

              {freeGiftItems.map(item => (
                <View key={item.cartItemId} style={styles.freeGiftCard}>
                  {/* Gold shimmer top border */}
                  <View style={styles.freeGiftTopAccent} />

                  <View style={styles.freeGiftCardInner}>
                    {/* Left: image + badge */}
                    <View style={styles.freeGiftImageWrap}>
                      <Image
                        source={item.media?.url ? { uri: item.media.url } : noimage}
                        style={styles.freeGiftImage}
                      />
                      <FreeGiftBadge />
                    </View>

                    {/* Right: details */}
                    <View style={styles.freeGiftDetails}>
                      <Text style={styles.freeGiftTitle} numberOfLines={2}>
                        {item.itemSnapshot.title}
                      </Text>
                      {item.itemSnapshot.description && (
                        <Text style={styles.freeGiftDesc} numberOfLines={1}>
                          {item.itemSnapshot.description}
                        </Text>
                      )}

                      {/* Qty + complimentary tag */}
                      <View style={styles.freeGiftFooter}>
                        <View style={styles.freeGiftQtyPill}>
                          <Icon name="package-variant" size={12} color="#0b81b8" />
                          <Text style={styles.freeGiftQtyText}>Qty: {item.quantity}</Text>
                        </View>
                        <View style={styles.complimentaryPill}>
                          <Icon name="check-circle" size={12} color="#fff" />
                          <Text style={styles.complimentaryText}>Complimentary</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Bottom note */}
                  <View style={styles.freeGiftNote}>
                    <Icon name="information-outline" size={13} color="#0b81b8" />
                    <Text style={styles.freeGiftNoteText}>
                      This item is a free gift and cannot be modified
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Offers & Discounts ────────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="ticket-percent-outline" size={24} color="#0B77A7" />
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

            <View style={styles.divider} />

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

          {/* ── Discount Summary (from API) ───────────────────────────────── */}
          {discountSummary.length > 0 && (
            <View style={styles.discountSummaryCard}>
              <View style={styles.discountSummaryHeader}>
                <View style={styles.discountSummaryHeaderLeft}>
                  <Icon name="tag-heart" size={22} color="#fff" />
                  <Text style={styles.discountSummaryHeaderText}>Discounts Applied</Text>
                </View>
                <View style={styles.discountSummaryBadge}>
                  <Text style={styles.discountSummaryBadgeText}>{discountSummary.length}</Text>
                </View>
              </View>

              <View style={styles.discountSummaryBody}>
                {discountSummary.map((disc, idx) => {
                  const iconName = getDiscountCategoryIcon(disc.category)
                  const iconColor = getDiscountCategoryColor(disc.category)
                  return (
                    <View key={disc.discountId ?? idx}>
                      <View style={styles.discountRow}>
                        <View style={styles.discountRowLeft}>
                          <View style={[styles.discountIconWrap, { backgroundColor: iconColor + '18' }]}>
                            <Icon name={iconName} size={18} color={iconColor} />
                          </View>
                          <View style={styles.discountTextBlock}>
                            <Text style={styles.discountName} numberOfLines={1}>{disc.name}</Text>
                            <View style={[styles.discountCategoryPill, { backgroundColor: iconColor + '22' }]}>
                              <Text style={[styles.discountCategoryText, { color: iconColor }]}>
                                {disc.category.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.discountAmountBlock}>
                          <Text style={styles.discountMinus}>−</Text>
                          <Text style={styles.discountAmount}>₹{Math.round(disc.totalApplied)}</Text>
                        </View>
                      </View>
                      {idx < discountSummary.length - 1 && <View style={styles.discountDivider} />}
                    </View>
                  )
                })}

                <View style={styles.discountTotalRow}>
                  <View style={styles.discountTotalLeft}>
                    <Icon name="check-decagram" size={18} color="#4CAF50" />
                    <Text style={styles.discountTotalLabel}>Total Discount</Text>
                  </View>
                  <Text style={styles.discountTotalValue}>− ₹{Math.round(totalDiscount)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Delivery / Shipping Address ───────────────────────────────── */}
          {!hasOnlyDigital && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="truck-delivery-outline" size={24} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Delivery Details</Text>
              </View>

              {/* Row 1: Full Name */}
              <TextInput
                mode="outlined"
                label="Full Name"
                placeholder="John Doe"
                placeholderTextColor="#99999993"
                value={address.name}
                onChangeText={v => setAddressField('name', v)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="account-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Row 2: Phone */}
              <TextInput
                mode="outlined"
                label="Phone Number"
                placeholder="9876543210"
                placeholderTextColor="#99999993"
                value={address.phone}
                onChangeText={v => setAddressField('phone', v)}
                keyboardType="phone-pad"
                maxLength={10}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="phone-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Row 3: Email (optional for physical) */}
              <TextInput
                mode="outlined"
                label="Email"
                placeholder="you@example.com"
                placeholderTextColor="#99999993"
                value={address.email}
                onChangeText={v => setAddressField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="email-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Row 4: Address Line 1 */}
              <TextInput
                mode="outlined"
                label="Address Line 1"
                placeholder="House / Flat No., Street"
                placeholderTextColor="#99999993"
                value={address.line1}
                onChangeText={v => setAddressField('line1', v)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="home-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Row 5: Address Line 2 (optional) */}
              <TextInput
                mode="outlined"
                label="Address Line 2 (optional)"
                placeholder="Landmark, Area, Colony"
                placeholderTextColor="#99999993"
                value={address.line2}
                onChangeText={v => setAddressField('line2', v)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="map-marker-outline" color="#999" />}
                style={styles.addressInput}
              />

              {/* Row 6: City + State side by side */}
              <View style={styles.addressRowDouble}>
                <TextInput
                  mode="outlined"
                  label="City"
                  placeholder="Indore"
                  placeholderTextColor="#99999993"
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
                  placeholderTextColor="#99999993"
                  value={address.state}
                  onChangeText={v => setAddressField('state', v)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#0B77A7"
                  style={[styles.addressInput, styles.addressInputHalf]}
                />
              </View>

              {/* Row 7: Pincode */}
              <TextInput
                mode="outlined"
                label="Pincode"
                placeholder="452001"
                placeholderTextColor="#99999993"
                value={address.pincode}
                onChangeText={v => setAddressField('pincode', v)}
                keyboardType="number-pad"
                maxLength={6}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
                left={<TextInput.Icon icon="postage-stamp" color="#999" />}
                style={styles.addressInput}
              />

              <View style={styles.deliveryInfo}>
                <Icon name="clock-outline" size={16} color="#4CAF50" />
                <Text style={styles.deliveryTime}>Estimated delivery in 3-5 days</Text>
              </View>
            </View>
          )}

          {/* ── Digital Delivery Email ────────────────────────────────────── */}
          {hasDigitalItem && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="email-outline" size={24} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Digital Delivery</Text>
              </View>
              <Text style={styles.emailNote}>Enter email to receive digital products</Text>
              <TextInput
                mode="outlined"
                placeholder="your.email@example.com"
                placeholderTextColor="#99999993"
                value={digitalEmail}
                onChangeText={setDigitalEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor="#E0E0E0"
                activeOutlineColor="#0B77A7"
              />
            </View>
          )}

          {/* Bill Summary */}
          <View style={styles.billCard}>
            <Text style={styles.billTitle}>Bill Summary</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal ({regularItems.length} item{regularItems.length !== 1 ? 's' : ''})</Text>
              {totalSavings > 0 ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.basePrice}>₹{Math.round(baseTotal)}</Text>
                  <Text style={styles.billValue}>₹{Math.round(finalTotal)}</Text>
                </View>
              ) : (
                <Text style={styles.billValue}>₹{Math.round(finalTotal)}</Text>
              )}
            </View>

            {/* Free gifts row in bill */}
            {freeGiftItems.length > 0 && (
              <View style={styles.billRow}>
                <View style={styles.billDiscountLabelRow}>
                  <Icon name="gift" size={13} color="#0b81b8" />
                  <Text style={[styles.billLabel, { color: '#0b81b8', flex: 1, marginLeft: 5 }]}>
                    Free Gift{freeGiftItems.length > 1 ? 's' : ''} ({freeGiftItems.length})
                  </Text>
                </View>
                <Text style={[styles.billValue, { color: '#0b81b8', fontFamily: FONTS.Bold }]}>FREE</Text>
              </View>
            )}

            {/* Applied code in bill */}
            {appliedCode && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#4CAF50' }]}>
                  {appliedCodeType === 'coupon' ? 'Coupon' : 'Dealer Code'} ({appliedCode})
                </Text>
                <Text style={[styles.billValue, { color: '#4CAF50' }]}>Applied ✓</Text>
              </View>
            )}

            {/* Discount summary rows in bill */}
            {discountSummary.map((disc, idx) => (
              <View key={disc.discountId ?? idx} style={styles.billRow}>
                <View style={styles.billDiscountLabelRow}>
                  <Icon
                    name={getDiscountCategoryIcon(disc.category)}
                    size={13}
                    color={getDiscountCategoryColor(disc.category)}
                  />
                  <Text style={[styles.billLabel, { color: '#388E3C', flex: 1, marginLeft: 5 }]} numberOfLines={1}>
                    {disc.name}
                  </Text>
                </View>
                <Text style={[styles.billValue, { color: '#388E3C' }]}>
                  − ₹{Math.round(disc.totalApplied)}
                </Text>
              </View>
            ))}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxable Amount</Text>
              <Text style={styles.billValue}>₹{taxableAmount.toFixed(2)}</Text>
            </View>
            {cgst > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>CGST</Text>
                <Text style={styles.billValue}>₹{cgst.toFixed(2)}</Text>
              </View>
            )}
            {sgst > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>SGST</Text>
                <Text style={styles.billValue}>₹{sgst.toFixed(2)}</Text>
              </View>
            )}
            {igst > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>IGST</Text>
                <Text style={styles.billValue}>₹{igst.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Total Tax</Text>
              <Text style={styles.billValue}>₹{taxTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Charges</Text>
              <Text style={styles.billValueFree}>FREE</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Total (incl. tax)</Text>
              <Text style={styles.billTotalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>

            {(totalSavings > 0 || totalDiscount > 0) && (
              <View style={styles.savingsCard}>
                <Icon name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.savingsText}>
                  You're saving ₹{Math.round(Math.max(totalSavings, totalDiscount))} on this order
                </Text>
              </View>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="credit-card-outline" size={24} color="#0B77A7" />
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
                <Icon name="cellphone" size={20} color="#0B77A7" />
                <View>
                  <Text style={styles.paymentTitle}>Pay Online</Text>
                  <Text style={styles.paymentSubtitle}>UPI, Cards, Wallets</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'COD' && styles.paymentOptionActive,
                hasDigitalItem && styles.paymentOptionDisabled,
              ]}
              onPress={() => !hasDigitalItem && setPaymentMethod('COD')}
              disabled={hasDigitalItem}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[
                  styles.radioOuter,
                  paymentMethod === 'COD' && styles.radioOuterActive,
                  hasDigitalItem && styles.radioOuterDisabled,
                ]}>
                  {paymentMethod === 'COD' && !hasDigitalItem && <View style={styles.radioInner} />}
                </View>
                <Icon name="cash" size={20} color={hasDigitalItem ? '#ccc' : '#4CAF50'} />
                <View>
                  <Text style={[styles.paymentTitle, hasDigitalItem && styles.paymentDisabled]}>
                    Cash on Delivery
                  </Text>
                  {hasDigitalItem && (
                    <Text style={styles.paymentSubtitle}>Not available for digital items</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Info Sections */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="shield-check-outline" size={20} color="#0B77A7" />
              <Text style={styles.infoTitle}>Returns & Cancellation</Text>
            </View>
            <Text style={styles.infoText}>
              Digital orders cannot be returned. Physical orders can be returned
              within 7 days. Refund will be processed in 2-3 working days.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="account-group-outline" size={20} color="#0B77A7" />
              <Text style={styles.infoTitle}>Dealer Programme</Text>
            </View>
            <Text style={styles.infoText}>
              Become a dealer or buy in bulk to enjoy special loyalty points,
              dealer codes for discounts, and bulk pricing negotiations.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomTotal}>₹{grandTotal.toFixed(2)}</Text>
          <Text style={styles.bottomSubtext}>
            {(totalSavings > 0 || totalDiscount > 0)
              ? `₹${Math.round(Math.max(totalSavings, totalDiscount))} Saved`
              : 'Incl. all taxes'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, placing && styles.checkoutBtnDisabled]}
          disabled={placing}
          onPress={() =>
            placeOrder({
              cartId: cart.cartId,
              cartItems: cart.items,
              paymentMethod: paymentMethod === 'ONLINE' ? 'RAZORPAY' : 'COD',
            })
          }
          activeOpacity={0.9}
        >
          {placing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.checkoutText}>Place Order</Text>
              <Icon name="arrow-right" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: '12@vs', fontSize: '14@ms', color: '#666', fontFamily: FONTS.Medium },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: '16@s', paddingVertical: '12@vs', backgroundColor: '#fff',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  backBtn: { width: '40@s', height: '40@s', borderRadius: '20@s', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', flex: 1, textAlign: 'center' },
  cartBadge: { width: '26@s', height: '26@s', borderRadius: '13@s', backgroundColor: '#0B77A7', justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { fontSize: '12@ms', color: '#fff', fontFamily: FONTS.Bold },

  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: '32@s' },
  emptyTitle: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginTop: '16@vs' },
  emptySubtitle: { fontSize: '14@ms', color: '#999', marginTop: '6@vs', marginBottom: '24@vs' },
  shopNowBtn: { flexDirection: 'row', backgroundColor: '#0B77A7', paddingHorizontal: '24@s', paddingVertical: '12@vs', borderRadius: '25@ms', alignItems: 'center', gap: '8@s' },
  shopNowText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '15@ms' },

  itemsContainer: { paddingHorizontal: '16@s', paddingTop: '12@vs', gap: '10@vs' },
  cartCard: { backgroundColor: '#fff', borderRadius: '14@ms', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, marginBottom: '4@vs' },
  cardContent: { padding: '14@s' },
  topRow: { flexDirection: 'row', gap: '12@s' },
  imageContainer: { position: 'relative', width: '80@s', height: '80@s', borderRadius: '10@ms', backgroundColor: '#F5F5F5' },
  productImage: { width: '100%', height: '100%', borderRadius: '10@ms', resizeMode: 'contain' },
  digitalBadge: { position: 'absolute', bottom: '4@vs', right: '4@s', backgroundColor: '#1976D2', width: '20@s', height: '20@s', borderRadius: '10@ms', justifyContent: 'center', alignItems: 'center' },
  productDetails: { flex: 1 },
  productTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '4@vs' },
  productDesc: { fontSize: '12@ms', color: '#888', marginBottom: '6@vs' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  basePrice: { fontSize: '12@ms', color: '#aaa', textDecorationLine: 'line-through', fontFamily: FONTS.Medium },
  finalPrice: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  savings: { fontSize: '11@ms', color: '#4CAF50', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  unitPrice: { fontSize: '11@ms', color: '#999', marginTop: '2@vs' },

  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '12@vs' },
  removeBtn: { padding: '6@s' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: '20@ms', paddingHorizontal: '4@s', paddingVertical: '2@vs' },
  qtyButton: { width: '32@s', height: '32@s', borderRadius: '16@s', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  qtyDisplay: { paddingHorizontal: '14@s' },
  qtyText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },

  clearCartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8@s', marginHorizontal: '16@s', marginVertical: '8@vs', paddingVertical: '10@vs', borderRadius: '10@ms', borderWidth: 1, borderColor: '#FF5252', backgroundColor: '#FFF5F5' },
  clearCartText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#FF5252' },

  // ── Free Gift Section ─────────────────────────────────────────────────────
  freeGiftSection: {
    marginHorizontal: '16@s',
    marginTop: '14@vs',
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
    color: '#00457a',
    letterSpacing: 0.3,
  },
  freeGiftCountPill: {
    backgroundColor: '#cdd4ff',
    borderRadius: '10@ms',
    paddingHorizontal: '8@s',
    paddingVertical: '2@vs',
    borderWidth: 1,
    borderColor: '#1756d4',
  },
  freeGiftCountText: {
    fontSize: '11@ms',
    fontFamily: FONTS.Bold,
    color: '#0b81b8',
  },

  freeGiftCard: {
    backgroundColor: '#f5fdff',
    borderRadius: '14@ms',
    borderWidth: 1.5,
    borderColor: '#1756d4',
    overflow: 'hidden',
    marginBottom: '10@vs',
    elevation: 3,
    shadowColor: '#1756d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  freeGiftTopAccent: {
    height: '3@vs',
    backgroundColor: '#1756d4',
  },
  freeGiftCardInner: {
    flexDirection: 'row',
    padding: '14@s',
    gap: '12@s',
  },
  freeGiftImageWrap: {
    position: 'relative',
    width: '80@s',
    height: '80@s',
    borderRadius: '10@ms',
    backgroundColor: '#e1eeff',
    borderWidth: 1,
    borderColor: '#70a7f0',
  },
  freeGiftImage: {
    width: '100%',
    height: '100%',
    borderRadius: '10@ms',
    resizeMode: 'contain',
  },
  freeGiftBadgeWrap: {
    position: 'absolute',
    bottom: '-1@vs',
    left: '-1@s',
    right: '-1@s',
    alignItems: 'center',
  },
  freeGiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '3@s',
    backgroundColor: '#0a69c8',
    paddingHorizontal: '6@s',
    paddingVertical: '3@vs',
    borderRadius: '6@ms',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  freeGiftBadgeText: {
    fontSize: '8@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    letterSpacing: 0.5,
  },

  freeGiftDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  freeGiftTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#00223d',
    marginBottom: '4@vs',
    lineHeight: '20@vs',
  },
  freeGiftDesc: {
    fontSize: '12@ms',
    color: '#557d8b',
    marginBottom: '8@vs',
  },
  freeGiftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    flexWrap: 'wrap',
  },
  freeGiftQtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    backgroundColor: '#cde6ff',
    borderRadius: '8@ms',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
    borderWidth: 1,
    borderColor: '#7090f0',
  },
  freeGiftQtyText: {
    fontSize: '11@ms',
    fontFamily: FONTS.Bold,
    color: '#0b81b8',
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

  freeGiftNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    backgroundColor: '#dcefff',
    paddingHorizontal: '14@s',
    paddingVertical: '8@vs',
    borderTopWidth: 1,
    borderTopColor: '#928aed',
  },
  freeGiftNoteText: {
    fontSize: '11@ms',
    color: '#0a20c8',
    fontFamily: FONTS.Medium,
    flex: 1,
  },

  sectionCard: { backgroundColor: '#fff', marginHorizontal: '16@s', marginTop: '12@vs', borderRadius: '14@ms', padding: '16@s', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: '10@s', marginBottom: '14@vs' },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },

  // ── Address form ──────────────────────────────────────────────────────────
  addressInput: { marginBottom: '10@vs', backgroundColor: '#fff' },
  addressRowDouble: { flexDirection: 'row', gap: '10@s' },
  addressInputHalf: { flex: 1 },

  deliveryInfo: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginTop: '4@vs' },
  deliveryTime: { fontSize: '12@ms', color: '#4CAF50', fontFamily: FONTS.Medium },

  offerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: '10@vs' },
  offerLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  offerText: { fontSize: '14@ms', color: '#333', fontFamily: FONTS.Medium },

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
  codeInput: { flex: 1, height: '46@vs', borderWidth: 1.5, borderColor: '#D0D0D0', borderRadius: '10@ms', paddingHorizontal: '12@s', fontSize: '14@ms', color: '#1a1a1a', backgroundColor: '#FAFAFA', fontFamily: FONTS.Medium },
  applyBtn: { backgroundColor: '#0B77A7', paddingHorizontal: '18@s', height: '46@vs', borderRadius: '10@ms', justifyContent: 'center', alignItems: 'center', minWidth: '72@s' },
  applyBtnDisabled: { backgroundColor: '#B0BEC5' },
  applyBtnText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '14@ms' },

  // ── Discount Summary Card ─────────────────────────────────────────────────
  discountSummaryCard: {
    marginHorizontal: '16@s', marginTop: '12@vs', borderRadius: '14@ms',
    overflow: 'hidden', elevation: 2,
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6,
  },
  discountSummaryHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2E7D32', paddingHorizontal: '16@s', paddingVertical: '12@vs',
  },
  discountSummaryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  discountSummaryHeaderText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },
  discountSummaryBadge: {
    backgroundColor: '#fff', borderRadius: '10@ms',
    paddingHorizontal: '8@s', paddingVertical: '2@vs',
  },
  discountSummaryBadgeText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  discountSummaryBody: { backgroundColor: '#fff', padding: '14@s' },

  discountRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: '10@vs',
  },
  discountRowLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s', flex: 1 },
  discountIconWrap: { width: '36@s', height: '36@s', borderRadius: '10@ms', justifyContent: 'center', alignItems: 'center' },
  discountTextBlock: { flex: 1 },
  discountName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '4@vs' },
  discountCategoryPill: { alignSelf: 'flex-start', borderRadius: '4@ms', paddingHorizontal: '6@s', paddingVertical: '2@vs' },
  discountCategoryText: { fontSize: '9@ms', fontFamily: FONTS.Bold, letterSpacing: 0.5 },
  discountAmountBlock: { flexDirection: 'row', alignItems: 'center', gap: '2@s' },
  discountMinus: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#388E3C' },
  discountAmount: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#388E3C' },
  discountDivider: { height: 1, backgroundColor: '#F0F4F0', marginVertical: '2@vs' },

  discountTotalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '10@vs', backgroundColor: '#F1F8F4',
    borderRadius: '10@ms', padding: '10@s',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  discountTotalLeft: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  discountTotalLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  discountTotalValue: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },

  emailNote: { fontSize: '13@ms', color: '#666', marginBottom: '10@vs' },

  billCard: { backgroundColor: '#fff', marginHorizontal: '16@s', marginTop: '12@vs', borderRadius: '14@ms', padding: '16@s', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  billTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '14@vs' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10@vs' },
  billLabel: { fontSize: '13@ms', color: '#666' },
  billValue: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#1a1a1a' },
  billValueFree: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#4CAF50' },
  billTotalLabel: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  billTotalValue: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },
  billDiscountLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: '8@s' },
  savingsCard: { flexDirection: 'row', alignItems: 'center', gap: '8@s', backgroundColor: '#F1F8F4', padding: '10@s', borderRadius: '8@ms', marginTop: '10@vs' },
  savingsText: { fontSize: '13@ms', color: '#4CAF50', fontFamily: FONTS.Medium, flex: 1 },

  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: '12@s', borderRadius: '10@ms', borderWidth: 1.5, borderColor: '#E8E8E8', marginBottom: '10@vs' },
  paymentOptionActive: { borderColor: '#0B77A7', backgroundColor: '#F0F8FB' },
  paymentOptionDisabled: { opacity: 0.5, backgroundColor: '#FAFAFA' },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s', flex: 1 },
  radioOuter: { width: '20@s', height: '20@s', borderRadius: '10@s', borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: '#0B77A7' },
  radioOuterDisabled: { borderColor: '#E0E0E0' },
  radioInner: { width: '10@s', height: '10@s', borderRadius: '5@s', backgroundColor: '#0B77A7' },
  paymentTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  paymentSubtitle: { fontSize: '11@ms', color: '#999', marginTop: '2@vs' },
  paymentDisabled: { color: '#bbb' },

  infoCard: { backgroundColor: '#fff', marginHorizontal: '16@s', marginTop: '12@vs', borderRadius: '14@ms', padding: '14@s', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginBottom: '8@vs' },
  infoTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  infoText: { fontSize: '12@ms', color: '#777', lineHeight: '18@vs' },

  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: '10@vs' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '16@s', paddingVertical: '14@vs', backgroundColor: '#fff', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8, borderTopLeftRadius: '20@ms', borderTopRightRadius: '20@ms' },
  bottomLeft: { flex: 1 },
  bottomTotal: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  bottomSubtext: { fontSize: '12@ms', color: '#4CAF50', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  checkoutBtn: { flexDirection: 'row', backgroundColor: '#0B77A7', paddingHorizontal: '24@s', paddingVertical: '14@vs', borderRadius: '30@ms', alignItems: 'center', gap: '8@s', elevation: 4, shadowColor: '#0B77A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, minWidth: '140@s', justifyContent: 'center' },
  checkoutBtnDisabled: { opacity: 0.7 },
  checkoutText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '15@ms' },
})