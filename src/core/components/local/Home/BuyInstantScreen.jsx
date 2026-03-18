import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { TextInput } from 'react-native-paper'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { StyleSheet } from 'react-native'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import { openRazorpay } from '../../global/razorpaymodule'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ─── Label icons for address labels ──────────────────────────────────────────
const LABEL_ICONS = {
  home: 'home-outline',
  office: 'briefcase-outline',
  work: 'briefcase-outline',
  other: 'map-marker-outline',
}
const getLabelIcon = label => LABEL_ICONS[label] ?? 'map-marker-outline'

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
      <View style={freeGiftStyles.topAccent} />
      <View style={freeGiftStyles.inner}>
        <View style={freeGiftStyles.imageWrap}>
          <Image
            source={item.media?.url ? { uri: item.media.url } : noimage}
            style={freeGiftStyles.image}
          />
          <View style={freeGiftStyles.badgeWrap}>
            <View style={freeGiftStyles.badge}>
              <Icon name="gift" size={9} color="#fff" />
              <Text style={freeGiftStyles.badgeText}>FREE</Text>
            </View>
          </View>
        </View>
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
      <View style={freeGiftStyles.note}>
        <Icon name="information-outline" size={12} color="#0b4bb8" />
        <Text style={freeGiftStyles.noteText}>
          This item is a free gift and cannot be modified
        </Text>
      </View>
    </View>
  )
}

// ─── Address Form Bottom Sheet ────────────────────────────────────────────────
function AddressBottomSheet({ visible, onClose, onSaved, editData }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropAnim = useRef(new Animated.Value(0)).current
  const [saving, setSaving] = useState(false)

  const isEdit = !!editData

  const [form, setForm] = useState({
    label: '',
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  })

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setForm({
        label: editData.label ?? '',
        name: editData.contactInfo?.name ?? '',
        phone: editData.contactInfo?.phone ?? '',
        line1: editData.address?.line1 ?? '',
        city: editData.address?.city ?? '',
        state: editData.address?.state ?? '',
        postalCode: editData.address?.postalCode ?? '',
        country: editData.address?.country ?? 'India',
        isDefault: editData.isDefault ?? false,
      })
    } else {
      setForm({
        label: '',
        name: '',
        phone: '',
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      })
    }
  }, [editData, visible])

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const validate = () => {
    const { label, name, phone, line1, city, state, postalCode } = form
    if (!label.trim()) { ToastAndroid.show('Label is required', ToastAndroid.SHORT); return false }
    if (!name.trim()) { ToastAndroid.show('Contact name is required', ToastAndroid.SHORT); return false }
    if (!phone.trim() || phone.trim().length < 10) {
      ToastAndroid.show('Enter a valid 10-digit phone number', ToastAndroid.SHORT)
      return false
    }
    if (!line1.trim()) { ToastAndroid.show('Address line 1 is required', ToastAndroid.SHORT); return false }
    if (!city.trim()) { ToastAndroid.show('City is required', ToastAndroid.SHORT); return false }
    if (!state.trim()) { ToastAndroid.show('State is required', ToastAndroid.SHORT); return false }
    if (!postalCode.trim() || postalCode.trim().length < 4) {
      ToastAndroid.show('Enter a valid postal code', ToastAndroid.SHORT)
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      setSaving(true)
      const token = await AsyncStorage.getItem('userToken')

      const payload = {
        label: form.label.trim(),
        address: {
          addressLine1: form.line1.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim() || 'India',
        },
        contactInfo: {
          name: form.name.trim(),
          phone: form.phone.trim(),
        },
        isDefault: form.isDefault,
      }

      const url = isEdit
        ? `${BASE_URL}/user/profile/addresses/${editData.id}`
        : `${BASE_URL}/user/profile/addresses`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw json

      ToastAndroid.show(
        isEdit ? 'Address updated!' : 'Address saved!',
        ToastAndroid.SHORT
      )
      onSaved(json.data)
      onClose()
    } catch (err) {
      const msg = err?.error?.message || err?.message || 'Failed to save address'
      ToastAndroid.show(msg, ToastAndroid.LONG)
    } finally {
      setSaving(false)
    }
  }

  const LABEL_OPTIONS = ['home', 'office', 'other']

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            sheetStyles.backdrop,
            { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
          ]}
        />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={sheetStyles.kavWrap}
        pointerEvents="box-none"
      >
        <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={sheetStyles.handle} />

          {/* Header */}
          <View style={sheetStyles.sheetHeader}>
            <View style={sheetStyles.sheetHeaderLeft}>
              <View style={sheetStyles.sheetIconWrap}>
                <Icon name={isEdit ? 'pencil-outline' : 'map-marker-plus-outline'} size={ms(18)} color="#2894c6" />
              </View>
              <View>
                <Text style={sheetStyles.sheetTitle}>{isEdit ? 'Edit Address' : 'Add New Address'}</Text>
                <Text style={sheetStyles.sheetSubtitle}>
                  {isEdit ? 'Update your saved address' : 'Fields marked * are required'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn} activeOpacity={0.7}>
              <Icon name="close" size={ms(20)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={sheetStyles.formScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Label quick-pick */}
            <Text style={sheetStyles.fieldLabel}>
              Label <Text style={sheetStyles.required}>*</Text>
            </Text>
            <View style={sheetStyles.labelRow}>
              {LABEL_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[sheetStyles.labelChip, form.label === opt && sheetStyles.labelChipActive]}
                  onPress={() => setField('label', opt)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={getLabelIcon(opt)}
                    size={ms(14)}
                    color={form.label === opt ? '#fff' : '#555'}
                  />
                  <Text style={[sheetStyles.labelChipText, form.label === opt && sheetStyles.labelChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              {!LABEL_OPTIONS.includes(form.label) && form.label !== '' && (
                <View style={[sheetStyles.labelChip, sheetStyles.labelChipActive]}>
                  <Icon name="map-marker-outline" size={ms(14)} color="#fff" />
                  <Text style={sheetStyles.labelChipTextActive}>{form.label}</Text>
                </View>
              )}
            </View>

            {/* Contact Name */}
            <Text style={sheetStyles.fieldLabel}>
              Contact Name <Text style={sheetStyles.required}>*</Text>
            </Text>
            <TextInput
              mode="outlined"
              label="Full Name *"
              placeholder="John Doe"
              placeholderTextColor="#bbb"
              value={form.name}
              onChangeText={v => setField('name', v)}
              outlineColor="#E0E0E0"
              activeOutlineColor="#2894c6"
              left={<TextInput.Icon icon="account-outline" color="#aaa" />}
              style={sheetStyles.input}
              dense
            />

            {/* Phone */}
            <Text style={sheetStyles.fieldLabel}>
              Phone <Text style={sheetStyles.required}>*</Text>
            </Text>
            <TextInput
              mode="outlined"
              label="Phone Number *"
              placeholder="9876543210"
              placeholderTextColor="#bbb"
              value={form.phone}
              onChangeText={v => setField('phone', v)}
              keyboardType="phone-pad"
              maxLength={13}
              outlineColor="#E0E0E0"
              activeOutlineColor="#2894c6"
              left={<TextInput.Icon icon="phone-outline" color="#aaa" />}
              style={sheetStyles.input}
              dense
            />

            {/* Address Line 1 */}
            <Text style={sheetStyles.fieldLabel}>
              Address <Text style={sheetStyles.required}>*</Text>
            </Text>
            <TextInput
              mode="outlined"
              label="Address Line 1 *"
              placeholder="House/Flat No., Street"
              placeholderTextColor="#bbb"
              value={form.line1}
              onChangeText={v => setField('line1', v)}
              outlineColor="#E0E0E0"
              activeOutlineColor="#2894c6"
              left={<TextInput.Icon icon="home-outline" color="#aaa" />}
              style={sheetStyles.input}
              dense
            />

            {/* City + State row */}
            <View style={sheetStyles.rowDouble}>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.fieldLabel}>
                  City <Text style={sheetStyles.required}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  label="City *"
                  placeholder="Mumbai"
                  placeholderTextColor="#bbb"
                  value={form.city}
                  onChangeText={v => setField('city', v)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#2894c6"
                  style={sheetStyles.input}
                  dense
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.fieldLabel}>
                  State <Text style={sheetStyles.required}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  label="State *"
                  placeholder="Maharashtra"
                  placeholderTextColor="#bbb"
                  value={form.state}
                  onChangeText={v => setField('state', v)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#2894c6"
                  style={sheetStyles.input}
                  dense
                />
              </View>
            </View>

            {/* Postal Code + Country row */}
            <View style={sheetStyles.rowDouble}>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.fieldLabel}>
                  Postal Code <Text style={sheetStyles.required}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  label="Postal Code *"
                  placeholder="400001"
                  placeholderTextColor="#bbb"
                  value={form.postalCode}
                  onChangeText={v => setField('postalCode', v)}
                  keyboardType="number-pad"
                  maxLength={10}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#2894c6"
                  style={sheetStyles.input}
                  dense
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.fieldLabel}>Country</Text>
                <TextInput
                  mode="outlined"
                  label="Country"
                  placeholder="India"
                  placeholderTextColor="#bbb"
                  value={form.country}
                  onChangeText={v => setField('country', v)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#2894c6"
                  style={sheetStyles.input}
                  dense
                />
              </View>
            </View>

            {/* Default toggle */}
            <TouchableOpacity
              style={sheetStyles.defaultRow}
              onPress={() => setField('isDefault', !form.isDefault)}
              activeOpacity={0.7}
            >
              <View style={[sheetStyles.checkbox, form.isDefault && sheetStyles.checkboxActive]}>
                {form.isDefault && <Icon name="check" size={ms(13)} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.defaultLabel}>Set as default address</Text>
                <Text style={sheetStyles.defaultSub}>This address will be pre-selected at checkout</Text>
              </View>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              style={[sheetStyles.saveBtn, saving && sheetStyles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name={isEdit ? 'content-save-outline' : 'map-marker-plus-outline'} size={ms(18)} color="#fff" />
                  <Text style={sheetStyles.saveBtnText}>
                    {isEdit ? 'Update Address' : 'Save Address'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: vs(20) }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Address Section ──────────────────────────────────────────────────────────
function AddressSection({ selectedId, onSelect, onAddressesLoaded }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const res = await fetch(`${BASE_URL}/user/profile/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        const list = json.data ?? []
        setAddresses(list)
        onAddressesLoaded(list)
        const def = list.find(a => a.isDefault) ?? list[0]
        if (def && !selectedId) onSelect(def.id)
      }
    } catch (err) {
      console.log('Fetch addresses error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAddresses() }, [])

  const handleSaved = useCallback(savedAddress => {
    fetchAddresses()
    onSelect(savedAddress.id)
  }, [fetchAddresses])

  const openEdit = addr => {
    setEditTarget(addr)
    setSheetVisible(true)
  }

  const openAdd = () => {
    setEditTarget(null)
    setSheetVisible(true)
  }

  return (
    <View style={styles.card}>
      {/* Section Header */}
      <View style={styles.cardHeader}>
        <Icon name="truck-delivery-outline" size={ms(22)} color="#0B77A7" />
        <Text style={styles.sectionTitle}>Delivery Address</Text>
      </View>

      {loading ? (
        <View style={addrStyles.loadingRow}>
          <ActivityIndicator size="small" color="#2894c6" />
          <Text style={addrStyles.loadingText}>Loading saved addresses...</Text>
        </View>
      ) : (
        <>
          {addresses.length > 0 ? (
            <View style={addrStyles.addressList}>
              {addresses.map(addr => {
                const isSelected = selectedId === addr.id
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[addrStyles.addrCard, isSelected && addrStyles.addrCardSelected]}
                    onPress={() => onSelect(addr.id)}
                    activeOpacity={0.8}
                  >
                    {/* Radio */}
                    <View style={addrStyles.radioCol}>
                      <View style={[addrStyles.radioOuter, isSelected && addrStyles.radioOuterActive]}>
                        {isSelected && <View style={addrStyles.radioInner} />}
                      </View>
                    </View>

                    {/* Content */}
                    <View style={addrStyles.addrContent}>
                      <View style={addrStyles.addrTopRow}>
                        <View style={[addrStyles.labelBadge, isSelected && addrStyles.labelBadgeActive]}>
                          <Icon name={getLabelIcon(addr.label)} size={ms(11)} color={isSelected ? '#fff' : '#555'} />
                          <Text style={[addrStyles.labelBadgeText, isSelected && addrStyles.labelBadgeTextActive]}>
                            {addr.label}
                          </Text>
                        </View>
                        {addr.isDefault && (
                          <View style={addrStyles.defaultBadge}>
                            <Icon name="star" size={ms(9)} color="#F59E0B" />
                            <Text style={addrStyles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => openEdit(addr)}
                          style={addrStyles.editBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Icon name="pencil-outline" size={ms(15)} color="#2894c6" />
                        </TouchableOpacity>
                      </View>

                      <Text style={addrStyles.addrLine1} numberOfLines={2}>
                        {addr.address?.addressLine1}
                      </Text>
                      <Text style={addrStyles.addrLine2}>
                        {[addr.address?.city, addr.address?.state, addr.address?.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>

                      <View style={addrStyles.contactRow}>
                        <Icon name="account-outline" size={ms(12)} color="#888" />
                        <Text style={addrStyles.contactText}>{addr.contactInfo?.name}</Text>
                        <View style={addrStyles.dotSep} />
                        <Icon name="phone-outline" size={ms(12)} color="#888" />
                        <Text style={addrStyles.contactText}>{addr.contactInfo?.phone}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : (
            <View style={addrStyles.emptyAddr}>
              <Icon name="map-marker-off-outline" size={ms(36)} color="#D1D5DB" />
              <Text style={addrStyles.emptyAddrText}>No saved addresses yet</Text>
              <Text style={addrStyles.emptyAddrSub}>Add one below to continue</Text>
            </View>
          )}

          {/* Add new address button */}
          <TouchableOpacity
            style={addrStyles.addAddrBtn}
            onPress={openAdd}
            activeOpacity={0.8}
          >
            <View style={addrStyles.addAddrIconWrap}>
              <Icon name="plus" size={ms(16)} color="#2894c6" />
            </View>
            <Text style={addrStyles.addAddrText}>Add New Address</Text>
            <Icon name="chevron-right" size={ms(16)} color="#2894c6" />
          </TouchableOpacity>
        </>
      )}

      <AddressBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSaved={handleSaved}
        editData={editTarget}
      />
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
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

  // ── Address state (saved addresses flow) ──────────────────────────────────
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressesCache, setAddressesCache] = useState([])

  // ── Profile state ─────────────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [businessId, setBusinessId] = useState(null)

  // ── Coupon / Dealer code ──────────────────────────────────────────────────
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

  // ── injectedItems = free gift items from preview ──────────────────────────
  const injectedItems = preview?.injectedItems ?? []
  const freeGiftItems = injectedItems.filter(i => i.isFreeGift)

  // ── Bootstrap: get businessId ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const id = await AsyncStorage.getItem('businessId')
      setBusinessId(id)
    }
    init()
  }, [])

  useEffect(() => {
    if (businessId) {
      fetchUserProfile()
    }
  }, [businessId])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
  }, [])

  const incrementQty = () => setQty(prev => prev + 1)
  const decrementQty = () => { if (qty > 1) setQty(prev => prev - 1) }

  // ── Profile helpers ───────────────────────────────────────────────────────
  const isProfileEmpty = (profile) => {
    if (!profile) return true

    const addressEmpty = !profile.address ||
      (!profile.address.addressLine1 &&
        !profile.address.city &&
        !profile.address.state &&
        !profile.address.postalCode)

    const userProfileEmpty = !profile.userProfile ||
      (!profile.userProfile.firstName &&
        !profile.userProfile.lastName &&
        !profile.userProfile.displayName &&
        !profile.userProfile.phone)

    return addressEmpty && userProfileEmpty
  }

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')

      const profileRes = await fetch(
        `${BASE_URL}/customer/business/${bId}/customer-business-profile`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const profileJson = await profileRes.json()
      console.log('Fetched profile in buy instant:', profileJson)

      if (profileJson?.success && profileJson?.data) {
        setUserProfile(profileJson.data)
      } else {
        setUserProfile(null)
      }
    } catch (err) {
      console.log('Error fetching user profile in buy instant:', err)
      setUserProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  // ── Fetch preview (with optional code) ───────────────────────────────────
  const fetchPreview = async (code = appliedCode) => {
    setLoading(true)
    const payload = {
      quantity: qty,
      ...(code ? { code } : {}),
    }
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${bId}/items/${itemId}/buy-now/preview`,
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

  // ── Apply code ────────────────────────────────────────────────────────────
  const applyCode = async type => {
    const code = (type === 'coupon' ? couponInput : dealerInput).trim()
    if (!code) { toast('Please enter a code'); return }

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

  // ── Remove code ───────────────────────────────────────────────────────────
  const removeCode = async () => {
    setAppliedCode(null)
    setAppliedCodeType(null)
    setCouponInput('')
    setDealerInput('')
    await fetchPreview(null)
    toast('Code removed')
  }

  // ── Place order ───────────────────────────────────────────────────────────
  const placeBuyNowOrder = async () => {
    if (placing) return

    // Profile check (same as CartScreen)
    if (isProfileEmpty(userProfile)) {
      toast('Please complete your profile first')
      navigation.navigate('ProfileInfoScreen')
      return
    }

    if (isDigital && !email) {
      toast('Please enter email for digital delivery')
      return
    }
    if (isDigital && !email.includes('@')) {
      toast('Please enter a valid email address')
      return
    }
    if (!isDigital && !selectedAddressId) {
      toast('Please select a delivery address')
      return
    }
    if (paymentMethod === 'COD' && isDigital) {
      toast('COD not available for digital items')
      return
    }

    try {
      setPlacing(true)
      const token = await AsyncStorage.getItem('userToken')
      const bId = businessId ?? await AsyncStorage.getItem('businessId')

      const selectedAddr = addressesCache.find(a => a.id === selectedAddressId)

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
                  line1: selectedAddr?.address?.addressLine1,
                  city: selectedAddr?.address?.city,
                  state: selectedAddr?.address?.state,
                  country: selectedAddr?.address?.country ?? 'India',
                  pincode: selectedAddr?.address?.postalCode,
                },
                contactSnapshot: {
                  name: selectedAddr?.contactInfo?.name,
                  phone: selectedAddr?.contactInfo?.phone,
                  email: email || '',
                },
              },
            ],
            itemType: 'physical',
          }),
        payment: { method: paymentMethod === 'ONLINE' ? 'RAZORPAY' : 'COD' },
      }

      console.log('BUY NOW ORDER PAYLOAD →', JSON.stringify(payload, null, 2))

      const res = await fetch(
        `${BASE_URL}/customer/business/${bId}/orders/${itemId}/place`,
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

      if (json.paymentMethod === 'RAZORPAY') {
        openRazorpay({
          razorpayOrder: json.razorpay,
          orderId: json.orderId,
          navigation,
          email: isDigital
            ? email
            : selectedAddr?.contactInfo?.email || '',
        })
        return
      }

      toast('Order placed successfully 🎉')
      navigation.navigate('ExploreInventoryScreen')
    } catch (e) {
      toast(e?.message || 'Order failed')
    } finally {
      setPlacing(false)
    }
  }

  // ── Derived preview values ────────────────────────────────────────────────
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

          {/* ── Product Card ──────────────────────────────────────────────── */}
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

            {/* ── Price Breakdown ───────────────────────────────────────── */}
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
                  {freeGiftItems.length > 0 && (
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

          {/* ── Skeleton for free gift while loading ─────────────────────── */}
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
            profileLoading ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="truck-delivery-outline" size={ms(22)} color="#0B77A7" />
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>
                <View style={addrStyles.loadingRow}>
                  <ActivityIndicator size="small" color="#2894c6" />
                  <Text style={addrStyles.loadingText}>Checking profile...</Text>
                </View>
              </View>
            ) : isProfileEmpty(userProfile) ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="truck-delivery-outline" size={ms(22)} color="#0B77A7" />
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>
                <View style={styles.incompleteProfileCard}>
                  <Icon name="account-alert-outline" size={ms(48)} color="#0B77A7" />
                  <Text style={styles.incompleteProfileTitle}>Profile Incomplete</Text>
                  <Text style={styles.incompleteProfileText}>
                    Please complete your profile to add delivery addresses and place orders
                  </Text>
                  <TouchableOpacity
                    style={styles.completeProfileBtn}
                    onPress={() => navigation.navigate('ProfileInfoScreen')}
                    activeOpacity={0.8}
                  >
                    <Icon name="account-edit-outline" size={ms(18)} color="#fff" />
                    <Text style={styles.completeProfileBtnText}>Complete Profile</Text>
                    <Icon name="arrow-right" size={ms(18)} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <AddressSection
                selectedId={selectedAddressId}
                onSelect={setSelectedAddressId}
                onAddressesLoaded={setAddressesCache}
              />
            )
          ) : (
            /* ── Digital Delivery ──────────────────────────────────────── */
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

          {/* ── Payment Method ────────────────────────────────────────────── */}
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

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'COD' && styles.paymentOptionActive,
                isDigital && styles.paymentOptionDisabled,
              ]}
              onPress={() => !isDigital && setPaymentMethod('COD')}
              disabled={isDigital}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[
                  styles.radioOuter,
                  paymentMethod === 'COD' && styles.radioOuterActive,
                  isDigital && styles.radioOuterDisabled,
                ]}>
                  {paymentMethod === 'COD' && !isDigital && <View style={styles.radioInner} />}
                </View>
                <Icon name="cash" size={22} color={isDigital ? '#ccc' : '#4CAF50'} />
                <View>
                  <Text style={[styles.paymentTitle, isDigital && styles.paymentDisabled]}>Cash on Delivery</Text>
                  <Text style={styles.paymentSubtitle}>
                    {isDigital ? 'Not available for digital items' : 'Pay when you receive'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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

// ─── Address Section Styles ───────────────────────────────────────────────────
const addrStyles = ScaledSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@s',
    paddingVertical: '12@vs',
  },
  loadingText: {
    fontSize: '13@ms',
    color: '#888',
    fontFamily: FONTS.Medium,
  },
  addressList: {
    gap: '10@vs',
    marginBottom: '12@vs',
  },
  addrCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '12@s',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: '12@ms',
    padding: '12@s',
    backgroundColor: '#FAFAFA',
  },
  addrCardSelected: {
    borderColor: '#2894c6',
    backgroundColor: '#F0F8FF',
  },
  radioCol: {
    paddingTop: '2@vs',
  },
  radioOuter: {
    width: '20@s',
    height: '20@s',
    borderRadius: '10@s',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#2894c6',
  },
  radioInner: {
    width: '10@s',
    height: '10@s',
    borderRadius: '5@s',
    backgroundColor: '#2894c6',
  },
  addrContent: {
    flex: 1,
  },
  addrTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    marginBottom: '6@vs',
    flexWrap: 'wrap',
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    backgroundColor: '#F3F4F6',
    borderRadius: '6@ms',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
  },
  labelBadgeActive: {
    backgroundColor: '#2894c6',
  },
  labelBadgeText: {
    fontSize: '11@ms',
    fontFamily: FONTS.Bold,
    color: '#555',
  },
  labelBadgeTextActive: {
    color: '#fff',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '3@s',
    backgroundColor: '#FFFBEB',
    borderRadius: '6@ms',
    paddingHorizontal: '6@s',
    paddingVertical: '3@vs',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  defaultBadgeText: {
    fontSize: '10@ms',
    fontFamily: FONTS.Bold,
    color: '#D97706',
  },
  editBtn: {
    marginLeft: 'auto',
    padding: '2@s',
  },
  addrLine1: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    lineHeight: '18@vs',
    marginBottom: '3@vs',
  },
  addrLine2: {
    fontSize: '12@ms',
    color: '#6B7280',
    fontFamily: FONTS.Medium,
    marginBottom: '6@vs',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    flexWrap: 'wrap',
  },
  contactText: {
    fontSize: '11@ms',
    color: '#9CA3AF',
    fontFamily: FONTS.Medium,
  },
  dotSep: {
    width: '3@s',
    height: '3@s',
    borderRadius: '2@s',
    backgroundColor: '#D1D5DB',
    marginHorizontal: '2@s',
  },
  emptyAddr: {
    alignItems: 'center',
    paddingVertical: '16@vs',
    gap: '4@vs',
  },
  emptyAddrText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#9CA3AF',
  },
  emptyAddrSub: {
    fontSize: '12@ms',
    color: '#C9D1DB',
    fontFamily: FONTS.Medium,
  },
  addAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@s',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: '12@ms',
    paddingVertical: '12@vs',
    paddingHorizontal: '14@s',
    backgroundColor: '#F0F8FF',
  },
  addAddrIconWrap: {
    width: '30@s',
    height: '30@s',
    borderRadius: '8@ms',
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAddrText: {
    flex: 1,
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#2894c6',
  },
})

// ─── Bottom Sheet Styles ──────────────────────────────────────────────────────
const sheetStyles = ScaledSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kavWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: '24@ms',
    borderTopRightRadius: '24@ms',
    maxHeight: SCREEN_HEIGHT * 0.9,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  handle: {
    width: '40@s',
    height: '4@vs',
    borderRadius: '2@ms',
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: '10@vs',
    marginBottom: '4@vs',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '20@s',
    paddingVertical: '14@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12@s',
  },
  sheetIconWrap: {
    width: '38@s',
    height: '38@s',
    borderRadius: '12@ms',
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
  },
  sheetSubtitle: {
    fontSize: '11@ms',
    color: '#9CA3AF',
    fontFamily: FONTS.Medium,
    marginTop: '1@vs',
  },
  closeBtn: {
    width: '36@s',
    height: '36@s',
    borderRadius: '18@s',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formScroll: {
    paddingHorizontal: '20@s',
    paddingTop: '14@vs',
  },
  fieldLabel: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    color: '#374151',
    marginBottom: '4@vs',
    marginTop: '6@vs',
  },
  required: {
    color: '#EF4444',
    fontSize: '13@ms',
  },
  labelRow: {
    flexDirection: 'row',
    gap: '8@s',
    flexWrap: 'wrap',
    marginBottom: '8@vs',
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '5@s',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: '8@ms',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    backgroundColor: '#F9FAFB',
  },
  labelChipActive: {
    borderColor: '#2894c6',
    backgroundColor: '#2894c6',
  },
  labelChipText: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    color: '#555',
  },
  labelChipTextActive: {
    color: '#fff',
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: '6@vs',
  },
  rowDouble: {
    flexDirection: 'row',
    gap: '10@s',
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '12@s',
    backgroundColor: '#F9FAFB',
    borderRadius: '12@ms',
    padding: '14@s',
    marginTop: '8@vs',
    marginBottom: '14@vs',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkbox: {
    width: '22@s',
    height: '22@s',
    borderRadius: '6@ms',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '1@vs',
  },
  checkboxActive: {
    backgroundColor: '#2894c6',
    borderColor: '#2894c6',
  },
  defaultLabel: {
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
  },
  defaultSub: {
    fontSize: '11@ms',
    color: '#9CA3AF',
    marginTop: '2@vs',
    fontFamily: FONTS.Medium,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10@s',
    backgroundColor: '#2894c6',
    borderRadius: '14@ms',
    paddingVertical: '14@vs',
    elevation: 3,
    shadowColor: '#2894c6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: '15@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
})

// ─── Free Gift Styles ─────────────────────────────────────────────────────────
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

// ─── Main Styles ──────────────────────────────────────────────────────────────
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

  // Free Gift Section
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
  paymentOptionDisabled: { opacity: 0.5, backgroundColor: '#FAFAFA' },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s', flex: 1 },
  radioOuter: { width: '22@s', height: '22@s', borderRadius: '11@s', borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: '#0B77A7' },
  radioOuterDisabled: { borderColor: '#E0E0E0' },
  radioInner: { width: '12@s', height: '12@s', borderRadius: '6@s', backgroundColor: '#0B77A7' },
  paymentTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a' },
  paymentSubtitle: { fontSize: '12@ms', color: '#666', marginTop: '2@vs' },
  paymentDisabled: { color: '#bbb' },

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

  // Incomplete profile card
  incompleteProfileCard: {
    alignItems: 'center',
    paddingVertical: '24@vs',
    paddingHorizontal: '20@s',
    backgroundColor: '#e1ecff',
    borderRadius: '12@ms',
    borderWidth: 1.5,
    borderColor: '#82b4ff',
    marginTop: '8@vs',
  },
  incompleteProfileTitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
    marginTop: '12@vs',
    marginBottom: '6@vs',
  },
  incompleteProfileText: {
    fontSize: '13@ms',
    color: '#666',
    textAlign: 'center',
    lineHeight: '20@vs',
    marginBottom: '18@vs',
    fontFamily: FONTS.Medium,
  },
  completeProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    backgroundColor: '#0B77A7',
    paddingHorizontal: '20@s',
    paddingVertical: '12@vs',
    borderRadius: '25@ms',
    elevation: 3,
    shadowColor: '#0B77A7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  completeProfileBtnText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
})