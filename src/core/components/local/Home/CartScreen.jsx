import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Image } from 'react-native'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import { openRazorpay } from '../../global/razorpaymodule'
import { TextInput } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'
import color from '../../../utils/color'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ─── Free Gift Badge ──────────────────────────────────────────────────────────
const FreeGiftBadge = () => (
  <View style={styles.freeGiftBadgeWrap}>
    <View style={styles.freeGiftBadge}>
      <Icon name="gift" size={ms(9)} color="#fff" />
      <Text style={styles.freeGiftBadgeText}>FREE GIFT</Text>
    </View>
  </View>
)

// ─── Label icons ──────────────────────────────────────────────────────────────
const LABEL_ICONS = {
  home: 'home-outline',
  office: 'briefcase-outline',
  work: 'briefcase-outline',
  other: 'map-marker-outline',
}
const getLabelIcon = label => LABEL_ICONS[label] ?? 'map-marker-outline'

// ─── Address Bottom Sheet ─────────────────────────────────────────────────────
function AddressBottomSheet({ visible, onClose, onSaved, editData }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropAnim = useRef(new Animated.Value(0)).current
  const [saving, setSaving] = useState(false)
  const isEdit = !!editData

  const [form, setForm] = useState({
    label: '', name: '', phone: '', line1: '', city: '',
    state: '', postalCode: '', country: 'India', isDefault: false,
  })

  useEffect(() => {
    if (editData) {
      setForm({
        label: editData.label ?? '',
        name: editData.contactInfo?.name ?? '',
        phone: editData.contactInfo?.phone ?? '',
        line1: editData.address?.addressLine1 ?? '',
        city: editData.address?.city ?? '',
        state: editData.address?.state ?? '',
        postalCode: editData.address?.postalCode ?? '',
        country: editData.address?.country ?? 'India',
        isDefault: editData.isDefault ?? false,
      })
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
      console.log('ADDRESS PAYLOAD', JSON.stringify(payload, null, 2))
      const url = isEdit
        ? `${BASE_URL}/user/profile/addresses/${editData.id}`
        : `${BASE_URL}/user/profile/addresses`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      const json = await res.json()
      console.log(json, 'Address save response')
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
      console.log('Fetched addresses', json)
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
  const handleSaved = useCallback(savedAddress => { fetchAddresses(); onSelect(savedAddress.id) }, [fetchAddresses])
  const openEdit = addr => { setEditTarget(addr); setSheetVisible(true) }
  const openAdd = () => { setEditTarget(null); setSheetVisible(true) }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name="truck-delivery-outline" size={ms(20)} color={color.primary} />
        <Text style={styles.sectionTitle}>Delivery Address</Text>
      </View>

      {loading ? (
        <View style={addrStyles.loadingRow}>
          <ActivityIndicator size="small" color={color.primary} />
          <Text style={addrStyles.loadingText}>Loading saved addresses…</Text>
        </View>
      ) : (
        <>
          {addresses.length > 0 ? (
            <View style={addrStyles.addrList}>
              {addresses.map(addr => {
                const sel = selectedId === addr.id
                return (
                  <TouchableOpacity key={addr.id} style={[addrStyles.addrCard, sel && addrStyles.addrCardSel]} onPress={() => onSelect(addr.id)} activeOpacity={0.8}>
                    {/* Radio */}
                    <View style={addrStyles.radioCol}>
                      <View style={[addrStyles.radioOuter, sel && addrStyles.radioOuterActive]}>
                        {sel && <View style={addrStyles.radioInner} />}
                      </View>
                    </View>
                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <View style={addrStyles.addrTopRow}>
                        <View style={[addrStyles.labelBadge, sel && addrStyles.labelBadgeActive]}>
                          <Icon name={getLabelIcon(addr.label)} size={ms(11)} color={sel ? '#fff' : '#555'} />
                          <Text style={[addrStyles.labelBadgeText, sel && addrStyles.labelBadgeTextActive]}>{addr.label}</Text>
                        </View>
                        {addr.isDefault && (
                          <View style={addrStyles.defaultBadge}>
                            <Icon name="star" size={ms(9)} color="#F59E0B" />
                            <Text style={addrStyles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => openEdit(addr)} style={addrStyles.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Icon name="pencil-outline" size={ms(15)} color={color.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={addrStyles.line1} numberOfLines={2}>{addr.address?.addressLine1}</Text>
                      <Text style={addrStyles.line2}>{[addr.address?.city, addr.address?.state, addr.address?.postalCode].filter(Boolean).join(', ')}</Text>
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
              <Icon name="map-marker-off-outline" size={ms(36)} color="#BDBDBD" />
              <Text style={addrStyles.emptyText}>No saved addresses yet</Text>
              <Text style={addrStyles.emptySub}>Add one below to continue</Text>
            </View>
          )}

          <TouchableOpacity style={addrStyles.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <View style={addrStyles.addIconWrap}>
              <Icon name="plus" size={ms(16)} color={color.primary} />
            </View>
            <Text style={addrStyles.addText}>Add New Address</Text>
            <Icon name="chevron-right" size={ms(16)} color={color.primary} />
          </TouchableOpacity>
        </>
      )}

      <AddressBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} onSaved={handleSaved} editData={editTarget} />
    </View>
  )
}

// ─── Main CartScreen ──────────────────────────────────────────────────────────
export default function CartScreen() {
  const navigation = useNavigation()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')
  const [fadeAnim] = useState(new Animated.Value(0))
  const [digitalEmail, setDigitalEmail] = useState('')
  const [businessId, setBusinessId] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // ── Address ───────────────────────────────────────────────────────────────
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressesCache, setAddressesCache] = useState([])

  // ── Coupon / Dealer ───────────────────────────────────────────────────────
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [showDealerInput, setShowDealerInput] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [dealerInput, setDealerInput] = useState('')
  const [appliedCode, setAppliedCode] = useState(null)
  const [appliedCodeType, setAppliedCodeType] = useState(null)
  const [applyingCode, setApplyingCode] = useState(false)

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasOnlyDigital = cart?.items?.length > 0 && cart.items.every(i => i.itemSnapshot?.itemType === 'digital')
  const hasDigitalItem = cart?.items?.some(i => i.itemSnapshot?.itemType === 'digital')
  const hasPhysicalItem = cart?.items?.some(i => i.itemSnapshot?.itemType !== 'digital')
  const regularItems = cart?.items?.filter(i => !i.isFreeGift) ?? []
  const freeGiftItems = cart?.items?.filter(i => i.isFreeGift) ?? []

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('businessId').then(id => setBusinessId(id))
  }, [])

  useEffect(() => { if (businessId) fetchCart() }, [businessId])

  useEffect(() => {
    if (!loading) Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }, [loading])

  // ── Fetch cart ────────────────────────────────────────────────────────────
  const fetchCart = async (code = appliedCode) => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const url = code
        ? `${BASE_URL}/customer/business/${bId}/cart?code=${encodeURIComponent(code)}`
        : `${BASE_URL}/customer/business/${bId}/cart`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json?.data) {
        setCart(json.data)
      }
      return json
    } catch (err) {
      console.log('Cart fetch error', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Apply code ────────────────────────────────────────────────────────────
  const applyCode = async type => {
    const code = (type === 'coupon' ? couponInput : dealerInput).trim()
    if (!code) { ToastAndroid.show('Please enter a code', ToastAndroid.SHORT); return }
    try {
      setApplyingCode(true)
      const json = await fetchCart(code)
      if (json?.data) {
        setAppliedCode(code); setAppliedCodeType(type)
        setShowCouponInput(false); setShowDealerInput(false)
        ToastAndroid.show(type === 'coupon' ? 'Coupon applied! 🎉' : 'Dealer code applied! 🎉', ToastAndroid.SHORT)
      } else { ToastAndroid.show('Invalid code, please try again', ToastAndroid.SHORT) }
    } catch (err) { ToastAndroid.show(err?.message || 'Failed to apply code', ToastAndroid.SHORT) }
    finally { setApplyingCode(false) }
  }

  const removeCode = async () => {
    setAppliedCode(null); setAppliedCodeType(null); setCouponInput(''); setDealerInput('')
    await fetchCart(null)
    ToastAndroid.show('Code removed', ToastAndroid.SHORT)
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const getCartTotals = () => {
    if (!cart?.items) return { baseTotal: 0, finalTotal: 0, totalSavings: 0, taxTotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0 }
    return cart.items.filter(i => !i.isFreeGift).reduce(
      (acc, item) => {
        const base = item.discountPricing?.baseItemTotal ?? item.pricing?.itemTotal ?? 0
        const final = item.discountPricing?.finalItemTotal ?? item.pricing?.itemTotal ?? 0
        const disc = item.discountPricing?.discountTotal ?? 0
        const tax = item.taxBreakdown ?? {}
        acc.baseTotal += base
        acc.finalTotal += final
        acc.totalSavings += disc
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
  const discountSummary = cart?.discountSummary ?? []
  const totalDiscount = cart?.totalDiscount ?? 0

  // ── Attribute builder ─────────────────────────────────────────────────────
  const buildAttributesFromCartItem = item =>
    (item.selectedAttributes?.attributes || []).map(attr => ({
      attributeDefinitionId: attr.definitionId,
      sourceType: attr.source,
      value: attr.selectedValue,
    }))

  // ── Qty controls ──────────────────────────────────────────────────────────
  const updateQty = async (item, delta) => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${bId}/items/${item.itemId}/cart/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: delta, selectedAttributes: buildAttributesFromCartItem(item) }),
      })
      if (!res.ok) throw await res.json()
      await fetchCart()
    } catch { ToastAndroid.show('Unable to update quantity', ToastAndroid.SHORT) }
  }

  const reduceItemQuantity = async (itemId, qty = 1) => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${bId}/items/${itemId}/cart/reduce`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: qty }),
      })
      if (!res.ok) throw await res.json()
      await fetchCart()
    } catch { ToastAndroid.show('Unable to update quantity', ToastAndroid.SHORT) }
  }

  const removeItem = async cartItemId => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${bId}/items/cart/${cartItemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw await res.json()
      await fetchCart()
      ToastAndroid.show('Item removed', ToastAndroid.SHORT)
    } catch { ToastAndroid.show('Unable to remove item', ToastAndroid.SHORT) }
  }

  const clearCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(`${BASE_URL}/customer/business/${bId}/cart/clear`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw await res.json()
      await fetchCart()
      ToastAndroid.show('Cart cleared', ToastAndroid.SHORT)
    } catch { ToastAndroid.show('Unable to clear cart', ToastAndroid.SHORT) }
  }

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
      console.log('Fetched profile in cart:', json)
      setUserProfile(json?.success && json?.data ? json.data : null)
      console.log('Is profile empty?', isProfileEmpty(json?.data))
    } catch (err) { console.log('Error fetching user profile in cart:', err); setUserProfile(null) }
    finally { setProfileLoading(false) }
  }

  useEffect(() => { if (businessId) fetchUserProfile() }, [businessId])

  // ── Build order payload ────────────────────────────────────────────────────
  const buildOrderPayload = ({ cartId, cartItems, paymentMethod, selectedAddr, email, code }) => {
    const hasPhysical = cartItems.some(i => i.itemSnapshot?.itemType !== 'digital')
    const hasDigital = cartItems.some(i => i.itemSnapshot?.itemType === 'digital')
    const payload = {
      cartId,
      payment: { method: paymentMethod },
      itemType: hasPhysical ? 'physical' : 'digital',
      ...(code ? { code } : {}),
    }
    if (hasPhysical && selectedAddr) {
      payload.addresses = [{
        type: 'shipping',
        addressSnapshot: { line1: selectedAddr.address?.addressLine1, city: selectedAddr.address?.city, state: selectedAddr.address?.state, country: selectedAddr.address?.country ?? 'India', pincode: selectedAddr.address?.postalCode },
        contactSnapshot: { name: selectedAddr.contactInfo?.name, phone: selectedAddr.contactInfo?.phone, email: email || selectedAddr?.contactInfo?.email || userProfile?.userProfile?.email || '' },
      }]
    }
    if (hasDigital) payload.email = email
    return payload
  }

  // ── Place order ────────────────────────────────────────────────────────────
  const placeOrder = async ({ cartId, cartItems, paymentMethod }) => {
    if (placing) return
    if (isProfileEmpty(userProfile)) {
      ToastAndroid.show('Please complete your profile first', ToastAndroid.SHORT)
      navigation.navigate('ProfileInfoScreen')
      return
    }
    try {
      setPlacing(true)
      const hasDigital = cartItems.some(i => i.itemSnapshot?.itemType === 'digital')
      const hasPhysical = cartItems.some(i => i.itemSnapshot?.itemType !== 'digital')
      if (hasDigital && !digitalEmail) { ToastAndroid.show('Enter email for digital delivery', ToastAndroid.SHORT); return }
      if (hasDigital && !digitalEmail.includes('@')) { ToastAndroid.show('Enter valid email address', ToastAndroid.SHORT); return }
      if (hasPhysical && !selectedAddressId) { ToastAndroid.show('Please select a delivery address', ToastAndroid.SHORT); return }
      if (paymentMethod === 'COD' && hasDigital) { ToastAndroid.show('COD not available for digital items', ToastAndroid.SHORT); return }

      const selectedAddr = addressesCache.find(a => a.id === selectedAddressId)
      const token = await AsyncStorage.getItem('userToken')
      const bId = businessId ?? await AsyncStorage.getItem('businessId')
      const body = buildOrderPayload({ cartId, cartItems, paymentMethod, selectedAddr, email: digitalEmail, code: appliedCode })
      console.log('ORDER PAYLOAD →', JSON.stringify(body, null, 2))

      const res = await fetch(`${BASE_URL}/customer/business/${bId}/order/place`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw json

      if (json.paymentMethod === 'RAZORPAY') {
        openRazorpay({ razorpayOrder: json.razorpay, orderId: json.orderId, navigation, email: digitalEmail || selectedAddr?.contactInfo?.email || '' })
        return
      }
      ToastAndroid.show('Order placed successfully 🎉', ToastAndroid.SHORT)
      await fetchCart()
      navigation.navigate('ExploreInventoryScreen')
    } catch (err) { ToastAndroid.show(err?.message || 'Unable to place order', ToastAndroid.SHORT) }
    finally { setPlacing(false) }
  }

  useFocusEffect(useCallback(() => { fetchUserProfile() }, []))

  // ── Discount icon/color helpers ───────────────────────────────────────────
  const getDiscountCategoryIcon = cat => ({ promotion: 'tag-multiple', coupon: 'ticket-confirmation', dealer: 'star-circle' }[cat] ?? 'percent')
  const getDiscountCategoryColor = cat => ({ promotion: color.primary, coupon: '#9C27B0', dealer: '#4CAF50' }[cat] ?? color.primary)

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={color.primary} />
        <Text style={styles.loadingText}>Loading your cart…</Text>
      </View>
    )
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (!cart?.items || cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.emptyCart}>
          <Icon name="cart-outline" size={ms(80)} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('ExploreInventoryScreen')}>
            <Text style={styles.shopNowText}>Start Shopping</Text>
            <Icon name="arrow-right" size={ms(18)} color={color.text} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Full cart render ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cart?.items?.length || 0}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(130) }}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Regular Cart Items ── */}
          {regularItems.length > 0 && (
            <View style={styles.itemsSection}>
              {regularItems.map(item => {
                const base = item.discountPricing?.baseItemTotal ?? item.pricing?.itemTotal ?? 0
                const final = item.discountPricing?.finalItemTotal ?? item.pricing?.itemTotal ?? 0
                const discount = item.discountPricing?.discountTotal ?? 0
                const unitPrice = item.discountPricing?.finalUnitPrice ?? final / item.quantity
                return (
                  <View key={item.cartItemId} style={styles.cartCard}>
                    <View style={styles.cardContent}>
                      <View style={styles.topRow}>
                        <View style={styles.imageContainer}>
                          <Image source={item.media?.url ? { uri: item.media.url } : noimage} style={styles.productImage} />
                          {item.itemSnapshot?.itemType === 'digital' && (
                            <View style={styles.digitalBadge}>
                              <Icon name="download" size={ms(10)} color="#fff" />
                            </View>
                          )}
                        </View>
                        <View style={styles.productDetails}>
                          <Text style={styles.productTitle} numberOfLines={2}>{item.itemSnapshot.title}</Text>
                          {item.itemSnapshot.description && (
                            <Text style={styles.productDesc} numberOfLines={1}>{item.itemSnapshot.description}</Text>
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
                          {discount > 0 && <Text style={styles.savings}>You save ₹{Math.round(discount)}</Text>}
                          {item.quantity > 1 && <Text style={styles.unitPrice}>₹{unitPrice.toFixed(2)} each</Text>}
                        </View>
                      </View>

                      {/* Qty row */}
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity onPress={() => removeItem(item.cartItemId)} style={styles.removeBtn}>
                          <Icon name="delete-outline" size={ms(20)} color="#C62828" />
                        </TouchableOpacity>
                        <View style={styles.qtyBox}>
                          <TouchableOpacity onPress={() => item.quantity === 1 ? removeItem(item.cartItemId) : reduceItemQuantity(item.itemId, 1)} style={styles.qtyButton} activeOpacity={0.7}>
                            <Icon name="minus" size={ms(15)} color={color.primary} />
                          </TouchableOpacity>
                          <View style={styles.qtyDisplay}>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                          </View>
                          <TouchableOpacity onPress={() => updateQty(item, 1)} style={styles.qtyButton} activeOpacity={0.7}>
                            <Icon name="plus" size={ms(15)} color={color.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* {regularItems.length > 1 && (
            <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart}>
              <Icon name="delete-sweep-outline" size={ms(20)} color="#C62828" />
              <Text style={styles.clearCartText}>Clear All Items</Text>
            </TouchableOpacity>
          )} */}

          {/* ── Free Gift Items ── */}
          {freeGiftItems.length > 0 && (
            <View style={styles.freeGiftSection}>
              <View style={styles.freeGiftSectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                  <Icon name="gift-open" size={ms(18)} color={color.primary} />
                  <Text style={styles.freeGiftSectionTitle}>Your Free Gift{freeGiftItems.length > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.freeGiftCountPill}>
                  <Text style={styles.freeGiftCountText}>{freeGiftItems.length}</Text>
                </View>
              </View>
              {freeGiftItems.map(item => (
                <View key={item.cartItemId} style={styles.freeGiftCard}>
                  <View style={styles.freeGiftTopAccent} />
                  <View style={styles.freeGiftCardInner}>
                    <View style={styles.freeGiftImageWrap}>
                      <Image source={item.media?.url ? { uri: item.media.url } : noimage} style={styles.freeGiftImage} />
                      <FreeGiftBadge />
                    </View>
                    <View style={styles.freeGiftDetails}>
                      <Text style={styles.freeGiftTitle} numberOfLines={2}>{item.itemSnapshot.title}</Text>
                      {item.itemSnapshot.description && <Text style={styles.freeGiftDesc} numberOfLines={1}>{item.itemSnapshot.description}</Text>}
                      <View style={styles.freeGiftFooter}>
                        <View style={styles.freeGiftQtyPill}>
                          <Icon name="package-variant" size={ms(11)} color={color.primary} />
                          <Text style={styles.freeGiftQtyText}>Qty: {item.quantity}</Text>
                        </View>
                        <View style={styles.complimentaryPill}>
                          <Icon name="check-circle" size={ms(11)} color="#fff" />
                          <Text style={styles.complimentaryText}>Complimentary</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.freeGiftNote}>
                    <Icon name="information-outline" size={ms(12)} color={color.primary} />
                    <Text style={styles.freeGiftNoteText}>This item is a free gift and cannot be modified</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Offers & Discounts ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="ticket-percent-outline" size={ms(20)} color={color.primary} />
              <Text style={styles.sectionTitle}>Offers & Discounts</Text>
            </View>

            {appliedCode && (
              <View style={styles.appliedCodeBanner}>
                <View style={styles.appliedCodeLeft}>
                  <Icon name={appliedCodeType === 'coupon' ? 'ticket-confirmation' : 'star-circle'} size={ms(18)} color="#4CAF50" />
                  <View>
                    <Text style={styles.appliedCodeLabel}>{appliedCodeType === 'coupon' ? 'Coupon' : 'Dealer Code'} Applied</Text>
                    <Text style={styles.appliedCodeValue}>{appliedCode}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={removeCode} style={{ padding: s(4) }}>
                  <Icon name="close-circle" size={ms(20)} color="#C62828" />
                </TouchableOpacity>
              </View>
            )}

            {appliedCodeType !== 'dealer' && (
              <>
                <TouchableOpacity style={styles.offerItem} onPress={() => { if (appliedCodeType === 'coupon') return; setShowCouponInput(p => !p); setShowDealerInput(false) }} activeOpacity={0.7}>
                  <View style={styles.offerLeft}>
                    <Icon name="ticket-confirmation-outline" size={ms(20)} color="#E65100" />
                    <Text style={styles.offerText}>{appliedCodeType === 'coupon' ? 'Coupon Applied ✓' : 'Apply Coupon Code'}</Text>
                  </View>
                  {appliedCodeType !== 'coupon' && <Icon name={showCouponInput ? 'chevron-up' : 'chevron-right'} size={ms(20)} color="#BDBDBD" />}
                </TouchableOpacity>
                {showCouponInput && !appliedCode && (
                  <View style={styles.codeInputRow}>
                    <RNTextInput style={styles.codeInput} placeholder="Enter coupon code" placeholderTextColor="#BDBDBD" value={couponInput} onChangeText={setCouponInput} autoCapitalize="characters" />
                    <TouchableOpacity style={[styles.applyBtn, (!couponInput.trim() || applyingCode) && styles.applyBtnDisabled]} disabled={!couponInput.trim() || applyingCode} onPress={() => applyCode('coupon')}>
                      {applyingCode ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.applyBtnText}>Apply</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <View style={styles.divider} />

            {appliedCodeType !== 'coupon' && (
              <>
                <TouchableOpacity style={styles.offerItem} onPress={() => { if (appliedCodeType === 'dealer') return; setShowDealerInput(p => !p); setShowCouponInput(false) }} activeOpacity={0.7}>
                  <View style={styles.offerLeft}>
                    <Icon name="star-circle-outline" size={ms(20)} color="#4CAF50" />
                    <Text style={styles.offerText}>{appliedCodeType === 'dealer' ? 'Dealer Code Applied ✓' : 'Use Dealer Code'}</Text>
                  </View>
                  {appliedCodeType !== 'dealer' && <Icon name={showDealerInput ? 'chevron-up' : 'chevron-right'} size={ms(20)} color="#BDBDBD" />}
                </TouchableOpacity>
                {showDealerInput && !appliedCode && (
                  <View style={styles.codeInputRow}>
                    <RNTextInput style={styles.codeInput} placeholder="Enter dealer code" placeholderTextColor="#BDBDBD" value={dealerInput} onChangeText={setDealerInput} autoCapitalize="characters" />
                    <TouchableOpacity style={[styles.applyBtn, (!dealerInput.trim() || applyingCode) && styles.applyBtnDisabled]} disabled={!dealerInput.trim() || applyingCode} onPress={() => applyCode('dealer')}>
                      {applyingCode ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.applyBtnText}>Apply</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          {/* ── Discount Summary ── */}
          {discountSummary.length > 0 && (
            <View style={styles.discountSummaryCard}>
              <View style={styles.discountSummaryHeader}>
                <View style={styles.discountSummaryHeaderLeft}>
                  <Icon name="tag-heart" size={ms(20)} color="#fff" />
                  <Text style={styles.discountSummaryHeaderText}>Discounts Applied</Text>
                </View>
                <View style={styles.discountSummaryBadge}>
                  <Text style={styles.discountSummaryBadgeText}>{discountSummary.length}</Text>
                </View>
              </View>
              <View style={styles.discountSummaryBody}>
                {discountSummary.map((disc, idx) => {
                  const iconName = getDiscountCategoryIcon(disc.category)
                  const iconColor = getDiscountCategoryColor(disc.category)
                  return (
                    <View key={disc.discountId ?? idx}>
                      <View style={styles.discountRow}>
                        <View style={styles.discountRowLeft}>
                          <View style={[styles.discountIconWrap, { backgroundColor: iconColor + '18' }]}>
                            <Icon name={iconName} size={ms(17)} color={iconColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.discountName} numberOfLines={1}>{disc.name}</Text>
                            <View style={[styles.discountCategoryPill, { backgroundColor: iconColor + '22' }]}>
                              <Text style={[styles.discountCategoryText, { color: iconColor }]}>{disc.category.toUpperCase()}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.discountAmountBlock}>
                          <Text style={styles.discountMinus}>−</Text>
                          <Text style={styles.discountAmount}>₹{Math.round(disc.totalApplied)}</Text>
                        </View>
                      </View>
                      {idx < discountSummary.length - 1 && <View style={styles.discountDivider} />}
                    </View>
                  )
                })}
                <View style={styles.discountTotalRow}>
                  <View style={styles.discountTotalLeft}>
                    <Icon name="check-decagram" size={ms(17)} color="#4CAF50" />
                    <Text style={styles.discountTotalLabel}>Total Discount</Text>
                  </View>
                  <Text style={styles.discountTotalValue}>− ₹{Math.round(totalDiscount)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Address Section ── */}
          {!hasOnlyDigital && (
            profileLoading ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="truck-delivery-outline" size={ms(20)} color={color.primary} />
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>
                <View style={addrStyles.loadingRow}>
                  <ActivityIndicator size="small" color={color.primary} />
                  <Text style={addrStyles.loadingText}>Checking profile…</Text>
                </View>
              </View>
            ) : isProfileEmpty(userProfile) ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="truck-delivery-outline" size={ms(20)} color={color.primary} />
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>
                <View style={styles.incompleteProfileCard}>
                  <Icon name="account-alert-outline" size={ms(44)} color={color.primary} />
                  <Text style={styles.incompleteProfileTitle}>Profile Incomplete</Text>
                  <Text style={styles.incompleteProfileText}>Please complete your profile to add delivery addresses and place orders</Text>
                  <TouchableOpacity style={styles.completeProfileBtn} onPress={() => navigation.navigate('ProfileInfoScreen')} activeOpacity={0.8}>
                    <Icon name="account-edit-outline" size={ms(17)} color="#fff" />
                    <Text style={styles.completeProfileBtnText}>Complete Profile</Text>
                    <Icon name="arrow-right" size={ms(17)} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <AddressSection selectedId={selectedAddressId} onSelect={setSelectedAddressId} onAddressesLoaded={setAddressesCache} />
            )
          )}

          {/* ── Digital Delivery Email ── */}
          {hasDigitalItem && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="email-outline" size={ms(20)} color={color.primary} />
                <Text style={styles.sectionTitle}>Digital Delivery</Text>
              </View>
              <Text style={styles.emailNote}>Enter email to receive digital products</Text>
              <TextInput mode="outlined" placeholder="your.email@example.com" placeholderTextColor="#bbb" value={digitalEmail} onChangeText={setDigitalEmail} keyboardType="email-address" autoCapitalize="none" outlineColor="#E0E0E0" activeOutlineColor={color.primary} />
            </View>
          )}

          {/* ── Bill Summary ── */}
          <View style={styles.card}>
            <Text style={styles.billTitle}>Bill Summary</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal ({regularItems.length} item{regularItems.length !== 1 ? 's' : ''})</Text>
              {totalSavings > 0 ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.basePrice}>₹{Math.round(baseTotal)}</Text>
                  <Text style={styles.billValue}>₹{Math.round(finalTotal)}</Text>
                </View>
              ) : (
                <Text style={styles.billValue}>₹{Math.round(finalTotal)}</Text>
              )}
            </View>

            {freeGiftItems.length > 0 && (
              <View style={styles.billRow}>
                <View style={styles.billDiscountLabelRow}>
                  <Icon name="gift" size={ms(13)} color={color.primary} />
                  <Text style={[styles.billLabel, { color: color.primary, flex: 1, marginLeft: s(5) }]}>Free Gift{freeGiftItems.length > 1 ? 's' : ''} ({freeGiftItems.length})</Text>
                </View>
                <Text style={[styles.billValue, { color: color.primary, fontFamily: FONTS.Bold }]}>FREE</Text>
              </View>
            )}

            {appliedCode && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#4CAF50' }]}>{appliedCodeType === 'coupon' ? 'Coupon' : 'Dealer Code'} ({appliedCode})</Text>
                <Text style={[styles.billValue, { color: '#4CAF50' }]}>Applied ✓</Text>
              </View>
            )}

            {discountSummary.map((disc, idx) => (
              <View key={disc.discountId ?? idx} style={styles.billRow}>
                <View style={styles.billDiscountLabelRow}>
                  <Icon name={getDiscountCategoryIcon(disc.category)} size={ms(13)} color={getDiscountCategoryColor(disc.category)} />
                  <Text style={[styles.billLabel, { color: '#388E3C', flex: 1, marginLeft: s(5) }]} numberOfLines={1}>{disc.name}</Text>
                </View>
                <Text style={[styles.billValue, { color: '#388E3C' }]}>− ₹{Math.round(disc.totalApplied)}</Text>
              </View>
            ))}

            <View style={styles.billRow}><Text style={styles.billLabel}>Taxable Amount</Text><Text style={styles.billValue}>₹{taxableAmount.toFixed(2)}</Text></View>
            {cgst > 0 && <View style={styles.billRow}><Text style={styles.billLabel}>CGST</Text><Text style={styles.billValue}>₹{cgst.toFixed(2)}</Text></View>}
            {sgst > 0 && <View style={styles.billRow}><Text style={styles.billLabel}>SGST</Text><Text style={styles.billValue}>₹{sgst.toFixed(2)}</Text></View>}
            {igst > 0 && <View style={styles.billRow}><Text style={styles.billLabel}>IGST</Text><Text style={styles.billValue}>₹{igst.toFixed(2)}</Text></View>}
            <View style={styles.billRow}><Text style={styles.billLabel}>Total Tax</Text><Text style={styles.billValue}>₹{taxTotal.toFixed(2)}</Text></View>
            <View style={styles.billRow}><Text style={styles.billLabel}>Delivery Charges</Text><Text style={styles.billValueFree}>FREE</Text></View>
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Total (incl. tax)</Text>
              <Text style={styles.billTotalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>

            {(totalSavings > 0 || totalDiscount > 0) && (
              <View style={styles.savingsCard}>
                <Icon name="check-circle" size={ms(17)} color="#4CAF50" />
                <Text style={styles.savingsText}>You're saving ₹{Math.round(Math.max(totalSavings, totalDiscount))} on this order</Text>
              </View>
            )}
          </View>

          {/* ── Payment Method ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="credit-card-outline" size={ms(20)} color={color.primary} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>

            <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionActive]} onPress={() => setPaymentMethod('ONLINE')} activeOpacity={0.7}>
              <View style={styles.paymentLeft}>
                <View style={[styles.radioOuter, paymentMethod === 'ONLINE' && styles.radioOuterActive]}>
                  {paymentMethod === 'ONLINE' && <View style={styles.radioInner} />}
                </View>
                <Icon name="cellphone" size={ms(20)} color={color.primary} />
                <View>
                  <Text style={styles.paymentTitle}>Pay Online</Text>
                  <Text style={styles.paymentSubtitle}>UPI, Cards, Wallets</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive, hasDigitalItem && styles.paymentOptionDisabled]}
              onPress={() => !hasDigitalItem && setPaymentMethod('COD')}
              disabled={hasDigitalItem}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.radioOuter, paymentMethod === 'COD' && styles.radioOuterActive, hasDigitalItem && styles.radioOuterDisabled]}>
                  {paymentMethod === 'COD' && !hasDigitalItem && <View style={styles.radioInner} />}
                </View>
                <Icon name="cash" size={ms(20)} color={hasDigitalItem ? '#BDBDBD' : '#4CAF50'} />
                <View>
                  <Text style={[styles.paymentTitle, hasDigitalItem && styles.paymentDisabled]}>Cash on Delivery</Text>
                  {hasDigitalItem && <Text style={styles.paymentSubtitle}>Not available for digital items</Text>}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Info cards ── */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="shield-check-outline" size={ms(20)} color={color.primary} />
              <Text style={styles.infoTitle}>Returns & Cancellation</Text>
            </View>
            <Text style={styles.infoText}>Digital orders cannot be returned. Physical orders can be returned within 7 days. Refund will be processed in 2-3 working days.</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="account-group-outline" size={ms(20)} color={color.primary} />
              <Text style={styles.infoTitle}>Dealer Programme</Text>
            </View>
            <Text style={styles.infoText}>Become a dealer or buy in bulk to enjoy special loyalty points, dealer codes for discounts, and bulk pricing negotiations.</Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomTotal}>₹{grandTotal.toFixed(2)}</Text>
          <Text style={styles.bottomSubtext}>
            {(totalSavings > 0 || totalDiscount > 0)
              ? `₹${Math.round(Math.max(totalSavings, totalDiscount))} Saved`
              : 'Incl. all taxes'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, placing && styles.checkoutBtnDisabled]}
          disabled={placing}
          onPress={() => placeOrder({ cartId: cart.cartId, cartItems: cart.items, paymentMethod: paymentMethod === 'ONLINE' ? 'RAZORPAY' : 'COD' })}
          activeOpacity={0.9}
        >
          {placing ? (
            <><ActivityIndicator size="small" color={color.text} /><Text style={styles.checkoutText}>Processing…</Text></>
          ) : (
            <><Icon name="check-circle" size={ms(18)} color={color.text} /><Text style={styles.checkoutText}>Place Order</Text></>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Address Styles ───────────────────────────────────────────────────────────
const addrStyles = ScaledSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s', paddingVertical: '12@vs' },
  loadingText: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  addrList: { gap: '10@vs', marginBottom: '12@vs' },
  addrCard: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: '10@ms', padding: '12@s', backgroundColor: '#FAFAFA' },
  addrCardSel: { borderColor: color.primary, backgroundColor: color.primary + '20' },
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: '10@s', borderWidth: 1.5, borderColor: color.primary, borderStyle: 'dashed', borderRadius: '10@ms', paddingVertical: '12@vs', paddingHorizontal: '14@s', backgroundColor: color.primary + '12' },
  addIconWrap: { width: '30@s', height: '30@s', borderRadius: '8@ms', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  addText: { flex: 1, fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
})

// ─── Bottom Sheet Styles ──────────────────────────────────────────────────────
const sh = ScaledSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  kavWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: '20@ms', borderTopRightRadius: '20@ms', maxHeight: SCREEN_HEIGHT * 0.9, elevation: 20 },
  handle: { width: '40@s', height: '4@vs', borderRadius: '2@ms', backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: '10@vs', marginBottom: '4@vs' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: '20@s', paddingVertical: '14@vs', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  sheetHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s' },
  sheetIconWrap: { width: '38@s', height: '38@s', borderRadius: '10@ms', backgroundColor: color.primary + '20', justifyContent: 'center', alignItems: 'center' },
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

// ─── Main Styles — ONLY color.* ───────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: color.background },
  loadingText: { marginTop: '12@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '14@vs', paddingHorizontal: '14@s',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  backBtn: { width: '36@s', height: '36@s', borderRadius: '18@ms', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff' },
  cartBadge: { backgroundColor: color.secondary, borderRadius: '12@ms', paddingHorizontal: '10@s', paddingVertical: '3@vs', minWidth: '28@s', alignItems: 'center' },
  cartBadgeText: { fontSize: '12@ms', color: color.text, fontFamily: FONTS.Bold },

  // ── Empty cart ───────────────────────────────────────────────────────────────
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: '32@s' },
  emptyTitle: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: color.text, marginTop: '16@vs' },
  emptySubtitle: { fontSize: '14@ms', color: '#888', marginTop: '6@vs', marginBottom: '24@vs', fontFamily: FONTS.Medium },
  shopNowBtn: { flexDirection: 'row', backgroundColor: color.secondary, paddingHorizontal: '24@s', paddingVertical: '12@vs', borderRadius: '8@ms', alignItems: 'center', gap: '8@s' },
  shopNowText: { color: color.text, fontFamily: FONTS.Bold, fontSize: '15@ms' },

  // ── Card ─────────────────────────────────────────────────────────────────────
  card: { backgroundColor: '#fff', marginHorizontal: '14@s', marginBottom: '10@vs', borderRadius: '10@ms', padding: '14@s', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, borderWidth: 1, borderColor: '#EBEBEB' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '14@vs', gap: '10@s' },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '10@vs' },

  // ── Items section ─────────────────────────────────────────────────────────────
  itemsSection: { paddingHorizontal: '14@s', paddingTop: '12@vs', gap: '8@vs' },
  cartCard: { backgroundColor: '#fff', borderRadius: '10@ms', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, borderWidth: 1, borderColor: '#EBEBEB', marginBottom: '4@vs' },
  cardContent: { padding: '14@s' },
  topRow: { flexDirection: 'row', gap: '12@s' },
  imageContainer: { position: 'relative', width: '80@s', height: '80@s', borderRadius: '8@ms', backgroundColor: color.background },
  productImage: { width: '100%', height: '100%', borderRadius: '8@ms', resizeMode: 'contain' },
  digitalBadge: { position: 'absolute', bottom: '4@vs', right: '4@s', backgroundColor: color.primary, width: '20@s', height: '20@s', borderRadius: '10@ms', justifyContent: 'center', alignItems: 'center' },
  productDetails: { flex: 1 },
  productTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '4@vs' },
  productDesc: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium, marginBottom: '6@vs' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  basePrice: { fontSize: '12@ms', color: '#BDBDBD', textDecorationLine: 'line-through', fontFamily: FONTS.Medium },
  finalPrice: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  savings: { fontSize: '11@ms', color: '#4CAF50', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  unitPrice: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },

  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '12@vs' },
  removeBtn: { padding: '6@s' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.background, borderRadius: '20@ms', paddingHorizontal: '4@s', paddingVertical: '2@vs', borderWidth: 1, borderColor: '#E0E0E0' },
  qtyButton: { width: '32@s', height: '32@s', borderRadius: '16@ms', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: '#E0E0E0' },
  qtyDisplay: { paddingHorizontal: '14@s' },
  qtyText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },

  clearCartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8@s', marginHorizontal: '14@s', marginVertical: '8@vs', paddingVertical: '10@vs', borderRadius: '8@ms', borderWidth: 1, borderColor: '#C62828', backgroundColor: '#FFF5F5' },
  clearCartText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#C62828' },

  // ── Free Gift ────────────────────────────────────────────────────────────────
  freeGiftSection: { marginHorizontal: '14@s', marginTop: '10@vs' },
  freeGiftSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10@vs' },
  freeGiftSectionTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  freeGiftCountPill: { backgroundColor: color.primary, borderRadius: '10@ms', paddingHorizontal: '8@s', paddingVertical: '2@vs' },
  freeGiftCountText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#fff' },
  freeGiftCard: { backgroundColor: color.primary + '12', borderRadius: '10@ms', borderWidth: 1.5, borderColor: color.primary, overflow: 'hidden', marginBottom: '10@vs' },
  freeGiftTopAccent: { height: '3@vs', backgroundColor: color.primary },
  freeGiftCardInner: { flexDirection: 'row', padding: '12@s', gap: '12@s' },
  freeGiftImageWrap: { position: 'relative', width: '70@s', height: '70@s', borderRadius: '8@ms', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' },
  freeGiftImage: { width: '100%', height: '100%', borderRadius: '8@ms', resizeMode: 'contain' },
  freeGiftBadgeWrap: { position: 'absolute', bottom: '-1@vs', left: '-1@s', right: '-1@s', alignItems: 'center' },
  freeGiftBadge: { flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: color.primary, paddingHorizontal: '6@s', paddingVertical: '2@vs', borderRadius: '4@ms', borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  freeGiftBadgeText: { fontSize: '8@ms', fontFamily: FONTS.Bold, color: '#fff', letterSpacing: 0.5 },
  freeGiftDetails: { flex: 1, justifyContent: 'space-between' },
  freeGiftTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms', marginBottom: '6@vs' },
  freeGiftDesc: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium, marginBottom: '8@vs' },
  freeGiftFooter: { flexDirection: 'row', alignItems: 'center', gap: '8@s', flexWrap: 'wrap' },
  freeGiftQtyPill: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: '#fff', borderRadius: '6@ms', paddingHorizontal: '8@s', paddingVertical: '3@vs', borderWidth: 1, borderColor: '#E0E0E0' },
  freeGiftQtyText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: color.primary },
  complimentaryPill: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: color.primary, borderRadius: '6@ms', paddingHorizontal: '8@s', paddingVertical: '3@vs' },
  complimentaryText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#fff' },
  freeGiftNote: { flexDirection: 'row', alignItems: 'center', gap: '6@s', backgroundColor: '#fff', paddingHorizontal: '12@s', paddingVertical: '7@vs', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  freeGiftNoteText: { fontSize: '11@ms', color: color.primary, fontFamily: FONTS.Medium, flex: 1 },

  // ── Offers ───────────────────────────────────────────────────────────────────
  offerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: '10@vs' },
  offerLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  offerText: { fontSize: '14@ms', color: color.text, fontFamily: FONTS.Medium },
  appliedCodeBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', borderRadius: '8@ms', padding: '12@s', marginBottom: '10@vs', borderWidth: 1, borderColor: '#C8E6C9' },
  appliedCodeLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  appliedCodeLabel: { fontSize: '11@ms', color: '#4CAF50', fontFamily: FONTS.Medium },
  appliedCodeValue: { fontSize: '14@ms', color: color.text, fontFamily: FONTS.Bold, marginTop: '1@vs' },
  codeInputRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s', marginTop: '8@vs', marginBottom: '4@vs' },
  codeInput: { flex: 1, height: '44@vs', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: '8@ms', paddingHorizontal: '12@s', fontSize: '14@ms', color: color.text, backgroundColor: color.background, fontFamily: FONTS.Medium },
  applyBtn: { backgroundColor: color.primary, paddingHorizontal: '16@s', height: '44@vs', borderRadius: '8@ms', justifyContent: 'center', alignItems: 'center', minWidth: '72@s' },
  applyBtnDisabled: { backgroundColor: '#BDBDBD' },
  applyBtnText: { color: '#fff', fontFamily: FONTS.Bold, fontSize: '14@ms' },

  // ── Discount Summary ──────────────────────────────────────────────────────────
  discountSummaryCard: { marginHorizontal: '14@s', marginBottom: '10@vs', borderRadius: '10@ms', overflow: 'hidden', borderWidth: 1, borderColor: '#C8E6C9', elevation: 1 },
  discountSummaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2E7D32', paddingHorizontal: '14@s', paddingVertical: '12@vs' },
  discountSummaryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  discountSummaryHeaderText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },
  discountSummaryBadge: { backgroundColor: '#fff', borderRadius: '10@ms', paddingHorizontal: '8@s', paddingVertical: '2@vs' },
  discountSummaryBadgeText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  discountSummaryBody: { backgroundColor: '#fff', padding: '14@s' },
  discountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: '8@vs' },
  discountRowLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s', flex: 1 },
  discountIconWrap: { width: '34@s', height: '34@s', borderRadius: '8@ms', justifyContent: 'center', alignItems: 'center' },
  discountName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '3@vs' },
  discountCategoryPill: { alignSelf: 'flex-start', borderRadius: '4@ms', paddingHorizontal: '6@s', paddingVertical: '2@vs' },
  discountCategoryText: { fontSize: '9@ms', fontFamily: FONTS.Bold, letterSpacing: 0.5 },
  discountAmountBlock: { flexDirection: 'row', alignItems: 'center', gap: '2@s' },
  discountMinus: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#388E3C' },
  discountAmount: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#388E3C' },
  discountDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '2@vs' },
  discountTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '10@vs', backgroundColor: '#F1F8F4', borderRadius: '8@ms', padding: '10@s', borderWidth: 1, borderColor: '#C8E6C9' },
  discountTotalLeft: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  discountTotalLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },
  discountTotalValue: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#2E7D32' },

  emailNote: { fontSize: '13@ms', color: '#888', marginBottom: '10@vs', fontFamily: FONTS.Medium },

  // ── Bill Summary ─────────────────────────────────────────────────────────────
  billTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '14@vs' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10@vs' },
  billLabel: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  billValue: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: color.text },
  billValueFree: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#4CAF50' },
  billTotalLabel: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  billTotalValue: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.primary },
  billDiscountLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: '8@s' },
  savingsCard: { flexDirection: 'row', alignItems: 'center', gap: '8@s', backgroundColor: '#F1F8F4', padding: '10@s', borderRadius: '8@ms', marginTop: '10@vs' },
  savingsText: { fontSize: '13@ms', color: '#4CAF50', fontFamily: FONTS.Medium, flex: 1 },

  // ── Payment ──────────────────────────────────────────────────────────────────
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: '12@s', borderRadius: '8@ms', borderWidth: 1.5, borderColor: '#EBEBEB', marginBottom: '10@vs' },
  paymentOptionActive: { borderColor: color.primary, backgroundColor: color.primary + '12' },
  paymentOptionDisabled: { opacity: 0.5, backgroundColor: color.background },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s', flex: 1 },
  radioOuter: { width: '20@s', height: '20@s', borderRadius: '10@ms', borderWidth: 2, borderColor: '#BDBDBD', justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: color.primary },
  radioOuterDisabled: { borderColor: '#E0E0E0' },
  radioInner: { width: '10@s', height: '10@s', borderRadius: '5@ms', backgroundColor: color.primary },
  paymentTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  paymentSubtitle: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  paymentDisabled: { color: '#BDBDBD' },

  // ── Info cards ───────────────────────────────────────────────────────────────
  infoCard: { backgroundColor: '#fff', marginHorizontal: '14@s', marginBottom: '10@vs', borderRadius: '10@ms', padding: '14@s', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, borderWidth: 1, borderColor: '#EBEBEB' },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginBottom: '8@vs' },
  infoTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  infoText: { fontSize: '12@ms', color: '#888', lineHeight: '18@ms', fontFamily: FONTS.Medium },

  // ── Incomplete profile ────────────────────────────────────────────────────────
  incompleteProfileCard: { alignItems: 'center', paddingVertical: '24@vs', paddingHorizontal: '16@s', backgroundColor: color.primary + '12', borderRadius: '10@ms', borderWidth: 1.5, borderColor: color.primary, marginTop: '8@vs' },
  incompleteProfileTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.primary, marginTop: '10@vs', marginBottom: '6@vs' },
  incompleteProfileText: { fontSize: '13@ms', color: '#888', textAlign: 'center', lineHeight: '19@ms', marginBottom: '16@vs', fontFamily: FONTS.Medium },
  completeProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: '8@s', backgroundColor: color.primary, paddingHorizontal: '18@s', paddingVertical: '11@vs', borderRadius: '8@ms', elevation: 2 },
  completeProfileBtnText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // ── Bottom bar ───────────────────────────────────────────────────────────────
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '14@s', paddingVertical: '12@vs', backgroundColor: '#fff', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 6, borderTopWidth: 1, borderTopColor: '#EBEBEB' },
  bottomLeft: { flex: 1 },
  bottomTotal: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: color.text },
  bottomSubtext: { fontSize: '12@ms', color: '#4CAF50', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: '8@s', backgroundColor: color.secondary, paddingHorizontal: '22@s', paddingVertical: '13@vs', borderRadius: '8@ms', elevation: 2 },
  checkoutBtnDisabled: { opacity: 0.65 },
  checkoutText: { color: color.text, fontFamily: FONTS.Bold, fontSize: '15@ms' },
})