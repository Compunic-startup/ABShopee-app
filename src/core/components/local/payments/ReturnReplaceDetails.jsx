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
  Platform,
  ToastAndroid,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import BASE_URL from '../../../services/api'

// ─── Adapter: raw detail API response → component shape ──────────────────────
const adaptDetail = raw => ({
  returnId:        raw.returnId,
  orderId:         raw.orderId,
  type:            raw.type,
  status:          raw.status,
  workflowStatus:  raw.workflowStatus,
  createdAt:       raw.createdAt,
  updatedAt:       raw.updatedAt,

  reason:          raw.reason,
  reasonKey:       raw.reasonKey,
  description:     raw.description,

  item: {
    title:      raw.item?.title      || 'Product',
    image:      raw.item?.image      || null,
    price:      raw.item?.price      ?? null,
    quantity:   raw.item?.quantity   ?? 1,
    itemType:   raw.item?.itemType   || 'physical',
    attributes: raw.item?.attributes || [],
  },

  evidence:     raw.evidence || [],
  photos:       raw.photos   || [],

  refundAmount:   raw.refundAmount   ?? null,
  refundMethod:   raw.refundMethod   ?? null,
  refundTimeline: raw.refundTimeline ?? null,

  // courier info (flat on detail response)
  courier: raw.courier
    ? {
        trackingId:   raw.courier.trackingId   || null,
        courierName:  raw.courier.courierName  || null,
        courierDate:  raw.courier.courierDate  || null,
      }
    : null,

  pickupAddress:   raw.pickupAddress   || null,
  pickupScheduled: raw.pickupScheduled || null,

  newItem: raw.newItem
    ? {
        title:            raw.newItem.title            || 'Replacement Product',
        image:            raw.newItem.image            || null,
        attributes:       raw.newItem.attributes       || [],
        estimatedDelivery:raw.newItem.estimatedDelivery|| null,
        trackingId:       raw.newItem.trackingId       || null,
        carrier:          raw.newItem.carrier          || null,
        shipmentStatus:   raw.newItem.shipmentStatus   || null,
      }
    : null,

  timeline: raw.timeline || [],
})

// ─── Status config ────────────────────────────────────────────────────────────
const getStatusConfig = status => {
  const map = {
    pending:          { color: color.primary, bg: color.primary+20, icon: 'clock-outline',          label: 'Pending'          },
    submitted:        { color: color.primary, bg: color.primary+20, icon: 'clock-outline',          label: 'Pending'          },
    approved:         { color: color.primary,   bg: '#E8EDFF',             icon: 'check-circle-outline',   label: 'Approved'         },
    rejected:         { color: '#C62828',        bg: '#FFEBEE',             icon: 'close-circle-outline',   label: 'Rejected'         },
    processing:       { color: color.primary,   bg: '#E8EDFF',             icon: 'package-variant',        label: 'Processing'       },
    completed:        { color: '#2E7D32',        bg: '#E8F5E9',             icon: 'check-all',              label: 'Completed'        },
    cancelled:        { color: '#C62828',        bg: '#FFEBEE',             icon: 'cancel',                 label: 'Cancelled'        },
    pickup_scheduled: { color: '#E65100',        bg: '#FFF3E0',             icon: 'calendar-check-outline', label: 'Pickup Scheduled' },
    shipped:          { color: '#1565C0',        bg: '#E3F2FD',             icon: 'truck-fast-outline',     label: 'Shipped'          },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'help-circle-outline', label: status || 'Unknown',
  }
}

const getShipmentStatusConfig = status => {
  const map = {
    pending:    { color: '#E65100', bg: '#FFF3E0', icon: 'clock-outline',          label: 'Pending'    },
    shipped:    { color: '#1565C0', bg: '#E3F2FD', icon: 'truck-fast-outline',     label: 'Shipped'    },
    in_transit: { color: '#6A1B9A', bg: '#F3E5F5', icon: 'truck-delivery-outline', label: 'In Transit' },
    delivered:  { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle',           label: 'Delivered'  },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'truck-outline', label: status || 'Unknown',
  }
}

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <Icon name={icon} size={ms(20)} color={color.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
)

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReturnReplaceDetailsScreen() {
  const navigation         = useNavigation()
  const { returnId }       = useRoute().params

  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [fadeAnim]            = useState(new Animated.Value(0))

  useEffect(() => { fetchDetail() }, [])

  useEffect(() => {
    if (!loading && detail) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }, [loading, detail])

  const fetchDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      if (!token || !businessId) throw new Error('Missing auth credentials')

      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/returns/${returnId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

      const json = await res.json()

      if (!json.success) throw new Error(json.message || 'Failed to load details')

      setDetail(adaptDetail(json.data))
    } catch (e) {
      console.log('ReturnReplaceDetails fetch error:', e)
      setError('Failed to load request details.')
      ToastAndroid.show('Failed to load details', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ──
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

  // ── Error ──
  if (error || !detail) {
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
          <Icon name="alert-circle-outline" size={ms(48)} color="#C62828" />
          <Text style={styles.loadingText}>{error || 'Something went wrong.'}</Text>
          <TouchableOpacity onPress={fetchDetail} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Derived values ──
  const isReturn      = detail.type === 'return'
  const statusConfig  = getStatusConfig(detail.status)
  const isCancellable = ['pending', 'submitted'].includes(detail.status?.toLowerCase())

  const requestedDate = new Date(detail.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const requestedTime = new Date(detail.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })

  const newItem    = detail.newItem
  const shipConfig = newItem ? getShipmentStatusConfig(newItem.shipmentStatus) : null
  const estDelivery = newItem?.estimatedDelivery
    ? new Date(newItem.estimatedDelivery).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
      })
    : null
  const pickupDate = detail.pickupScheduled
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
              <View style={[styles.typePill, { backgroundColor: isReturn ? '#FFF3E0' : '#E8EDFF' }]}>
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

            {/* ID + Order row */}
            <View style={styles.idDateRow}>
              <View style={styles.idBox}>
                <Icon name="receipt" size={ms(14)} color="#888" />
                <Text style={styles.idText} numberOfLines={1}>
                  #{detail.returnId.slice(-10).toUpperCase()}
                </Text>
              </View>
              <View style={styles.idBox}>
                <Icon name="shopping-outline" size={ms(14)} color="#888" />
                <Text style={styles.idText} numberOfLines={1}>
                  Order #{detail.orderId.slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Date + Time */}
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
              2. ITEM CARD
          ══════════════════════════════════════════════════════════════ */}
          <View style={styles.sectionCard}>
            <SectionHeader icon="cube-outline" title="Item" />

            <View style={styles.itemRow}>
              <View style={styles.itemThumb}>
                {detail.item?.image
                  ? <Image source={{ uri: detail.item.image }} style={styles.itemImage} />
                  : <Icon
                      name={detail.item?.itemType === 'digital' ? 'download-box' : 'cube-outline'}
                      size={ms(28)}
                      color={color.primary}
                    />
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
                  {detail.item?.price != null && detail.item.price > 0 && (
                    <Text style={styles.itemPrice}>₹{detail.item.price.toLocaleString('en-IN')}</Text>
                  )}
                  {detail.item?.itemType === 'digital' && (
                    <View style={styles.digitalChip}>
                      <Icon name="download-box" size={ms(11)} color={color.primary} />
                      <Text style={styles.digitalChipText}>Digital</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Reason */}
            <View style={styles.reasonBlock}>
              <View style={styles.reasonHeader}>
                <Icon name="information-outline" size={ms(14)} color={color.primary} />
                <Text style={styles.reasonTitle}>Reason</Text>
              </View>
              <Text style={styles.reasonMain}>{detail.reason}</Text>
              {!!detail.description && (
                <Text style={styles.reasonDesc}>{detail.description}</Text>
              )}
            </View>

            {/* Photos / Evidence */}
            {detail.photos?.length > 0 && (
              <View style={styles.photosRow}>
                <View style={styles.photosHeader}>
                  <Icon name="image-multiple-outline" size={ms(14)} color={color.primary} />
                  <Text style={styles.photosLabel}>
                    {detail.photos.length} photo{detail.photos.length > 1 ? 's' : ''} attached
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: vs(8) }}>
                  {detail.photos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.photoThumb} />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* ═══════════════════════════════════════════════════════════
              3. REPLACEMENT ITEM CARD (replacements only)
          ══════════════════════════════════════════════════════════════ */}
          {!isReturn && newItem && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="swap-horizontal" title="Replacement Item" />

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

              <View style={styles.deliveryGrid}>
                {estDelivery && (
                  <View style={styles.deliveryCell}>
                    <Icon name="calendar-clock" size={ms(18)} color={color.primary} />
                    <Text style={styles.deliveryCellLabel}>Estimated Delivery</Text>
                    <Text style={styles.deliveryCellValue}>{estDelivery}</Text>
                  </View>
                )}
                {newItem.carrier && (
                  <View style={styles.deliveryCell}>
                    <Icon name="truck-outline" size={ms(18)} color={color.primary} />
                    <Text style={styles.deliveryCellLabel}>Carrier</Text>
                    <Text style={styles.deliveryCellValue}>{newItem.carrier}</Text>
                  </View>
                )}
                {newItem.trackingId && (
                  <View style={[styles.deliveryCell, styles.deliveryCellFull]}>
                    <Icon name="barcode-scan" size={ms(18)} color={color.primary} />
                    <Text style={styles.deliveryCellLabel}>Tracking ID</Text>
                    <Text style={styles.deliveryCellValue}>{newItem.trackingId}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════
              3b. COURIER CARD (when courier info exists on return/replacement)
          ══════════════════════════════════════════════════════════════ */}
          {detail.courier?.trackingId && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="truck-delivery-outline" title="Courier Info" />
              <View style={styles.deliveryGrid}>
                {detail.courier.courierName && (
                  <View style={styles.deliveryCell}>
                    <Icon name="truck-outline" size={ms(18)} color={color.primary} />
                    <Text style={styles.deliveryCellLabel}>Courier</Text>
                    <Text style={styles.deliveryCellValue}>{detail.courier.courierName}</Text>
                  </View>
                )}
                {detail.courier.courierDate && (
                  <View style={styles.deliveryCell}>
                    <Icon name="calendar-outline" size={ms(18)} color={color.primary} />
                    <Text style={styles.deliveryCellLabel}>Date</Text>
                    <Text style={styles.deliveryCellValue}>
                      {new Date(detail.courier.courierDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
                <View style={[styles.deliveryCell, styles.deliveryCellFull]}>
                  <Icon name="barcode-scan" size={ms(18)} color={color.primary} />
                  <Text style={styles.deliveryCellLabel}>Tracking ID</Text>
                  <Text style={styles.deliveryCellValue}>{detail.courier.trackingId}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════
              4. REFUND DETAILS (returns only)
          ══════════════════════════════════════════════════════════════ */}
          {isReturn && (detail.refundAmount != null || detail.refundMethod) && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="cash-refund" title="Refund Details" />

              {detail.refundAmount != null && (
                <View style={styles.refundAmountRow}>
                  <Text style={styles.refundAmountLabel}>Refund Amount</Text>
                  <Text style={styles.refundAmountValue}>
                    ₹{detail.refundAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              <View style={styles.refundInfoGrid}>
                {detail.refundMethod && (
                  <View style={styles.refundInfoCell}>
                    <Icon name="credit-card-outline" size={ms(16)} color={color.primary} />
                    <Text style={styles.refundInfoLabel}>Method</Text>
                    <Text style={styles.refundInfoValue}>{detail.refundMethod}</Text>
                  </View>
                )}
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
              5. PICKUP ADDRESS
          ══════════════════════════════════════════════════════════════ */}
          {detail.pickupAddress && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="map-marker-outline" title="Pickup Address" />
              <View style={styles.addressCard}>
                {detail.pickupAddress.name && (
                  <Text style={styles.addressName}>{detail.pickupAddress.name}</Text>
                )}
                {detail.pickupAddress.phone && (
                  <Text style={styles.addressPhone}>{detail.pickupAddress.phone}</Text>
                )}
                {detail.pickupAddress.line1 && (
                  <Text style={styles.addressLine}>{detail.pickupAddress.line1}</Text>
                )}
                {(detail.pickupAddress.city || detail.pickupAddress.state) && (
                  <Text style={styles.addressLine}>
                    {[detail.pickupAddress.city, detail.pickupAddress.state]
                      .filter(Boolean).join(', ')}
                    {detail.pickupAddress.pincode ? ` – ${detail.pickupAddress.pincode}` : ''}
                  </Text>
                )}
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
              6. TIMELINE
          ══════════════════════════════════════════════════════════════ */}
          {detail.timeline?.length > 0 && (
            <View style={styles.sectionCard}>
              <SectionHeader icon="timeline-clock" title="Request Timeline" />
              {detail.timeline.map((step, idx) => {
                const stepConfig = getStatusConfig(step.status)
                const stepDate   = new Date(step.date).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                const stepTime = new Date(step.date).toLocaleTimeString('en-IN', {
                  hour: '2-digit', minute: '2-digit',
                })
                const isLast = idx === detail.timeline.length - 1

                return (
                  <View key={idx} style={styles.timelineItem}>
                    <View style={styles.timelineDotCol}>
                      <View style={[
                        styles.timelineDot,
                        { backgroundColor: isLast ? stepConfig.color : '#D0D0D0' },
                      ]}>
                        <Icon name={stepConfig.icon} size={ms(10)} color="#fff" />
                      </View>
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[
                        styles.timelineLabel,
                        isLast && { color: stepConfig.color, fontFamily: FONTS.Bold },
                      ]}>
                        {step.label}
                      </Text>
                      {!!step.description && (
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
              7. HELP CARD
          ══════════════════════════════════════════════════════════════ */}
          <View style={styles.helpCard}>
            <Icon name="help-circle-outline" size={ms(22)} color={color.primary} />
            <View style={styles.helpTextWrap}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                Contact support for any queries about this {isReturn ? 'return' : 'replacement'}
              </Text>
            </View>
            <TouchableOpacity style={styles.helpBtn} activeOpacity={0.7}>
              <Icon name="message-text" size={ms(18)} color={color.primary} />
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  header: {
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
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
    width: '36@s', height: '36@s', borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18@ms', fontFamily: FONTS.Bold,
    color: '#fff', letterSpacing: 0.2,
    flex: 1, textAlign: 'center',
  },

  scrollContent: { paddingBottom: '100@vs' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: '12@vs' },
  loadingText: { fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },
  retryBtn: {
    marginTop: '8@vs', paddingHorizontal: '24@s', paddingVertical: '10@vs',
    borderRadius: '6@ms', borderWidth: 1.5, borderColor: color.primary,
  },
  retryBtnText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },

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
    paddingHorizontal: '10@s', paddingVertical: '5@vs', borderRadius: '20@ms',
  },
  typePillText: { fontSize: '11@ms', fontFamily: FONTS.Bold },
  idDateRow: {
    flexDirection: 'row', gap: '8@s',
    backgroundColor: color.background, borderRadius: '6@ms',
    padding: '10@s', marginBottom: '10@vs',
  },
  idBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: '5@s' },
  idText: { fontSize: '11@ms', color: '#666', fontFamily: FONTS.Medium, flexShrink: 1 },
  dateTimeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '12@s',
  },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: '5@s' },
  dateTimeText: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium },
  dateTimeDivider: { width: 1, height: '14@vs', backgroundColor: '#E0E0E0' },

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
    backgroundColor: color.primary + '10', borderColor: color.primary + '40',
  },
  attrText: { fontSize: '10@ms', color: '#555', fontFamily: FONTS.Medium },
  itemFootRow: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginTop: '6@vs' },
  qtyChip: {
    backgroundColor: color.background,
    paddingHorizontal: '8@s', paddingVertical: '3@vs',
    borderRadius: '4@ms', borderWidth: 1, borderColor: '#E0E0E0',
  },
  qtyText: { fontSize: '11@ms', color: '#666', fontFamily: FONTS.Medium },
  itemPrice: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  digitalChip: {
    flexDirection: 'row', alignItems: 'center', gap: '3@s',
    backgroundColor: color.primary + '15',
    paddingHorizontal: '7@s', paddingVertical: '3@vs',
    borderRadius: '4@ms',
  },
  digitalChipText: { fontSize: '10@ms', color: color.primary, fontFamily: FONTS.Medium },

  reasonBlock: {
    backgroundColor: color.background, borderRadius: '8@ms',
    padding: '10@s', borderLeftWidth: 3, borderLeftColor: color.primary,
  },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '4@vs' },
  reasonTitle: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },
  reasonMain: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '4@vs' },
  reasonDesc: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium, lineHeight: '17@ms' },

  photosRow: { marginTop: '10@vs' },
  photosHeader: { flexDirection: 'row', alignItems: 'center', gap: '6@s' },
  photosLabel: { fontSize: '12@ms', color: color.primary, fontFamily: FONTS.Medium },
  photoThumb: {
    width: '72@s', height: '72@s', borderRadius: '6@ms',
    marginRight: '8@s', backgroundColor: '#EEE',
  },

  shipStatusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    paddingHorizontal: '12@s', paddingVertical: '8@vs',
    borderRadius: '8@ms', marginBottom: '12@vs',
  },
  shipStatusText: { fontSize: '13@ms', fontFamily: FONTS.Bold },

  deliveryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: '8@s', marginTop: '4@vs' },
  deliveryCell: {
    flex: 1, minWidth: '120@s',
    backgroundColor: color.background, borderRadius: '8@ms',
    padding: '10@s', borderWidth: 1, borderColor: '#EBEBEB',
    alignItems: 'flex-start', gap: '4@vs',
  },
  deliveryCellFull: { minWidth: '100%' },
  deliveryCellLabel: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium },
  deliveryCellValue: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },

  refundAmountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '12@vs',
  },
  refundAmountLabel: { fontSize: '14@ms', fontFamily: FONTS.Medium, color: '#666' },
  refundAmountValue: { fontSize: '22@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  refundInfoGrid: { flexDirection: 'row', gap: '8@s', marginBottom: '10@vs' },
  refundInfoCell: {
    flex: 1, backgroundColor: color.background, borderRadius: '8@ms',
    padding: '10@s', borderWidth: 1, borderColor: '#EBEBEB', gap: '3@vs',
  },
  refundInfoLabel: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium },
  refundInfoValue: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },
  refundNote: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: '#E8F5E9', borderRadius: '6@ms',
    paddingHorizontal: '10@s', paddingVertical: '8@vs',
  },
  refundNoteText: { fontSize: '11@ms', color: '#2E7D32', fontFamily: FONTS.Medium, flex: 1 },

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

  timelineItem: { flexDirection: 'row', gap: '12@s', marginBottom: '4@vs' },
  timelineDotCol: { alignItems: 'center', width: '24@s' },
  timelineDot: {
    width: '22@s', height: '22@s', borderRadius: '11@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: '#E0E0E0',
    marginTop: '3@vs', marginBottom: '3@vs', minHeight: '16@vs',
  },
  timelineContent: { flex: 1, paddingBottom: '12@vs' },
  timelineLabel: { fontSize: '13@ms', color: '#444', fontFamily: FONTS.Medium },
  timelineDesc: {
    fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium,
    lineHeight: '16@ms', marginTop: '3@vs',
  },
  timelineDate: { fontSize: '10@ms', color: '#BBB', fontFamily: FONTS.Medium, marginTop: '4@vs' },

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

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: '16@s', paddingVertical: '12@vs', paddingBottom: '24@vs',
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