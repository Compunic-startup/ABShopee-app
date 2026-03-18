import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Animated,
  StyleSheet,
  Platform,
  ToastAndroid,
  KeyboardAvoidingView,
  Image,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BASE_URL from '../../../services/api'
import FONTS from '../../../utils/fonts'

/* ─── palette ─── */
const BLUE        = '#0B77A7'
const BLUE_DARK   = '#085f87'
const BLUE_LIGHT  = '#E8F4FB'
const BLUE_MID    = '#C2E0F0'
const WHITE       = '#FFFFFF'
const BG          = '#F4F9FC'
const TEXT_DARK   = '#0D1B2A'
const TEXT_MID    = '#4A6070'
const TEXT_LIGHT  = '#8FA8B8'
const BORDER      = '#DCE8F0'
const DEALER_GOLD    = '#C8973A'
const DEALER_GOLD_BG = '#FDF6E9'
const ERROR       = '#E53935'
const ERROR_BG    = '#FFF5F5'
const SUCCESS     = '#2E7D32'

/* ─── helpers ─── */
const BUSINESS_TYPES = [
  'sole_proprietorship',
  'partnership',
  'private_limited',
  'public_limited',
  'llp',
  'wholesale',
  'dealer',
  'retailer',
]

/* ─── sub-components ─── */

function SectionHeader({ icon, title, subtitle, isDealer }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconBox, isDealer && styles.sectionIconBoxDealer]}>
        <Icon name={icon} size={18} color={isDealer ? DEALER_GOLD : BLUE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  )
}

function FieldInput({
  label, value, onChangeText, placeholder, keyboardType = 'default',
  autoCapitalize = 'sentences', icon, error, multiline = false,
  editable = true, hint,
}) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[
        styles.inputWrap,
        focused && styles.inputWrapFocused,
        error  && styles.inputWrapError,
        !editable && styles.inputWrapDisabled,
      ]}>
        {icon ? <Icon name={icon} size={16} color={focused ? BLUE : TEXT_LIGHT} style={styles.inputIcon} /> : null}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={TEXT_LIGHT}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={editable}
        />
      </View>
      {error ? (
        <View style={styles.fieldError}>
          <Icon name="alert-circle-outline" size={12} color={ERROR} />
          <Text style={styles.fieldErrorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  )
}

function TypePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const display = value
    ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Select business type'

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>Business Type</Text>
      <TouchableOpacity
        style={[styles.inputWrap, styles.pickerBtn]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
      >
        <Icon name="briefcase-outline" size={16} color={value ? BLUE : TEXT_LIGHT} style={styles.inputIcon} />
        <Text style={[styles.input, !value && { color: TEXT_LIGHT }]}>{display}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={TEXT_LIGHT} />
      </TouchableOpacity>

      {open && (
        <View style={styles.pickerDropdown}>
          {BUSINESS_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.pickerOption, type === value && styles.pickerOptionActive]}
              onPress={() => { onChange(type); setOpen(false) }}
              activeOpacity={0.75}
            >
              <Text style={[styles.pickerOptionText, type === value && styles.pickerOptionTextActive]}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
              {type === value && <Icon name="check" size={16} color={BLUE} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

function GstToggle({ value, onChange }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>GST Registered?</Text>
      <View style={styles.toggleRow}>
        {[true, false].map(opt => (
          <TouchableOpacity
            key={String(opt)}
            style={[styles.toggleBtn, value === opt && styles.toggleBtnActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Icon
              name={opt ? 'check-circle-outline' : 'close-circle-outline'}
              size={16}
              color={value === opt ? WHITE : TEXT_LIGHT}
            />
            <Text style={[styles.toggleText, value === opt && styles.toggleTextActive]}>
              {opt ? 'Yes' : 'No'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

/* ─── Saving overlay ─── */
function SavingOverlay({ visible }) {
  if (!visible) return null
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.overlayText}>Saving changes…</Text>
      </View>
    </View>
  )
}

/* ─── Main Screen ─── */
export default function EditProfileScreen() {
  const navigation = useNavigation()
  const route      = useRoute()

  /* profile passed from AccountScreen via navigation params */
  const initialProfile = route.params?.profile ?? null

  const [loading,  setLoading]  = useState(!initialProfile)
  const [saving,   setSaving]   = useState(false)
  const [profile,  setProfile]  = useState(initialProfile)

  const headerAnim = useRef(new Animated.Value(0)).current
  const fadeAnim   = useRef(new Animated.Value(initialProfile ? 1 : 0)).current

  /* ── User profile fields ── */
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [displayName, setDisplayName] = useState('')
  const [userPhone,   setUserPhone]   = useState('')
  const [avatarUrl,   setAvatarUrl]   = useState('')

  /* ── Business profile fields ── */
  const [legalName,      setLegalName]      = useState('')
  const [tradeName,      setTradeName]      = useState('')
  const [logoUrl,        setLogoUrl]        = useState('')
  const [businessType,   setBusinessType]   = useState('')
  const [gstNumber,      setGstNumber]      = useState('')
  const [panNumber,      setPanNumber]      = useState('')
  const [isGstRegistered,setIsGstRegistered]= useState(false)
  const [email,          setEmail]          = useState('')
  const [bizPhone,       setBizPhone]       = useState('')
  const [website,        setWebsite]        = useState('')

  /* ── Address fields ── */
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city,         setCity]         = useState('')
  const [state,        setState]        = useState('')
  const [postalCode,   setPostalCode]   = useState('')
  const [country,      setCountry]      = useState('India')

  /* ── Validation errors ── */
  const [errors, setErrors] = useState({})

  /* ── populate form when profile available ── */
  const populateForm = useCallback((p) => {
    if (!p) return
    const up = p.userProfile ?? {}
    const ad = p.address     ?? {}

    setFirstName(up.firstName    || '')
    setLastName(up.lastName      || '')
    setDisplayName(up.displayName || '')
    setUserPhone(up.phone        || '')
    setAvatarUrl(up.avatarUrl    || '')

    setLegalName(p.legalName      || '')
    setTradeName(p.tradeName      || '')
    setLogoUrl(p.logoUrl          || '')
    setBusinessType(p.businessType || '')
    setGstNumber(p.gstNumber      || '')
    setPanNumber(p.panNumber      || '')
    setIsGstRegistered(p.isGstRegistered ?? false)
    setEmail(p.email              || '')
    setBizPhone(p.phone           || '')
    setWebsite(p.website          || '')

    setAddressLine1(ad.addressLine1 || '')
    setAddressLine2(ad.addressLine2 || '')
    setCity(ad.city                 || '')
    setState(ad.state               || '')
    setPostalCode(ad.postalCode     || '')
    setCountry(ad.country           || 'India')
  }, [])

  /* ── fetch profile if not passed ── */
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()

    if (initialProfile) {
      populateForm(initialProfile)
      return
    }

    const load = async () => {
      try {
        const token      = await AsyncStorage.getItem('userToken')
        const businessId = await AsyncStorage.getItem('businessId')
        const res  = await fetch(`${BASE_URL}/customer/business/${businessId}/customer-business-profile`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
        const json = await res()
        console.log('Profile fetch response:', json)
        if (json?.success && json?.data) {
          setProfile(json.data)
          populateForm(json.data)
        }
      } catch (err) {
        // console.error('EditProfileScreen fetch error:', err)
        ToastAndroid.show('Failed to load profile data', ToastAndroid.SHORT)
      } finally {
        setLoading(false)
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
      }
    }
    load()
  }, [])

  /* ── validation ── */
  const validate = () => {
    const e = {}
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))        e.email      = 'Enter a valid email address'
    if (website && !/^https?:\/\/.+/.test(website))                  e.website    = 'Must start with http:// or https://'
    if (gstNumber && gstNumber.length !== 15)                        e.gstNumber  = 'GST number must be 15 characters'
    if (panNumber && panNumber.length !== 10)                        e.panNumber  = 'PAN must be 10 characters'
    if (postalCode && !/^\d{6}$/.test(postalCode))                   e.postalCode = 'Enter a valid 6-digit postal code'
    if (avatarUrl && !/^https?:\/\/.+/.test(avatarUrl))              e.avatarUrl  = 'Must start with http:// or https://'
    if (logoUrl   && !/^https?:\/\/.+/.test(logoUrl))                e.logoUrl    = 'Must start with http:// or https://'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── save ── */
  const handleSave = async () => {
    if (!validate()) {
      ToastAndroid.show('Please fix the errors below', ToastAndroid.SHORT)
      return
    }

    setSaving(true)
    try {
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      /* ── 1. Update user profile ── */
      const userPayload = {}
      if (firstName)   userPayload.firstName   = firstName.trim()
      if (lastName)    userPayload.lastName    = lastName.trim()
      if (displayName) userPayload.displayName = displayName.trim()
      if (userPhone)   userPayload.phone       = userPhone.trim()
      if (avatarUrl)   userPayload.avatarUrl   = avatarUrl.trim()

      if (Object.keys(userPayload).length > 0) {
        const userRes  = await fetch(`${BASE_URL}/user/profile`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(userPayload),
        })
        const userJson = await userRes.json()
        if (!userJson?.success) {
          // const msg = userJson?.error?.message || 'Failed to update user profile'
          ToastAndroid.show(msg, ToastAndroid.LONG)
          setSaving(false)
          return
        }
      }

      /* ── 2. Update business profile ── */
      const bizPayload = {}
      if (legalName)    bizPayload.legalName    = legalName.trim()
      if (tradeName)    bizPayload.tradeName    = tradeName.trim()
      if (logoUrl)      bizPayload.logoUrl      = logoUrl.trim()
      if (businessType) bizPayload.businessType = businessType
      if (gstNumber)    bizPayload.gstNumber    = gstNumber.trim().toUpperCase()
      if (panNumber)    bizPayload.panNumber    = panNumber.trim().toUpperCase()
      bizPayload.isGstRegistered = isGstRegistered
      if (email)        bizPayload.email        = email.trim()
      if (bizPhone)     bizPayload.phone        = bizPhone.trim()
      if (website)      bizPayload.website      = website.trim()
      if (addressLine1) bizPayload.addressLine1 = addressLine1.trim()
      if (addressLine2) bizPayload.addressLine2 = addressLine2.trim()
      if (city)         bizPayload.city         = city.trim()
      if (state)        bizPayload.state        = state.trim()
      if (postalCode)   bizPayload.postalCode   = postalCode.trim()
      if (country)      bizPayload.country      = country.trim()

      if (Object.keys(bizPayload).length > 0) {
        const bizRes  = await fetch(`${BASE_URL}/seller/business/${businessId}/customer-business-profile`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(bizPayload),
        })
        const bizJson = await bizRes.json()
        if (!bizJson?.success) {
          const code = bizJson?.error?.code
          const msg  = bizJson?.error?.message
          if (code === 'BUSINESS_NOT_FOUND')  ToastAndroid.show('Business not found', ToastAndroid.SHORT)
          else if (code === 'FORBIDDEN')       ToastAndroid.show('You do not have permission to update this profile', ToastAndroid.LONG)
          else if (code === 'VALIDATION_ERROR') ToastAndroid.show(msg || 'Validation error', ToastAndroid.LONG)
          // else ToastAndroid.show(msg || 'Failed to update business profile', ToastAndroid.LONG)
          setSaving(false)
          return
        }
      }

      ToastAndroid.show('Profile updated successfully ✓', ToastAndroid.SHORT)
      navigation.goBack()
    } catch (err) {
      console.error('handleSave error:', err)
      ToastAndroid.show('Network error. Please try again.', ToastAndroid.SHORT)
    } finally {
      setSaving(false)
    }
  }

  const isDealer = profile?.businessType === 'wholesale' || profile?.businessType === 'dealer'

  /* ── loading ── */
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />
      <SavingOverlay visible={saving} />

      {/* ── Header ── */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }),
            }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
          <Icon name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>Account</Text>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveBtn}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Icon name="check" size={18} color={BLUE} />
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Avatar preview ── */}
          <View style={styles.avatarPreviewWrap}>
            <View style={styles.avatarPreviewCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarPreviewImg} />
              ) : (
                <Icon name="account" size={48} color={BLUE} />
              )}
            </View>
            <Text style={styles.avatarHint}>
              {avatarUrl ? 'Avatar URL preview' : 'Enter an avatar URL below to set your photo'}
            </Text>
          </View>

          {/* ════════════════════════════════
              SECTION 1 — Personal Details
          ════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader
              icon="account-outline"
              title="Personal Details"
              subtitle="Your name and contact info"
            />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Rahul"
                  icon="account-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Sharma"
                  icon="account-outline"
                />
              </View>
            </View>

            <FieldInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Rahul S"
              icon="badge-account-horizontal-outline"
              hint="This is the name shown on your account"
            />

            <FieldInput
              label="Phone Number"
              value={userPhone}
              onChangeText={setUserPhone}
              placeholder="+91 98765 43210"
              icon="phone-outline"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <FieldInput
              label="Avatar URL"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://cdn.example.com/avatar.png"
              icon="image-outline"
              keyboardType="url"
              autoCapitalize="none"
              error={errors.avatarUrl}
              hint="Paste a public image link for your profile photo"
            />
          </View>

          {/* ════════════════════════════════
              SECTION 2 — Business Identity
          ════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader
              icon="domain"
              title="Business Identity"
              subtitle="Legal and trade details"
              isDealer={isDealer}
            />

            <FieldInput
              label="Legal Name"
              value={legalName}
              onChangeText={setLegalName}
              placeholder="ABC Private Limited"
              icon="office-building-outline"
            />

            <FieldInput
              label="Trade / Brand Name"
              value={tradeName}
              onChangeText={setTradeName}
              placeholder="ABC Store"
              icon="store-outline"
            />

            <TypePicker value={businessType} onChange={setBusinessType} />

            <FieldInput
              label="Business Logo URL"
              value={logoUrl}
              onChangeText={setLogoUrl}
              placeholder="https://cdn.example.com/logo.png"
              icon="image-outline"
              keyboardType="url"
              autoCapitalize="none"
              error={errors.logoUrl}
            />
          </View>

          {/* ════════════════════════════════
              SECTION 3 — Tax & Compliance
          ════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader
              icon="file-certificate-outline"
              title="Tax & Compliance"
              subtitle="GST, PAN registration details"
              isDealer={isDealer}
            />

            <GstToggle value={isGstRegistered} onChange={setIsGstRegistered} />

            {isGstRegistered && (
              <FieldInput
                label="GST Number"
                value={gstNumber}
                onChangeText={t => setGstNumber(t.toUpperCase())}
                placeholder="27ABCDE1234F1Z5"
                icon="identifier"
                autoCapitalize="characters"
                keyboardType="default"
                error={errors.gstNumber}
                hint="15-character GSTIN"
              />
            )}

            <FieldInput
              label="PAN Number"
              value={panNumber}
              onChangeText={t => setPanNumber(t.toUpperCase())}
              placeholder="ABCDE1234F"
              icon="card-account-details-outline"
              autoCapitalize="characters"
              error={errors.panNumber}
              hint="10-character PAN"
            />
          </View>

          {/* ════════════════════════════════
              SECTION 4 — Contact
          ════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader
              icon="contacts-outline"
              title="Business Contact"
              subtitle="Email, phone, and website"
            />

            <FieldInput
              label="Business Email"
              value={email}
              onChangeText={setEmail}
              placeholder="contact@example.com"
              icon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <FieldInput
              label="Business Phone"
              value={bizPhone}
              onChangeText={setBizPhone}
              placeholder="+91 98765 43210"
              icon="phone-outline"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <FieldInput
              label="Website"
              value={website}
              onChangeText={setWebsite}
              placeholder="https://yourstore.com"
              icon="web"
              keyboardType="url"
              autoCapitalize="none"
              error={errors.website}
            />
          </View>

          {/* ════════════════════════════════
              SECTION 5 — Address
          ════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader
              icon="map-marker-outline"
              title="Business Address"
              subtitle="Registered location details"
            />

            <FieldInput
              label="Address Line 1"
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="Shop 12, Market Road"
              icon="map-marker-outline"
            />

            <FieldInput
              label="Address Line 2"
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Near City Mall"
              icon="map-marker-radius-outline"
            />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  placeholder="Pune"
                  icon="city-variant-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="State"
                  value={state}
                  onChangeText={setState}
                  placeholder="Maharashtra"
                  icon="map-outline"
                />
              </View>
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="Postal Code"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="411001"
                  icon="mailbox-outline"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  error={errors.postalCode}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="Country"
                  value={country}
                  onChangeText={setCountry}
                  placeholder="India"
                  icon="earth"
                />
              </View>
            </View>
          </View>

          {/* ── Save button (bottom) ── */}
          <TouchableOpacity
            style={[styles.saveBtnBottom, saving && styles.saveBtnBottomDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <>
                <Icon name="content-save-outline" size={20} color={WHITE} />
                <Text style={styles.saveBtnBottomText}>Save All Changes</Text>
              </>
            )}
          </TouchableOpacity>

        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

/* ─── styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    backgroundColor: BLUE,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: {
    fontSize: 10, color: 'rgba(255,255,255,0.65)',
    fontFamily: FONTS.Medium, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: -0.2,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: WHITE,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { fontSize: 13, fontFamily: FONTS.Bold, color: BLUE },

  /* Loader */
  loaderWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: TEXT_MID, fontFamily: FONTS.Medium },

  /* Avatar preview */
  avatarPreviewWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  avatarPreviewCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: BLUE_MID,
    overflow: 'hidden',
  },
  avatarPreviewImg: { width: 90, height: 90, borderRadius: 45 },
  avatarHint: { fontSize: 12, color: TEXT_LIGHT, fontFamily: FONTS.Regular },

  /* Section */
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sectionIconBox: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionIconBoxDealer: { backgroundColor: DEALER_GOLD_BG },
  sectionTitle:    { fontSize: 15, fontFamily: FONTS.Bold,   color: TEXT_DARK },
  sectionSubtitle: { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT, marginTop: 1 },

  /* Field */
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_MID,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, backgroundColor: BG,
    paddingHorizontal: 12, minHeight: 46,
  },
  inputWrapFocused:  { borderColor: BLUE, backgroundColor: '#F0F8FC' },
  inputWrapError:    { borderColor: ERROR, backgroundColor: ERROR_BG },
  inputWrapDisabled: { opacity: 0.5 },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, fontSize: 14, fontFamily: FONTS.Regular,
    color: TEXT_DARK, paddingVertical: 0,
  },
  inputMultiline: { textAlignVertical: 'top', paddingTop: 10, minHeight: 80 },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fieldErrorText: { fontSize: 11, color: ERROR, fontFamily: FONTS.Regular },
  fieldHint: { fontSize: 11, color: TEXT_LIGHT, fontFamily: FONTS.Regular, marginTop: 4 },

  /* Row of 2 */
  row2: { flexDirection: 'row', gap: 10 },

  /* Type picker */
  pickerBtn: { justifyContent: 'space-between' },
  pickerDropdown: {
    marginTop: 4, borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, backgroundColor: WHITE, overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  pickerOptionActive:     { backgroundColor: BLUE_LIGHT },
  pickerOptionText:       { fontSize: 14, fontFamily: FONTS.Regular, color: TEXT_DARK },
  pickerOptionTextActive: { color: BLUE, fontFamily: FONTS.Medium },

  /* GST toggle */
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: BG,
  },
  toggleBtnActive: { backgroundColor: BLUE, borderColor: BLUE },
  toggleText:       { fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_LIGHT },
  toggleTextActive: { color: WHITE },

  /* Save bottom */
  saveBtnBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 8,
    backgroundColor: BLUE, paddingVertical: 15,
    borderRadius: 14,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnBottomDisabled: { opacity: 0.6 },
  saveBtnBottomText: {
    fontSize: 16, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: 0.2,
  },

  /* Overlay */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCard: {
    backgroundColor: WHITE, borderRadius: 16,
    paddingHorizontal: 36, paddingVertical: 28,
    alignItems: 'center', gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  overlayText: { fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_DARK },
})
