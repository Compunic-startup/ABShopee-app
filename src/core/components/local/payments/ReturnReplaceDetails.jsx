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
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'

// ─── Dummy data (same shape as ReturnReplacementScreen) ──────────────────────
const DUMMY_DETAILS = {
  RET2024032801: {
    returnId: 'RET2024032801',
    orderId: 'ORD2024031501',
    type: 'return',
    status: 'approved',
    createdAt: '2024-03-28T10:30:00Z',
    item: {
      title: 'Samsung Galaxy Buds Pro 2',
      quantity: 1,
      price: 15999,
      image: null,
      attributes: [{ label: 'Color', displayValue: 'Bora Purple' }],
      itemType: 'physical',
    },
    reason: 'Product damaged',
    description: 'The charging case has a crack on the lid. The crack appeared right out of the box.',
    refundAmount: 15999,
    refundMethod: 'Original Payment Method',
    refundTimeline: '5-7 business days',
    pickupAddress: {
      name: 'Rahul Verma',
      phone: '+91 98765 43210',
      line1: '12, Shanti Nagar, Near Bus Stand',
      city: 'Raipur',
      state: 'Chhattisgarh',
      pincode: '492001',
    },
    pickupScheduled: '2024-04-01T10:00:00Z',
    timeline: [
      { status: 'requested', date: '2024-03-28T10:30:00Z', label: 'Return Requested', description: 'Your return request has been submitted successfully.' },
      { status: 'approved', date: '2024-03-28T14:15:00Z', label: 'Return Approved', description: 'Our team has reviewed and approved your return request.' },
      { status: 'pickup_scheduled', date: '2024-03-29T09:00:00Z', label: 'Pickup Scheduled', description: 'A pickup has been scheduled for your item.' },
    ],
  },
  REP2024032502: {
    returnId: 'REP2024032502',
    orderId: 'ORD2024031203',
    type: 'replacement',
    status: 'processing',
    createdAt: '2024-03-25T16:20:00Z',
    item: {
      title: 'Nike Air Max 270 Running Shoes',
      quantity: 1,
      price: 12995,
      image: null,
      attributes: [
        { label: 'Size', displayValue: 'UK 8 (Wrong)' },
        { label: 'Color', displayValue: 'Black/White' },
      ],
      itemType: 'physical',
    },
    reason: 'Wrong size delivered',
    description: 'Ordered UK 9 but received UK 8. The shoe is too tight and cannot be worn.',
    newItem: {
      title: 'Nike Air Max 270 Running Shoes',
      image: null,
      attributes: [
        { label: 'Size', displayValue: 'UK 9 (Correct)' },
        { label: 'Color', displayValue: 'Black/White' },
      ],
      estimatedDelivery: '2024-04-05T00:00:00Z',
      trackingId: 'BLUEDART4892011',
      carrier: 'Blue Dart',
      shipmentStatus: 'shipped',
    },
    pickupAddress: {
      name: 'Priya Sharma',
      phone: '+91 91234 56789',
      line1: 'Flat 4B, Sunshine Apartments, Civil Lines',
      city: 'Raipur',
      state: 'Chhattisgarh',
      pincode: '492001',
    },
    pickupScheduled: '2024-03-28T11:00:00Z',
    timeline: [
      { status: 'requested', date: '2024-03-25T16:20:00Z', label: 'Replacement Requested', description: 'Your replacement request has been submitted.' },
      { status: 'approved', date: '2024-03-25T19:45:00Z', label: 'Replacement Approved', description: 'Our team has approved your replacement request.' },
      { status: 'processing', date: '2024-03-26T09:00:00Z', label: 'Item Picked Up', description: 'The original item has been picked up from your address.' },
      { status: 'shipped', date: '2024-03-27T14:30:00Z', label: 'Replacement Dispatched', description: 'Your replacement item has been dispatched.' },
    ],
  },
}

// ─── Status config (mirrors ReturnReplacementScreen) ─────────────────────────
const getStatusConfig = status => {
  const map = {
    pending:          { color: color.secondary, bg: color.secondarylight,  icon: 'clock-outline',         label: 'Pending' },
    approved:         { color: color.primary,   bg: '#E8EDFF',              icon: 'check-circle-outline',  label: 'Approved' },
    rejected:         { color: '#C62828',        bg: '#FFEBEE',              icon: 'close-circle-outline',  label: 'Rejected' },
    processing:       { color: color.primary,   bg: '#E8EDFF',              icon: 'package-variant',       label: 'Processing' },
    completed:        { color: '#2E7D32',        bg: '#E8F5E9',              icon: 'check-all',             label: 'Completed' },
    cancelled:        { color: '#C62828',        bg: '#FFEBEE',              icon: 'cancel',                label: 'Cancelled' },
    pickup_scheduled: { color: '#E65100',        bg: '#FFF3E0',              icon: 'calendar-check-outline',label: 'Pickup Scheduled' },
    shipped:          { color: '#1565C0',        bg: '#E3F2FD',              icon: 'truck-fast-outline',    label: 'Shipped' },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'help-circle-outline', label: status,
  }
}

const getShipmentStatusConfig = status => {
  const map = {
    pending:    { color: '#E65100', bg: '#FFF3E0', icon: 'clock-outline',          label: 'Pending' },
    shipped:    { color: '#1565C0', bg: '#E3F2FD', icon: 'truck-fast-outline',     label: 'Shipped' },
    in_transit: { color: '#6A1B9A', bg: '#F3E5F5', icon: 'truck-delivery-outline', label: 'In Transit' },
    delivered:  { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle',           label: 'Delivered' },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'truck-outline', label: status || 'Unknown',
  }
}

// ─── Section Header (shared pattern) ─────────────────────────────────────────
const SectionHeader = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <Icon name={icon} size={ms(20)} color={color.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
)

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ReturnReplaceDetailsScreen() {
  const navigation = useNavigation()
  const { returnId } = useRoute().params

  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [fadeAnim]            = useState(new Animated.Value(0))

  useEffect(() => { fetchDetail() }, [])

  useEffect(() => {
    if (!loading && detail) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }, [loading, detail])

  const fetchDetail = async () => {
    try {
      // Replace with real API call when available:
      // const token = await AsyncStorage.getItem('userToken')
      // const businessId = await AsyncStorage.getItem('businessId')
      // const res = await fetch(`${BASE_URL}/customer/business/${businessId}/returns/${returnId}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // })
      // const json = await res.json()
      // setDetail(json?.data)
      await new Promise(resolve => setTimeout(resolve, 700))
      setDetail(DUMMY_DETAILS[returnId] ?? null)
    } catch (e) {
      ToastAndroid.show('Failed to load details', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
          <View style={{ width: ms(36) }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading request details…</Text>
        </View>
      </View>
    )
  }

  if (!detail) return null

  const isReturn         = detail.type === 'return'
  const statusConfig     = getStatusConfig(detail.status)
  const isCancellable    = ['pending'].includes(detail.status?.toLowerCase())
  const requestedDate    = new Date(detail.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const requestedTime    = new Date(detail.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })

  const newItem       = detail.newItem
  const shipConfig    = newItem ? getShipmentStatusConfig(newItem.shipmentStatus) : null
  const estDelivery   = newItem?.estimatedDelivery
    ? new Date(newItem.estimatedDelivery).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
      })
    : null
  const pickupDate    = detail.pickupScheduled
    ? new Date(detail.pickupScheduled).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: ms(36) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ═══════════════════════════════════════════════════════════
              1. STATUS CARD
          ══════════════════════════════════════════════════════════════ */}
          <View style={styles.statusCard}>
            <View style={styles.statusTop}>
              <View style={[styles.statusIconWrap, { backgroundColor: statusConfig.bg }]}>
                <Icon name={statusConfig.icon} size={ms(28)} color={statusConfig.color} />
              </View>
              <View style={{ flex: 1, marginLeft: ms(12) }}>
                <Text style={styles.statusMeta}>
                  {isReturn ? 'Return' : 'Replacement'} Request
                </Text>
                <Text style={[styles.statusValue, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
              <View style={[styles.typePill, {
                backgroundColor: isReturn ? '#FFF3E0' : '#E8EDFF',
              }]}>
                <Icon
                  name={isReturn ? 'keyboard-return' : 'swap-horizontal'}
                  size={ms(12)}
                  color={isReturn ? '#E65100' : color.primary}
                />
                <Text style={[styles.typePillText, { color: isReturn ? '#E65100' : color.primary }]}>
                  {isReturn ? 'Return' : 'Replacement'}
                </Text>
              </View>
            </View>

            {/* ID + Date row */}
            <View style={styles.idDateRow}>
              <View style={styles.idBox}>
                <Icon name="receipt" size={ms(14)} color="#888" />
                <Text style={styles.idText}>
                  #{returnId.slice(-10).toUpperCase()}
                </Text>
              </View>
              <View style={styles.idBox}>
                <Icon name="shopping-outline" size={ms(14)} color="#888" />
                <Text style={styles.idText}>
                  Order #{detail.orderId.slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Requested date/time */}
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Icon name="calendar-outline" size={ms(13)} color="#888" />
                <Text style={styles.dateTimeText}>{requestedDate}</Text>
              </View>
              <View style={styles.dateTimeDivider} />
              <View style={styles.dateTimeItem}>
                <Icon name="clock-outline" size={ms(13)} color="#888" />
                <Text style={styles.dateTimeText}>{requestedTime}</Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════
              2. ORIGINAL ITEM CARD
          ══════════════════════════════════════════════════════════════ */}
          <View style={styles.sectionCard}>
            <SectionHeader icon="cube-outline" title="Original Item" />

            <View style={styles.itemRow}>
              <View style={styles.itemThumb}>
                {detail.item?.image
                  ? <Image source={{ uri: detail.item.image }} style={styles.itemImage} />
                  : <Icon name="cube-outline" size={ms(28)} color={color.primary} />
                }
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemTitle} numberOfLines={2}>{detail.item?.title}</Text>

                {detail.item?.attributes?.length > 0 && (
                  <View style={styles.attrRow}>
                    {detail.item.attributes.map((a, i) => (
                      <View key={i} style={styles.attrChip}>
                        <Text style={styles.attrText}>{a.label}: {a.displayValue}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.itemFootRow}>
                  <View style={styles.qtyChip}>
                    <Text style={styles.qtyText}>Qty: {detail.item?.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{detail.item?.price?.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>

            {/* Reason block */}
            <View style={styles.reasonBlock}>
              <View style={styles.reasonHeader}>
                <Icon name="information-outline" size={ms(14)} color={color.primary} />
                <Text style={styles.reasonTitle}>Reason</Text>
              </View>
              <Text style={styles.reasonMain}>{detail.reason}</Text>
              {detail.description && (
                <Text style={styles.reasonDesc}>{detail.description}</Text>
              )}
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════
              3a. REPLACEMENT ITEM CARD (only for replacements)
          ══════════════════════════════════════════════════════════════ */}
          {!isReturn && newItem && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="swap-horizontal" title="Replacement Item" />

              {/* Shipment status pill */}
              {shipConfig && (
                <View style={[styles.shipStatusBanner, { backgroundColor: shipConfig.bg }]}>
                  <Icon name={shipConfig.icon} size={ms(16)} color={shipConfig.color} />
                  <Text style={[styles.shipStatusText, { color: shipConfig.color }]}>
                    {shipConfig.label}
                  </Text>
                </View>
              )}

              <View style={styles.itemRow}>
                <View style={styles.itemThumb}>
                  {newItem.image
                    ? <Image source={{ uri: newItem.image }} style={styles.itemImage} />
                    : <Icon name="cube-outline" size={ms(28)} color={color.primary} />
                  }
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{newItem.title}</Text>
                  {newItem.attributes?.length > 0 && (
                    <View style={styles.attrRow}>
                      {newItem.attributes.map((a, i) => (
                        <View key={i} style={[styles.attrChip, styles.attrChipNew]}>
                          <Text style={[styles.attrText, { color: color.primary }]}>
                            {a.label}: {a.displayValue}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.separator} />

              {/* Delivery details grid */}
              <View style={styles.deliveryGrid}>
                {/* Estimated delivery */}
                {estDelivery && (
                  <View style={styles.deliveryCell}>
                    <Icon name="calendar-clock" size={ms(18)} color={color.primary} />
                    <Text style={styles.deliveryCellLabel}>Estimated Delivery</Text>
                    <Text style={styles.deliveryCellValue}>{estDelivery}</Text>
                  </View>
                )}

                {/* Carrier */}
                {newItem.carrier && (
                  <View style={styles.deliveryCell}>
                    <Icon name="truck-outline" size={ms(18)} color={color.primary} />
                    <Text style={styles.deliveryCellLabel}>Carrier</Text>
                    <Text style={styles.deliveryCellValue}>{newItem.carrier}</Text>
                  </View>
                )}

                {/* Tracking ID */}
                {newItem.trackingId && (
                  <View style={[styles.deliveryCell, styles.deliveryCellFull]}>
                    <Icon name="barcode-scan" size={ms(18)} color={color.primary} />
                    <Text style={styles.deliveryCellLabel}>Tracking ID</Text>
                    <Text style={styles.deliveryCellValue}>{newItem.trackingId}</Text>
                  </View>
                )}
              </View>

              {newItem.trackingId && (
                <View style={styles.trackingNote}>
                  <Icon name="information-outline" size={ms(12)} color={color.primary} />
                  <Text style={styles.trackingNoteText}>
                    Use the tracking ID on {newItem.carrier}'s website to track your package
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════
              3b. REFUND DETAILS CARD (only for returns)
          ══════════════════════════════════════════════════════════════ */}
          {isReturn && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="cash-refund" title="Refund Details" />

              <View style={styles.refundAmountRow}>
                <Text style={styles.refundAmountLabel}>Refund Amount</Text>
                <Text style={styles.refundAmountValue}>
                  ₹{detail.refundAmount?.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.refundInfoGrid}>
                <View style={styles.refundInfoCell}>
                  <Icon name="credit-card-outline" size={ms(16)} color={color.primary} />
                  <Text style={styles.refundInfoLabel}>Method</Text>
                  <Text style={styles.refundInfoValue}>{detail.refundMethod}</Text>
                </View>
                {detail.refundTimeline && (
                  <View style={styles.refundInfoCell}>
                    <Icon name="clock-fast" size={ms(16)} color={color.primary} />
                    <Text style={styles.refundInfoLabel}>Timeline</Text>
                    <Text style={styles.refundInfoValue}>{detail.refundTimeline}</Text>
                  </View>
                )}
              </View>

              <View style={styles.refundNote}>
                <Icon name="shield-check-outline" size={ms(14)} color="#2E7D32" />
                <Text style={styles.refundNoteText}>
                  Refund will be initiated once the item is picked up and verified
                </Text>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════
              4. PICKUP ADDRESS CARD
          ══════════════════════════════════════════════════════════════ */}
          {detail.pickupAddress && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="map-marker-outline" title="Pickup Address" />

              <View style={styles.addressCard}>
                <Text style={styles.addressName}>{detail.pickupAddress.name}</Text>
                <Text style={styles.addressPhone}>{detail.pickupAddress.phone}</Text>
                <Text style={styles.addressLine}>{detail.pickupAddress.line1}</Text>
                <Text style={styles.addressLine}>
                  {detail.pickupAddress.city}, {detail.pickupAddress.state} – {detail.pickupAddress.pincode}
                </Text>
              </View>

              {pickupDate && (
                <View style={styles.pickupScheduleRow}>
                  <Icon name="calendar-check-outline" size={ms(16)} color="#E65100" />
                  <Text style={styles.pickupScheduleText}>
                    Pickup scheduled: <Text style={{ fontFamily: FONTS.Bold }}>{pickupDate}</Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════
              5. ORDER TIMELINE CARD
          ══════════════════════════════════════════════════════════════ */}
          {detail.timeline?.length > 0 && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="timeline-clock" title="Request Timeline" />

              {detail.timeline.map((step, idx) => {
                const stepConfig  = getStatusConfig(step.status)
                const stepDate    = new Date(step.date).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                const stepTime    = new Date(step.date).toLocaleTimeString('en-IN', {
                  hour: '2-digit', minute: '2-digit',
                })
                const isLast      = idx === detail.timeline.length - 1

                return (
                  <View key={idx} style={styles.timelineItem}>
                    {/* Dot + line column */}
                    <View style={styles.timelineDotCol}>
                      <View style={[
                        styles.timelineDot,
                        { backgroundColor: isLast ? stepConfig.color : '#D0D0D0' },
                      ]}>
                        <Icon name={stepConfig.icon} size={ms(10)} color="#fff" />
                      </View>
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>

                    {/* Content */}
                    <View style={styles.timelineContent}>
                      <Text style={[
                        styles.timelineLabel,
                        isLast && { color: stepConfig.color, fontFamily: FONTS.Bold },
                      ]}>
                        {step.label}
                      </Text>
                      {step.description && (
                        <Text style={styles.timelineDesc}>{step.description}</Text>
                      )}
                      <Text style={styles.timelineDate}>{stepDate} • {stepTime}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════
              6. HELP CARD
          ══════════════════════════════════════════════════════════════ */}
          <View style={styles.helpCard}>
            <Icon name="help-circle-outline" size={ms(22)} color={color.primary} />
            <View style={styles.helpTextWrap}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                Contact our support team for any queries about this {isReturn ? 'return' : 'replacement'}
              </Text>
            </View>
            <TouchableOpacity style={styles.helpBtn} activeOpacity={0.7}>
              <Icon name="message-text" size={ms(18)} color={color.primary} />
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Bottom action bar ── */}
      {isCancellable && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8}>
            <Icon name="close-circle-outline" size={ms(18)} color="#C62828" />
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // ── Header ──
  header: {
    backgroundColor: color.primary,
    paddingTop: '14@vs',
    paddingBottom: '14@vs',
    paddingHorizontal: '16@s',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: '36@s', height: '36@s',
    borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18@ms', fontFamily: FONTS.Bold,
    color: '#fff', letterSpacing: 0.2,
    flex: 1, textAlign: 'center',
  },

  scrollContent: { paddingBottom: '100@vs' },

  // ── Loader ──
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: '14@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // ── Status Card ──
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: '12@s', marginTop: '14@vs',
    padding: '14@s', borderRadius: '10@ms',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  statusTop: { flexDirection: 'row', alignItems: 'center', marginBottom: '12@vs' },
  statusIconWrap: {
    width: '52@s', height: '52@s', borderRadius: '26@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  statusMeta: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginBottom: '3@vs' },
  statusValue: { fontSize: '18@ms', fontFamily: FONTS.Bold },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    paddingHorizontal: '10@s', paddingVertical: '5@vs',
    borderRadius: '20@ms',
  },
  typePillText: { fontSize: '11@ms', fontFamily: FONTS.Bold },
  idDateRow: {
    flexDirection: 'row', gap: '8@s',
    backgroundColor: color.background,
    borderRadius: '6@ms', padding: '10@s',
    marginBottom: '10@vs',
  },
  idBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: '5@s',
  },
  idText: { fontSize: '11@ms', color: '#666', fontFamily: FONTS.Medium, flexShrink: 1 },
  dateTimeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '12@s',
  },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: '5@s' },
  dateTimeText: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium },
  dateTimeDivider: { width: 1, height: '14@vs', backgroundColor: '#E0E0E0' },

  // ── Section Card (shared) ──
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: '12@s', marginTop: '10@vs',
    padding: '14@s', borderRadius: '10@ms',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: '8@s', marginBottom: '12@vs',
  },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '10@vs' },

  // ── Item row (original + new) ──
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', marginBottom: '12@vs' },
  itemThumb: {
    width: '60@s', height: '60@s', borderRadius: '8@ms',
    backgroundColor: color.primary + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EEE',
  },
  itemImage: { width: '60@s', height: '60@s', borderRadius: '8@ms' },
  itemMeta: { flex: 1 },
  itemTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '19@ms' },
  attrRow: { flexDirection: 'row', flexWrap: 'wrap', gap: '5@s', marginTop: '5@vs' },
  attrChip: {
    backgroundColor: color.background,
    paddingHorizontal: '7@s', paddingVertical: '2@vs',
    borderRadius: '4@ms', borderWidth: 1, borderColor: '#E0E0E0',
  },
  attrChipNew: {
    backgroundColor: color.primary + '10',
    borderColor: color.primary + '40',
  },
  attrText: { fontSize: '10@ms', color: '#555', fontFamily: FONTS.Medium },
  itemFootRow: {
    flexDirection: 'row', alignItems: 'center', gap: '10@s', marginTop: '6@vs',
  },
  qtyChip: {
    backgroundColor: color.background,
    paddingHorizontal: '8@s', paddingVertical: '3@vs',
    borderRadius: '4@ms', borderWidth: 1, borderColor: '#E0E0E0',
  },
  qtyText: { fontSize: '11@ms', color: '#666', fontFamily: FONTS.Medium },
  itemPrice: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },

  // ── Reason block ──
  reasonBlock: {
    backgroundColor: color.background,
    borderRadius: '8@ms', padding: '10@s',
    borderLeftWidth: 3, borderLeftColor: color.primary,
  },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '4@vs' },
  reasonTitle: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },
  reasonMain: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '4@vs' },
  reasonDesc: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium, lineHeight: '17@ms' },

  // ── Shipment status banner ──
  shipStatusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    paddingHorizontal: '12@s', paddingVertical: '8@vs',
    borderRadius: '8@ms', marginBottom: '12@vs',
  },
  shipStatusText: { fontSize: '13@ms', fontFamily: FONTS.Bold },

  // ── Delivery grid ──
  deliveryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: '8@s', marginTop: '4@vs',
  },
  deliveryCell: {
    flex: 1, minWidth: '120@s',
    backgroundColor: color.background,
    borderRadius: '8@ms', padding: '10@s',
    borderWidth: 1, borderColor: '#EBEBEB',
    alignItems: 'flex-start', gap: '4@vs',
  },
  deliveryCellFull: { minWidth: '100%' },
  deliveryCellLabel: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium },
  deliveryCellValue: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  trackingNote: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: color.primary + '10',
    borderRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '7@vs',
    marginTop: '8@vs',
  },
  trackingNoteText: { fontSize: '11@ms', color: color.primary, fontFamily: FONTS.Medium, flex: 1 },

  // ── Refund details ──
  refundAmountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '12@vs',
  },
  refundAmountLabel: { fontSize: '14@ms', fontFamily: FONTS.Medium, color: '#666' },
  refundAmountValue: { fontSize: '22@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  refundInfoGrid: {
    flexDirection: 'row', gap: '8@s', marginBottom: '10@vs',
  },
  refundInfoCell: {
    flex: 1, backgroundColor: color.background,
    borderRadius: '8@ms', padding: '10@s',
    borderWidth: 1, borderColor: '#EBEBEB',
    gap: '3@vs',
  },
  refundInfoLabel: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium },
  refundInfoValue: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },
  refundNote: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: '#E8F5E9', borderRadius: '6@ms',
    paddingHorizontal: '10@s', paddingVertical: '8@vs',
  },
  refundNoteText: { fontSize: '11@ms', color: '#2E7D32', fontFamily: FONTS.Medium, flex: 1 },

  // ── Address card ──
  addressCard: {
    backgroundColor: color.background, borderRadius: '8@ms',
    padding: '12@s', marginBottom: '10@vs',
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  addressName: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '3@vs' },
  addressPhone: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium, marginBottom: '6@vs' },
  addressLine: { fontSize: '12@ms', color: '#555', fontFamily: FONTS.Medium, lineHeight: '17@ms' },
  pickupScheduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: '#FFF3E0', borderRadius: '6@ms',
    paddingHorizontal: '10@s', paddingVertical: '8@vs',
  },
  pickupScheduleText: { fontSize: '12@ms', color: '#E65100', fontFamily: FONTS.Medium, flex: 1 },

  // ── Timeline ──
  timelineItem: {
    flexDirection: 'row', gap: '12@s', marginBottom: '4@vs',
  },
  timelineDotCol: { alignItems: 'center', width: '24@s' },
  timelineDot: {
    width: '22@s', height: '22@s', borderRadius: '11@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: '#E0E0E0',
    marginTop: '3@vs', marginBottom: '3@vs',
    minHeight: '16@vs',
  },
  timelineContent: { flex: 1, paddingBottom: '12@vs' },
  timelineLabel: { fontSize: '13@ms', color: '#444', fontFamily: FONTS.Medium },
  timelineDesc: {
    fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium,
    lineHeight: '16@ms', marginTop: '3@vs',
  },
  timelineDate: { fontSize: '10@ms', color: '#BBB', fontFamily: FONTS.Medium, marginTop: '4@vs' },

  // ── Help card ──
  helpCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: '12@s', marginTop: '10@vs',
    padding: '14@s', borderRadius: '10@ms',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3,
    borderWidth: 1, borderColor: '#EBEBEB',
    gap: '10@s',
  },
  helpTextWrap: { flex: 1 },
  helpTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  helpText: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  helpBtn: {
    width: '36@s', height: '36@s', borderRadius: '18@ms',
    backgroundColor: color.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Bottom bar ──
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: '16@s', paddingVertical: '12@vs',
    paddingBottom: '24@vs',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 6,
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
  },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '8@s', paddingVertical: '12@vs', borderRadius: '8@ms',
    borderWidth: 1.5, borderColor: '#C62828',
  },
  cancelBtnText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#C62828' },
})