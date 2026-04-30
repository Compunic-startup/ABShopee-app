import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Platform,
  Linking,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'

// Reason key -> human-readable label
const REASON_LABELS = {
  changed_mind: 'Changed my mind',
  wrong_item: 'Ordered wrong item',
  found_better_price: 'Found better price',
  delivery_too_long: 'Delivery too long',
  duplicate_order: 'Duplicate order',
  other: 'Other reason',
}

// Status config
const getStatusConfig = status => {
  const map = {
    pending: { color: color.WHITE, bg: color.primary, icon: 'clock-outline', label: 'Pending' },
    approved: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle-outline', label: 'Approved' },
    rejected: { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Rejected' },
    processing: { color: color.primary, bg: '#E8EDFF', icon: 'package-variant', label: 'Processing' },
    completed: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-all', label: 'Completed' },
  }
  return map[status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'help-circle-outline', label: status,
  }
}

// Section wrapper
function Section({ icon, title, children, style }) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIconWrap}>
          <Icon name={icon} size={ms(16)} color={color.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

// Main Screen
export default function CancellationDetailsScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { cancellationId } = route.params

  const [cancellation, setCancellation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCancellationDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      if (!token || !businessId) throw new Error('Missing auth credentials')

      const response = await fetch(
        `${BASE_URL}/customer/business/${businessId}/cancellations/${cancellationId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const json = await response.json()
      console.log('Cancellation details response:', json)

      if (!json.success) throw new Error(json.message || 'Failed to fetch cancellation details')

      setCancellation(json.data)
    } catch (e) {
      console.log('Cancellation details fetch error', e)
      setError(e.message || 'Failed to load cancellation details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCancellationDetails()
  }, [cancellationId])

  const formatDate = (dateString) => {
    if (!dateString) return '--'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancellation Details</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loaderText}>Loading details...</Text>
        </View>
      </View>
    )
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancellation Details</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.errorState}>
          <Icon name="alert-circle-outline" size={ms(48)} color="#C62828" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCancellationDetails}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!cancellation) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancellation Details</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.errorState}>
          <Icon name="help-circle-outline" size={ms(48)} color="#BDBDBD" />
          <Text style={styles.errorTitle}>Not Found</Text>
          <Text style={styles.errorText}>Cancellation request not found</Text>
        </View>
      </View>
    )
  }

  const statusConfig = getStatusConfig(cancellation.status)
  const item = cancellation.item || {}
  const reasonLabel = REASON_LABELS[cancellation.reasonKey] || cancellation.reason

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancellation Details</Text>
        <View style={{ width: s(36) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconWrap}>
              <Icon name="cancel" size={ms(24)} color="#E65100" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Cancellation Request</Text>
              <Text style={styles.statusId}>ID: #{cancellationId?.slice(-8).toUpperCase()}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
            <Icon name={statusConfig.icon} size={ms(12)} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Item Details */}
        <Section icon="package-variant" title="Item Details">
          <View style={styles.itemCard}>
            <Image
              source={item.image ? { uri: item.image } : noimage}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title || 'Product'}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemMetaText}>Quantity: {item.quantity || 1}</Text>
                {item.itemType === 'digital' && (
                  <Text style={styles.itemMetaText}>Digital Product</Text>
                )}
                {item.price && (
                  <Text style={styles.itemPrice}>
                    Rs. {(item.price * (item.quantity || 1)).toLocaleString('en-IN')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Section>

        {/* Cancellation Reason */}
        <Section icon="comment-question-outline" title="Cancellation Reason">
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <Icon name="information-outline" size={ms(16)} color={color.text} />
              <Text style={styles.reasonTitle}>{reasonLabel}</Text>
            </View>
            {cancellation.description && (
              <Text style={styles.reasonDescription}>{cancellation.description}</Text>
            )}
          </View>
        </Section>

        {/* Refund Information */}
        {cancellation.refundAmount && (
          <Section icon="cash-refund" title="Refund Information">
            <View style={styles.refundCard}>
              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Refund Amount</Text>
                <Text style={styles.refundAmount}>Rs. {cancellation.refundAmount.toLocaleString('en-IN')}</Text>
              </View>
              {cancellation.refundMethod && (
                <View style={styles.refundRow}>
                  <Text style={styles.refundLabel}>Refund Method</Text>
                  <Text style={styles.refundMethod}>{cancellation.refundMethod}</Text>
                </View>
              )}
            </View>
          </Section>
        )}

        {/* Timeline */}
        <Section icon="timeline" title="Timeline">
          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineDot}>
                <Icon name="check-circle" size={ms(12)} color={color.primary} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Request Submitted</Text>
                <Text style={styles.timelineDate}>{formatDate(cancellation.createdAt)}</Text>
              </View>
            </View>
            
            {cancellation.updatedAt && cancellation.updatedAt !== cancellation.createdAt && (
              <View style={styles.timelineRow}>
                <View style={styles.timelineDot}>
                  <Icon name="update" size={ms(12)} color={color.primary} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Last Updated</Text>
                  <Text style={styles.timelineDate}>{formatDate(cancellation.updatedAt)}</Text>
                </View>
              </View>
            )}

            {cancellation.status === 'approved' && (
              <View style={styles.timelineRow}>
                <View style={styles.timelineDot}>
                  <Icon name="check-circle-outline" size={ms(12)} color="#2E7D32" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Request Approved</Text>
                  <Text style={styles.timelineDate}>{formatDate(cancellation.updatedAt)}</Text>
                </View>
              </View>
            )}

            {cancellation.status === 'rejected' && (
              <View style={styles.timelineRow}>
                <View style={styles.timelineDot}>
                  <Icon name="close-circle-outline" size={ms(12)} color="#C62828" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Request Rejected</Text>
                  <Text style={styles.timelineDate}>{formatDate(cancellation.updatedAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </Section>

        {/* Important Notes */}
        <Section icon="information-circle-outline" title="Important Information">
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {'\u2022'} Cancellation is only available for physical items that haven't been shipped{'\n'}
              {'\u2022'} Once approved, refunds are processed to your original payment method{'\n'}
              {'\u2022'} Refund processing time may vary (typically 5-7 business days){'\n'}
              {'\u2022'} You will receive email updates about your cancellation status{'\n'}
              {'\u2022'} For urgent queries, contact our customer support team
            </Text>
          </View>
        </Section>

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            If you have any questions about this cancellation, our support team is here to help.
          </Text>
          <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('mailto:support@abshopee.com')}>
            <Icon name="email-outline" size={ms(16)} color="#fff" />
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

// Styles
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // Header
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
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    letterSpacing: 0.2,
    flex: 1,
    textAlign: 'center',
  },
  backBtn: {
    width: '36@s', height: '36@s',
    borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },

  // Content
  scroll: { paddingHorizontal: '16@s', paddingBottom: '32@vs' },

  // Status Card
  statusCard: {
    backgroundColor: '#fff', borderRadius: '12@ms',
    padding: '16@s', marginTop: '16@vs', marginBottom: '20@vs',
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '12@vs' },
  statusIconWrap: {
    width: '48@ms', height: '48@ms', borderRadius: '24@ms',
    backgroundColor: '#E6510020', justifyContent: 'center', alignItems: 'center',
  },
  statusInfo: { flex: 1, marginLeft: '12@s' },
  statusTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text },
  statusId: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    paddingHorizontal: '12@s', paddingVertical: '6@vs',
    borderRadius: '20@ms', alignSelf: 'flex-start',
  },
  statusText: { fontSize: '12@ms', fontFamily: FONTS.Bold },

  // Section
  section: { marginBottom: '20@vs' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: '12@vs' },
  sectionIconWrap: {
    width: '28@ms', height: '28@ms', borderRadius: '14@ms',
    backgroundColor: color.primary + '15', justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginLeft: '10@s' },

  // Item Card
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: '8@ms', padding: '12@s' },
  itemImage: {
    width: '60@s', height: '60@s', borderRadius: '6@ms',
    backgroundColor: color.primary + '20',
  },
  itemInfo: { flex: 1, marginLeft: '12@s' },
  itemTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '6@vs' },
  itemMeta: { gap: '4@vs' },
  itemMetaText: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },
  itemPrice: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.primary },

  // Reason Card
  reasonCard: { backgroundColor: '#fff', borderRadius: '8@ms', padding: '14@s' },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '8@vs' },
  reasonTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginLeft: '8@s' },
  reasonDescription: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium, lineHeight: '18@vs' },

  // Refund Card
  refundCard: { backgroundColor: '#fff', borderRadius: '8@ms', padding: '14@s' },
  refundRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: '6@vs' },
  refundLabel: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888' },
  refundAmount: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  refundMethod: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },

  // Timeline
  timelineCard: { backgroundColor: '#fff', borderRadius: '8@ms', padding: '14@s' },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', marginBottom: '12@vs' },
  timelineDot: {
    width: '24@ms', height: '24@ms', borderRadius: '12@ms',
    backgroundColor: color.primary + '15', justifyContent: 'center', alignItems: 'center',
  },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text },
  timelineDate: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },

  // Info Card
  infoCard: { backgroundColor: '#fff', borderRadius: '8@ms', padding: '14@s' },
  infoText: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium, lineHeight: '18@vs' },

  // Support Section
  supportSection: {
    backgroundColor: '#fff', borderRadius: '12@ms',
    padding: '16@s', marginTop: '20@vs', marginBottom: '20@vs',
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  supportTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs' },
  supportText: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium, lineHeight: '18@vs', marginBottom: '16@vs' },
  supportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '8@s', paddingVertical: '12@vs', borderRadius: '6@ms',
    backgroundColor: color.primary,
  },
  supportBtnText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Loader
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: '14@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // Error states
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: '32@s' },
  errorTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, marginTop: '20@vs', marginBottom: '8@vs' },
  errorText: { fontSize: '13@ms', color: '#999', fontFamily: FONTS.Medium, textAlign: 'center', lineHeight: '20@vs' },
  retryBtn: {
    marginTop: '24@vs', paddingHorizontal: '24@s', paddingVertical: '12@vs',
    borderRadius: '8@ms', backgroundColor: color.primary,
  },
  retryBtnText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },
})
