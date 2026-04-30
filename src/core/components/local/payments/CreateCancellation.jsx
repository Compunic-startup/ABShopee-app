import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  TextInput,
  ToastAndroid,
  Animated,
  Platform,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import BASE_URL from '../../../services/api'
import noimage from '../../../assets/images/Categories/preloader.gif'

const CANCELLATION_REASONS = [
  { key: 'changed_mind', label: 'Changed my mind', icon: 'emoticon-happy-outline' },
  { key: 'wrong_item', label: 'Ordered wrong item', icon: 'swap-horizontal-circle-outline' },
  { key: 'found_better_price', label: 'Found better price', icon: 'tag-outline' },
  { key: 'delivery_too_long', label: 'Delivery too long', icon: 'clock-outline' },
  { key: 'duplicate_order', label: 'Duplicate order', icon: 'content-copy' },
  { key: 'other', label: 'Other reason', icon: 'dots-horizontal-circle-outline' },
]

const STEPS = ['Select Item', 'Reason']

// Helper: normalize a raw API item
function normaliseItem(raw) {
  const dv = raw?.dataValues ?? raw ?? {}

  const isReturnActive = raw?.isReturnActive ?? dv?.isReturnActive ?? false
  const itemStatus = raw?.itemStatus ?? dv?.itemStatus ?? 'pending'

  console.log('Normalised item:', {
    raw: raw?.itemStatus,
    dv: dv?.itemStatus,
    final: itemStatus,
  })

  return {
    itemId: dv.itemId,
    variantId: dv.variantId ?? null,
    quantity: dv.quantity ?? 1,
    itemSnapshot: dv.itemSnapshot ?? {},
    selectedAttributes: dv.selectedAttributes ?? {},
    isReturnActive,
    itemStatus,
  }
}

// Step indicator
function StepBar({ current }) {
  return (
    <View style={styles.stepBar}>
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        const isLast = i === STEPS.length - 1
        return (
          <React.Fragment key={i}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                done && styles.stepCircleDone,
                active && styles.stepCircleActive,
              ]}>
                {done
                  ? <Icon name="check" size={ms(11)} color="#fff" />
                  : <Text style={[styles.stepNum, active && { color: '#fff' }]}>{i + 1}</Text>
                }
              </View>
              <Text style={[
                styles.stepLabel,
                active && styles.stepLabelActive,
                done && styles.stepLabelDone,
              ]}>
                {label}
              </Text>
            </View>
            {!isLast && (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

// Section wrapper
function Section({ icon, title, subtitle, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIconWrap}>
          <Icon name={icon} size={ms(18)} color={color.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  )
}

// Main Screen
export default function CreateCancellationScreen() {
  const navigation = useNavigation()
  const route = useRoute()

  const { orderId, items: passedItems } = route.params ?? {}

  // state
  const [step, setStep] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // step 0
  const [selectedItem, setSelectedItem] = useState(null)

  // step 1
  const [reason, setReason] = useState(null)

  const fadeAnim = useRef(new Animated.Value(1)).current
  const scrollRef = useRef(null)

  // fetch / normalise items
  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const json = await res.json()
      console.log(json)

      const allItems = json?.data?.items ?? []

      const normalised = allItems.map(normaliseItem)

      const deduped = Object.values(
        normalised.reduce((acc, item) => {
          if (acc[item.itemId]) {
            acc[item.itemId] = {
              ...acc[item.itemId],
              quantity: acc[item.itemId].quantity + item.quantity,
            }
          } else {
            acc[item.itemId] = { ...item }
          }
          return acc
        }, {}),
      )

      setItems(deduped)
    } catch {
      ToastAndroid.show('Failed to load order details', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  // step animation
  const animateStep = cb => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
    setTimeout(cb, 150)
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  const goNext = () => animateStep(() => setStep(s => s + 1))
  const goBack = () => {
    if (step === 0) { navigation.goBack(); return }
    animateStep(() => setStep(s => s - 1))
  }

  // validation
  const canProceed = () => {
    if (step === 0) return !!selectedItem
    if (step === 1) return !!reason
    return false
  }

  // submit
  const handleSubmit = async () => {
    if (!canProceed()) return
    try {
      setSubmitting(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      const payload = {
        orderId,
        itemId: selectedItem.itemId,
        reason,
      }

      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/cancellations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      )
      const json = await res.json()
      console.log(json)
      if (!json?.success) throw new Error(json?.message ?? 'Submission failed')

      ToastAndroid.show('Cancellation request submitted successfully!', ToastAndroid.SHORT)
      navigation.navigate('cancellations')
    } catch (e) {
      ToastAndroid.show(e.message ?? 'Something went wrong', ToastAndroid.SHORT)
    } finally {
      setSubmitting(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancel Item</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loaderText}>Loading order details...</Text>
        </View>
      </View>
    )
  }

  // No eligible items
  if (!loading && items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancel Item</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.emptyState}>
          <Icon name="package-variant-closed-remove" size={ms(56)} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>No Items Available</Text>
          <Text style={styles.emptySubtitle}>
            All items in this order are either already cancelled, shipped, or not eligible for cancellation.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('cancellations')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>View My Cancellations</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // STEP 0 - Select Item
  const renderStep0 = () => (
    <Section
      icon="package-variant"
      title="Which item do you want to cancel?"
      subtitle={`${items.length} item${items.length > 1 ? 's' : ''} in this order`}
    >
      {items.map(item => {
        const snap = item.itemSnapshot ?? {}
        const attrs = (item.selectedAttributes?.attributes ?? [])
          .map(a => `${a.label}: ${a.displayValue}`)
          .join(' · ')
        const active = selectedItem?.itemId === item.itemId

        // Disable conditions
        const isDigital =
          snap.isDigital ??
          snap.digital ??
          snap.itemType === 'digital'
        // Items can't be cancelled if order is fulfilled or completed (shipped/delivered)
        const isShipped = ['fulfilled', 'completed'].includes(item.itemStatus)
        const isDisabled = item.isReturnActive || isDigital || isShipped

        return (
          <TouchableOpacity
            key={item.itemId}
            style={[
              styles.itemCard,
              active && styles.itemCardActive,
              isDisabled && styles.itemCardDisabled,
            ]}
            onPress={() => !isDisabled && setSelectedItem(item)}
            activeOpacity={isDisabled ? 1 : 0.7}
            disabled={isDisabled}
          >
            <Image
              source={snap.image ? { uri: snap.image } : noimage}
              style={[styles.itemImg, isDisabled && styles.itemImgDisabled]}
            />
            <View style={styles.itemInfo}>
              <Text
                style={[styles.itemName, isDisabled && styles.itemNameDisabled]}
                numberOfLines={2}
              >
                {snap.title || 'Product'}
              </Text>
              {!!attrs && <Text style={styles.itemAttrs} numberOfLines={1}>{attrs}</Text>}
              <View style={styles.itemFoot}>
                <View style={styles.qtyChip}>
                  <Text style={styles.qtyChipTxt}>Qty: {item.quantity}</Text>
                </View>

                {/* Status badge */}
                {item.isReturnActive && (
                  <View style={styles.disabledBadge}>
                    <Icon name="swap-horizontal-circle" size={ms(11)} color="#fff" />
                    <Text style={styles.disabledBadgeText}>Already in Return</Text>
                  </View>
                )}
                {isDigital && !item.isReturnActive && (
                  <View style={[styles.disabledBadge, styles.disabledBadgeDigital]}>
                    <Icon name="download-circle-outline" size={ms(11)} color="#fff" />
                    <Text style={styles.disabledBadgeText}>Digital - Not Cancellable</Text>
                  </View>
                )}
                {isShipped && !item.isReturnActive && !isDigital && (
                  <View style={[styles.disabledBadge, styles.disabledBadgeShipped]}>
                    <Icon name="truck-check-outline" size={ms(11)} color="#fff" />
                    <Text style={styles.disabledBadgeText}>Already Shipped</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Radio for eligible items, lock icon for disabled */}
            {!isDisabled ? (
              <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                {active && <View style={styles.radioInner} />}
              </View>
            ) : (
              <Icon
                name={isDigital ? 'cloud-lock-outline' : 'lock-outline'}
                size={ms(18)}
                color="#BDBDBD"
              />
            )}
          </TouchableOpacity>
        )
      })}
    </Section>
  )

  // STEP 1 - Reason
  const renderReason = () => (
    <Section
      icon="comment-question-outline"
      title="Why are you cancelling this?"
      subtitle="Select the reason that best fits your situation"
    >
      <View style={styles.reasonGrid}>
        {CANCELLATION_REASONS.map(r => {
          const active = reason === r.key
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.reasonChip, active && styles.reasonChipActive]}
              onPress={() => setReason(r.key)}
              activeOpacity={0.7}
            >
              <Icon name={r.icon} size={ms(15)} color={active ? color.primary : '#888'} />
              <Text style={[styles.reasonChipText, active && styles.reasonChipTextActive]}>
                {r.label}
              </Text>
              {active && (
                <Icon
                  name="check-circle"
                  size={ms(14)}
                  color={color.primary}
                  style={{ marginLeft: 'auto' }}
                />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </Section>
  )

  // STEP 1 - Details & Confirmation
  const renderStep1 = () => (
    <>
      {/* How it works */}
      <Section icon="information-circle-outline" title="How does cancellation work?">
        <View style={styles.howItWorksCard}>
          {[
            { icon: 'cancel', text: 'Your cancellation request will be reviewed by our team' },
            { icon: 'cash-refund', text: 'If approved, a refund will be initiated to your original payment method' },
            { icon: 'clock-outline', text: 'Refund processing typically takes 5-7 business days' },
            { icon: 'check-circle-outline', text: 'You will receive updates via email and in this app' },
          ].map((row, i) => (
            <View key={i} style={styles.howRow}>
              <View style={styles.howIconWrap}>
                <Icon name={row.icon} size={ms(16)} color={color.primary} />
              </View>
              <Text style={styles.howText}>{row.text}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Summary card */}
      <View style={styles.section}>
        <Text style={styles.summaryTitle}>Cancellation Summary</Text>
        <View style={styles.summaryCard}>
          {[
            { label: 'Product', value: (selectedItem?.itemSnapshot ?? {}).title ?? '---' },
            { label: 'Quantity', value: selectedItem?.quantity ?? 1 },
            { label: 'Reason', value: CANCELLATION_REASONS.find(r => r.key === reason)?.label ?? '---' },
            { label: 'Refund Amount', value: `Rs. ${((selectedItem?.itemSnapshot?.price ?? 0) * (selectedItem?.quantity ?? 1)).toLocaleString('en-IN')}` },
          ].map((row, i) => (
            <View key={i} style={[styles.summaryRow, i > 0 && styles.summaryRowBorder]}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Policy agreement */}
      <View style={styles.section}>
        <Text style={styles.policyTitle}>Important Notes</Text>
        <View style={styles.policyCard}>
          <Text style={styles.policyText}>
            {'\u2022'} Cancellation is only possible for physical items that haven't been shipped{'\n'}
            {'\u2022'} Once an item is shipped, it falls under the Returns flow{'\n'}
            {'\u2022'} Refund will be processed to your original payment method{'\n'}
            {'\u2022'} Processing time may vary based on your payment provider
          </Text>
        </View>
      </View>
    </>
  )

  // Render
  const isLastStep = step === STEPS.length - 1

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Item</Text>
        <View style={{ width: s(36) }} />
      </View>

      {/* Step bar */}
      <StepBar current={step} />

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.orderBadge}>
            <Icon name="receipt" size={ms(13)} color="#888" />
            <Text style={styles.orderBadgeText}>Order #{orderId?.slice(-8).toUpperCase()}</Text>
          </View>

          {step === 0 && renderStep0()}
          {step === 1 && renderReason()}
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.btnBack} onPress={goBack} activeOpacity={0.7}>
            <Icon name="arrow-left" size={ms(16)} color={color.primary} />
            <Text style={styles.btnBackText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btnNext, !canProceed() && styles.btnNextDisabled]}
          onPress={isLastStep ? handleSubmit : goNext}
          activeOpacity={0.8}
          disabled={!canProceed() || submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : (
              <>
                <Text style={styles.btnNextText}>
                  {isLastStep ? 'Submit Cancellation' : 'Continue'}
                </Text>
                {!isLastStep && <Icon name="arrow-right" size={ms(16)} color="#fff" />}
                {isLastStep && <Icon name="send-check-outline" size={ms(16)} color="#fff" />}
              </>
            )
          }
        </TouchableOpacity>
      </View>
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

  // Step bar
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '20@s',
    paddingVertical: '16@vs',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB',
  },
  stepItem: { flex: 1, alignItems: 'center' },
  stepCircle: {
    width: '24@ms', height: '24@ms', borderRadius: '12@ms',
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
  },
  stepCircleDone: { backgroundColor: color.primary },
  stepCircleActive: { backgroundColor: color.primary },
  stepNum: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#888' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: '8@s' },
  stepLineDone: { backgroundColor: color.primary },
  stepLabel: { fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#888', marginTop: '6@vs' },
  stepLabelActive: { color: color.primary, fontFamily: FONTS.Bold },
  stepLabelDone: { color: color.primary, fontFamily: FONTS.Medium },

  // Content
  scroll: { paddingHorizontal: '16@s', paddingBottom: '100@vs' },
  orderBadge: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: color.background,
    paddingHorizontal: '12@s', paddingVertical: '8@vs',
    borderRadius: '20@ms', marginTop: '12@vs', marginBottom: '16@vs',
    alignSelf: 'flex-start',
  },
  orderBadgeText: { fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#888' },

  // Section
  section: { marginBottom: '20@vs' },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: '12@vs' },
  sectionIconWrap: {
    width: '32@ms', height: '32@ms', borderRadius: '16@ms',
    backgroundColor: color.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: '10@s',
  },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  sectionSubtitle: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },

  // Item cards
  itemCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: '8@ms', padding: '12@s',
    marginBottom: '10@vs', borderWidth: 1, borderColor: '#EBEBEB',
  },
  itemCardActive: { borderColor: color.primary, backgroundColor: color.primary + '05' },
  itemCardDisabled: { opacity: 0.6, backgroundColor: '#F9F9F9' },
  itemImg: {
    width: '56@s', height: '56@s', borderRadius: '6@ms',
    backgroundColor: color.primary + '20',
  },
  itemImgDisabled: { opacity: 0.5 },
  itemInfo: { flex: 1, marginLeft: '12@s' },
  itemName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms' },
  itemNameDisabled: { color: '#999' },
  itemAttrs: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  itemFoot: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginTop: '8@vs' },
  qtyChip: {
    backgroundColor: color.background,
    paddingHorizontal: '8@s', paddingVertical: '2@vs',
    borderRadius: '10@ms', borderWidth: 1, borderColor: '#E0E0E0',
  },
  qtyChipTxt: { fontSize: '10@ms', fontFamily: FONTS.Medium, color: '#666' },
  disabledBadge: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    backgroundColor: '#C62828', paddingHorizontal: '8@s', paddingVertical: '2@vs',
    borderRadius: '10@ms',
  },
  disabledBadgeDigital: { backgroundColor: '#1976D2' },
  disabledBadgeShipped: { backgroundColor: '#F57C00' },
  disabledBadgeText: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: '#fff' },
  radioOuter: {
    width: '20@ms', height: '20@ms', borderRadius: '10@ms',
    borderWidth: 2, borderColor: '#D0D0D0', justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: color.primary },
  radioInner: { width: '10@ms', height: '10@ms', borderRadius: '5@ms', backgroundColor: color.primary },

  // Reason selection
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: '10@s' },
  reasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    paddingHorizontal: '12@s', paddingVertical: '8@vs',
    borderRadius: '20@ms', borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  reasonChipActive: { borderColor: color.primary, backgroundColor: color.primary + '08' },
  reasonChipText: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#666' },
  reasonChipTextActive: { color: color.primary, fontFamily: FONTS.Bold },

  // Text area
  textArea: {
    backgroundColor: '#fff', borderRadius: '6@ms',
    borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: '12@s',
    paddingVertical: '10@vs', fontSize: '13@ms', fontFamily: FONTS.Medium,
    color: color.text, minHeight: '80@vs',
  },
  charCount: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, textAlign: 'right', marginTop: '6@vs' },

  // How it works
  howItWorksCard: { backgroundColor: '#fff', borderRadius: '8@ms', padding: '14@s' },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '10@s', marginBottom: '10@vs' },
  howIconWrap: {
    width: '24@ms', height: '24@ms', borderRadius: '12@ms',
    backgroundColor: color.primary + '15', justifyContent: 'center', alignItems: 'center',
  },
  howText: { flex: 1, fontSize: '12@ms', fontFamily: FONTS.Medium, color: color.text, lineHeight: '16@vs' },

  // Summary
  summaryTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '10@vs' },
  summaryCard: { backgroundColor: '#fff', borderRadius: '8@ms', padding: '14@s' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: '8@vs' },
  summaryRowBorder: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  summaryLabel: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888' },
  summaryValue: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text, textAlign: 'right' },

  // Policy
  policyTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '10@vs' },
  policyCard: { backgroundColor: '#fff', borderRadius: '8@ms', padding: '14@s' },
  policyText: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: color.text, lineHeight: '18@vs' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: '10@s', paddingHorizontal: '16@s',
    paddingVertical: '12@vs', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
  },
  btnBack: {
    flex: 0.3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '6@s', paddingVertical: '10@vs', borderRadius: '6@ms',
    borderWidth: 1.5, borderColor: color.primary,
  },
  btnBackText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
  btnNext: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '8@s', paddingVertical: '10@vs', borderRadius: '6@ms',
    backgroundColor: color.primary,
  },
  btnNextDisabled: { backgroundColor: '#E0E0E0' },
  btnNextText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Empty state
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: '32@s' },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, marginTop: '20@vs', marginBottom: '8@vs' },
  emptySubtitle: { fontSize: '13@ms', color: '#999', fontFamily: FONTS.Medium, textAlign: 'center', lineHeight: '20@vs' },
  emptyBtn: {
    marginTop: '24@vs', paddingHorizontal: '24@s', paddingVertical: '12@vs',
    borderRadius: '8@ms', backgroundColor: color.primary,
  },
  emptyBtnText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Loader
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: '14@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },
})
