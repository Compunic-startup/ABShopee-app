import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { TextInput } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import BASE_URL from '../../../services/api'
import { redeemMilestoneGift, placeGiftOrder } from '../../../services/loyaltyapi'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

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
    label: '', name: '', phone: '', line1: '', city: '', state: '',
    postalCode: '', country: 'India', isDefault: false,
  })

  useEffect(() => {
    if (editData) {
      setForm({
        label: editData.label ?? '',
        name: editData.contactInfo?.name ?? '',
        phone: editData.contactInfo?.phone ?? '',
        line1: editData.address?.line1 ?? editData.address?.addressLine1 ?? '',
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
        address: {
          addressLine1: form.line1.trim(), city: form.city.trim(),
          state: form.state.trim(), postalCode: form.postalCode.trim(),
          country: form.country.trim() || 'India',
        },
        contactInfo: { name: form.name.trim(), phone: form.phone.trim() },
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
            <Text style={sh.fieldLabel}>Label <Text style={sh.required}>*</Text></Text>
            <View style={sh.labelRow}>
              {LABEL_OPTIONS.map(opt => (
                <TouchableOpacity key={opt} style={[sh.labelChip, form.label === opt && sh.labelChipActive]} onPress={() => setField('label', opt)} activeOpacity={0.7}>
                  <Icon name={getLabelIcon(opt)} size={ms(14)} color={form.label === opt ? '#fff' : '#555'} />
                  <Text style={[sh.labelChipText, form.label === opt && sh.labelChipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={sh.fieldLabel}>Contact Name <Text style={sh.required}>*</Text></Text>
            <TextInput mode="outlined" label="Full Name *" value={form.name} onChangeText={v => setField('name', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} left={<TextInput.Icon icon="account-outline" color="#aaa" />} style={sh.input} dense />

            <Text style={sh.fieldLabel}>Phone <Text style={sh.required}>*</Text></Text>
            <TextInput mode="outlined" label="Phone Number *" value={form.phone} onChangeText={v => setField('phone', v)} keyboardType="phone-pad" maxLength={13} outlineColor="#E0E0E0" activeOutlineColor={color.primary} left={<TextInput.Icon icon="phone-outline" color="#aaa" />} style={sh.input} dense />

            <Text style={sh.fieldLabel}>Address <Text style={sh.required}>*</Text></Text>
            <TextInput mode="outlined" label="Address Line 1 *" value={form.line1} onChangeText={v => setField('line1', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} left={<TextInput.Icon icon="home-outline" color="#aaa" />} style={sh.input} dense />

            <View style={sh.rowDouble}>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>City <Text style={sh.required}>*</Text></Text>
                <TextInput mode="outlined" label="City *" value={form.city} onChangeText={v => setField('city', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} style={sh.input} dense />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>State <Text style={sh.required}>*</Text></Text>
                <TextInput mode="outlined" label="State *" value={form.state} onChangeText={v => setField('state', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} style={sh.input} dense />
              </View>
            </View>

            <View style={sh.rowDouble}>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Postal Code <Text style={sh.required}>*</Text></Text>
                <TextInput mode="outlined" label="Postal Code *" value={form.postalCode} onChangeText={v => setField('postalCode', v)} keyboardType="number-pad" maxLength={10} outlineColor="#E0E0E0" activeOutlineColor={color.primary} style={sh.input} dense />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Country</Text>
                <TextInput mode="outlined" label="Country" value={form.country} onChangeText={v => setField('country', v)} outlineColor="#E0E0E0" activeOutlineColor={color.primary} style={sh.input} dense />
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
    } catch (err) { console.log('Fetch addresses error', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAddresses() }, [])
  const handleSaved = useCallback(savedAddr => { fetchAddresses(); onSelect(savedAddr.id) }, [fetchAddresses])
  const openEdit = addr => { setEditTarget(addr); setSheetVisible(true) }
  const openAdd = () => { setEditTarget(null); setSheetVisible(true) }

  return (
    <View style={CS.card}>
      <View style={CS.cardHeader}>
        <Icon name="truck-delivery-outline" size={ms(20)} color={color.primary} />
        <Text style={CS.sectionTitle}>Delivery Address</Text>
      </View>

      {loading ? (
        <View style={addrS.loadingRow}>
          <ActivityIndicator size="small" color={color.primary} />
          <Text style={addrS.loadingText}>Loading saved addresses…</Text>
        </View>
      ) : (
        <>
          {addresses.length > 0 ? (
            <View style={addrS.addrList}>
              {addresses.map(a => {
                const sel = selectedId === a.id
                return (
                  <TouchableOpacity key={a.id} style={[addrS.addrCard, sel && addrS.addrCardSel]} onPress={() => onSelect(a.id)} activeOpacity={0.8}>
                    <View style={addrS.radioCol}>
                      <View style={[addrS.radioOuter, sel && addrS.radioOuterActive]}>
                        {sel && <View style={addrS.radioInner} />}
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={addrS.addrTopRow}>
                        <View style={[addrS.labelBadge, sel && addrS.labelBadgeActive]}>
                          <Icon name={getLabelIcon(a.label)} size={ms(11)} color={sel ? '#fff' : '#555'} />
                          <Text style={[addrS.labelBadgeText, sel && addrS.labelBadgeTextActive]}>{a.label}</Text>
                        </View>
                        {a.isDefault && (
                          <View style={addrS.defaultBadge}>
                            <Icon name="star" size={ms(9)} color="#F59E0B" />
                            <Text style={addrS.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => openEdit(a)} style={addrS.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Icon name="pencil-outline" size={ms(15)} color={color.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={addrS.line1} numberOfLines={2}>{a.address?.addressLine1}</Text>
                      <Text style={addrS.line2}>{[a.address?.city, a.address?.state, a.address?.postalCode].filter(Boolean).join(', ')}</Text>
                      <View style={addrS.contactRow}>
                        <Icon name="account-outline" size={ms(12)} color="#888" />
                        <Text style={addrS.contactText}>{a.contactInfo?.name}</Text>
                        <View style={addrS.dotSep} />
                        <Icon name="phone-outline" size={ms(12)} color="#888" />
                        <Text style={addrS.contactText}>{a.contactInfo?.phone}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : (
            <View style={addrS.emptyAddr}>
              <Icon name="map-marker-off-outline" size={ms(36)} color="#BDBDBD" />
              <Text style={addrS.emptyText}>No saved addresses yet</Text>
              <Text style={addrS.emptySub}>Add one below to continue</Text>
            </View>
          )}

          <TouchableOpacity style={addrS.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <View style={addrS.addIconWrap}>
              <Icon name="plus" size={ms(16)} color={color.primary} />
            </View>
            <Text style={addrS.addText}>Add New Address</Text>
            <Icon name="chevron-right" size={ms(16)} color={color.primary} />
          </TouchableOpacity>
        </>
      )}

      <AddressBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} onSaved={handleSaved} editData={editTarget} />
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ClaimGiftScreen() {
  const navigation = useNavigation()
  const { params } = useRoute()
  const { milestone } = params   // full milestone object from getLoyaltyRewards

  const [placing, setPlacing] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [addressesCache, setAddressesCache] = useState([])

  const giftQty = milestone?.rewardDetails?.quantity ?? 1
  const toast = msg => ToastAndroid.show(msg, ToastAndroid.SHORT)

  const handleClaimGift = async () => {
    if (placing) return
    if (!selectedAddressId) {
      toast('Please select a delivery address')
      return
    }

    try {
      setPlacing(true)
      const selectedAddr = addressesCache.find(a => a.id === selectedAddressId)
      if (!selectedAddr) {
        toast('Address not found, please re-select')
        return
      }

      console.log('ClaimGift: Step 1 — redeeming milestone gift...', milestone.id)
      // Step 1: redeem the milestone → get rewardClaimId + rewardItemId
      const redeemRes = await redeemMilestoneGift(milestone.id)
      console.log('ClaimGift: redeemRes:', redeemRes)

      if (!redeemRes.success) {
        toast(redeemRes?.message || 'Failed to redeem gift')
        return
      }

      const { rewardClaimId, reward } = redeemRes.data ?? redeemRes
      const rewardItemId = reward?.rewardItemId

      console.log('ClaimGift: parsed values:', { rewardClaimId, rewardItemId })

      if (!rewardClaimId && !redeemRes.data?.id) {
        toast('Unexpected response from server (missing claim ID), please try again')
        return
      }

      const finalClaimId = rewardClaimId || redeemRes.data?.id
      const finalItemId = rewardItemId || redeemRes.data?.rewardItemId || milestone.rewardItemId

      if (!finalClaimId || !finalItemId) {
        toast('Unexpected response from server (missing item/claim info), please try again')
        return
      }

      console.log('ClaimGift: Step 2 — placing order...', { finalClaimId, finalItemId })
      // Step 2: place the order using the standard endpoint
      const orderRes = await placeGiftOrder({
        rewardItemId: finalItemId,
        rewardClaimId: finalClaimId,
        quantity: giftQty,
        addressSnapshot: {
          line1: selectedAddr.address?.addressLine1,
          city: selectedAddr.address?.city,
          state: selectedAddr.address?.state,
          country: selectedAddr.address?.country ?? 'India',
          pincode: selectedAddr.address?.postalCode,
        },
        contactSnapshot: {
          name: selectedAddr.contactInfo?.name,
          phone: selectedAddr.contactInfo?.phone,
          email: selectedAddr.contactInfo?.email || '',
        },
      })

      console.log('ClaimGift: orderRes:', orderRes)
      toast('Gift claimed successfully! 🎁')
      navigation.navigate('OrderPlacedAnimation', { pointsEarned: 0 })
    } catch (err) {
      console.error('ClaimGift error (raw):', err)
      console.error('ClaimGift error (stringified):', JSON.stringify(err))
      const msg = err?.error?.message || err?.message || 'Failed to claim gift. Please try again.'
      toast(msg)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <KeyboardAvoidingView style={CS.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Header */}
      <View style={CS.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={CS.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={CS.headerTitle}>Claim Free Gift</Text>
        <View style={CS.headerRight}>
          <Icon name="gift-outline" size={ms(18)} color="#fff" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(120) }}>

        {/* Gift Summary */}
        <View style={CS.card}>
          <View style={CS.cardHeader}>
            <Icon name="gift-outline" size={ms(20)} color={color.primary} />
            <Text style={CS.sectionTitle}>Your Free Gift</Text>
          </View>

          {/* Gift detail row */}
          <View style={CS.giftRow}>
            <View style={CS.giftIconBox}>
              <Icon name="gift" size={ms(36)} color={color.primary} />
              <View style={CS.freeBadge}>
                <Text style={CS.freeBadgeText}>FREE</Text>
              </View>
            </View>
            <View style={CS.giftInfo}>
              <Text style={CS.giftTitle} numberOfLines={3}>{milestone?.rewardTitle}</Text>
              <View style={CS.giftMeta}>
                <Icon name="package-variant" size={ms(13)} color="#888" />
                <Text style={CS.giftMetaText}>Qty: {giftQty}</Text>
              </View>
              <View style={CS.giftMeta}>
                <Icon name="trophy-outline" size={ms(13)} color={color.primary} />
                <Text style={[CS.giftMetaText, { color: color.primary }]}>
                  Milestone: {milestone?.milestonePoints} pts
                </Text>
              </View>
            </View>
          </View>

          <View style={CS.giftNote}>
            <Icon name="information-outline" size={ms(13)} color={color.primary} />
            <Text style={CS.giftNoteText}>This is a complimentary gift and cannot be modified or exchanged</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <AddressSection
          selectedId={selectedAddressId}
          onSelect={setSelectedAddressId}
          onAddressesLoaded={setAddressesCache}
        />

        {/* Payment — COD only, free gift */}
        <View style={CS.card}>
          <View style={CS.cardHeader}>
            <Icon name="credit-card-check-outline" size={ms(20)} color={color.primary} />
            <Text style={CS.sectionTitle}>Payment</Text>
          </View>
          <View style={CS.payFreeRow}>
            <View style={CS.payFreeLeft}>
              <Icon name="check-circle" size={ms(20)} color={color.primary} />
              <View>
                <Text style={CS.payFreeTitle}>Free of Charge</Text>
                <Text style={CS.payFreeSub}>No payment required for this gift</Text>
              </View>
            </View>
            <View style={CS.payFreeBadge}>
              <Text style={CS.payFreeBadgeText}>₹0.00</Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={CS.card}>
          <View style={CS.cardHeader}>
            <Icon name="receipt-text-outline" size={ms(20)} color={color.primary} />
            <Text style={CS.sectionTitle}>Order Summary</Text>
          </View>

          <View style={CS.summaryRow}>
            <Text style={CS.summaryLabel}>Gift Item</Text>
            <Text style={CS.summaryValStrike}>₹—</Text>
          </View>
          <View style={CS.summaryRow}>
            <Text style={CS.summaryLabel}>Gift Discount</Text>
            <Text style={CS.summaryValGreen}>- FREE</Text>
          </View>
          <View style={CS.summaryDivider} />
          <View style={CS.summaryRow}>
            <Text style={CS.summaryTotal}>Total Payable</Text>
            <Text style={CS.summaryTotalVal}>₹0.00</Text>
          </View>

          <View style={CS.cod}>
            <Icon name="truck-delivery-outline" size={ms(14)} color="#64748B" />
            <Text style={CS.codText}>Will be delivered to your selected address</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom CTA */}
      <View style={CS.bottomBar}>
        <View style={CS.bottomLeft}>
          <Text style={CS.bottomLabel}>Total</Text>
          <Text style={CS.bottomTotal}>FREE</Text>
        </View>
        <TouchableOpacity
          style={[CS.claimBtn, (!selectedAddressId || placing) && CS.claimBtnDis]}
          onPress={handleClaimGift}
          disabled={!selectedAddressId || placing}
          activeOpacity={0.85}
        >
          {placing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="gift" size={ms(18)} color="#fff" />
              <Text style={CS.claimBtnText}>Claim Gift</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CS = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: '14@s',
    paddingTop: Platform.OS === 'android' ? '14@vs' : '12@vs',
    paddingBottom: '13@vs',
    backgroundColor: color.primary,
    elevation: 4,
  },
  headerBtn: { width: '36@s', height: '36@s', borderRadius: '4@ms', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: '4@s' },

  // Card
  card: {
    backgroundColor: '#fff', marginHorizontal: '14@s', marginBottom: '10@vs',
    borderRadius: '4@ms', padding: '14@s',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
    borderWidth: 1, borderColor: '#EBEBEB', marginTop: '14@vs',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: '14@vs', gap: '10@s' },
  sectionTitle: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },

  // Gift row
  giftRow: { flexDirection: 'row', gap: '14@s', marginBottom: '12@vs' },
  giftIconBox: {
    width: '80@s', height: '80@s', borderRadius: '4@ms',
    backgroundColor: color.primary + '15',
    borderWidth: 1, borderColor: color.primary + '30',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  freeBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: color.primary, alignItems: 'center',
    paddingVertical: '2@vs', borderBottomLeftRadius: '4@ms', borderBottomRightRadius: '4@ms',
  },
  freeBadgeText: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: '#fff', letterSpacing: 0.5 },
  giftInfo: { flex: 1 },
  giftTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '20@ms', marginBottom: '8@vs' },
  giftMeta: { flexDirection: 'row', alignItems: 'center', gap: '5@s', marginBottom: '4@vs' },
  giftMetaText: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888' },
  giftNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '8@s',
    backgroundColor: color.primary + '0D', borderRadius: '4@ms',
    padding: '10@s', borderWidth: 1, borderColor: color.primary + '25',
  },
  giftNoteText: { flex: 1, fontSize: '11@ms', fontFamily: FONTS.Medium, color: color.primary, lineHeight: '16@ms' },

  // Payment free row
  payFreeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payFreeLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s', flex: 1 },
  payFreeTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.primary },
  payFreeSub: { fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#888', marginTop: '2@vs' },
  payFreeBadge: { backgroundColor: color.primary + '14', borderRadius: '4@ms', paddingHorizontal: '10@s', paddingVertical: '5@vs', borderWidth: 1, borderColor: color.primary + '40' },
  payFreeBadgeText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.primary },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8@vs' },
  summaryLabel: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  summaryValStrike: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#BDBDBD', textDecorationLine: 'line-through' },
  summaryValGreen: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '10@vs' },
  summaryTotal: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: color.text },
  summaryTotalVal: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: color.primary },
  cod: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginTop: '10@vs' },
  codText: { fontSize: '11@ms', fontFamily: FONTS.Medium, color: '#64748B', flex: 1 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: '14@s', paddingVertical: '12@vs',
    backgroundColor: '#fff', elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 6,
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
  },
  bottomLeft: { flex: 1 },
  bottomLabel: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },
  bottomTotal: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: color.primary },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    backgroundColor: color.primary,
    paddingHorizontal: '22@s', paddingVertical: '13@vs',
    borderRadius: '4@ms', elevation: 2,
  },
  claimBtnDis: { opacity: 0.6 },
  claimBtnText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#fff' },
})

// ─── Address styles ───────────────────────────────────────────────────────────
const addrS = ScaledSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: '10@s', paddingVertical: '12@vs' },
  loadingText: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  addrList: { gap: '10@vs', marginBottom: '12@vs' },
  addrCard: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: '4@ms', padding: '12@s', backgroundColor: '#FAFAFA' },
  addrCardSel: { borderColor: color.primary, backgroundColor: color.primary + '14' },
  radioCol: { paddingTop: '2@vs' },
  radioOuter: { width: '20@s', height: '20@s', borderRadius: '10@ms', borderWidth: 2, borderColor: '#BDBDBD', justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { borderColor: color.primary },
  radioInner: { width: '10@s', height: '10@s', borderRadius: '5@ms', backgroundColor: color.primary },
  addrTopRow: { flexDirection: 'row', alignItems: 'center', gap: '6@s', marginBottom: '6@vs', flexWrap: 'wrap' },
  labelBadge: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: color.background, borderRadius: '4@ms', paddingHorizontal: '8@s', paddingVertical: '3@vs' },
  labelBadgeActive: { backgroundColor: color.primary },
  labelBadgeText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#555' },
  labelBadgeTextActive: { color: '#fff' },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: color.primary + '14', borderRadius: '4@ms', paddingHorizontal: '6@s', paddingVertical: '3@vs', borderWidth: 1, borderColor: color.primary + '40' },
  defaultBadgeText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: color.primary },
  editBtn: { marginLeft: 'auto', padding: '2@s' },
  line1: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms', marginBottom: '3@vs' },
  line2: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium, marginBottom: '6@vs' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: '4@s', flexWrap: 'wrap' },
  contactText: { fontSize: '11@ms', color: '#BDBDBD', fontFamily: FONTS.Medium },
  dotSep: { width: '3@s', height: '3@s', borderRadius: '2@ms', backgroundColor: '#E0E0E0', marginHorizontal: '2@s' },
  emptyAddr: { alignItems: 'center', paddingVertical: '16@vs', gap: '4@vs' },
  emptyText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#BDBDBD' },
  emptySub: { fontSize: '12@ms', color: '#E0E0E0', fontFamily: FONTS.Medium },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: '10@s', borderWidth: 1.5, borderColor: color.primary, borderStyle: 'dashed', borderRadius: '4@ms', paddingVertical: '12@vs', paddingHorizontal: '14@s', backgroundColor: color.primary + '14' },
  addIconWrap: { width: '30@s', height: '30@s', borderRadius: '4@ms', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  addText: { flex: 1, fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },
})

// ─── Bottom sheet styles ──────────────────────────────────────────────────────
const sh = ScaledSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  kavWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: '12@ms', borderTopRightRadius: '12@ms', maxHeight: SCREEN_HEIGHT * 0.9, elevation: 20 },
  handle: { width: '40@s', height: '4@vs', borderRadius: '2@ms', backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: '10@vs', marginBottom: '4@vs' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: '20@s', paddingVertical: '14@vs', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  sheetHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: '12@s' },
  sheetIconWrap: { width: '38@s', height: '38@s', borderRadius: '4@ms', backgroundColor: color.primary + '20', justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text },
  sheetSub: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '1@vs' },
  closeBtn: { width: '34@s', height: '34@s', borderRadius: '4@ms', backgroundColor: color.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  formScroll: { paddingHorizontal: '20@s', paddingTop: '14@vs' },
  fieldLabel: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '4@vs', marginTop: '6@vs' },
  required: { color: '#C62828', fontSize: '13@ms' },
  labelRow: { flexDirection: 'row', gap: '8@s', flexWrap: 'wrap', marginBottom: '8@vs' },
  labelChip: { flexDirection: 'row', alignItems: 'center', gap: '5@s', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: '4@ms', paddingHorizontal: '12@s', paddingVertical: '6@vs', backgroundColor: color.background },
  labelChipActive: { borderColor: color.primary, backgroundColor: color.primary },
  labelChipText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#555' },
  labelChipTextActive: { color: '#fff', fontSize: '12@ms', fontFamily: FONTS.Bold },
  input: { backgroundColor: '#fff', marginBottom: '6@vs' },
  rowDouble: { flexDirection: 'row', gap: '10@s' },
  defaultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', backgroundColor: color.background, borderRadius: '4@ms', padding: '14@s', marginTop: '8@vs', marginBottom: '14@vs', borderWidth: 1, borderColor: '#E0E0E0' },
  checkbox: { width: '22@s', height: '22@s', borderRadius: '4@ms', borderWidth: 2, borderColor: '#BDBDBD', justifyContent: 'center', alignItems: 'center', marginTop: '1@vs' },
  checkboxActive: { backgroundColor: color.primary, borderColor: color.primary },
  defaultLabel: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  defaultSub: { fontSize: '11@ms', color: '#888', marginTop: '2@vs', fontFamily: FONTS.Medium },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '10@s', backgroundColor: color.primary, borderRadius: '4@ms', paddingVertical: '14@vs', elevation: 3 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#fff' },
})
