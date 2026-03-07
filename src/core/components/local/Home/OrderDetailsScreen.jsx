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
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import noimage from '../../../assets/images/Categories/preloader.gif'
import RNFS from 'react-native-fs'
import FileViewer from 'react-native-file-viewer'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Free Gift Badge ──────────────────────────────────────────────────────────
const FreeGiftBadge = () => (
  <View style={styles.freeGiftBadgeWrap}>
    <View style={styles.freeGiftBadge}>
      <Icon name="gift" size={11} color="#fff" />
      <Text style={styles.freeGiftBadgeText}>FREE GIFT</Text>
    </View>
  </View>
)

export default function OrderDetailsScreen() {
  const navigation = useNavigation()
  const { orderId } = useRoute().params

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [])

  useEffect(() => {
    if (!loading && order) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }
  }, [loading, order])

  const fetchOrder = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      console.log('Order details response:', json)
      setOrder(json?.data)
    } catch (e) {
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
      const url = `${BASE_URL}/customer/business/${businessId}/orders/${orderId}/invoice`
      const filePath = `${RNFS.DownloadDirectoryPath}/Invoice-${orderId}.pdf`
      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        headers: { Authorization: `Bearer ${token}` },
      }).promise
      if (result.statusCode === 200) {
        ToastAndroid.show('Invoice downloaded successfully', ToastAndroid.SHORT)
        await FileViewer.open(filePath)
      } else {
        ToastAndroid.show('Download failed', ToastAndroid.SHORT)
      }
    } catch (err) {
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT)
    } finally {
      setDownloading(false)
    }
  }

  const getStatusConfig = status => {
    const configs = {
      created: { color: '#FF9800', bgColor: '#FFF3E0', icon: 'clock-outline', label: 'Order Placed' },
      confirmed: { color: '#2196F3', bgColor: '#E3F2FD', icon: 'check-circle-outline', label: 'Confirmed' },
      fulfilled: { color: '#9C27B0', bgColor: '#F3E5F5', icon: 'package-variant', label: 'Processing' },
      completed: { color: '#4CAF50', bgColor: '#E8F5E9', icon: 'check-all', label: 'Completed' },
      cancelled: { color: '#F44336', bgColor: '#FFEBEE', icon: 'close-circle-outline', label: 'Cancelled' },
    }
    return configs[status?.toLowerCase()] || {
      color: '#757575', bgColor: '#F5F5F5', icon: 'help-circle-outline', label: status,
    }
  }

  const getShipmentStatusConfig = status => {
    const configs = {
      pending: { color: '#FF9800', bgColor: '#FFF3E0', icon: 'clock-outline', label: 'Pending' },
      shipped: { color: '#2196F3', bgColor: '#E3F2FD', icon: 'truck-fast-outline', label: 'Shipped' },
      in_transit: { color: '#9C27B0', bgColor: '#F3E5F5', icon: 'truck-delivery-outline', label: 'In Transit' },
      delivered: { color: '#4CAF50', bgColor: '#E8F5E9', icon: 'check-circle', label: 'Delivered' },
      returned: { color: '#F44336', bgColor: '#FFEBEE', icon: 'keyboard-return', label: 'Returned' },
    }
    return configs[status?.toLowerCase()] || {
      color: '#757575', bgColor: '#F5F5F5', icon: 'truck-outline', label: status || 'Unknown',
    }
  }

  // ─── Free gift separation logic ───────────────────────────────────────────
  const computeItemSections = () => {
    if (!order) return { regularItems: [], freeGiftItems: [] }
    const metaGifts = order.metadata?.freeGifts ?? []
    const allItems = order.items ?? []
    const giftItemIds = new Set(metaGifts.map(g => g.itemId))
    const itemsMap = new Map(allItems.map(i => [i.itemId, i]))
    const regularItems = allItems.filter(i => !giftItemIds.has(i.itemId))
    const freeGiftItems = metaGifts.map(gift => {
      const matched = itemsMap.get(gift.itemId)
      if (matched) return { ...matched, _isGift: true }
      return {
        itemId: gift.itemId,
        quantity: gift.quantity ?? 1,
        itemSnapshot: gift.itemSnapshot ?? gift,
        _isGift: true,
        _metaOnly: true,
      }
    })
    return { regularItems, freeGiftItems }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0B77A7" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    )
  }

  if (!order) return null

  const { regularItems, freeGiftItems } = computeItemSections()

  const addressData = order.addresses?.[0]?.addressSnapshot
  const contactData = order.addresses?.[0]?.contactSnapshot
  const latestEvent = order.events?.[order.events.length - 1]
  const currentStatus = latestEvent?.toStatus || order.status
  const statusConfig = getStatusConfig(currentStatus)
  const allItems = order.items ?? []
  const isDigital =
    allItems.length > 0 &&
    allItems.every(i => i.itemSnapshot?.itemType === 'digital')

  // ─── Shipment data (safe — no crash if absent) ────────────────────────────
  const shipments = Array.isArray(order.shipment) && order.shipment.length > 0
    ? order.shipment
    : null

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="share-variant" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Status Card ── */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.bgColor }]}>
                <Icon name={statusConfig.icon} size={32} color={statusConfig.color} />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>Order Status</Text>
                <Text style={[styles.statusValue, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>
            <View style={styles.orderIdContainer}>
              <Icon name="receipt" size={18} color="#666" />
              <Text style={styles.orderId}>Order ID: #{orderId.slice(0, 12)}</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Icon name="calendar-outline" size={16} color="#666" />
                <Text style={styles.dateTimeText}>{orderDate}</Text>
              </View>
              <View style={styles.dateTimeDivider} />
              <View style={styles.dateTimeItem}>
                <Icon name="clock-outline" size={16} color="#666" />
                <Text style={styles.dateTimeText}>{orderTime}</Text>
              </View>
            </View>
          </View>

          {/* ── Shipment Tracking Card (only renders if shipment data exists) ── */}
          {shipments && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="truck-delivery-outline" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>
                  Shipment{shipments.length > 1 ? 's' : ''} ({shipments.length})
                </Text>
              </View>

              {shipments.map((shipment, index) => {
                const shipConfig = getShipmentStatusConfig(shipment.status)
                const shippedOn = shipment.createdAt
                  ? new Date(shipment.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                  : null

                return (
                  <View key={shipment.id ?? index} style={styles.shipmentCard}>
                    {/* Top row: carrier + status pill */}
                    <View style={styles.shipmentTopRow}>
                      <View style={styles.shipmentCarrierRow}>
                        <View style={styles.shipmentCarrierIconWrap}>
                          <Icon name="truck-outline" size={20} color="#0B77A7" />
                        </View>
                        <View>
                          <Text style={styles.shipmentCarrierLabel}>Courier Partner</Text>
                          <Text style={styles.shipmentCarrierName}>
                            {shipment.carrier || 'N/A'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.shipmentStatusPill, { backgroundColor: shipConfig.bgColor }]}>
                        <Icon name={shipConfig.icon} size={12} color={shipConfig.color} />
                        <Text style={[styles.shipmentStatusText, { color: shipConfig.color }]}>
                          {shipConfig.label}
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.shipmentDivider} />

                    {/* Tracking ID row */}
                    <View style={styles.shipmentDetailRow}>
                      <Icon name="barcode-scan" size={16} color="#666" />
                      <Text style={styles.shipmentDetailLabel}>Tracking ID</Text>
                      <Text style={styles.shipmentDetailValue} numberOfLines={1}>
                        {shipment.trackingId || '—'}
                      </Text>
                    </View>

                    {/* Shipped on */}
                    {shippedOn && (
                      <View style={styles.shipmentDetailRow}>
                        <Icon name="calendar-check-outline" size={16} color="#666" />
                        <Text style={styles.shipmentDetailLabel}>Shipped On</Text>
                        <Text style={styles.shipmentDetailValue}>{shippedOn}</Text>
                      </View>
                    )}

                    {/* Info note */}
                    <View style={styles.shipmentNote}>
                      <Icon name="information-outline" size={13} color="#0B77A7" />
                      <Text style={styles.shipmentNoteText}>
                        Use the tracking ID on the courier's website to track your package
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* ── Regular Items Section ── */}
          {regularItems.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="package-variant" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Items ({regularItems.length})</Text>
              </View>

              {regularItems.map((item, index) => {
                const snapshot = item.itemSnapshot
                const pricingItems = order.pricing?.pricingSnapshot?.items ?? []
                const originalIndex = order.items.findIndex(i => i.itemId === item.itemId)

                return (
                  <View key={item.itemId + index} style={styles.itemCard}>
                    <Image
                      source={snapshot?.image ? { uri: snapshot.image } : noimage}
                      style={styles.itemImage}
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemTitle} numberOfLines={2}>{snapshot?.title}</Text>
                      <View style={styles.itemMetaRow}>
                        <View style={styles.qtyBadge}>
                          <Text style={styles.qtyText}>Qty: {item.quantity}</Text>
                        </View>
                        {snapshot?.itemType === 'digital' && (
                          <View style={styles.digitalBadge}>
                            <Icon name="download" size={10} color="#1976D2" />
                            <Text style={styles.digitalText}>Digital</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.itemPrice}>
                        ₹{(pricingItems[originalIndex]?.finalLineTotal || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* ── Free Gift Section ── */}
          {freeGiftItems.length > 0 && (
            <View style={styles.freeGiftSection}>
              <View style={styles.freeGiftSectionHeader}>
                <View style={styles.freeGiftHeaderLeft}>
                  <Icon name="gift-open" size={20} color="#0b81b8" />
                  <Text style={styles.freeGiftSectionTitle}>
                    Free Gift{freeGiftItems.length > 1 ? 's' : ''} Included
                  </Text>
                </View>
                <View style={styles.freeGiftCountPill}>
                  <Text style={styles.freeGiftCountText}>{freeGiftItems.length}</Text>
                </View>
              </View>

              {freeGiftItems.map((item, index) => {
                const snapshot = item.itemSnapshot
                return (
                  <View key={item.itemId + index} style={styles.freeGiftCard}>
                    <View style={styles.freeGiftTopAccent} />
                    <View style={styles.freeGiftCardInner}>
                      <View style={styles.freeGiftImageWrap}>
                        <Image
                          source={snapshot?.image ? { uri: snapshot.image } : noimage}
                          style={styles.freeGiftImage}
                        />
                        <FreeGiftBadge />
                      </View>
                      <View style={styles.freeGiftDetails}>
                        <Text style={styles.freeGiftTitle} numberOfLines={2}>
                          {snapshot?.title || 'Surprise Gift'}
                        </Text>
                        {snapshot?.description && (
                          <Text style={styles.freeGiftDesc} numberOfLines={1}>
                            {snapshot.description}
                          </Text>
                        )}
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
                    <View style={styles.freeGiftNote}>
                      <Icon name="information-outline" size={13} color="#0b81b8" />
                      <Text style={styles.freeGiftNoteText}>
                        This item was added as a free gift with your order
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* ── Price Summary ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="calculator" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Price Summary</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₹{order.pricing?.pricingSnapshot?.subtotal}</Text>
            </View>
            {order.pricing?.pricingSnapshot?.discountTotal > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={[styles.priceValue, { color: '#4CAF50' }]}>
                  - ₹{order.pricing.pricingSnapshot.discountTotal}
                </Text>
              </View>
            )}
            {freeGiftItems.length > 0 && (
              <View style={styles.priceRow}>
                <View style={styles.priceDiscountLabel}>
                  <Icon name="gift" size={13} color="#0b81b8" />
                  <Text style={[styles.priceLabel, { color: '#0b81b8', marginLeft: 5 }]}>
                    Free Gift{freeGiftItems.length > 1 ? 's' : ''} ({freeGiftItems.length})
                  </Text>
                </View>
                <Text style={[styles.priceValue, { color: '#0b81b8', fontFamily: FONTS.Bold }]}>FREE</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charges</Text>
              <Text style={[styles.priceValue, { color: '#4CAF50' }]}>FREE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{order.pricing?.pricingSnapshot?.total}</Text>
            </View>
          </View>

          {/* ── Payment Info ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="credit-card-outline" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Payment Information</Text>
            </View>
            {order.payment?.map((pay, index) => (
              <View key={index} style={styles.paymentInfoCard}>
                <View style={styles.paymentRow}>
                  <Icon name={pay.provider === 'razorpay' ? 'cellphone' : 'cash'} size={22} color="#0B77A7" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.paymentMethod}>{pay.method?.toUpperCase()}</Text>
                    <Text style={[styles.paymentStatus, {
                      color: pay.status === 'captured' || pay.status === 'success' ? '#4CAF50' : '#FF9800',
                    }]}>
                      {pay.status?.toUpperCase()}
                    </Text>
                    <Text style={styles.paymentMeta}>Amount: ₹{parseFloat(pay.amount).toFixed(2)}</Text>
                    <Text style={styles.paymentMeta}>Currency: {pay.currency}</Text>
                    <Text style={styles.paymentMeta}>
                      Paid On: {new Date(pay.createdAt).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ── Delivery Address ── */}
          {!isDigital && addressData && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="map-marker" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>
              <View style={styles.addressCard}>
                <Text style={styles.addressName}>{contactData?.name}</Text>
                <Text style={styles.addressPhone}>{contactData?.phone}</Text>
                <Text style={styles.addressText}>{addressData?.line1}</Text>
                <Text style={styles.addressText}>
                  {addressData?.city}, {addressData?.state} - {addressData?.pincode}
                </Text>
                <Text style={styles.addressText}>{addressData?.country}</Text>
              </View>
              <View style={styles.deliveryInfoBox}>
                <Icon name="truck-fast" size={20} color="#4CAF50" />
                <Text style={styles.deliveryInfoText}>Expected delivery in 3-5 business days</Text>
              </View>
            </View>
          )}

          {/* ── Digital Delivery ── */}
          {isDigital && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="download-circle" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Digital Delivery</Text>
              </View>
              <View style={styles.digitalDeliveryCard}>
                <Icon name="email-check" size={32} color="#1976D2" />
                <Text style={styles.digitalDeliveryTitle}>Delivered to Email</Text>
                <Text style={styles.digitalDeliveryText}>
                  Your digital products have been sent to your registered email address.
                  Check your inbox for download links.
                </Text>
              </View>
            </View>
          )}

          {/* ── Order Timeline ── */}
          {order.events?.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="timeline-clock" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Order Timeline</Text>
              </View>
              {order.events.map((event, index) => {
                const eventConfig = getStatusConfig(event.toStatus)
                const eventDate = new Date(event.createdAt).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })
                return (
                  <View key={index} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: eventConfig.color }]}>
                      <Icon name={eventConfig.icon} size={12} color="#fff" />
                    </View>
                    {index < order.events.length - 1 && <View style={styles.timelineLine} />}
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>{eventConfig.label}</Text>
                      <Text style={styles.timelineDate}>{eventDate}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* ── Help Card ── */}
          <View style={styles.helpCard}>
            <Icon name="help-circle-outline" size={24} color="#0B77A7" />
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                Contact our support team for any queries about your order
              </Text>
            </View>
            <TouchableOpacity style={styles.helpBtn}>
              <Icon name="message-text" size={20} color="#0B77A7" />
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Floating Invoice Button ── */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.floatingBtn}
          activeOpacity={0.8}
          onPress={downloadInvoice}
          disabled={downloading}
        >
          {downloading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Icon name="file-download-outline" size={22} color="#fff" />}
          <Text style={styles.floatingText}>
            {downloading ? 'Downloading...' : 'Download Invoice'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: '16@s', paddingVertical: '12@vs', backgroundColor: '#0B77A7',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  backBtn: { width: '40@s', height: '40@s', borderRadius: '20@s', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff', flex: 1, textAlign: 'center' },
  headerBtn: { width: '40@s', height: '40@s', borderRadius: '20@s', justifyContent: 'center', alignItems: 'center' },

  // ── Status Card ──
  statusCard: {
    backgroundColor: '#fff', marginHorizontal: '16@s', marginTop: '16@vs',
    padding: '16@s', borderRadius: '16@ms', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '16@vs' },
  statusIconContainer: {
    width: '56@s', height: '56@s', borderRadius: '28@s',
    justifyContent: 'center', alignItems: 'center', marginRight: '12@s',
  },
  statusTextContainer: { flex: 1 },
  statusLabel: { fontSize: '12@ms', color: '#666', marginBottom: '4@vs' },
  statusValue: { fontSize: '18@ms', fontFamily: FONTS.Bold },
  orderIdContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA',
    padding: '10@s', borderRadius: '8@ms', marginBottom: '12@vs', gap: '8@s',
  },
  orderId: { fontSize: '13@ms', color: '#666', fontFamily: FONTS.Medium },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '12@s' },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: '6@s' },
  dateTimeText: { fontSize: '13@ms', color: '#666', fontFamily: FONTS.Medium },
  dateTimeDivider: { width: 1, height: '14@vs', backgroundColor: '#E0E0E0' },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: '#fff', marginHorizontal: '16@s', marginTop: '12@vs',
    padding: '16@s', borderRadius: '16@ms', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '16@vs', gap: '10@s' },
  sectionTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },

  // ── Shipment Card ──
  shipmentCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: '12@ms',
    borderWidth: 1,
    borderColor: '#BBDEFB',
    marginBottom: '10@vs',
    overflow: 'hidden',
  },
  shipmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14@s',
  },
  shipmentCarrierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@s',
  },
  shipmentCarrierIconWrap: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipmentCarrierLabel: {
    fontSize: '11@ms',
    color: '#888',
    fontFamily: FONTS.Medium,
    marginBottom: '2@vs',
  },
  shipmentCarrierName: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
  },
  shipmentStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    paddingHorizontal: '10@s',
    paddingVertical: '5@vs',
    borderRadius: '20@ms',
  },
  shipmentStatusText: {
    fontSize: '11@ms',
    fontFamily: FONTS.Bold,
  },
  shipmentDivider: {
    height: 1,
    backgroundColor: '#BBDEFB',
    marginHorizontal: '14@s',
  },
  shipmentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    paddingHorizontal: '14@s',
    paddingVertical: '9@vs',
  },
  shipmentDetailLabel: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
    width: '80@s',
  },
  shipmentDetailValue: {
    flex: 1,
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
  },
  shipmentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    backgroundColor: '#DDEEFF',
    paddingHorizontal: '14@s',
    paddingVertical: '8@vs',
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
  },
  shipmentNoteText: {
    flex: 1,
    fontSize: '11@ms',
    color: '#0B77A7',
    fontFamily: FONTS.Medium,
  },

  // ── Item Card ──
  itemCard: {
    flexDirection: 'row', backgroundColor: '#F8F9FA', padding: '12@s',
    borderRadius: '12@ms', marginBottom: '12@vs',
  },
  itemImage: { width: '70@s', height: '70@s', borderRadius: '10@ms', marginRight: '12@s', backgroundColor: '#E0E0E0' },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '6@vs' },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginBottom: '4@vs' },
  qtyBadge: { flexDirection: 'row', alignItems: 'center', gap: '4@s' },
  qtyText: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium },
  digitalBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    paddingHorizontal: '6@s', paddingVertical: '2@vs', borderRadius: '8@ms', gap: '3@s',
  },
  digitalText: { fontSize: '10@ms', color: '#1976D2', fontFamily: FONTS.Bold },
  itemPrice: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },

  // ── Free Gift Section ──
  freeGiftSection: { marginHorizontal: '16@s', marginTop: '12@vs' },
  freeGiftSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '10@vs', paddingHorizontal: '2@s',
  },
  freeGiftHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  freeGiftSectionTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#00457a', letterSpacing: 0.3 },
  freeGiftCountPill: {
    backgroundColor: '#cdd4ff', borderRadius: '10@ms',
    paddingHorizontal: '8@s', paddingVertical: '2@vs',
    borderWidth: 1, borderColor: '#1756d4',
  },
  freeGiftCountText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#0b81b8' },
  freeGiftCard: {
    backgroundColor: '#f5fdff', borderRadius: '14@ms',
    borderWidth: 1.5, borderColor: '#1756d4', overflow: 'hidden', marginBottom: '10@vs',
    elevation: 3, shadowColor: '#1756d4', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 8,
  },
  freeGiftTopAccent: { height: '3@vs', backgroundColor: '#1756d4' },
  freeGiftCardInner: { flexDirection: 'row', padding: '14@s', gap: '12@s' },
  freeGiftImageWrap: {
    position: 'relative', width: '80@s', height: '80@s', borderRadius: '10@ms',
    backgroundColor: '#e1eeff', borderWidth: 1, borderColor: '#70a7f0',
  },
  freeGiftImage: { width: '100%', height: '100%', borderRadius: '10@ms', resizeMode: 'contain' },
  freeGiftBadgeWrap: {
    position: 'absolute', bottom: '-1@vs', left: '-1@s', right: '-1@s', alignItems: 'center',
  },
  freeGiftBadge: {
    flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: '#0a69c8',
    paddingHorizontal: '6@s', paddingVertical: '3@vs', borderRadius: '6@ms',
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },
  freeGiftBadgeText: { fontSize: '8@ms', fontFamily: FONTS.Bold, color: '#fff', letterSpacing: 0.5 },
  freeGiftDetails: { flex: 1, justifyContent: 'space-between' },
  freeGiftTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#00223d', marginBottom: '4@vs', lineHeight: '20@vs' },
  freeGiftDesc: { fontSize: '12@ms', color: '#557d8b', marginBottom: '8@vs' },
  freeGiftFooter: { flexDirection: 'row', alignItems: 'center', gap: '8@s', flexWrap: 'wrap' },
  freeGiftQtyPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: '#cde6ff',
    borderRadius: '8@ms', paddingHorizontal: '8@s', paddingVertical: '3@vs',
    borderWidth: 1, borderColor: '#7090f0',
  },
  freeGiftQtyText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#0b81b8' },
  complimentaryPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: '#0a69c8',
    borderRadius: '8@ms', paddingHorizontal: '8@s', paddingVertical: '3@vs',
  },
  complimentaryText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#fff', letterSpacing: 0.3 },
  freeGiftNote: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s', backgroundColor: '#dcefff',
    paddingHorizontal: '14@s', paddingVertical: '8@vs',
    borderTopWidth: 1, borderTopColor: '#928aed',
  },
  freeGiftNoteText: { fontSize: '11@ms', color: '#0a20c8', fontFamily: FONTS.Medium, flex: 1 },

  // ── Price Summary ──
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12@vs' },
  priceLabel: { fontSize: '14@ms', color: '#666' },
  priceValue: { fontSize: '14@ms', fontFamily: FONTS.Medium, color: '#1a1a1a' },
  priceDiscountLabel: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: '12@vs' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  totalValue: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },

  // ── Payment ──
  paymentInfoCard: { backgroundColor: '#F8F9FA', padding: '14@s', borderRadius: '12@ms' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: '12@s' },
  paymentMethod: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  paymentStatus: { fontSize: '12@ms', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  paymentMeta: { fontSize: '12@ms', color: '#666', marginTop: '2@vs' },

  // ── Address ──
  addressCard: { backgroundColor: '#F8F9FA', padding: '14@s', borderRadius: '12@ms', marginBottom: '12@vs' },
  addressName: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '4@vs' },
  addressPhone: { fontSize: '13@ms', color: '#666', marginBottom: '8@vs' },
  addressText: { fontSize: '13@ms', color: '#555', lineHeight: '20@vs' },
  deliveryInfoBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F8F4',
    padding: '12@s', borderRadius: '10@ms', gap: '10@s',
  },
  deliveryInfoText: { flex: 1, fontSize: '13@ms', color: '#4CAF50', fontFamily: FONTS.Medium },

  // ── Digital Delivery ──
  digitalDeliveryCard: { alignItems: 'center', padding: '20@s', backgroundColor: '#F8F9FA', borderRadius: '12@ms' },
  digitalDeliveryTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginTop: '12@vs', marginBottom: '6@vs' },
  digitalDeliveryText: { fontSize: '13@ms', color: '#666', textAlign: 'center', lineHeight: '20@vs' },

  // ── Timeline ──
  timelineItem: { flexDirection: 'row', marginBottom: '16@vs', position: 'relative' },
  timelineDot: {
    width: '24@s', height: '24@s', borderRadius: '12@s',
    justifyContent: 'center', alignItems: 'center', marginRight: '12@s', zIndex: 2,
  },
  timelineLine: {
    position: 'absolute', left: '12@s', top: '24@vs', bottom: '-16@vs',
    width: 2, backgroundColor: '#E0E0E0',
  },
  timelineContent: { flex: 1, paddingTop: '2@vs' },
  timelineTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '2@vs' },
  timelineDate: { fontSize: '12@ms', color: '#666' },

  // ── Help Card ──
  helpCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    marginHorizontal: '16@s', marginTop: '12@vs', padding: '16@s',
    borderRadius: '12@ms', gap: '12@s',
  },
  helpTextContainer: { flex: 1 },
  helpTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '2@vs' },
  helpText: { fontSize: '12@ms', color: '#666' },
  helpBtn: {
    width: '40@s', height: '40@s', borderRadius: '20@s', backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', elevation: 2,
  },

  // ── Floating Button ──
  floatingContainer: { position: 'absolute', bottom: '20@vs', left: '16@s', right: '16@s' },
  floatingBtn: {
    flexDirection: 'row', backgroundColor: '#0B77A7', paddingVertical: '14@vs',
    paddingHorizontal: '24@s', borderRadius: '30@ms', alignItems: 'center',
    justifyContent: 'center', gap: '8@s', elevation: 6,
    shadowColor: '#0B77A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  floatingText: { color: '#fff', fontSize: '15@ms', fontFamily: FONTS.Bold },

  // ── Loader ──
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: '16@vs', fontSize: '14@ms', color: '#666', fontFamily: FONTS.Medium },
})