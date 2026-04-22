import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Image,
  ToastAndroid,
  Clipboard,
} from 'react-native'
import { ScaledSheet, ms, s, vs } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import noimage from '../../../assets/images/Categories/preloader.gif'
import RNFS from 'react-native-fs'
import FileViewer from 'react-native-file-viewer'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import color from '../../../utils/color'
import { openRazorpay } from '../../global/razorpaymodule'

// ─── Step pipeline — keyed to real API events[].toStatus ─────────────────────
const STEPS = [
  { key: 'created', label: 'Order Placed', icon: 'receipt' },
  { key: 'confirmed', label: 'Confirmed', icon: 'check-circle-outline' },
  { key: 'fulfilled', label: 'Shipped', icon: 'truck-delivery-outline' },
  { key: 'completed', label: 'Delivered', icon: 'home-circle-outline' },
]
const STEP_INDEX = { created: 0, confirmed: 1, fulfilled: 2, completed: 3 }

// ─── Vertical Stepper ─────────────────────────────────────────────────────────
function VerticalStepper({ currentStatus, events = [] }) {
  const isCancelled = currentStatus === 'cancelled'
  const activeIdx = isCancelled ? 0 : (STEP_INDEX[currentStatus] ?? 0)

  const eventTimeMap = {}
  events.forEach(ev => { if (ev.toStatus) eventTimeMap[ev.toStatus] = ev.createdAt })

  const fmtDate = iso => iso
    ? new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    : null

  if (isCancelled) {
    return (
      <View style={styles.vWrap}>
        {/* Node 1 — placed */}
        <View style={styles.vRow}>
          <View style={styles.vLeft}>
            <View style={[styles.vCircle, styles.vCircleDone]}>
              <Icon name="check" size={ms(11)} color="#fff" />
            </View>
            <View style={[styles.vLine, styles.vLineCancelled]} />
          </View>
          <View style={styles.vBody}>
            <Text style={styles.vLabel}>Order Placed</Text>
            {eventTimeMap['created'] && <Text style={styles.vDate}>{fmtDate(eventTimeMap['created'])}</Text>}
          </View>
        </View>
        {/* Node 2 — cancelled */}
        <View style={styles.vRow}>
          <View style={styles.vLeft}>
            <View style={[styles.vCircle, styles.vCircleCancelled]}>
              <Icon name="close" size={ms(11)} color="#fff" />
            </View>
          </View>
          <View style={styles.vBody}>
            <Text style={[styles.vLabel, { color: '#D32F2F' }]}>Cancelled</Text>
            {eventTimeMap['cancelled'] && <Text style={styles.vDate}>{fmtDate(eventTimeMap['cancelled'])}</Text>}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.vWrap}>
      {STEPS.map((step, i) => {
        const done = i <= activeIdx
        const current = i === activeIdx
        const isLast = i === STEPS.length - 1
        return (
          <View key={step.key} style={styles.vRow}>
            <View style={styles.vLeft}>
              <View style={[
                styles.vCircle,
                done && styles.vCircleDone,
                current && styles.vCircleCurrent,
                !done && styles.vCircleEmpty,
              ]}>
                {done
                  ? <Icon name={current ? step.icon : 'check'} size={ms(11)} color="#fff" />
                  : <View style={styles.vDotInner} />
                }
              </View>
              {!isLast && <View style={[styles.vLine, i < activeIdx && styles.vLineDone]} />}
            </View>
            <View style={[styles.vBody, !isLast && { paddingBottom: vs(18) }]}>
              <Text style={[
                styles.vLabel,
                done && { color: color.text, fontFamily: current ? FONTS.Bold : FONTS.SemiBold },
                !done && { color: '#BDBDBD' },
              ]}>
                {step.label}
              </Text>
              {done && eventTimeMap[step.key] && (
                <Text style={styles.vDate}>{fmtDate(eventTimeMap[step.key])}</Text>
              )}
              {current && !eventTimeMap[step.key] && (
                <Text style={styles.vProgress}>In progress</Text>
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ─── Dashed divider ───────────────────────────────────────────────────────────
const DashedDivider = () => (
  <View style={styles.dashedRow}>
    {Array.from({ length: 36 }).map((_, i) => <View key={i} style={styles.dashedDot} />)}
  </View>
)

// ─── Price row ────────────────────────────────────────────────────────────────
const PriceRow = ({ label, value, strike, green, bold, large }) => (
  <View style={styles.priceRow}>
    <Text style={[styles.priceLabel, bold && styles.priceLabelBold]}>{label}</Text>
    <Text style={[
      styles.priceValue,
      strike && styles.strikethrough,
      green && { color: '#388E3C' },
      bold && styles.priceValueBold,
      large && { fontSize: ms(16) },
    ]}>
      {value}
    </Text>
  </View>
)

// ─── Section card ─────────────────────────────────────────────────────────────
const Card = ({ title, titleIcon, children }) => (
  <View style={styles.card}>
    {title && (
      <View style={styles.cardTitleRow}>
        {titleIcon && <Icon name={titleIcon} size={ms(16)} color={color.primary} />}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    )}
    {children}
  </View>
)

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OrderDetailsScreen() {
  const navigation = useNavigation()
  const { orderId } = useRoute().params
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => { 
    fetchOrder()
    fetchUserProfile()
  }, [])

  useEffect(() => {
    if (!loading && order)
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [loading, order])

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${bId}/customer-business-profile`, { 
        method: 'GET', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } 
      })
      const json = await res.json()
      console.log('Fetched profile in order details:', json)
      setUserProfile(json?.success && json?.data ? json.data : null)
      console.log('Is profile empty?', !json?.data || !json?.data?.userProfile?.email)
    } catch (err) { 
      console.log('Error fetching user profile in order details:', err)
      setUserProfile(null) 
    } finally { 
      setProfileLoading(false) 
    }
  }

  const fetchOrder = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      console.log('Fetched order details:', json)
      setOrder(json?.data)   // API shape: { data: { orderId, items, events, ... } }
    } catch {
      ToastAndroid.show('Failed to load order details', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = async () => {
    try {
      setDownloading(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const filePath = `${RNFS.DownloadDirectoryPath}/Invoice-${orderId}.pdf`
      const result = await RNFS.downloadFile({
        fromUrl: `${BASE_URL}/customer/business/${businessId}/orders/${orderId}/invoice`,
        toFile: filePath,
        headers: { Authorization: `Bearer ${token}` },
      }).promise
      if (result.statusCode === 200) {
        ToastAndroid.show('Invoice downloaded', ToastAndroid.SHORT)
        await FileViewer.open(filePath)
      } else {
        ToastAndroid.show('Download failed', ToastAndroid.SHORT)
        console.log('Download Result:', JSON.stringify(result, null, 2))
      }
    } catch (error) {
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT)
      console.log('Download Error:', error)
    } finally {
      setDownloading(false)
    }
  }

  const copyOrderId = () => {
    Clipboard.setString(order?.orderId ?? '')
    ToastAndroid.show('Order ID copied', ToastAndroid.SHORT)
  }

  const initiatePayment = async () => {
    try {
      console.log('=== PAYMENT INITIATION START ===')
      
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      
      console.log('Auth check - Token:', token ? 'exists' : 'missing', 'BusinessId:', businessId ? 'exists' : 'missing')
      
      // Validate authentication
      if (!token) {
        console.log('ERROR: No token found')
        ToastAndroid.show('Please login again to continue', ToastAndroid.LONG)
        navigation.navigate('LoginScreen')
        return
      }
      if (!businessId) {
        console.log('ERROR: No businessId found')
        ToastAndroid.show('Business ID missing. Please login again.', ToastAndroid.LONG)
        return
      }
      
      console.log('Step 1: Auth validated, initiating payment for order:', orderId)
      
      const apiUrl = `${BASE_URL}/customer/business/${businessId}/orders/${orderId}/initiate-payment`
      console.log('Step 2: Calling API:', apiUrl)
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      })
      
      console.log('Step 3: API response status:', res.status, res.statusText)
      
      const json = await res.json()
      console.log('Step 4: Payment initiation response:', JSON.stringify(json, null, 2))
      
      if (!res.ok) {
        console.log('ERROR: Payment initiation failed:', json)
        throw json
      }

      console.log('Step 5: Checking payment method in response...')
      console.log('Payment method:', json.paymentMethod)
      console.log('Has razorpay object:', !!json.razorpay)
      console.log('Razorpay object:', json.razorpay)

      // Open Razorpay with the returned payment details
      if (json.paymentMethod === 'RAZORPAY' && json.razorpay) {
        
        // Use profile email first, then order email, then fallback
        const email = userProfile?.email ||
                     order?.addresses?.[0]?.contactSnapshot?.email || 
                     order?.metadata?.email || 
                     'pranay@example.com' // Final fallback
        
                     console.log(userProfile)
        // Use profile phone first, then order phone, then fallback
        const phone = userProfile?.userProfile?.phone ||
                     order?.addresses?.[0]?.contactSnapshot?.phone || 
                     '9999999999' // Final fallback
        
        console.log('Order:', order);
        console.log('User Profile:', userProfile);
        console.log('Step 6: Opening Razorpay with email:', email, 'phone:', phone)
        console.log('Step 7: Calling openRazorpay with params:', {
          razorpayOrder: json.razorpay,
          orderId: json.orderId,
          email: email,
          phone: phone
        })
        
        openRazorpay({ 
          razorpayOrder: json.razorpay, 
          orderId: json.orderId, 
          navigation, 
          email,
          phone
        })
        
        console.log('Step 8: openRazorpay called successfully')
      } else {
        console.log('ERROR: Invalid payment response - paymentMethod:', json.paymentMethod, 'hasRazorpay:', !!json.razorpay)
        ToastAndroid.show('Invalid payment response from server', ToastAndroid.SHORT)
      }
    } catch (error) {
      console.log('=== PAYMENT INITIATION ERROR ===')
      console.log('Error type:', typeof error)
      console.log('Error details:', JSON.stringify(error, null, 2))
      console.log('Error message:', error?.message)
      console.log('Error stack:', error?.stack)
      
      const errorMessage = error?.message || 'Failed to initiate payment'
      ToastAndroid.show(errorMessage, ToastAndroid.LONG)
      
      // If it's an authentication error, redirect to login
      if (errorMessage.includes('unauthorized') || errorMessage.includes('token') || errorMessage.includes('profile')) {
        setTimeout(() => {
          navigation.navigate('LoginScreen')
        }, 2000)
      }
    }
  }

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: s(40) }} />
        </View>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading order details…</Text>
        </View>
      </View>
    )
  }

  if (!order) return null

  // ── Data derived from real API shape ──────────────────────────────────────
  // events[] → [{ fromStatus, toStatus, createdAt, ... }]
  const events = order.events ?? []
  const latestEvent = events[events.length - 1]
  const currentStatus = latestEvent?.toStatus ?? order.status ?? 'created'
  const isCancelled = currentStatus === 'cancelled'

  // items[] — deduplicate same itemId (your data has itemId 854df... twice)
  const allItems = (order.items ?? []).map(i => i.dataValues || i)
  const deduped = Object.values(
    allItems.reduce((acc, item) => {
      if (acc[item.itemId]) {
        acc[item.itemId] = { ...acc[item.itemId], quantity: acc[item.itemId].quantity + item.quantity }
      } else {
        acc[item.itemId] = { ...item }
      }
      return acc
    }, {})
  )

  // Free gifts from metadata.freeGifts
  const metaGifts = order.metadata?.freeGifts ?? []
  const giftIds = new Set(metaGifts.map(g => g.itemId))
  const freeGifts = metaGifts.map(gift => {
    const match = allItems.find(i => i.itemId === gift.itemId)
    return match
      ? { ...match, _gift: true }
      : { itemId: gift.itemId, quantity: gift.quantity ?? 1, itemSnapshot: gift.itemSnapshot ?? gift, _gift: true }
  })

  const isDigital = allItems.length > 0 && allItems.every(i => i.itemSnapshot?.itemType === 'digital')

  // addresses[0].addressSnapshot + contactSnapshot
  const addrEntry = order.addresses?.[0]
  const addrSnap = addrEntry?.addressSnapshot
  const contSnap = addrEntry?.contactSnapshot

  // shipment[]
  const shipments = Array.isArray(order.shipment) && order.shipment.length > 0
    ? order.shipment : null

  // pricing.pricingSnapshot — { subtotal, total, discountTotal, items[] }
  const ps = order.pricing?.pricingSnapshot ?? {}
  const subtotal = ps.subtotal ?? 0
  const total = ps.total ?? parseFloat(order.pricing?.amount ?? 0)
  const discountTotal = ps.discountTotal ?? 0
  // delivery = total - (subtotal - discountTotal)  [clamp to 0]
  const deliveryFee = Math.max(0, total - subtotal + discountTotal)

  // payment[0] — { provider, method, status, amount, currency }
  const payment = order.payment?.[0]
  const isPaid = ['captured', 'success', 'paid'].includes(payment?.status)

  const createdDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const createdTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })

  // Hero item for top card
  const heroItem = deduped[0]
  const heroSnap = heroItem?.itemSnapshot ?? {}
  const heroAttrs = (heroItem?.selectedAttributes?.attributes ?? [])
    .map(a => `${a.label}: ${a.displayValue}`).join(' · ')
  const extraCount = deduped.length - 1

  const statusLabel = {
    created: 'Order Placed', confirmed: 'Confirmed',
    fulfilled: 'Shipped', completed: 'Delivered', cancelled: 'Cancelled',
  }[currentStatus] ?? currentStatus


  // const canReturn =
  //   currentStatus === 'Completed' &&
  //   !isCancelled &&
  //   !isDigital &&
  //   !(order?.returnRequestExists)

  const canReturn = true

  // Check if order should show Pay Now button
  const canPayNow = currentStatus === 'created' && 
                   order.metadata?.approvalStatus === 'approved' &&
                   !isPaid

  const goToReturn = () => {
    navigation.navigate('createreturn', {
      orderId: order.orderId,
      items: deduped,
    })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity style={styles.headerHelpBtn}>
          <Text style={styles.headerHelpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(110) }}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Hero product ────────────────────────────────────────────── */}
          <View style={styles.heroCard}>
            <Image
              source={heroSnap.image ? { uri: heroSnap.image } : noimage}
              style={styles.heroImg}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={2}>
                {heroSnap.title || 'Product'}
              </Text>
              {!!heroAttrs && <Text style={styles.heroAttrs} numberOfLines={1}>{heroAttrs}</Text>}
              <View style={styles.heroMeta}>
                <View style={styles.qtyPill}>
                  <Text style={styles.qtyPillTxt}>Qty: {heroItem?.quantity}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Order ID bar ────────────────────────────────────────────── */}
          <TouchableOpacity style={styles.orderIdBar} onPress={copyOrderId} activeOpacity={0.7}>
            <Icon name="receipt" size={ms(13)} color="#999" />
            <Text style={styles.orderIdBarTxt} numberOfLines={1}>
              Order #{order.orderId?.slice(-16).toUpperCase()}
            </Text>
            <Icon name="content-copy" size={ms(13)} color={color.primary} />
          </TouchableOpacity>


          {/* ── Status + Vertical Stepper ───────────────────────────────── */}
          <Card>
            <View style={styles.statusRow}>
              <View>
                <Text style={[styles.statusLabel, isCancelled && { color: '#D32F2F' }]}>
                  {statusLabel}
                </Text>
                <Text style={styles.statusDate}>{createdDate} · {createdTime}</Text>
              </View>
              {isCancelled && (
                <View style={styles.cancelPill}>
                  <Icon name="close-circle" size={ms(12)} color="#D32F2F" />
                  <Text style={styles.cancelPillTxt}>Cancelled</Text>
                </View>
              )}
            </View>
            <VerticalStepper currentStatus={currentStatus} events={events} />
          </Card>

          {/* ── Shipments ───────────────────────────────────────────────── */}
          {shipments?.map((sh, i) => (
            <Card key={i} title="Shipment Info" titleIcon="truck-fast-outline">
              <View style={styles.shipRow}>
                <View style={styles.shipIconWrap}>
                  <Icon name="truck-outline" size={ms(18)} color={color.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shipCarrier}>{sh.carrier || 'Courier Partner'}</Text>
                  {sh.trackingId && <Text style={styles.shipTrack}>ID: {sh.trackingId}</Text>}
                </View>
                <View style={styles.shipPill}>
                  <Text style={styles.shipPillTxt}>
                    {sh.status?.charAt(0).toUpperCase() + sh.status?.slice(1)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}

          {/* ── Items list ──────────────────────────────────────────────── */}
          <Card title={`Items (${deduped.length})`} titleIcon="package-variant">
            {deduped.map((item, idx) => {
              const snap = item.itemSnapshot ?? {}
              const isGift = giftIds.has(item.itemId)
              // per-item price from pricingSnapshot.items[idx]
              const psItem = ps.items?.[idx]
              const lineTotal = psItem?.finalLineTotal ?? (snap.price ?? 0) * item.quantity
              return (
                <View key={item.itemId + idx} style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}>
                  <Image
                    source={snap.image ? { uri: snap.image } : noimage}
                    style={styles.itemImg}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{snap.title || 'Product'}</Text>
                    {(item.selectedAttributes?.attributes ?? []).length > 0 && (
                      <Text style={styles.itemAttrs} numberOfLines={1}>
                        {item.selectedAttributes.attributes.map(a => `${a.label}: ${a.displayValue}`).join(' · ')}
                      </Text>
                    )}
                    <View style={styles.itemFoot}>
                      <View style={styles.qtyPill}>
                        <Text style={styles.qtyPillTxt}>Qty: {item.quantity}</Text>
                      </View>
                      {isGift && (
                        <View style={styles.freePill}>
                          <Icon name="gift" size={ms(9)} color="#fff" />
                          <Text style={styles.freePillTxt}>FREE</Text>
                        </View>
                      )}
                      {snap.itemType === 'digital' && (
                        <View style={styles.digitalPill}>
                          <Icon name="download" size={ms(9)} color={color.primary} />
                          <Text style={styles.digitalPillTxt}>Digital</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>
                    {isGift ? 'FREE' : `₹${lineTotal?.toFixed(0)}`}
                  </Text>
                </View>
              )
            })}
          </Card>

          {/* ── Delivery address ────────────────────────────────────────── */}
          {!isDigital && (addrSnap || contSnap) && (
            <Card title="Delivery details" titleIcon="map-marker-outline">
              {addrSnap && (
                <View style={styles.addrBox}>
                  <View style={styles.addrTypeRow}>
                    <Icon name="map-marker" size={ms(13)} color="#999" />
                    <Text style={styles.addrType}>{addrEntry?.type === 'shipping' ? 'Shipping' : 'Other'}</Text>
                  </View>
                  <Text style={styles.addrLine}>
                    {[addrSnap.line1, addrSnap.city, addrSnap.state].filter(Boolean).join(', ')}
                  </Text>
                  <Text style={styles.addrLine}>{addrSnap.pincode} · {addrSnap.country}</Text>
                </View>
              )}
              {contSnap && (
                <View style={[styles.addrBox, styles.contRow]}>
                  <Icon name="account-circle-outline" size={ms(15)} color="#999" />
                  <Text style={styles.contName}>{contSnap.name}</Text>
                  <Text style={styles.contPhone}>{contSnap.phone}</Text>
                </View>
              )}
            </Card>
          )}

          {/* ── Digital delivery ────────────────────────────────────────── */}
          {isDigital && (
            <Card title="Digital Delivery" titleIcon="download-circle-outline">
              <View style={styles.digitalBox}>
                <Icon name="email-check-outline" size={ms(22)} color={color.primary} />
                <Text style={styles.digitalTxt}>
                  Your digital product(s) have been sent to your registered email address.
                </Text>
              </View>
            </Card>
          )}

          {/* ── Price details ───────────────────────────────────────────── */}
          <Card title="Price details" titleIcon="tag-outline">
            <PriceRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
            {discountTotal > 0 && (
              <PriceRow label="Discount" value={`-₹${discountTotal.toFixed(2)}`} green />
            )}
            <PriceRow
              label="Delivery charges"
              value={deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
              green={deliveryFee === 0}
            />
            {freeGifts.length > 0 && (
              <PriceRow
                label={`Free gift${freeGifts.length > 1 ? 's' : ''} (${freeGifts.length})`}
                value="FREE"
                green
              />
            )}
            <DashedDivider />
            <PriceRow label="Total amount" value={`₹${parseFloat(total).toFixed(2)}`} bold large />

            {/* Payment method inline — matching Flipkart layout */}
            {payment && (
              <View style={styles.payRow}>
                <Text style={styles.payLbl}>Payment{'\n'}method</Text>
                <View style={styles.payRight}>
                  <View style={styles.payIconBox}>
                    <Icon
                      name={
                        payment.method === 'cod' ? 'cash' :
                          payment.provider === 'razorpay' ? 'cellphone' :
                            'credit-card-outline'
                      }
                      size={ms(16)}
                      color={color.primary}
                    />
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.payMethod}>
                      {payment.method === 'cod'
                        ? 'Cash on\nDelivery'
                        : payment.method?.charAt(0).toUpperCase() + payment.method?.slice(1)}
                    </Text>
                    <Text style={[styles.payStatus, { color: isPaid ? '#388E3C' : '#E65100' }]}>
                      {isPaid ? 'Paid' : payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* ── Order info ──────────────────────────────────────────────── */}
          <Card title="Order information" titleIcon="information-outline">
            {[
              { label: 'Order ID', value: order.orderId?.toUpperCase(), copy: true },
              { label: 'Placed on', value: `${createdDate} · ${createdTime}` },
              { label: 'Items', value: `${deduped.length} item${deduped.length > 1 ? 's' : ''}` },
              { label: 'Currency', value: payment?.currency ?? 'INR' },
            ].map((row, i) => (
              <View key={i} style={[styles.infoRow, i < 3 && styles.infoRowBorder]}>
                <Text style={styles.infoLbl}>{row.label}</Text>
                <TouchableOpacity
                  style={styles.infoValRow}
                  onPress={row.copy ? copyOrderId : undefined}
                  activeOpacity={row.copy ? 0.6 : 1}
                >
                  <Text style={styles.infoVal} numberOfLines={1}>{row.value}</Text>
                  {row.copy && <Icon name="content-copy" size={ms(12)} color={color.primary} />}
                </TouchableOpacity>
              </View>
            ))}
          </Card>

        </Animated.View>
      </ScrollView>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.invoiceBtn}
          onPress={downloadInvoice}
          disabled={downloading}
          activeOpacity={0.8}
        >
          {downloading
            ? <ActivityIndicator size="small" color={color.primary} />
            : <Icon name="file-download-outline" size={ms(17)} color={color.primary} />
          }
          <Text style={styles.invoiceBtnTxt}>
            {downloading ? 'Downloading…' : 'Download Invoice'}
          </Text>
        </TouchableOpacity>

        {canPayNow && (
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={initiatePayment}
            activeOpacity={0.8}
          >
            <Icon name="credit-card-outline" size={ms(17)} color="#fff" />
            <Text style={styles.payNowBtnTxt}>Pay Now</Text>
          </TouchableOpacity>
        )}

        {canReturn && (
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={goToReturn}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={ms(17)} color="#fff" />
            <Text style={styles.returnBtnTxt}>Replace</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── Styles — ONLY color.* values ────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: '12@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: color.primary,
    paddingHorizontal: '14@s', paddingVertical: '13@vs',
    elevation: 4,
  },
  headerBtn: { width: '36@s', height: '36@s', borderRadius: '18@ms', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '17@ms', fontFamily: FONTS.Bold, color: '#fff' },
  headerHelpBtn: {
    borderWidth: 1.5, borderColor: color.primary,
    borderRadius: '6@ms', paddingHorizontal: '12@s', paddingVertical: '5@vs',
  },
  headerHelpText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.primary },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: '16@s', paddingVertical: '14@vs',
  },
  heroImg: {
    width: '64@s', height: '64@s', borderRadius: '8@ms',
    backgroundColor: color.secondarylight, resizeMode: 'contain',
    marginRight: '12@s', borderWidth: 1, borderColor: '#EEE',
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '20@ms' },
  heroAttrs: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '3@vs' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginTop: '6@vs' },
  extraTxt: { fontSize: '12@ms', color: color.primary, fontFamily: FONTS.Bold },

  // ── Order ID bar ──────────────────────────────────────────────────────────
  orderIdBar: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    backgroundColor: '#fff', paddingHorizontal: '16@s', paddingVertical: '10@vs',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  orderIdBarTxt: { flex: 1, fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: { backgroundColor: '#fff', marginTop: '8@vs', paddingHorizontal: '16@s', paddingVertical: '16@vs' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: '7@s', marginBottom: '14@vs' },
  cardTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },

  // ── Status head ───────────────────────────────────────────────────────────
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '20@vs',
  },
  statusLabel: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text },
  statusDate: { fontSize: '12@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '3@vs' },
  cancelPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    borderWidth: 1, borderColor: '#D32F2F',
    paddingHorizontal: '8@s', paddingVertical: '3@vs', borderRadius: '20@ms',
  },
  cancelPillTxt: { fontSize: '11@ms', color: '#D32F2F', fontFamily: FONTS.Bold },

  // ── Vertical stepper ──────────────────────────────────────────────────────
  vWrap: { paddingLeft: '2@s' },
  vRow: { flexDirection: 'row', alignItems: 'flex-start' },
  vLeft: { alignItems: 'center', width: '28@s' },
  vCircle: {
    width: '26@s', height: '26@s', borderRadius: '13@ms',
    backgroundColor: '#E0E0E0', borderWidth: 2, borderColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center',
  },
  vCircleDone: { backgroundColor: color.primary, borderColor: color.primary },
  vCircleCurrent: { backgroundColor: color.primary, borderColor: color.secondary, borderWidth: 2.5 },
  vCircleEmpty: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  vCircleCancelled: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  vDotInner: { width: '8@s', height: '8@s', borderRadius: '4@ms', backgroundColor: '#BDBDBD' },
  vLine: {
    width: 2, flex: 1, minHeight: '30@vs',
    backgroundColor: '#E0E0E0', marginVertical: '2@vs',
  },
  vLineDone: { backgroundColor: color.primary },
  vLineCancelled: { backgroundColor: '#D32F2F' },
  vBody: { flex: 1, paddingLeft: '14@s', paddingBottom: vs(18) },
  vLabel: { fontSize: '13@ms', fontFamily: FONTS.SemiBold, color: color.text },
  vDate: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '3@vs' },
  vProgress: { fontSize: '11@ms', color: color.primary, fontFamily: FONTS.Medium, marginTop: '3@vs' },

  // ── Shipment ──────────────────────────────────────────────────────────────
  shipRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  shipIconWrap: {
    width: '40@s', height: '40@s', borderRadius: '20@ms',
    backgroundColor: color.secondarylight, justifyContent: 'center', alignItems: 'center',
  },
  shipCarrier: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  shipTrack: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  shipPill: {
    backgroundColor: color.secondarylight,
    paddingHorizontal: '10@s', paddingVertical: '4@vs', borderRadius: '20@ms',
  },
  shipPillTxt: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: color.primary },

  // ── Items ─────────────────────────────────────────────────────────────────
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: '10@vs' },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  itemImg: {
    width: '60@s', height: '60@s', borderRadius: '8@ms',
    backgroundColor: color.secondarylight, resizeMode: 'contain',
    marginRight: '12@s', borderWidth: 1, borderColor: '#EEE',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms' },
  itemAttrs: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '3@vs' },
  itemFoot: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginTop: '6@vs', flexWrap: 'wrap' },
  itemPrice: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, paddingTop: '2@vs' },

  qtyPill: { backgroundColor: color.background, paddingHorizontal: '7@s', paddingVertical: '2@vs', borderRadius: '4@ms', borderWidth: 1, borderColor: '#E0E0E0' },
  qtyPillTxt: { fontSize: '10@ms', color: '#666', fontFamily: FONTS.Medium },
  freePill: { flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: color.primary, paddingHorizontal: '7@s', paddingVertical: '2@vs', borderRadius: '4@ms' },
  freePillTxt: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#fff' },
  digitalPill: { flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: color.secondarylight, paddingHorizontal: '7@s', paddingVertical: '2@vs', borderRadius: '4@ms' },
  digitalPillTxt: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: color.primary },

  // ── Address ───────────────────────────────────────────────────────────────
  addrBox: { backgroundColor: color.background, borderRadius: '8@ms', padding: '12@s', marginBottom: '4@vs' },
  addrTypeRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '6@vs' },
  addrType: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#888' },
  addrLine: { fontSize: '13@ms', color: color.text, fontFamily: FONTS.Medium, lineHeight: '20@ms' },
  contRow: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginBottom: 0 },
  contName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  contPhone: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#888' },

  // ── Digital delivery ──────────────────────────────────────────────────────
  digitalBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '12@s',
    backgroundColor: color.secondarylight, borderRadius: '8@ms', padding: '12@s',
  },
  digitalTxt: { flex: 1, fontSize: '13@ms', color: color.text, fontFamily: FONTS.Medium, lineHeight: '20@ms' },

  // ── Price ─────────────────────────────────────────────────────────────────
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '11@vs' },
  priceLabel: { fontSize: '14@ms', color: color.text, fontFamily: FONTS.Medium },
  priceLabelBold: { fontFamily: FONTS.Bold },
  priceValue: { fontSize: '14@ms', color: color.text, fontFamily: FONTS.Medium },
  priceValueBold: { fontFamily: FONTS.Bold },
  strikethrough: { textDecorationLine: 'line-through', color: '#BDBDBD' },
  dashedRow: { flexDirection: 'row', marginVertical: '12@vs' },
  dashedDot: { flex: 1, height: 1, backgroundColor: '#BDBDBD', marginRight: '3@s' },

  // Payment row (inline in price card)
  payRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: '8@vs', paddingTop: '12@vs',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  payLbl: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  payRight: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  payIconBox: {
    width: '34@s', height: '34@s', borderRadius: '6@ms',
    backgroundColor: color.secondarylight,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EEE',
  },
  payMethod: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, textAlign: 'right' },
  payStatus: { fontSize: '11@ms', fontFamily: FONTS.Medium, marginTop: '2@vs' },

  // ── Order info ────────────────────────────────────────────────────────────
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: '9@vs' },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoLbl: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  infoValRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', flex: 1, justifyContent: 'flex-end' },
  infoVal: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, textAlign: 'right', flex: 1 },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: '16@s', paddingVertical: '12@vs',
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
    gap: '10@s', elevation: 10,
  },
  invoiceBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '6@s', paddingVertical: '11@vs',
    borderRadius: '8@ms', borderWidth: 1.5, borderColor: color.primary,
  },
  invoiceBtnTxt: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
  shopMoreBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: '11@vs', borderRadius: '8@ms',
    backgroundColor: color.primary,
  },
  shopMoreTxt: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#fff' },
  returnBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6@s',
    paddingVertical: '11@vs',
    borderRadius: '8@ms',
    backgroundColor: color.primary,
  },

  returnBtnTxt: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  payNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6@s',
    paddingVertical: '11@vs',
    borderRadius: '8@ms',
    backgroundColor: '#4CAF50',
  },
  payNowBtnTxt: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
})