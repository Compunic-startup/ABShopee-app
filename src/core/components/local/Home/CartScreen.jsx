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

export default function CartScreen() {
  const navigation = useNavigation()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')
  const [fadeAnim] = useState(new Animated.Value(0))
  const [digitalEmail, setDigitalEmail] = useState('')
  const [businessId, setBusinessId] = useState(null)
  const [placing, setPlacing] = useState(false)

  // ─── Coupon / Dealer code ─────────────────────────────────────────────────
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [showDealerInput, setShowDealerInput] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [dealerInput, setDealerInput] = useState('')
  // The single active code sent to the backend
  const [appliedCode, setAppliedCode] = useState(null)
  // 'coupon' | 'dealer' | null
  const [appliedCodeType, setAppliedCodeType] = useState(null)
  const [applyingCode, setApplyingCode] = useState(false)

  // ─── Derived flags ────────────────────────────────────────────────────────
  const hasOnlyDigital =
    cart?.items?.length > 0 &&
    cart.items.every(i => i.itemSnapshot?.itemType === 'digital')

  const hasDigitalItem = cart?.items?.some(
    i => i.itemSnapshot?.itemType === 'digital'
  )

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

  // ─── Fetch cart (optionally with discount code) ───────────────────────────
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

  // ─── Totals ───────────────────────────────────────────────────────────────
  const getCartTotals = () => {
    if (!cart?.items) {
      return {
        baseTotal: 0, finalTotal: 0, totalSavings: 0,
        taxTotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0,
      }
    }

    return cart.items.reduce(
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
    const hasDigital = cartItems.some(i => i.itemSnapshot?.itemType === 'digital')

    const payload = {
      cartId,
      payment: { method: paymentMethod },
      itemType: hasDigital ? 'digital' : 'physical',
      ...(code ? { code } : {}),        // ← applied code in body
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

  // ─── Place order ──────────────────────────────────────────────────────────
  const placeOrder = async ({ cartId, cartItems, paymentMethod, address }) => {
    if (placing) return
    try {
      setPlacing(true)
      const hasDigital = cartItems.some(i => i.itemSnapshot?.itemType === 'digital')

      if (hasDigital && !digitalEmail) {
        ToastAndroid.show('Enter email for digital delivery', ToastAndroid.SHORT)
        return
      }
      if (hasDigital && !digitalEmail.includes('@')) {
        ToastAndroid.show('Enter valid email address', ToastAndroid.SHORT)
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
        code: appliedCode,        // ← send applied code with order
      })

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
        navigation.replace('OrderPlacedAnimation')
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

          {/* Cart Items */}
          <View style={styles.itemsContainer}>
            {cart?.items?.map(item => {
              const base = item.discountPricing?.baseItemTotal ?? item.pricing?.itemTotal ?? 0
              const final = item.discountPricing?.finalItemTotal ?? item.pricing?.itemTotal ?? 0
              const discount = item.discountPricing?.discountTotal ?? 0
              const unitPrice = item.discountPricing?.finalUnitPrice ?? final / item.quantity

              return (
                <View key={item.cartItemId} style={styles.cartCard}>
                  <View style={styles.cardContent}>
                    <View style={styles.topRow}>
                      <View style={styles.imageContainer}>
                        <Image source={{ uri: item.media?.url }} style={styles.productImage} />
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

          {/* Clear Cart */}
          {cart?.items?.length > 1 && (
            <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart}>
              <Icon name="delete-sweep-outline" size={22} color="#FF5252" />
              <Text style={styles.clearCartText}>Clear All Items</Text>
            </TouchableOpacity>
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

            {/* Coupon row — hide if dealer code is active */}
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

            {/* Dealer code row — hide if coupon is active */}
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

          {/* Delivery Section */}
          {!hasOnlyDigital && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="truck-delivery-outline" size={24} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Delivery Details</Text>
              </View>
              <TouchableOpacity style={styles.addressCard}>
                <View style={styles.addressLeft}>
                  <Icon name="map-marker" size={20} color="#0B77A7" />
                  <View style={styles.addressTextContainer}>
                    <Text style={styles.addressTitle}>Deliver to</Text>
                    <Text style={styles.addressText}>
                      HB 15 Takshshila Apartments, Indore, MP 452001
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>
              <View style={styles.deliveryInfo}>
                <Icon name="clock-outline" size={16} color="#4CAF50" />
                <Text style={styles.deliveryTime}>Estimated delivery in 3-5 days</Text>
              </View>
            </View>
          )}

          {/* Digital Email */}
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
              <Text style={styles.billLabel}>Subtotal ({cart?.items?.length} items)</Text>
              {totalSavings > 0 ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.basePrice}>₹{Math.round(baseTotal)}</Text>
                  <Text style={styles.billValue}>₹{Math.round(finalTotal)}</Text>
                </View>
              ) : (
                <Text style={styles.billValue}>₹{Math.round(finalTotal)}</Text>
              )}
            </View>

            {/* Applied code row in bill */}
            {appliedCode && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#4CAF50' }]}>
                  {appliedCodeType === 'coupon' ? 'Coupon' : 'Dealer Code'} ({appliedCode})
                </Text>
                <Text style={[styles.billValue, { color: '#4CAF50' }]}>Applied ✓</Text>
              </View>
            )}

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

            {totalSavings > 0 && (
              <View style={styles.savingsCard}>
                <Icon name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.savingsText}>
                  You're saving ₹{Math.round(totalSavings)} on this order
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
            {totalSavings > 0 ? `₹${Math.round(totalSavings)} Saved` : 'Incl. all taxes'}
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
              address: {
                line1: 'HB 15 Takshshila Apartments',
                city: 'Indore',
                state: 'MP',
                pincode: '452001',
                name: 'Customer',
                phone: '9999999999',
                email: 'ayushhkhale@gmail.com',
              },
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

  sectionCard: { backgroundColor: '#fff', marginHorizontal: '16@s', marginTop: '12@vs', borderRadius: '14@ms', padding: '16@s', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: '10@s', marginBottom: '14@vs' },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },

  offerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: '10@vs' },
  offerLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  offerText: { fontSize: '14@ms', color: '#333', fontFamily: FONTS.Medium },

  // ── Applied code banner ───────────────────────────────────────────────────
  appliedCodeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F1F8F4', borderRadius: '10@ms', padding: '12@s',
    marginBottom: '10@vs', borderWidth: 1, borderColor: '#C8E6C9',
  },
  appliedCodeLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  appliedCodeLabel: { fontSize: '11@ms', color: '#4CAF50', fontFamily: FONTS.Medium },
  appliedCodeValue: { fontSize: '14@ms', color: '#1a1a1a', fontFamily: FONTS.Bold, marginTop: '1@vs' },
  removeCodeBtn: { padding: '4@s' },

  // ── Code input row ────────────────────────────────────────────────────────
  codeInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: '10@s',
    marginTop: '8@vs', marginBottom: '4@vs',
  },
  codeInput: {
    flex: 1, height: '46@vs', borderWidth: 1.5, borderColor: '#D0D0D0',
    borderRadius: '10@ms', paddingHorizontal: '12@s',
    fontSize: '14@ms', color: '#1a1a1a', backgroundColor: '#FAFAFA',
    fontFamily: FONTS.Medium,
  },
  applyBtn: {
    backgroundColor: '#0B77A7', paddingHorizontal: '18@s', height: '46@vs',
    borderRadius: '10@ms', justifyContent: 'center', alignItems: 'center', minWidth: '72@s',
  },
  applyBtnDisabled: { backgroundColor: '#B0BEC5' },
  applyBtnText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '14@ms' },

  addressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', padding: '12@s', borderRadius: '10@ms', marginBottom: '10@vs' },
  addressLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: '10@s', flex: 1 },
  addressTextContainer: { flex: 1 },
  addressTitle: { fontSize: '12@ms', color: '#999', marginBottom: '2@vs' },
  addressText: { fontSize: '13@ms', color: '#333', fontFamily: FONTS.Medium },
  deliveryInfo: { flexDirection: 'row', alignItems: 'center', gap: '6@s' },
  deliveryTime: { fontSize: '12@ms', color: '#4CAF50', fontFamily: FONTS.Medium },

  emailNote: { fontSize: '13@ms', color: '#666', marginBottom: '10@vs' },

  billCard: { backgroundColor: '#fff', marginHorizontal: '16@s', marginTop: '12@vs', borderRadius: '14@ms', padding: '16@s', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  billTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '14@vs' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10@vs' },
  billLabel: { fontSize: '13@ms', color: '#666' },
  billValue: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#1a1a1a' },
  billValueFree: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#4CAF50' },
  billTotalLabel: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  billTotalValue: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },
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