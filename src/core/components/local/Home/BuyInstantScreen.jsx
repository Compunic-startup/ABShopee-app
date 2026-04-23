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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { StyleSheet } from 'react-native'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import { openRazorpay } from '../../global/razorpaymodule'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'
import color from '../../../utils/color'
import { SafeAreaView } from 'react-native-safe-area-context'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ─── Label icons ──────────────────────────────────────────────────────────────
const LABEL_ICONS = { home: 'home-outline', office: 'briefcase-outline', work: 'briefcase-outline', other: 'map-marker-outline' }
const getLabelIcon = label => LABEL_ICONS[label] ?? 'map-marker-outline'

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonBox({ width, height, borderRadius = 6, style }) {
  const pulse = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.75, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ])).start()
  }, [])
  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: color.primary + 20, opacity: pulse }, style]} />
  )
}

function PriceBreakdownSkeleton() {
  const rows = [{ l: 130, r: 70 }, { l: 160, r: 80 }, { l: 110, r: 60 }, { l: 145, r: 75 }, { l: 120, r: 65 }]
  return (
    <View style={{ gap: vs(14), paddingVertical: vs(6) }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox width={r.l} height={13} />
          <SkeletonBox width={r.r} height={13} />
        </View>
      ))}
    </View>
  )
}

// ─── Free Gift Card ───────────────────────────────────────────────────────────
function FreeGiftCard({ item }) {
  return (
    <View style={fg.card}>
      <View style={fg.topBar} />
      <View style={fg.inner}>
        <View style={fg.imgWrap}>
          <Image source={item.media?.url ? { uri: item.media.url } : noimage} style={fg.img} />
          <View style={fg.badgeWrap}>
            <View style={fg.badge}>
              <Icon name="gift" size={ms(9)} color="#fff" />
              <Text style={fg.badgeText}>FREE</Text>
            </View>
          </View>
        </View>
        <View style={fg.details}>
          <Text style={fg.title} numberOfLines={2}>{item.itemSnapshot?.title}</Text>
          <View style={fg.footer}>
            <View style={fg.qtyPill}>
              <Icon name="package-variant" size={ms(11)} color={color.primary} />
              <Text style={fg.qtyText}>Qty: {item.quantity}</Text>
            </View>
            <View style={fg.complPill}>
              <Icon name="check-circle" size={ms(11)} color="#fff" />
              <Text style={fg.complText}>Complimentary</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={fg.note}>
        <Icon name="information-outline" size={ms(12)} color={color.primary} />
        <Text style={fg.noteText}>This item is a free gift and cannot be modified</Text>
      </View>
    </View>
  )
}

// ─── Address Bottom Sheet ─────────────────────────────────────────────────────
function AddressBottomSheet({ visible, onClose, onSaved, editData }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropAnim = useRef(new Animated.Value(0)).current
  const [saving, setSaving] = useState(false)
  const isEdit = !!editData

  const [form, setForm] = useState({ label: '', name: '', phone: '', line1: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false })

  // Populate form — logic unchanged
  useEffect(() => {
    if (editData) {
      setForm({ label: editData.label ?? '', name: editData.contactInfo?.name ?? '', phone: editData.contactInfo?.phone ?? '', line1: editData.address?.line1 ?? '', city: editData.address?.city ?? '', state: editData.address?.state ?? '', postalCode: editData.address?.postalCode ?? '', country: editData.address?.country ?? 'India', isDefault: editData.isDefault ?? false })
    } else {
      setForm({ label: '', name: '', phone: '', line1: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false })
    }
  }, [editData, visible])

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const validate = () => {
    const { label, name, phone, line1, city, state, postalCode } = form
    if (!label.trim()) { ToastAndroid.show('Label is required', ToastAndroid.SHORT); return false }
    if (!name.trim()) { ToastAndroid.show('Contact name is required', ToastAndroid.SHORT); return false }
    if (!phone.trim() || phone.trim().length < 10) { ToastAndroid.show('Enter a valid 10-digit phone number', ToastAndroid.SHORT); return false }
    if (!line1.trim()) { ToastAndroid.show('Address line 1 is required', ToastAndroid.SHORT); return false }
    if (!city.trim()) { ToastAndroid.show('City is required', ToastAndroid.SHORT); return false }
    if (!state.trim()) { ToastAndroid.show('State is required', ToastAndroid.SHORT); return false }
    if (!postalCode.trim() || postalCode.trim().length < 4) { ToastAndroid.show('Enter a valid postal code', ToastAndroid.SHORT); return false }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      setSaving(true)
      const token = await AsyncStorage.getItem('userToken')
      const payload = {
        label: form.label.trim(),
        address: { addressLine1: form.line1.trim(), city: form.city.trim(), state: form.state.trim(), postalCode: form.postalCode.trim(), country: form.country.trim() || 'India' },
        contactInfo: { name: form.name.trim(), phone: form.phone.trim() },
        isDefault: form.isDefault,
      }
      const url = isEdit ? `${BASE_URL}/user/profile/addresses/${editData.id}` : `${BASE_URL}/user/profile/addresses`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok || !json.success) throw json
      ToastAndroid.show(isEdit ? 'Address updated!' : 'Address saved!', ToastAndroid.SHORT)
      onSaved(json.data)
      onClose()
    } catch (err) {
      ToastAndroid.show(err?.error?.message || err?.message || 'Failed to save address', ToastAndroid.LONG)
    } finally {
      setSaving(false)
    }
  }

  const LABEL_OPTIONS = ['home', 'office', 'other']

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[sh.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={sh.kavWrap} pointerEvents="box-none">
        <Animated.View style={[sh.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={sh.handle} />

          {/* Sheet header */}
          <View style={sh.sheetHead}>
            <View style={sh.sheetHeadLeft}>
              <View style={sh.sheetIconWrap}>
                <Icon name={isEdit ? 'pencil-outline' : 'map-marker-plus-outline'} size={ms(18)} color={color.primary} />
              </View>
              <View>
                <Text style={sh.sheetTitle}>{isEdit ? 'Edit Address' : 'Add New Address'}</Text>
                <Text style={sh.sheetSub}>{isEdit ? 'Update your saved address' : 'Fields marked * are required'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={sh.closeBtn} activeOpacity={0.7}>
              <Icon name="close" size={ms(20)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sh.formScroll} keyboardShouldPersistTaps="handled">
            {/* Label */}
            <Text style={sh.fieldLabel}>Label <Text style={sh.required}>*</Text></Text>
            <View style={sh.labelRow}>
              {LABEL_OPTIONS.map(opt => (
                <TouchableOpacity key={opt} style={[sh.labelChip, form.label === opt && sh.labelChipActive]} onPress={() => setField('label', opt)} activeOpacity={0.7}>
                  <Icon name={getLabelIcon(opt)} size={ms(14)} color={form.label === opt ? '#fff' : '#555'} />
                  <Text style={[sh.labelChipText, form.label === opt && sh.labelChipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
              {!LABEL_OPTIONS.includes(form.label) && form.label !== '' && (
                <View style={[sh.labelChip, sh.labelChipActive]}>
                  <Icon name="map-marker-outline" size={ms(14)} color="#fff" />
                  <Text style={sh.labelChipTextActive}>{form.label}</Text>
                </View>
              )}
            </View>

            <Text style={sh.fieldLabel}>Contact Name <Text style={sh.required}>*</Text></Text>
            <TextInput mode="outlined" label="Full Name *" placeholder="John Doe" placeholderTextColor="#bbb" value={form.name} onChangeText={v => setField('name', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} left={<TextInput.Icon icon="account-outline" color="#aaa" />} style={sh.input} dense />

            <Text style={sh.fieldLabel}>Phone <Text style={sh.required}>*</Text></Text>
            <TextInput mode="outlined" label="Phone Number *" placeholder="9876543210" placeholderTextColor="#bbb" value={form.phone} onChangeText={v => setField('phone', v)} keyboardType="phone-pad" maxLength={13} outlineColor="#E0E0E0" activeOutlineColor={color.primary} left={<TextInput.Icon icon="phone-outline" color="#aaa" />} style={sh.input} dense />

            <Text style={sh.fieldLabel}>Address <Text style={sh.required}>*</Text></Text>
            <TextInput mode="outlined" label="Address Line 1 *" placeholder="House/Flat No., Street" placeholderTextColor="#bbb" value={form.line1} onChangeText={v => setField('line1', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} left={<TextInput.Icon icon="home-outline" color="#aaa" />} style={sh.input} dense />

            <View style={sh.rowDouble}>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>City <Text style={sh.required}>*</Text></Text>
                <TextInput mode="outlined" label="City *" placeholder="Mumbai" placeholderTextColor="#bbb" value={form.city} onChangeText={v => setField('city', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} style={sh.input} dense />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>State <Text style={sh.required}>*</Text></Text>
                <TextInput mode="outlined" label="State *" placeholder="Maharashtra" placeholderTextColor="#bbb" value={form.state} onChangeText={v => setField('state', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} style={sh.input} dense />
              </View>
            </View>

            <View style={sh.rowDouble}>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Postal Code <Text style={sh.required}>*</Text></Text>
                <TextInput mode="outlined" label="Postal Code *" placeholder="400001" placeholderTextColor="#bbb" value={form.postalCode} onChangeText={v => setField('postalCode', v)} keyboardType="number-pad" maxLength={10} outlineColor="#E0E0E0" activeOutlineColor={color.primary} style={sh.input} dense />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Country</Text>
                <TextInput mode="outlined" label="Country" placeholder="India" placeholderTextColor="#bbb" value={form.country} onChangeText={v => setField('country', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} style={sh.input} dense />
              </View>
            </View>

            <TouchableOpacity style={sh.defaultRow} onPress={() => setField('isDefault', !form.isDefault)} activeOpacity={0.7}>
              <View style={[sh.checkbox, form.isDefault && sh.checkboxActive]}>
                {form.isDefault && <Icon name="check" size={ms(13)} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.defaultLabel}>Set as default address</Text>
                <Text style={sh.defaultSub}>This address will be pre-selected at checkout</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[sh.saveBtn, saving && sh.saveBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                  <Icon name={isEdit ? 'content-save-outline' : 'map-marker-plus-outline'} size={ms(18)} color="#fff" />
                  <Text style={sh.saveBtnText}>{isEdit ? 'Update Address' : 'Save Address'}</Text>
                </>
              }
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
      const res = await fetch(`${BASE_URL}/user/profile/addresses`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) {
        const list = json.data ?? []
        setAddresses(list)
        onAddressesLoaded(list)
        const def = list.find(a => a.isDefault) ?? list[0]
        if (def && !selectedId) onSelect(def.id)
      }
    } catch (err) { console.log('Fetch addresses error', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAddresses() }, [])
  const handleSaved = useCallback(savedAddr => { fetchAddresses(); onSelect(savedAddr.id) }, [fetchAddresses])
  const openEdit = addr => { setEditTarget(addr); setSheetVisible(true) }
  const openAdd = () => { setEditTarget(null); setSheetVisible(true) }

  return (
    <View style={S.card}>
      <View style={S.cardHeader}>
        <Icon name="truck-delivery-outline" size={ms(20)} color={color.primary} />
        <Text style={S.sectionTitle}>Delivery Address</Text>
      </View>

      {loading ? (
        <View style={addr.loadingRow}>
          <ActivityIndicator size="small" color={color.primary} />
          <Text style={addr.loadingText}>Loading saved addresses…</Text>
        </View>
      ) : (
        <>
          {addresses.length > 0 ? (
            <View style={addr.addrList}>
              {addresses.map(a => {
                const sel = selectedId === a.id
                return (
                  <TouchableOpacity key={a.id} style={[addr.addrCard, sel && addr.addrCardSel]} onPress={() => onSelect(a.id)} activeOpacity={0.8}>
                    {/* Radio */}
                    <View style={addr.radioCol}>
                      <View style={[addr.radioOuter, sel && addr.radioOuterActive]}>
                        {sel && <View style={addr.radioInner} />}
                      </View>
                    </View>
                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <View style={addr.addrTopRow}>
                        <View style={[addr.labelBadge, sel && addr.labelBadgeActive]}>
                          <Icon name={getLabelIcon(a.label)} size={ms(11)} color={sel ? '#fff' : '#555'} />
                          <Text style={[addr.labelBadgeText, sel && addr.labelBadgeTextActive]}>{a.label}</Text>
                        </View>
                        {a.isDefault && (
                          <View style={addr.defaultBadge}>
                            <Icon name="star" size={ms(9)} color="#F59E0B" />
                            <Text style={addr.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => openEdit(a)} style={addr.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Icon name="pencil-outline" size={ms(15)} color={color.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={addr.line1} numberOfLines={2}>{a.address?.addressLine1}</Text>
                      <Text style={addr.line2}>{[a.address?.city, a.address?.state, a.address?.postalCode].filter(Boolean).join(', ')}</Text>
                      <View style={addr.contactRow}>
                        <Icon name="account-outline" size={ms(12)} color="#888" />
                        <Text style={addr.contactText}>{a.contactInfo?.name}</Text>
                        <View style={addr.dotSep} />
                        <Icon name="phone-outline" size={ms(12)} color="#888" />
                        <Text style={addr.contactText}>{a.contactInfo?.phone}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : (
            <View style={addr.emptyAddr}>
              <Icon name="map-marker-off-outline" size={ms(36)} color="#BDBDBD" />
              <Text style={addr.emptyText}>No saved addresses yet</Text>
              <Text style={addr.emptySub}>Add one below to continue</Text>
            </View>
          )}

          <TouchableOpacity style={addr.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <View style={addr.addIconWrap}>
              <Icon name="plus" size={ms(16)} color={color.primary} />
            </View>
            <Text style={addr.addText}>Add New Address</Text>
            <Icon name="chevron-right" size={ms(16)} color={color.primary} />
          </TouchableOpacity>
        </>
      )}

      <AddressBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} onSaved={handleSaved} editData={editTarget} />
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

  const { itemId, product, selectedAttributes = [], quantity = 1, isDigital } = params

  const [qty, setQty] = useState(quantity)
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')

  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressesCache, setAddressesCache] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [businessId, setBusinessId] = useState(null)

  const [showCouponInput, setShowCouponInput] = useState(false)
  const [showDealerInput, setShowDealerInput] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [dealerInput, setDealerInput] = useState('')
  const [appliedCode, setAppliedCode] = useState(null)
  const [appliedCodeType, setAppliedCodeType] = useState(null)
  const [applyingCode, setApplyingCode] = useState(false)

  const toast = msg => ToastAndroid.show(msg, ToastAndroid.SHORT)

  const price = product.prices?.[0]?.amount || 0
  const image = product.media?.find(m => m.role === 'primary')?.url || product.media?.[0]?.url

  const injectedItems = preview?.injectedItems ?? []
  const freeGiftItems = injectedItems.filter(i => i.isFreeGift)

  // ── All logic unchanged ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => { const id = await AsyncStorage.getItem('businessId'); setBusinessId(id) }
    init()
  }, [])

  useEffect(() => { if (businessId) fetchUserProfile() }, [businessId])

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }, [fadeAnim])

  const incrementQty = () => setQty(prev => prev + 1)
  const decrementQty = () => { if (qty > 1) setQty(prev => prev - 1) }

  const isProfileEmpty = profile => {
    if (!profile) return true
    const addrEmpty = !profile.address || !profile.address.addressLine1 || !profile.address.city || !profile.address.state || !profile.address.postalCode
    const upEmpty = !profile.userProfile || !profile.userProfile.firstName || !profile.userProfile.phone
    return addrEmpty || upEmpty
  }

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${bId}/customer-business-profile`, { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setUserProfile(json?.success && json?.data ? json.data : null)
    } catch (err) { console.log('Error fetching profile:', err); setUserProfile(null) }
    finally { setProfileLoading(false) }
  }


  const fetchPreview = async (code = appliedCode) => {
    setLoading(true)
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${bId}/items/${itemId}/buy-now/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: qty, ...(code ? { code } : {}) }),
      })
      const json = await res.json()
      if (!res.ok) throw json
      setPreview(json.data)
      return json
    } catch (err) { toast(err?.message || 'Unable to load item') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPreview() }, [qty])

  const applyCode = async type => {
    const code = (type === 'coupon' ? couponInput : dealerInput).trim()
    if (!code) { toast('Please enter a code'); return }
    try {
      setApplyingCode(true)
      const json = await fetchPreview(code)
      if (json?.data) {
        setAppliedCode(code); setAppliedCodeType(type)
        setShowCouponInput(false); setShowDealerInput(false)
        toast(type === 'coupon' ? 'Coupon applied! 🎉' : 'Dealer code applied! 🎉')
      } else { toast('Invalid code, please try again') }
    } catch (err) { toast(err?.message || 'Failed to apply code') }
    finally { setApplyingCode(false) }
  }

  const removeCode = async () => {
    setAppliedCode(null); setAppliedCodeType(null); setCouponInput(''); setDealerInput('')
    await fetchPreview(null); toast('Code removed')
  }

  const placeBuyNowOrder = async () => {
    if (placing) return
    if (isProfileEmpty(userProfile)) { toast('Please complete your profile first'); navigation.navigate('ProfileInfoScreen'); return }
    if (!isDigital && !selectedAddressId) { toast('Please select a delivery address'); return }
    if (paymentMethod === 'COD' && isDigital) { toast('COD not available for digital items'); return }

    try {
      setPlacing(true)
      const token = await AsyncStorage.getItem('userToken')
      const bId = businessId ?? await AsyncStorage.getItem('businessId')
      const selectedAddr = addressesCache.find(a => a.id === selectedAddressId)

      const payload = {
        quantity: qty,
        selectedAttributes,
        ...(appliedCode ? { code: appliedCode } : {}),
        ...(isDigital
          ? { itemType: 'digital', email: finalEmail }
          : {
            addresses: [{
              type: 'shipping',
              addressSnapshot: { line1: selectedAddr?.address?.addressLine1, city: selectedAddr?.address?.city, state: selectedAddr?.address?.state, country: selectedAddr?.address?.country ?? 'India', pincode: selectedAddr?.address?.postalCode },
              contactSnapshot: { name: selectedAddr?.contactInfo?.name, phone: selectedAddr?.contactInfo?.phone, email: selectedAddr?.contactInfo?.email || userProfile?.email || '' },
            }],
            itemType: 'physical',
          }),
        payment: { method: paymentMethod === 'ONLINE' ? 'RAZORPAY' : 'COD' },
      }

      const res = await fetch(`${BASE_URL}/customer/business/${bId}/orders/${itemId}/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw json

      // Handle bulk digital order approval workflow
      if (json.status === 'pending_approval') {
        if (!json.orderId) {
          toast('Order created but ID missing. Please contact support.')
          return
        }
        navigation.navigate('OrderPendingApprovalScreen', { orderId: json.orderId })
        return
      }

      if (json.paymentMethod === 'RAZORPAY') {
        const razorpayEmail = finalEmail || 'customer@example.com'
        console.log('Passing email to Razorpay:', razorpayEmail)
        openRazorpay({ razorpayOrder: json.razorpay, orderId: json.orderId, navigation, email: razorpayEmail })
        return
      }
      toast('Order placed successfully 🎉')
      navigation.navigate('ExploreInventoryScreen')
    } catch (e) { toast(e?.message || 'Order failed') }
    finally { setPlacing(false) }
  }

  useFocusEffect(useCallback(() => { fetchUserProfile() }, []))
  useEffect(() => {
    if (userProfile?.email) {
      setEmail(userProfile.userProfile.email)
    }
  }, [userProfile])

  const finalEmail = email || userProfile?.email || ''

  // Derived preview values
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
    <KeyboardAvoidingView style={S.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />
      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Checkout</Text>
        <View style={S.headerRight}>
          <Icon name="lock-outline" size={ms(18)} color="#fff" />
          <Text style={S.secureText}>Secure</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(120) }}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Order Summary card ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Icon name="package-variant" size={ms(20)} color={color.primary} />
              <Text style={S.sectionTitle}>Order Summary</Text>
            </View>

            {/* Product row */}
            <View style={S.productRow}>
              <View style={S.imgBox}>
                <Image source={image ? { uri: image } : noimage} style={S.productImg} />
                {isDigital && (
                  <View style={S.digitalBadge}>
                    <Icon name="download" size={ms(10)} color="#fff" />
                    <Text style={S.digitalBadgeText}>Digital</Text>
                  </View>
                )}
              </View>
              <View style={S.productInfo}>
                <Text style={S.productTitle} numberOfLines={2}>{product.title}</Text>
                {product.category && (
                  <View style={S.catBadge}>
                    <Icon name="tag-outline" size={ms(11)} color="#888" />
                    <Text style={S.catText}>{product.category}</Text>
                  </View>
                )}
                {hasDiscount ? (
                  <View style={S.unitPriceRow}>
                    <Text style={S.unitPriceStrike}>₹{unitPrice}</Text>
                    <Text style={S.unitPriceDisc}>₹{discountedUnitPrice} / unit</Text>
                  </View>
                ) : (
                  <Text style={S.unitPrice}>₹{unitPrice} / unit</Text>
                )}
              </View>
            </View>

            {/* Qty stepper */}
            <View style={S.qtySection}>
              <Text style={S.qtyLabel}>Quantity</Text>
              <View style={S.qtyBox}>
                <TouchableOpacity onPress={decrementQty} style={S.qtyBtn} activeOpacity={0.7}>
                  <Icon name="minus" size={ms(17)} color={color.primary} />
                </TouchableOpacity>
                <View style={S.qtyDisplay}>
                  <Text style={S.qtyText}>{qty}</Text>
                </View>
                <TouchableOpacity onPress={incrementQty} style={S.qtyBtn} activeOpacity={0.7}>
                  <Icon name="plus" size={ms(17)} color={color.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={S.divider} />

            {/* Price breakdown */}
            {loading ? <PriceBreakdownSkeleton /> : (
              <View style={S.priceBreakdown}>
                <View style={S.priceRow}>
                  <Text style={S.priceLabel}>Item Total (MRP)</Text>
                  <Text style={S.priceVal}>₹{baseSubtotal.toFixed(2)}</Text>
                </View>

                {hasDiscount && (
                  <>
                    {discountSummary.map((d, i) => (
                      <View key={i} style={S.priceRow}>
                        <View style={S.discLabelRow}>
                          <Icon name="tag" size={ms(12)} color="#2E7D32" />
                          <Text style={S.discLabel} numberOfLines={1}>{d.name}</Text>
                        </View>
                        <Text style={S.discVal}>-₹{d.totalApplied.toFixed(2)}</Text>
                      </View>
                    ))}
                    <View style={S.priceRow}>
                      <Text style={S.priceLabel}>Price after discount</Text>
                      <Text style={S.priceVal}>₹{finalSubtotal.toFixed(2)}</Text>
                    </View>
                  </>
                )}

                {appliedCode && (
                  <View style={S.priceRow}>
                    <Text style={[S.priceLabel, { color: '#2E7D32' }]}>
                      {appliedCodeType === 'coupon' ? 'Coupon' : 'Dealer Code'} ({appliedCode})
                    </Text>
                    <Text style={[S.priceVal, { color: '#2E7D32' }]}>Applied ✓</Text>
                  </View>
                )}

                {freeGiftItems.length > 0 && (
                  <View style={S.priceRow}>
                    <View style={S.discLabelRow}>
                      <Icon name="gift" size={ms(12)} color={color.primary} />
                      <Text style={[S.priceLabel, { color: color.primary, marginLeft: s(4) }]}>
                        Free Gift{freeGiftItems.length > 1 ? 's' : ''} ({freeGiftItems.length})
                      </Text>
                    </View>
                    <Text style={[S.priceVal, { color: color.primary, fontFamily: FONTS.Bold }]}>FREE</Text>
                  </View>
                )}

                <View style={S.priceRow}>
                  <Text style={S.priceLabel}>Delivery Charges</Text>
                  <Text style={S.priceFree}>FREE</Text>
                </View>

                {activeTaxComponents.length > 0 && (
                  <>
                    <View style={S.taxHeader}>
                      <Icon name="receipt" size={ms(12)} color="#888" />
                      <Text style={S.taxHeaderText}>Taxes ({taxMode === 'exclusive' ? 'excluded from price' : 'included in price'})</Text>
                    </View>
                    {activeTaxComponents.map(([key, val]) => (
                      <View key={key} style={S.priceRow}>
                        <Text style={S.taxLabel}>{key.toUpperCase()} @ {val.rate}%</Text>
                        <Text style={S.taxVal}>₹{val.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                    <View style={S.priceRow}>
                      <Text style={S.priceLabel}>Total Tax</Text>
                      <Text style={S.priceVal}>₹{taxTotal.toFixed(2)}</Text>
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={S.divider} />

            {/* Total */}
            <View style={S.totalRow}>
              <View>
                <Text style={S.totalLabel}>Total Amount</Text>
                {!loading && hasDiscount && <Text style={S.savingsNote}>You save ₹{totalDiscount.toFixed(2)}!</Text>}
              </View>
              {loading
                ? <SkeletonBox width={110} height={28} borderRadius={8} />
                : <Text style={S.totalAmt}>₹{totalPayable.toFixed(2)}</Text>
              }
            </View>
          </View>

          {/* ── Free gifts ── */}
          {!loading && freeGiftItems.length > 0 && (
            <View style={S.freeGiftSection}>
              <View style={S.freeGiftHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                  <Icon name="gift-open" size={ms(18)} color={color.primary} />
                  <Text style={S.freeGiftTitle}>Your Free Gift{freeGiftItems.length > 1 ? 's' : ''}</Text>
                </View>
                <View style={S.freeGiftCountPill}>
                  <Text style={S.freeGiftCountText}>{freeGiftItems.length}</Text>
                </View>
              </View>
              {freeGiftItems.map(item => <FreeGiftCard key={item.cartItemId} item={item} />)}
            </View>
          )}

          {loading && (
            <View style={[S.freeGiftSection, { opacity: 0.5 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: vs(10) }}>
                <SkeletonBox width={20} height={20} borderRadius={10} />
                <SkeletonBox width={140} height={14} />
              </View>
              <SkeletonBox width="100%" height={100} borderRadius={10} />
            </View>
          )}

          {/* ── Offers card ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Icon name="ticket-percent-outline" size={ms(20)} color={color.primary} />
              <Text style={S.sectionTitle}>Offers & Discounts</Text>
            </View>

            {appliedCode && (
              <View style={S.appliedBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
                  <Icon name={appliedCodeType === 'coupon' ? 'ticket-confirmation' : 'star-circle'} size={ms(18)} color="#2E7D32" />
                  <View>
                    <Text style={S.appliedLabel}>{appliedCodeType === 'coupon' ? 'Coupon' : 'Dealer Code'} Applied</Text>
                    <Text style={S.appliedCode}>{appliedCode}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={removeCode} style={{ padding: s(4) }}>
                  <Icon name="close-circle" size={ms(20)} color="#C62828" />
                </TouchableOpacity>
              </View>
            )}

            {appliedCodeType !== 'dealer' && (
              <>
                <TouchableOpacity style={S.offerRow} onPress={() => { if (appliedCodeType === 'coupon') return; setShowCouponInput(p => !p); setShowDealerInput(false) }} activeOpacity={0.7}>
                  <View style={S.offerLeft}>
                    <Icon name="ticket-confirmation-outline" size={ms(20)} color="#E65100" />
                    <Text style={S.offerText}>{appliedCodeType === 'coupon' ? 'Coupon Applied ✓' : 'Apply Coupon Code'}</Text>
                  </View>
                  {appliedCodeType !== 'coupon' && <Icon name={showCouponInput ? 'chevron-up' : 'chevron-right'} size={ms(20)} color="#BDBDBD" />}
                </TouchableOpacity>
                {showCouponInput && !appliedCode && (
                  <View style={S.codeRow}>
                    <RNTextInput style={S.codeInput} placeholder="Enter coupon code" placeholderTextColor="#BDBDBD" value={couponInput} onChangeText={setCouponInput} autoCapitalize="characters" />
                    <TouchableOpacity style={[S.applyBtn, (!couponInput.trim() || applyingCode) && S.applyBtnDis]} disabled={!couponInput.trim() || applyingCode} onPress={() => applyCode('coupon')} activeOpacity={0.8}>
                      {applyingCode ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.applyBtnText}>Apply</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <View style={S.offerDivider} />

            {appliedCodeType !== 'coupon' && (
              <>
                <TouchableOpacity style={S.offerRow} onPress={() => { if (appliedCodeType === 'dealer') return; setShowDealerInput(p => !p); setShowCouponInput(false) }} activeOpacity={0.7}>
                  <View style={S.offerLeft}>
                    <Icon name="star-circle-outline" size={ms(20)} color="#2E7D32" />
                    <Text style={S.offerText}>{appliedCodeType === 'dealer' ? 'Dealer Code Applied ✓' : 'Use Dealer Code'}</Text>
                  </View>
                  {appliedCodeType !== 'dealer' && <Icon name={showDealerInput ? 'chevron-up' : 'chevron-right'} size={ms(20)} color="#BDBDBD" />}
                </TouchableOpacity>
                {showDealerInput && !appliedCode && (
                  <View style={S.codeRow}>
                    <RNTextInput style={S.codeInput} placeholder="Enter dealer code" placeholderTextColor="#BDBDBD" value={dealerInput} onChangeText={setDealerInput} autoCapitalize="characters" />
                    <TouchableOpacity style={[S.applyBtn, (!dealerInput.trim() || applyingCode) && S.applyBtnDis]} disabled={!dealerInput.trim() || applyingCode} onPress={() => applyCode('dealer')} activeOpacity={0.8}>
                      {applyingCode ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.applyBtnText}>Apply</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          {/* ── Address / Digital ── */}
          {!isDigital ? (
            profileLoading ? (
              <View style={S.card}>
                <View style={S.cardHeader}>
                  <Icon name="truck-delivery-outline" size={ms(20)} color={color.primary} />
                  <Text style={S.sectionTitle}>Delivery Address</Text>
                </View>
                <View style={addr.loadingRow}>
                  <ActivityIndicator size="small" color={color.primary} />
                  <Text style={addr.loadingText}>Checking profile…</Text>
                </View>
              </View>
            ) : isProfileEmpty(userProfile) ? (
              <View style={S.card}>
                <View style={S.cardHeader}>
                  <Icon name="truck-delivery-outline" size={ms(20)} color={color.primary} />
                  <Text style={S.sectionTitle}>Delivery Address</Text>
                </View>
                <View style={S.incompleteCard}>
                  <Icon name="account-alert-outline" size={ms(44)} color={color.primary} />
                  <Text style={S.incompleteTitle}>Profile Incomplete</Text>
                  <Text style={S.incompleteText}>Please complete your profile to add delivery addresses and place orders</Text>
                  <TouchableOpacity style={S.completeProfBtn} onPress={() => navigation.navigate('ProfileInfoScreen')} activeOpacity={0.8}>
                    <Icon name="account-edit-outline" size={ms(17)} color="#fff" />
                    <Text style={S.completeProfText}>Complete Profile</Text>
                    <Icon name="arrow-right" size={ms(17)} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <AddressSection selectedId={selectedAddressId} onSelect={setSelectedAddressId} onAddressesLoaded={setAddressesCache} />
            )
          ) : (
            <View style={S.card}>
              <View style={S.cardHeader}>
                <Icon name="email-outline" size={ms(20)} color={color.primary} />
                <Text style={S.sectionTitle}>Digital Delivery</Text>
              </View>
              <View style={S.digitalInfoBox}>
                <Icon name="download-circle" size={ms(20)} color={color.primary} />
                <Text style={S.digitalInfoText}>Digital Product Keys will be sent on your registered email (Check Your Spam Folder, If not found in Inbox)</Text>
              </View>
              <View style={S.digitalDeliveryNote}>
                <Icon name="whatsapp" size={22} color={color.GREEN} style={{ alignSelf: 'center' }} />
                <Text style={S.digitalDeliveryNoteText}>
                  You'll also receive the digital keys on your registered phone number via Whatsapp.
                </Text>
              </View>
            </View>
          )}

          {/* ── Payment method ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Icon name="credit-card-outline" size={ms(20)} color={color.primary} />
              <Text style={S.sectionTitle}>Payment Method</Text>
            </View>

            <TouchableOpacity style={[S.payOption, paymentMethod === 'ONLINE' && S.payOptionActive]} onPress={() => setPaymentMethod('ONLINE')} activeOpacity={0.7}>
              <View style={S.payLeft}>
                <View style={[S.radio, paymentMethod === 'ONLINE' && S.radioActive]}>
                  {paymentMethod === 'ONLINE' && <View style={S.radioInner} />}
                </View>
                <Icon name="cellphone" size={ms(22)} color={color.primary} />
                <View>
                  <Text style={S.payTitle}>Pay Online</Text>
                  <Text style={S.paySub}>UPI, Cards, Net Banking, Wallets</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.payOption, paymentMethod === 'COD' && S.payOptionActive, isDigital && S.payOptionDis]}
              onPress={() => !isDigital && setPaymentMethod('COD')}
              disabled={isDigital}
              activeOpacity={0.7}
            >
              <View style={S.payLeft}>
                <View style={[S.radio, paymentMethod === 'COD' && S.radioActive, isDigital && S.radioDis]}>
                  {paymentMethod === 'COD' && !isDigital && <View style={S.radioInner} />}
                </View>
                <Icon name="cash" size={ms(22)} color={isDigital ? '#BDBDBD' : '#2E7D32'} />
                <View>
                  <Text style={[S.payTitle, isDigital && { color: '#BDBDBD' }]}>Cash on Delivery</Text>
                  <Text style={S.paySub}>{isDigital ? 'Not available for digital items' : 'Pay when you receive'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Security banner */}
          <View style={S.securityBanner}>
            <Icon name="shield-check" size={ms(24)} color="#2E7D32" />
            <View style={{ flex: 1 }}>
              <Text style={S.securityTitle}>Safe & Secure Payments</Text>
              <Text style={S.securitySub}>100% Payment Protection. Easy Returns</Text>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Bottom bar — yellow Place Order like Flipkart ── */}
      <View style={S.bottomBar}>
        <View style={S.bottomLeft}>
          <Text style={S.bottomLabel}>Total Amount</Text>
          {loading
            ? <SkeletonBox width={110} height={26} borderRadius={8} style={{ marginTop: vs(2) }} />
            : <Text style={S.bottomTotal}>₹{totalPayable.toFixed(2)}</Text>
          }
        </View>
        <TouchableOpacity
          style={[S.placeBtn, (placing || loading) && S.placeBtnDis]}
          disabled={placing || loading}
          onPress={placeBuyNowOrder}
          activeOpacity={0.9}
        >
          {placing ? (
            <><ActivityIndicator size="small" color={color.text} /><Text style={S.placeBtnText}>Processing…</Text></>
          ) : (
            <><Icon name="check-circle" size={ms(20)} color={color.text} /><Text style={S.placeBtnText}>Place Order</Text></>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading overlay */}
      {placing && (
        <View style={S.loadingOverlay}>
          <View style={S.loadingCard}>
            <ActivityIndicator size="large" color={color.primary} />
            <Text style={S.loadingText}>Processing your order…</Text>
            <Text style={S.loadingSub}>Please wait</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

// ─── Address styles ───────────────────────────────────────────────────────────
const addr = ScaledSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s', paddingVertical: '12@vs' },
  loadingText: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  addrList: { gap: '10@vs', marginBottom: '12@vs' },
  addrCard: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: '10@ms', padding: '12@s', backgroundColor: '#FAFAFA' },
  addrCardSel: { borderColor: color.primary, backgroundColor: color.primary + 20 },
  radioCol: { paddingTop: '2@vs' },
  radioOuter: { width: '20@s', height: '20@s', borderRadius: '10@ms', borderWidth: 2, borderColor: '#BDBDBD', justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: color.primary },
  radioInner: { width: '10@s', height: '10@s', borderRadius: '5@ms', backgroundColor: color.primary },
  addrTopRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '6@vs', flexWrap: 'wrap' },
  labelBadge: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: color.background, borderRadius: '6@ms', paddingHorizontal: '8@s', paddingVertical: '3@vs' },
  labelBadgeActive: { backgroundColor: color.primary },
  labelBadgeText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#555' },
  labelBadgeTextActive: { color: '#fff' },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: '#FFFBEB', borderRadius: '6@ms', paddingHorizontal: '6@s', paddingVertical: '3@vs', borderWidth: 1, borderColor: '#FDE68A' },
  defaultBadgeText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#D97706' },
  editBtn: { marginLeft: 'auto', padding: '2@s' },
  line1: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms', marginBottom: '3@vs' },
  line2: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium, marginBottom: '6@vs' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: '4@s', flexWrap: 'wrap' },
  contactText: { fontSize: '11@ms', color: '#BDBDBD', fontFamily: FONTS.Medium },
  dotSep: { width: '3@s', height: '3@s', borderRadius: '2@ms', backgroundColor: '#E0E0E0', marginHorizontal: '2@s' },
  emptyAddr: { alignItems: 'center', paddingVertical: '16@vs', gap: '4@vs' },
  emptyText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#BDBDBD' },
  emptySub: { fontSize: '12@ms', color: '#E0E0E0', fontFamily: FONTS.Medium },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: '10@s', borderWidth: 1.5, borderColor: color.primary, borderStyle: 'dashed', borderRadius: '10@ms', paddingVertical: '12@vs', paddingHorizontal: '14@s', backgroundColor: color.primary + 20 },
  addIconWrap: { width: '30@s', height: '30@s', borderRadius: '8@ms', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  addText: { flex: 1, fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
})

// ─── Bottom sheet styles ──────────────────────────────────────────────────────
const sh = ScaledSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  kavWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: '20@ms', borderTopRightRadius: '20@ms', maxHeight: SCREEN_HEIGHT * 0.9, elevation: 20 },
  handle: { width: '40@s', height: '4@vs', borderRadius: '2@ms', backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: '10@vs', marginBottom: '4@vs' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: '20@s', paddingVertical: '14@vs', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  sheetHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s' },
  sheetIconWrap: { width: '38@s', height: '38@s', borderRadius: '10@ms', backgroundColor: color.primary + 20, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text },
  sheetSub: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '1@vs' },
  closeBtn: { width: '34@s', height: '34@s', borderRadius: '17@ms', backgroundColor: color.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  formScroll: { paddingHorizontal: '20@s', paddingTop: '14@vs' },
  fieldLabel: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '4@vs', marginTop: '6@vs' },
  required: { color: '#C62828', fontSize: '13@ms' },
  labelRow: { flexDirection: 'row', gap: '8@s', flexWrap: 'wrap', marginBottom: '8@vs' },
  labelChip: { flexDirection: 'row', alignItems: 'center', gap: '5@s', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: '8@ms', paddingHorizontal: '12@s', paddingVertical: '6@vs', backgroundColor: color.background },
  labelChipActive: { borderColor: color.primary, backgroundColor: color.primary },
  labelChipText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#555' },
  labelChipTextActive: { color: '#fff', fontSize: '12@ms', fontFamily: FONTS.Bold },
  input: { backgroundColor: '#fff', marginBottom: '6@vs' },
  rowDouble: { flexDirection: 'row', gap: '10@s' },
  defaultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', backgroundColor: color.background, borderRadius: '10@ms', padding: '14@s', marginTop: '8@vs', marginBottom: '14@vs', borderWidth: 1, borderColor: '#E0E0E0' },
  checkbox: { width: '22@s', height: '22@s', borderRadius: '6@ms', borderWidth: 2, borderColor: '#BDBDBD', justifyContent: 'center', alignItems: 'center', marginTop: '1@vs' },
  checkboxActive: { backgroundColor: color.primary, borderColor: color.primary },
  defaultLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  defaultSub: { fontSize: '11@ms', color: '#888', marginTop: '2@vs', fontFamily: FONTS.Medium },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '10@s', backgroundColor: color.primary, borderRadius: '10@ms', paddingVertical: '14@vs', elevation: 3 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#fff' },
})

// ─── Free gift styles ─────────────────────────────────────────────────────────
const fg = ScaledSheet.create({
  card: { backgroundColor: color.primary + 20, borderRadius: '10@ms', borderWidth: 1.5, borderColor: color.primary, overflow: 'hidden', marginBottom: '10@vs' },
  topBar: { height: '3@vs' },
  inner: { flexDirection: 'row', padding: '12@s', gap: '12@s' },
  imgWrap: { position: 'relative', width: '70@s', height: '70@s', borderRadius: '8@ms', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' },
  img: { width: '100%', height: '100%', borderRadius: '8@ms', resizeMode: 'contain' },
  badgeWrap: { position: 'absolute', bottom: '-1@vs', left: '-1@s', right: '-1@s', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: color.primary, paddingHorizontal: '6@s', paddingVertical: '2@vs', borderRadius: '4@ms', borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  badgeText: { fontSize: '8@ms', fontFamily: FONTS.Bold, color: '#fff', letterSpacing: 0.5 },
  details: { flex: 1, justifyContent: 'space-between' },
  title: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms', marginBottom: '6@vs' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: '8@s', flexWrap: 'wrap' },
  qtyPill: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: '#fff', borderRadius: '6@ms', paddingHorizontal: '8@s', paddingVertical: '3@vs', borderWidth: 1, borderColor: '#E0E0E0' },
  qtyText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: color.primary },
  complPill: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: color.primary, borderRadius: '6@ms', paddingHorizontal: '8@s', paddingVertical: '3@vs' },
  complText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#fff' },
  note: { flexDirection: 'row', alignItems: 'center', gap: '6@s', backgroundColor: '#fff', paddingHorizontal: '12@s', paddingVertical: '7@vs', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  noteText: { fontSize: '11@ms', color: color.primary, fontFamily: FONTS.Medium, flex: 1 },
})

// ─── Main styles — ONLY color.* ───────────────────────────────────────────────
const S = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: '14@s', paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs', paddingBottom: '13@vs', backgroundColor: color.primary, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 , 
    paddingTop: '30@vs',},
  headerBtn: { width: '36@s', height: '36@s', borderRadius: '18@ms', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: '4@s' },
  secureText: { fontSize: '12@ms', color: '#fff', fontFamily: FONTS.Medium },

  // Card
  card: { backgroundColor: '#fff', marginHorizontal: '14@s', marginBottom: '10@vs', borderRadius: '10@ms', padding: '14@s', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, borderWidth: 1, borderColor: '#EBEBEB' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '14@vs', gap: '10@s' },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '12@vs' },

  // Product row
  productRow: { flexDirection: 'row', marginBottom: '14@vs' },
  imgBox: { position: 'relative', width: '90@s', height: '90@s', borderRadius: '8@ms', backgroundColor: color.primary + 20, marginRight: '12@s', borderWidth: 1, borderColor: '#EEE' },
  productImg: { width: '100%', height: '100%', borderRadius: '8@ms', resizeMode: 'contain' },
  digitalBadge: { position: 'absolute', top: '5@vs', left: '5@s', flexDirection: 'row', alignItems: 'center', backgroundColor: color.primary, paddingHorizontal: '5@s', paddingVertical: '2@vs', borderRadius: '6@ms', gap: '3@s' },
  digitalBadgeText: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: '#fff' },
  productInfo: { flex: 1, justifyContent: 'space-between' },
  productTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '19@ms', marginBottom: '5@vs' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: color.background, paddingHorizontal: '6@s', paddingVertical: '2@vs', borderRadius: '4@ms', alignSelf: 'flex-start', marginBottom: '5@vs' },
  catText: { fontSize: '10@ms', color: '#888', fontFamily: FONTS.Medium },
  unitPrice: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },
  unitPriceRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', flexWrap: 'wrap' },
  unitPriceStrike: { fontSize: '12@ms', color: '#BDBDBD', textDecorationLine: 'line-through', fontFamily: FONTS.Medium },
  unitPriceDisc: { fontSize: '13@ms', color: '#2E7D32', fontFamily: FONTS.Bold },

  // Qty
  qtySection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14@vs' },
  qtyLabel: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.background, borderRadius: '25@ms', paddingHorizontal: '4@s', paddingVertical: '4@vs', borderWidth: 1, borderColor: '#E0E0E0' },
  qtyBtn: { width: '34@s', height: '34@s', borderRadius: '17@ms', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: '#E0E0E0' },
  qtyDisplay: { paddingHorizontal: '18@s' },
  qtyText: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text },

  // Price breakdown
  priceBreakdown: { marginBottom: '10@vs' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10@vs' },
  priceLabel: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  priceVal: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: color.text },
  priceFree: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  discLabelRow: { flexDirection: 'row', alignItems: 'center', gap: '5@s', flex: 1, marginRight: '8@s' },
  discLabel: { fontSize: '12@ms', color: '#2E7D32', fontFamily: FONTS.Medium, flex: 1 },
  discVal: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  taxHeader: { flexDirection: 'row', alignItems: 'center', gap: '5@s', marginBottom: '6@vs', marginTop: '4@vs' },
  taxHeaderText: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },
  taxLabel: { fontSize: '12@ms', color: '#888' },
  taxVal: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },

  // Total
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  savingsNote: { fontSize: '12@ms', color: '#2E7D32', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  totalAmt: { fontSize: '22@ms', fontFamily: FONTS.Bold, color: color.primary },

  // Free gift section
  freeGiftSection: { marginHorizontal: '14@s', marginBottom: '10@vs' },
  freeGiftHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10@vs' },
  freeGiftTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  freeGiftCountPill: { backgroundColor: color.primary, borderRadius: '10@ms', paddingHorizontal: '8@s', paddingVertical: '2@vs' },
  freeGiftCountText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Offers
  offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: '10@vs' },
  offerLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  offerText: { fontSize: '14@ms', color: color.text, fontFamily: FONTS.Medium },
  offerDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '4@vs' },
  appliedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', borderRadius: '8@ms', padding: '12@s', marginBottom: '10@vs', borderWidth: 1, borderColor: '#C8E6C9' },
  appliedLabel: { fontSize: '11@ms', color: '#2E7D32', fontFamily: FONTS.Medium },
  appliedCode: { fontSize: '14@ms', color: color.text, fontFamily: FONTS.Bold, marginTop: '1@vs' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s', marginTop: '8@vs', marginBottom: '4@vs' },
  codeInput: { flex: 1, height: '44@vs', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: '8@ms', paddingHorizontal: '12@s', fontSize: '14@ms', color: color.text, backgroundColor: color.background, fontFamily: FONTS.Medium },
  applyBtn: { backgroundColor: color.primary, paddingHorizontal: '16@s', height: '44@vs', borderRadius: '8@ms', justifyContent: 'center', alignItems: 'center', minWidth: '70@s' },
  applyBtnDis: { backgroundColor: '#BDBDBD' },
  applyBtnText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '14@ms' },

  // Email
  emailNote: { fontSize: '13@ms', color: '#888', marginBottom: '10@vs', fontFamily: FONTS.Medium },
  emailInput: { backgroundColor: '#fff', marginBottom: '12@vs' },
  digitalInfoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: color.primary + 20, padding: '12@s', borderRadius: '8@ms', gap: '10@s', borderWidth: 1, borderColor: '#E0E0E0' },
  digitalInfoText: { flex: 1, fontSize: '13@ms', color: color.text, fontFamily: FONTS.Medium, lineHeight: '19@ms' },

  // Payment
  payOption: { flexDirection: 'row', alignItems: 'center', padding: '14@s', borderRadius: '8@ms', borderWidth: 1.5, borderColor: '#EBEBEB', marginBottom: '10@vs' },
  payOptionActive: { borderColor: color.primary, backgroundColor: color.primary + 20 },
  payOptionDis: { opacity: 0.5, backgroundColor: color.background },
  payLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s', flex: 1 },
  radio: { width: '20@s', height: '20@s', borderRadius: '10@ms', borderWidth: 2, borderColor: '#BDBDBD', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: color.primary },
  radioDis: { borderColor: '#E0E0E0' },
  radioInner: { width: '10@s', height: '10@s', borderRadius: '5@ms', backgroundColor: color.primary },
  payTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  paySub: { fontSize: '11@ms', color: '#888', marginTop: '2@vs', fontFamily: FONTS.Medium },

  // Security
  securityBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', marginHorizontal: '14@s', marginBottom: '14@vs', padding: '12@s', borderRadius: '10@ms', gap: '12@s', borderWidth: 1, borderColor: '#C8E6C9' },
  securityTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '1@vs' },
  securitySub: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium },

  // Incomplete profile
  incompleteCard: { alignItems: 'center', paddingVertical: '24@vs', paddingHorizontal: '16@s', backgroundColor: color.primary + 20, borderRadius: '10@ms', borderWidth: 1.5, borderColor: color.primary, marginTop: '8@vs' },
  incompleteTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.primary, marginTop: '10@vs', marginBottom: '6@vs' },
  incompleteText: { fontSize: '13@ms', color: '#888', textAlign: 'center', lineHeight: '19@ms', marginBottom: '16@vs', fontFamily: FONTS.Medium },
  completeProfBtn: { flexDirection: 'row', alignItems: 'center', gap: '8@s', backgroundColor: color.primary, paddingHorizontal: '18@s', paddingVertical: '11@vs', borderRadius: '8@ms', elevation: 2 },
  completeProfText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '14@s', paddingVertical: '12@vs', backgroundColor: '#fff', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 6, borderTopWidth: 1, borderTopColor: '#EBEBEB' },
  bottomLeft: { flex: 1 },
  bottomLabel: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },
  bottomTotal: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: color.text },
  // Place Order — yellow like Flipkart's CTA
  placeBtn: { flexDirection: 'row', alignItems: 'center', gap: '8@s', backgroundColor: color.secondary, paddingHorizontal: '22@s', paddingVertical: '13@vs', borderRadius: '8@ms', elevation: 2 },
  placeBtnDis: { opacity: 0.65 },
  placeBtnText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },

  // Loading overlay
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loadingCard: { backgroundColor: '#fff', padding: '28@s', borderRadius: '12@ms', alignItems: 'center', elevation: 8, minWidth: '200@s' },
  loadingText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text, marginTop: '14@vs' },
  loadingSub: { fontSize: '12@ms', color: '#888', marginTop: '4@vs', fontFamily: FONTS.Medium },
  digitalDeliveryNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '8@s',
    backgroundColor: color.GREEN + '12',
    borderRadius: '8@ms',
    padding: '10@s',
    marginTop: '10@vs',
    borderWidth: 1,
    borderColor: color.GREEN + '40',
  },
  digitalDeliveryNoteText: {
    fontSize: '12@ms',
    color: color.GREEN,
    fontFamily: FONTS.Medium,
    flex: 1,
    lineHeight: '17@ms',
  },
})