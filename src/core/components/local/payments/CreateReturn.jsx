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
import { launchImageLibrary } from 'react-native-image-picker'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import BASE_URL from '../../../services/api'
import noimage from '../../../assets/images/Categories/preloader.gif'


const RETURN_REASONS = [
  { key: 'damaged', label: 'Product is damaged', icon: 'package-variant-closed' },
  { key: 'wrong_item', label: 'Wrong item received', icon: 'swap-horizontal-circle-outline' },
  { key: 'not_working', label: 'Product not working', icon: 'alert-circle-outline' },
  { key: 'missing_parts', label: 'Missing parts / accessories', icon: 'puzzle-remove-outline' },
  { key: 'other', label: 'Other reason', icon: 'dots-horizontal-circle-outline' },
]

const REQUEST_TYPES = [
  {
    key: 'replacement',
    label: 'Replacement',
    icon: 'swap-horizontal',
    desc: 'Send the product back and get a new one delivered',
  },
]

const OFFICE_ADDRESS = {
  name: 'Ab Shopee',
  line1: '123, Industrial Area, Phase 2',
  city: 'Indore',
  state: 'Madhya Pradesh',
  pincode: '452012',
  phone: '+91 98765 00000',
  hours: 'Mon–Sat, 10 AM – 6 PM',
}

const STEPS = ['Select Item', 'Reason', 'Photos', 'Courier Info']

// ─── Helper: normalise a raw API item ────────────────────────────────────────
function normaliseItem(raw) {
  const dv = raw?.dataValues ?? raw ?? {}

  const isReturnActive = raw?.isReturnActive ?? dv?.isReturnActive ?? false

  console.log('Normalised item:', {
    raw: raw?.isReturnActive,
    dv: dv?.isReturnActive,
    final: isReturnActive,
  })

  return {
    itemId: dv.itemId,
    variantId: dv.variantId ?? null,
    quantity: dv.quantity ?? 1,
    itemSnapshot: dv.itemSnapshot ?? {},
    selectedAttributes: dv.selectedAttributes ?? {},
    isReturnActive,
  }
}

// ─── Step indicator ───────────────────────────────────────────────────────────
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

// ─── Section wrapper ──────────────────────────────────────────────────────────
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateReturnScreen() {
  const navigation = useNavigation()
  const route = useRoute()

  const { orderId, items: passedItems } = route.params ?? {}

  // ── state ──
  const [step, setStep] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // step 0
  const [selectedItem, setSelectedItem] = useState(null)
  const [requestType, setRequestType] = useState('replacement')

  // step 1
  const [reason, setReason] = useState(null)
  const [description, setDescription] = useState('')

  // step 2
  const [photos, setPhotos] = useState([])

  // step 3
  const [courierName, setCourierName] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [courierDate, setCourierDate] = useState('')
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)

  const fadeAnim = useRef(new Animated.Value(1)).current
  const scrollRef = useRef(null)

  // ── fetch / normalise items ──
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

  // ── step animation ──
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

  // ── photo picker ──
  const pickPhoto = async () => {
    if (photos.length >= 4) {
      ToastAndroid.show('Maximum 4 photos allowed', ToastAndroid.SHORT)
      return
    }
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7, selectionLimit: 4 - photos.length },
      res => {
        if (res.didCancel || res.errorCode) return
        const newPhotos = (res.assets ?? []).map(a => ({
          uri: a.uri, name: a.fileName, type: a.type,
        }))
        setPhotos(prev => [...prev, ...newPhotos].slice(0, 4))
      },
    )
  }

  const removePhoto = idx => setPhotos(prev => prev.filter((_, i) => i !== idx))

  // ── validation ──
  const canProceed = () => {
    if (step === 0) return !!selectedItem && !!requestType
    if (step === 1) return !!reason && description.trim().length >= 10
    if (step === 2) return photos.length >= 1
    if (step === 3) return (
      courierName.trim() !== '' &&
      trackingId.trim() !== '' &&
      courierDate.trim() !== '' &&
      agreedToPolicy
    )
    return false
  }

  // ── submit ──
  const handleSubmit = async () => {
    if (!canProceed()) return
    try {
      setSubmitting(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('itemId', selectedItem.itemId)
      formData.append('type', requestType)
      formData.append('reason', reason)
      formData.append('description', description)
      formData.append('courierName', courierName)
      formData.append('trackingId', trackingId)
      formData.append('courierDate', courierDate)
      photos.forEach((p, i) =>
        formData.append('photos', {
          uri: p.uri,
          name: p.name ?? `photo_${i}.jpg`,
          type: p.type ?? 'image/jpeg',
        }),
      )

      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/returns`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData },
      )
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message ?? 'Submission failed')

      ToastAndroid.show('Request submitted successfully!', ToastAndroid.SHORT)
      navigation.navigate('returnreplacement')
    } catch (e) {
      ToastAndroid.show(e.message ?? 'Something went wrong', ToastAndroid.SHORT)
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Request</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loaderText}>Loading order details…</Text>
        </View>
      </View>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // No eligible items
  // ─────────────────────────────────────────────────────────────────────────
  if (!loading && items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Request</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.emptyState}>
          <Icon name="package-variant-closed-remove" size={ms(56)} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>No Items Available</Text>
          <Text style={styles.emptySubtitle}>
            All items in this order already have an active return or replacement request.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('returnreplacement')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>View My Requests</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 0 — Select Item + Request Type
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <>
      {/* Request type */}
      <Section
        icon="swap-horizontal-circle-outline"
        title="What do you want to do?"
        subtitle="Choose whether you want a refund or a new product"
      >
        <View style={styles.typeRow}>
          {REQUEST_TYPES.map(t => {
            const active = requestType === t.key
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeCard, active && styles.typeCardActive]}
                onPress={() => setRequestType(t.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.typeIconWrap, active && styles.typeIconWrapActive]}>
                  <Icon name={t.icon} size={ms(22)} color={active ? '#fff' : '#888'} />
                </View>
                <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.label}</Text>
                <Text style={[styles.typeDesc, active && styles.typeDescActive]}>{t.desc}</Text>
                {active && (
                  <View style={styles.typeCheck}>
                    <Icon name="check-circle" size={ms(16)} color={color.primary} />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </Section>

      {/* Select item */}
      <Section
        icon="package-variant"
        title="Which product do you want to return?"
        subtitle={`${items.length} item${items.length > 1 ? 's' : ''} in this order`}
      >
        {items.map(item => {
          const snap = item.itemSnapshot ?? {}
          const attrs = (item.selectedAttributes?.attributes ?? [])
            .map(a => `${a.label}: ${a.displayValue}`)
            .join(' · ')
          const active = selectedItem?.itemId === item.itemId

          // ── Disable conditions ──
          const isDigital =
            snap.isDigital ??
            snap.digital ??
            snap.itemType === 'digital'
          const isDisabled = item.isReturnActive || isDigital

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

                  {/* ── Status badge ── */}
                  {item.isReturnActive && (
                    <View style={styles.disabledBadge}>
                      <Icon name="swap-horizontal-circle" size={ms(11)} color="#fff" />
                      <Text style={styles.disabledBadgeText}>Already in Return</Text>
                    </View>
                  )}
                  {isDigital && !item.isReturnActive && (
                    <View style={[styles.disabledBadge, styles.disabledBadgeDigital]}>
                      <Icon name="download-circle-outline" size={ms(11)} color="#fff" />
                      <Text style={styles.disabledBadgeText}>Digital – Not Returnable</Text>
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
    </>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Reason
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Section
        icon="comment-question-outline"
        title="Why are you returning this?"
        subtitle="Select the reason that best fits your issue"
      >
        <View style={styles.reasonGrid}>
          {RETURN_REASONS.map(r => {
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

      <Section
        icon="text-box-edit-outline"
        title="Tell us more"
        subtitle="Describe the issue in a few words (minimum 10 characters)"
      >
        <TextInput
          style={styles.textArea}
          placeholder="e.g. The screen has a crack, the zipper broke after first use…"
          placeholderTextColor="#BDBDBD"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </Section>
    </>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Photos
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <Section
      icon="camera-outline"
      title="Attach photos of the product"
      subtitle="Upload clear pictures of the issue. At least 1 photo required, max 4."
    >
      <View style={styles.infoBanner}>
        <Icon name="information-outline" size={ms(14)} color={color.primary} />
        <Text style={styles.infoBannerText}>
          Good photos help us process your request faster. Show the damage, wrong item, or issue clearly.
        </Text>
      </View>

      <View style={styles.photoGrid}>
        {photos.map((p, idx) => (
          <View key={idx} style={styles.photoThumb}>
            <Image source={{ uri: p.uri }} style={styles.photoImg} />
            <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(idx)}>
              <Icon name="close-circle" size={ms(20)} color="#C62828" />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < 4 && (
          <TouchableOpacity style={styles.photoAdd} onPress={pickPhoto} activeOpacity={0.7}>
            <Icon name="camera-plus-outline" size={ms(28)} color={color.primary} />
            <Text style={styles.photoAddText}>Add Photo</Text>
            <Text style={styles.photoAddCount}>{photos.length}/4</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.photoHint}>
        💡 Tip: Include photos of the packaging, the product label, and the damage or issue.
      </Text>
    </Section>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Courier Info + Office Address
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <>
      {/* How it works */}
      <Section icon="information-circle-outline" title="How does this work?">
        <View style={styles.howItWorksCard}>
          {[
            { icon: 'package-variant', text: 'Pack your product securely in a box or bag' },
            { icon: 'truck-delivery-outline', text: 'Drop it off at your nearest courier service (e.g. Delhivery, Blue Dart, India Post)' },
            { icon: 'map-marker-outline', text: 'Send it to our office address shown below' },
            { icon: 'receipt-text-outline', text: 'Fill in the courier name and tracking ID below so we can track it' },
            { icon: 'check-circle-outline', text: "Once received, we'll process your request within 3–5 business days" },
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

      {/* Office address */}
      <Section
        icon="office-building-marker-outline"
        title="Send your product here"
        subtitle="This is the address where you need to courier the product"
      >
        <View style={styles.officeCard}>
          <View style={styles.officeTopRow}>
            <Icon name="map-marker" size={ms(16)} color={color.primary} />
            <Text style={styles.officeName}>{OFFICE_ADDRESS.name}</Text>
          </View>
          <Text style={styles.officeLine}>{OFFICE_ADDRESS.line1}</Text>
          <Text style={styles.officeLine}>
            {OFFICE_ADDRESS.city}, {OFFICE_ADDRESS.state} – {OFFICE_ADDRESS.pincode}
          </Text>
          <View style={styles.officeMeta}>
            <View style={styles.officeMetaItem}>
              <Icon name="phone-outline" size={ms(13)} color="#777" />
              <Text style={styles.officeMetaText}>{OFFICE_ADDRESS.phone}</Text>
            </View>
            <View style={styles.officeMetaItem}>
              <Icon name="clock-outline" size={ms(13)} color="#777" />
              <Text style={styles.officeMetaText}>{OFFICE_ADDRESS.hours}</Text>
            </View>
          </View>
        </View>

        <View style={styles.noticeBox}>
          <Icon name="alert-circle-outline" size={ms(15)} color="#E65100" />
          <Text style={styles.noticeText}>
            <Text style={{ fontFamily: FONTS.Bold }}>Important: </Text>
            Please write your Order ID{' '}
            <Text style={{ fontFamily: FONTS.Bold }}>#{orderId?.slice(-8).toUpperCase()}</Text>
            {' '}on the package so we can identify your return quickly.
          </Text>
        </View>
      </Section>

      {/* Courier details form */}
      <Section
        icon="truck-check-outline"
        title="Enter your courier details"
        subtitle="Fill this in after you've sent the package"
      >
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>
            Courier / Delivery Partner Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.formInput}
            placeholder="e.g. Delhivery, Blue Dart, India Post"
            placeholderTextColor="#BDBDBD"
            value={courierName}
            onChangeText={setCourierName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>
            Tracking ID / AWB Number <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.formInput}
            placeholder="e.g. DELVR123456789"
            placeholderTextColor="#BDBDBD"
            value={trackingId}
            onChangeText={setTrackingId}
            autoCapitalize="characters"
          />
          <Text style={styles.formHint}>
            You'll get this from the courier receipt when you drop off the package
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>
            Date of Dispatch <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.formInput}
            placeholder="e.g. 01 Apr 2025"
            placeholderTextColor="#BDBDBD"
            value={courierDate}
            onChangeText={setCourierDate}
          />
        </View>
      </Section>

      {/* Policy agreement */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAgreedToPolicy(v => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToPolicy && styles.checkboxChecked]}>
            {agreedToPolicy && <Icon name="check" size={ms(12)} color="#fff" />}
          </View>
          <Text style={styles.checkText}>
            I confirm that I have sent the product to the address above and the details provided are correct.
            I understand the refund/replacement will be processed only after the item is received and verified.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary card */}
      <View style={styles.section}>
        <Text style={styles.summaryTitle}>📦 Request Summary</Text>
        <View style={styles.summaryCard}>
          {[
            { label: 'Product', value: (selectedItem?.itemSnapshot ?? {}).title ?? '—' },
            { label: 'Request type', value: 'Replacement' },
            { label: 'Reason', value: RETURN_REASONS.find(r => r.key === reason)?.label ?? '—' },
            { label: 'Photos', value: `${photos.length} attached` },
          ].map((row, i) => (
            <View key={i} style={[styles.summaryRow, i > 0 && styles.summaryRowBorder]}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const isLastStep = step === STEPS.length - 1

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Request</Text>
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
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
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
                  {isLastStep ? 'Submit Request' : 'Continue'}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // Header
  header: {
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '14@vs',
    paddingHorizontal: '16@s',
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: '36@s', height: '36@s', borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff',
    letterSpacing: 0.2, flex: 1, textAlign: 'center',
  },

  // Step bar
  stepBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: '14@s', paddingVertical: '12@vs',
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB',
  },
  stepItem: { alignItems: 'center', gap: '4@vs' },
  stepLine: {
    flex: 1, height: 2, backgroundColor: '#E0E0E0',
    marginHorizontal: '4@s', marginBottom: '16@vs',
  },
  stepLineDone: { backgroundColor: color.primary },
  stepCircle: {
    width: '24@s', height: '24@s', borderRadius: '12@ms',
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: color.primary },
  stepCircleDone: { backgroundColor: color.primary },
  stepNum: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#999' },
  stepLabel: {
    fontSize: '9@ms', fontFamily: FONTS.Medium, color: '#BDBDBD',
    textAlign: 'center', maxWidth: '56@s',
  },
  stepLabelActive: { color: color.primary, fontFamily: FONTS.Bold },
  stepLabelDone: { color: color.primary },

  // Scroll + order badge
  scroll: { paddingBottom: '110@vs' },
  orderBadge: {
    flexDirection: 'row', alignItems: 'center', gap: '6@s',
    backgroundColor: '#fff', paddingHorizontal: '16@s', paddingVertical: '8@vs',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  orderBadgeText: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },

  // Section
  section: {
    backgroundColor: '#fff', marginTop: '8@vs',
    paddingHorizontal: '16@s', paddingVertical: '16@vs',
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '10@s', marginBottom: '14@vs',
  },
  sectionIconWrap: {
    width: '34@s', height: '34@s', borderRadius: '10@ms',
    backgroundColor: color.primary + '18',
    justifyContent: 'center', alignItems: 'center', marginTop: '1@vs',
  },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  sectionSubtitle: { fontSize: '12@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '3@vs', lineHeight: '17@ms' },

  // Request type
  typeRow: { flexDirection: 'row', gap: '10@s' },
  typeCard: {
    flex: 1, borderRadius: '10@ms', padding: '12@s',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: color.background, alignItems: 'center', gap: '6@vs',
    position: 'relative',
  },
  typeCardActive: { borderColor: color.primary, backgroundColor: color.primary + '08' },
  typeIconWrap: {
    width: '44@s', height: '44@s', borderRadius: '22@ms',
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
  },
  typeIconWrapActive: { backgroundColor: color.primary },
  typeLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#888', textAlign: 'center' },
  typeLabelActive: { color: color.primary },
  typeDesc: { fontSize: '10@ms', color: '#BBB', fontFamily: FONTS.Medium, textAlign: 'center', lineHeight: '14@ms' },
  typeDescActive: { color: '#777' },
  typeCheck: { position: 'absolute', top: '8@vs', right: '8@s' },

  // Item card
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: '10@s',
    borderRadius: '8@ms', padding: '10@s',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    marginBottom: '8@vs', backgroundColor: color.background,
  },
  itemCardActive: { borderColor: color.primary, backgroundColor: color.primary + '06' },
  itemCardDisabled: { opacity: 0.6, backgroundColor: '#F9F9F9' },
  itemImg: {
    width: '52@s', height: '52@s', borderRadius: '6@ms',
    backgroundColor: color.primary + '15', resizeMode: 'contain',
    borderWidth: 1, borderColor: '#EEE',
  },
  itemImgDisabled: { opacity: 0.5 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms' },
  itemNameDisabled: { color: '#AAAAAA' },
  itemAttrs: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  itemFoot: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginTop: '5@vs', flexWrap: 'wrap' },
  itemPrice: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  qtyChip: {
    backgroundColor: '#EEE', paddingHorizontal: '7@s', paddingVertical: '2@vs',
    borderRadius: '4@ms',
  },
  qtyChipTxt: { fontSize: '10@ms', color: '#666', fontFamily: FONTS.Medium },

  // Disabled badges
  disabledBadge: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    backgroundColor: '#757575',
    paddingHorizontal: '7@s', paddingVertical: '3@vs',
    borderRadius: '4@ms',
  },
  disabledBadgeDigital: { backgroundColor: '#5C6BC0' },
  disabledBadgeText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Radio
  radioOuter: {
    width: '20@s', height: '20@s', borderRadius: '10@ms',
    borderWidth: 2, borderColor: '#BDBDBD',
    justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: color.primary },
  radioInner: {
    width: '10@s', height: '10@s', borderRadius: '5@ms',
    backgroundColor: color.primary,
  },

  // Reason grid
  reasonGrid: { gap: '8@vs' },
  reasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: '10@s',
    paddingHorizontal: '12@s', paddingVertical: '10@vs',
    borderRadius: '8@ms', borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: color.background,
  },
  reasonChipActive: { borderColor: color.primary, backgroundColor: color.primary + '08' },
  reasonChipText: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium, flex: 1 },
  reasonChipTextActive: { color: color.primary, fontFamily: FONTS.Bold },

  // Text area
  textArea: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: '8@ms',
    paddingHorizontal: '12@s', paddingVertical: '10@vs',
    fontSize: '13@ms', fontFamily: FONTS.Medium, color: color.text,
    minHeight: '100@vs', backgroundColor: color.background,
  },
  charCount: { fontSize: '11@ms', color: '#BBB', fontFamily: FONTS.Medium, textAlign: 'right', marginTop: '5@vs' },

  // Photo grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: '10@s', marginTop: '6@vs' },
  photoThumb: { width: '80@s', height: '80@s', borderRadius: '8@ms', overflow: 'visible' },
  photoImg: {
    width: '80@s', height: '80@s', borderRadius: '8@ms',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#fff', borderRadius: '10@ms',
  },
  photoAdd: {
    width: '80@s', height: '80@s', borderRadius: '8@ms',
    borderWidth: 1.5, borderColor: color.primary, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: '4@vs',
    backgroundColor: color.primary + '08',
  },
  photoAddText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: color.primary },
  photoAddCount: { fontSize: '9@ms', color: '#BBB', fontFamily: FONTS.Medium },
  photoHint: {
    fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium,
    marginTop: '12@vs', lineHeight: '18@ms',
  },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '8@s',
    backgroundColor: color.primary + '10',
    borderRadius: '8@ms', padding: '10@s', marginBottom: '14@vs',
  },
  infoBannerText: {
    flex: 1, fontSize: '12@ms', color: color.primary,
    fontFamily: FONTS.Medium, lineHeight: '18@ms',
  },

  // How it works
  howItWorksCard: {
    backgroundColor: color.background, borderRadius: '8@ms',
    padding: '12@s', gap: '10@vs', borderWidth: 1, borderColor: '#EBEBEB',
  },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '10@s' },
  howIconWrap: {
    width: '30@s', height: '30@s', borderRadius: '15@ms',
    backgroundColor: color.primary + '18',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  howText: { flex: 1, fontSize: '13@ms', color: color.text, fontFamily: FONTS.Medium, lineHeight: '19@ms' },

  // Office card
  officeCard: {
    backgroundColor: color.background, borderRadius: '10@ms',
    padding: '14@s', marginBottom: '10@vs',
    borderWidth: 1.5, borderColor: color.primary + '50',
  },
  officeTopRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '6@vs' },
  officeName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary, flex: 1 },
  officeLine: { fontSize: '13@ms', color: color.text, fontFamily: FONTS.Medium, lineHeight: '20@ms' },
  officeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: '12@s', marginTop: '10@vs' },
  officeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: '5@s' },
  officeMetaText: { fontSize: '12@ms', color: '#666', fontFamily: FONTS.Medium },

  // Notice box
  noticeBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '8@s',
    backgroundColor: '#FFF3E0', borderRadius: '8@ms',
    padding: '10@s', borderLeftWidth: 3, borderLeftColor: '#E65100',
  },
  noticeText: { flex: 1, fontSize: '12@ms', color: '#E65100', fontFamily: FONTS.Medium, lineHeight: '18@ms' },

  // Form
  formGroup: { marginBottom: '14@vs' },
  formLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '7@vs' },
  required: { color: '#C62828' },
  formInput: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: '8@ms',
    paddingHorizontal: '12@s', paddingVertical: '10@vs',
    fontSize: '13@ms', fontFamily: FONTS.Medium, color: color.text,
    backgroundColor: color.background,
  },
  formHint: { fontSize: '11@ms', color: '#BBB', fontFamily: FONTS.Medium, marginTop: '5@vs' },

  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '10@s' },
  checkbox: {
    width: '20@s', height: '20@s', borderRadius: '5@ms',
    borderWidth: 2, borderColor: '#BDBDBD',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0, marginTop: '2@vs',
  },
  checkboxChecked: { backgroundColor: color.primary, borderColor: color.primary },
  checkText: { flex: 1, fontSize: '12@ms', color: '#555', fontFamily: FONTS.Medium, lineHeight: '18@ms' },

  // Summary
  summaryTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '10@vs' },
  summaryCard: { borderRadius: '8@ms', borderWidth: 1, borderColor: '#EBEBEB', overflow: 'hidden' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: '12@s', paddingVertical: '10@vs', backgroundColor: '#fff',
  },
  summaryRowBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  summaryLabel: { fontSize: '12@ms', color: '#999', fontFamily: FONTS.Medium, width: '90@s' },
  summaryValue: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text, flex: 1, textAlign: 'right' },

  // Loader
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: '14@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // Empty state
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: '32@s', gap: '12@vs',
  },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, textAlign: 'center' },
  emptySubtitle: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium, textAlign: 'center', lineHeight: '20@ms' },
  emptyBtn: {
    marginTop: '8@vs', backgroundColor: color.primary,
    paddingHorizontal: '24@s', paddingVertical: '12@vs',
    borderRadius: '8@ms',
  },
  emptyBtnText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: '16@s', paddingVertical: '12@vs',
    paddingBottom: Platform.OS === 'ios' ? '28@vs' : '12@vs',
    elevation: 10, gap: '10@s',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 6,
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
  },
  btnBack: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '5@s', paddingVertical: '11@vs', paddingHorizontal: '16@s',
    borderRadius: '8@ms', borderWidth: 1.5, borderColor: color.primary,
  },
  btnBackText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
  btnNext: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '7@s', paddingVertical: '12@vs', borderRadius: '8@ms',
    backgroundColor: color.primary,
    elevation: 2, shadowColor: color.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  btnNextDisabled: { backgroundColor: '#BDBDBD', elevation: 0, shadowOpacity: 0 },
  btnNextText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },
})