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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BASE_URL from '../../../services/api'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'

/* ─── tokens from color.js ─── */
const PRIMARY = color.primary
const BG = color.background
const TEXT_DARK = color.text

const PRIMARY_DARK = color.primary
const PRIMARY_LIGHT = '#E3F2FA'
const PRIMARY_MID = '#B3D8EE'
const WHITE = '#FFFFFF'
const TEXT_MID = '#5A6A75'
const TEXT_LIGHT = '#9EB0BC'
const BORDER = '#DDE8EE'
const DIVIDER = '#EEF3F6'
const ERROR = '#E53935'
const ERROR_BG = '#FFF0F0'

/* ─── business type options ─── */
const BUSINESS_TYPES = [
  'sole_proprietorship', 'partnership', 'private_limited',
  'public_limited', 'llp', 'wholesale', 'dealer', 'retailer', 'other'
]

/* ─── SectionHeader ─── */
function SectionHeader({ icon, title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Icon name={icon} size={18} color={PRIMARY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  )
}

/* ─── FieldInput ─── */
function FieldInput({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', autoCapitalize = 'sentences',
  icon, error, multiline = false, editable = true, hint,
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[
        styles.inputWrap,
        focused && styles.inputWrapFocused,
        error && styles.inputWrapError,
        !editable && styles.inputWrapDisabled,
      ]}>
        {icon ? <Icon name={icon} size={16} color={focused ? PRIMARY : TEXT_LIGHT} style={styles.inputIcon} /> : null}
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

/* ─── TypePicker ─── */
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
        <Icon name="briefcase-outline" size={16} color={value ? PRIMARY : TEXT_LIGHT} style={styles.inputIcon} />
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
              {type === value && <Icon name="check" size={16} color={PRIMARY} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

/* ─── SavingOverlay ─── */
function SavingOverlay({ visible }) {
  if (!visible) return null
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.overlayText}>Saving changes…</Text>
      </View>
    </View>
  )
}

/* ════════════════════════════════════════════
   Main Screen
════════════════════════════════════════════ */
export default function EditProfileScreen() {
  const navigation = useNavigation()
  const route = useRoute()

  const initialProfile = route.params?.profile ?? null

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(initialProfile)

  // ─── Profile incomplete guard (same as AddressesScreen) ───────────────────
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const isProfileEmpty = (p) => {
    if (!p) return true
    const addrEmpty =
      !p.address ||
      !p.address.addressLine1 ||
      !p.address.city ||
      !p.address.state ||
      !p.address.postalCode
    const upEmpty =
      !p.userProfile ||
      !p.userProfile.firstName ||
      !p.userProfile.phone
    return addrEmpty || upEmpty
  }

  const fetchUserProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const bId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${bId}/customer-business-profile`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const json = await res.json()
      setUserProfile(json?.success && json?.data ? json.data : null)
    } catch (err) {
      console.log('Error fetching profile:', err)
      setUserProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])
  // ──────────────────────────────────────────────────────────────────────────

  const headerAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(initialProfile ? 1 : 0)).current

  /* ── personal fields ── */
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  /* ── business fields ── */
  const [legalName, setLegalName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [isGstRegistered, setIsGstRegistered] = useState(false)
  const [email, setEmail] = useState('')
  const [bizPhone, setBizPhone] = useState('')
  const [website, setWebsite] = useState('')

  /* ── Auto-detect GST registration based on GST number ── */
  const handleGstNumberChange = (value) => {
    setGstNumber(value.toUpperCase())
    if (value.trim().length > 0) {
      setIsGstRegistered(true)
    } else {
      setIsGstRegistered(false)
    }
  }

  /* ── address fields ── */
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('India')

  const [errors, setErrors] = useState({})

  /* ── populate ── */
  const populateForm = useCallback((p) => {
    if (!p) return
    const up = p.userProfile ?? {}
    const ad = p.address ?? {}

    setFirstName(up.firstName || '')
    setLastName(up.lastName || '')
    setDisplayName(up.displayName || '')
    setUserPhone(up.phone || '')
    setAvatarUrl(up.avatarUrl || '')

    setLegalName(p.legalName || '')
    setTradeName(p.tradeName || '')
    setLogoUrl(p.logoUrl || '')
    setBusinessType(p.businessType || '')
    setGstNumber(p.gstNumber || '')
    setPanNumber(p.panNumber || '')
    setIsGstRegistered(p.isGstRegistered ?? false)
    setEmail(p.email || '')
    setBizPhone(p.phone || '')
    setWebsite(p.website || '')

    setAddressLine1(ad.addressLine1 || '')
    setAddressLine2(ad.addressLine2 || '')
    setCity(ad.city || '')
    setStateVal(ad.state || '')
    setPostalCode(ad.postalCode || '')
    setCountry(ad.country || 'India')
  }, [])

  /* ── fetch profile + form data ── */
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()

    const load = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken')
        const businessId = await AsyncStorage.getItem('businessId')

        // Fetch profile for incomplete guard
        setProfileLoading(true)
        const guardRes = await fetch(
          `${BASE_URL}/customer/business/${businessId}/customer-business-profile`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          }
        )
        const guardJson = await guardRes.json()
        const profileData = guardJson?.success && guardJson?.data ? guardJson.data : null
        setUserProfile(profileData)
        setProfileLoading(false)

        // Populate form
        if (initialProfile) {
          populateForm(initialProfile)
        } else if (profileData) {
          setProfile(profileData)
          populateForm(profileData)
        }
      } catch {
        ToastAndroid.show('Failed to load profile data', ToastAndroid.SHORT)
        setProfileLoading(false)
      } finally {
        setLoading(false)
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
      }
    }
    load()
  }, [])

  // Re-check on screen focus (same pattern as AddressesScreen)
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile()
    }, [fetchUserProfile])
  )

  /* ── validation ── */
  const validate = () => {
    const e = {}
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (website && !/^https?:\/\/.+/.test(website)) e.website = 'Must start with http:// or https://'
    if (gstNumber && gstNumber.length !== 15) e.gstNumber = 'GST number must be 15 characters'
    if (panNumber && panNumber.length !== 10) e.panNumber = 'PAN must be 10 characters'
    if (postalCode && !/^\d{6}$/.test(postalCode)) e.postalCode = 'Enter a valid 6-digit postal code'
    if (logoUrl && !/^https?:\/\/.+/.test(logoUrl)) e.logoUrl = 'Must start with http:// or https://'
    if (avatarUrl && !/^https?:\/\/.+/.test(avatarUrl)) e.avatarUrl = 'Must start with http:// or https://'
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
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      /* 1. Update user profile */
      const userPayload = {}
      if (firstName) userPayload.firstName = firstName.trim()
      if (lastName) userPayload.lastName = lastName.trim()
      if (displayName) userPayload.displayName = displayName.trim()
      if (userPhone) userPayload.phone = userPhone.trim()
      if (avatarUrl) userPayload.avatarUrl = avatarUrl.trim()

      if (Object.keys(userPayload).length > 0) {
        const userRes = await fetch(`${BASE_URL}/user/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(userPayload),
        })
        const userJson = await userRes.json()
        console.log(userJson)
        if (!userJson?.success) {
          ToastAndroid.show(userJson?.error?.message, ToastAndroid.LONG)
          setSaving(false)
          return
        }
      }

      /* 2. Update business profile */
      const bizPayload = {}
      if (legalName) bizPayload.legalName = legalName.trim()
      if (tradeName) bizPayload.tradeName = tradeName.trim()
      if (logoUrl) bizPayload.logoUrl = logoUrl.trim()
      if (businessType) bizPayload.businessType = businessType
      if (gstNumber) bizPayload.gstNumber = gstNumber.trim().toUpperCase()
      if (panNumber) bizPayload.panNumber = panNumber.trim().toUpperCase()
      bizPayload.isGstRegistered = isGstRegistered
      if (email) bizPayload.email = email.trim()
      if (bizPhone) bizPayload.phone = bizPhone.trim()
      if (website) bizPayload.website = website.trim()
      if (addressLine1) bizPayload.addressLine1 = addressLine1.trim()
      if (addressLine2) bizPayload.addressLine2 = addressLine2.trim()
      if (city) bizPayload.city = city.trim()
      if (stateVal) bizPayload.state = stateVal.trim()
      if (postalCode) bizPayload.postalCode = postalCode.trim()
      if (country) bizPayload.country = country.trim()

      if (Object.keys(bizPayload).length > 0) {
        const bizRes = await fetch(
          `${BASE_URL}/customer/business/${businessId}/customer-business-profile`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(bizPayload),
          }
        )
        const bizJson = await bizRes.json()
        if (!bizJson?.success) {
          const code = bizJson?.error?.code
          const msg = bizJson?.error?.message
          if (code === 'BUSINESS_NOT_FOUND') ToastAndroid.show('Business not found', ToastAndroid.SHORT)
          else if (code === 'FORBIDDEN') ToastAndroid.show('Permission denied', ToastAndroid.LONG)
          else if (code === 'VALIDATION_ERROR') ToastAndroid.show(msg || 'Validation error', ToastAndroid.LONG)
          setSaving(false)
          return
        }
      }

      ToastAndroid.show('Profile updated successfully', ToastAndroid.SHORT)
      navigation.goBack()
    } catch {
      ToastAndroid.show('Network error. Please try again.', ToastAndroid.SHORT)
    } finally {
      setSaving(false)
    }
  }

  /* ── Header (shared between all states) ── */
  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
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
      {/* Spacer to balance the back button */}
      <View style={{ width: 40 }} />
    </Animated.View>
  )

  /* ── Loading screen ── */
  if (profileLoading || loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY_DARK} />
        {renderHeader()}
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>
            {profileLoading ? 'Checking profile...' : 'Loading profile…'}
          </Text>
        </View>
      </View>
    )
  }

  /* ── Profile incomplete guard (exact same UI as AddressesScreen) ── */
  if (isProfileEmpty(userProfile)) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY_DARK} />
        {renderHeader()}
        <View style={styles.incompleteContainer}>
          <View style={styles.incompleteIconWrap}>
            <Icon name="account-alert-outline" size={64} color={PRIMARY} />
          </View>
          <Text style={styles.incompleteTitle}>Profile Incomplete</Text>
          <Text style={styles.incompleteText}>
            To edit your profile, you need to complete your basic information first.
            Please add your personal details and business address.
          </Text>
          <TouchableOpacity
            style={styles.completeProfileBtn}
            onPress={() => navigation.navigate('ProfileInfoScreen')}
            activeOpacity={0.8}
          >
            <Icon name="account-edit-outline" size={20} color={WHITE} />
            <Text style={styles.completeProfileText}>Complete Profile</Text>
            <Icon name="arrow-right" size={20} color={WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  /* ── Main edit form ── */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_DARK} />
      <SavingOverlay visible={saving} />

      {renderHeader()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {(firstName?.[0] || 'U').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
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


            <View style={{ flex: 1 }}>
              <FieldInput
                label="Full Name" value={firstName} onChangeText={setFirstName}
                placeholder="Rahul" icon="account-outline"
              />
            </View>

            {/* <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="First Name" value={firstName} onChangeText={setFirstName}
                  placeholder="Rahul" icon="account-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="Last Name" value={lastName} onChangeText={setLastName}
                  placeholder="Sharma" icon="account-outline"
                />
              </View>
            </View> */}

            {/* <FieldInput
              label="Display Name" value={displayName} onChangeText={setDisplayName}
              placeholder="Rahul S" icon="badge-account-horizontal-outline"
              hint="This is the name shown on your account"
            /> */}

            <FieldInput
              label="Phone Number" value={userPhone} onChangeText={setUserPhone}
              placeholder="+91 98765 43210" icon="phone-outline"
              keyboardType="phone-pad" autoCapitalize="none"
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
            />

            <FieldInput
              label="Legal Name" value={legalName} onChangeText={setLegalName}
              placeholder="ABC Private Limited" icon="office-building-outline"
            />
            <FieldInput
              label="Trade / Brand Name" value={tradeName} onChangeText={setTradeName}
              placeholder="ABC Store" icon="store-outline"
            />
            <TypePicker value={businessType} onChange={setBusinessType} />
          </View>

          {/* ════════════════════════════════
              SECTION 3 — Tax & Compliance
          ════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader
              icon="file-certificate-outline"
              title="Tax & Compliance"
              subtitle="GST and PAN details"
            />

            <FieldInput
              label="GST Number (Optional)" value={gstNumber}
              onChangeText={handleGstNumberChange}
              placeholder="27ABCDE1234F1Z5" icon="identifier"
              autoCapitalize="characters"
              error={errors.gstNumber}
              hint="15-character GSTIN"
            />

            {/* <FieldInput
              label="PAN Number" value={panNumber}
              onChangeText={t => setPanNumber(t.toUpperCase())}
              placeholder="ABCDE1234F" icon="card-account-details-outline"
              autoCapitalize="characters"
              error={errors.panNumber} hint="10-character PAN"
            /> */}
          </View>

          {/* ════════════════════════════════
              SECTION 4 — Business Contact
          ════════════════════════════════ */}
          <View style={styles.section}>
            <SectionHeader
              icon="contacts-outline"
              title="Business Contact"
              subtitle="Email, phone, and website"
            />

            <FieldInput
              label="Business Email" value={email} onChangeText={setEmail}
              placeholder="contact@example.com" icon="email-outline"
              keyboardType="email-address" autoCapitalize="none"
              error={errors.email}
            />
            <FieldInput
              label="Business Phone" value={bizPhone} onChangeText={setBizPhone}
              placeholder="+91 98765 43210" icon="phone-outline"
              keyboardType="phone-pad" autoCapitalize="none"
            />
            {/* <FieldInput
              label="Website" value={website} onChangeText={setWebsite}
              placeholder="https://yourstore.com" icon="web"
              keyboardType="url" autoCapitalize="none"
              error={errors.website}
            /> */}
          </View>

          {/* ── Save button ── */}
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
                <Text style={styles.saveBtnBottomText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: {
    fontSize: 10, color: 'rgba(255,255,255,0.6)',
    fontFamily: FONTS.Medium, letterSpacing: 1.1, textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 18, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: -0.2 },

  /* Loader */
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: TEXT_MID, fontFamily: FONTS.Medium },

  /* ── Profile Incomplete state (matches AddressesScreen exactly) ── */
  incompleteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  incompleteIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: color.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: color.primary + '40',
  },
  incompleteTitle: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    color: color.text,
    marginBottom: 8,
  },
  incompleteText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONTS.Medium,
    marginBottom: 24,
  },
  completeProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  completeProfileText: {
    fontSize: 15,
    fontFamily: FONTS.Bold,
    color: '#fff',
  },

  /* Avatar preview */
  avatarPreviewWrap: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatarPreviewCircle: {
    width: 90, height: 90, borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2.5, borderColor: PRIMARY_MID,
  },
  avatarPreviewImg: { width: 90, height: 90 },
  avatarFallback: {
    flex: 1, backgroundColor: PRIMARY,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 36, fontFamily: FONTS.Bold, color: WHITE },

  /* Section */
  section: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: WHITE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    elevation: 1,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sectionIconBox: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: PRIMARY_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontFamily: FONTS.Bold, color: TEXT_DARK },
  sectionSubtitle: { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT, marginTop: 1 },

  /* Field */
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_MID,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    backgroundColor: BG, paddingHorizontal: 12, minHeight: 46,
  },
  inputWrapFocused: { borderColor: PRIMARY, backgroundColor: '#F0F8FC' },
  inputWrapError: { borderColor: ERROR, backgroundColor: ERROR_BG },
  inputWrapDisabled: { opacity: 0.5 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, fontFamily: FONTS.Regular, color: TEXT_DARK, paddingVertical: 0 },
  inputMultiline: { textAlignVertical: 'top', paddingTop: 10, minHeight: 80 },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fieldErrorText: { fontSize: 11, color: ERROR, fontFamily: FONTS.Regular },
  fieldHint: { fontSize: 11, color: TEXT_LIGHT, fontFamily: FONTS.Regular, marginTop: 4 },

  /* Row 2 */
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
  pickerOptionActive: { backgroundColor: PRIMARY_LIGHT },
  pickerOptionText: { fontSize: 14, fontFamily: FONTS.Regular, color: TEXT_DARK },
  pickerOptionTextActive: { color: PRIMARY, fontFamily: FONTS.Medium },

  /* Save bottom */
  saveBtnBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 8,
    backgroundColor: PRIMARY, paddingVertical: 15, borderRadius: 14,
    elevation: 4,
    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8,
  },
  saveBtnBottomDisabled: { opacity: 0.6 },
  saveBtnBottomText: { fontSize: 16, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: 0.2 },

  /* Overlay */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 99, justifyContent: 'center', alignItems: 'center',
  },
  overlayCard: {
    backgroundColor: WHITE, borderRadius: 16,
    paddingHorizontal: 36, paddingVertical: 28,
    alignItems: 'center', gap: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 12,
  },
  overlayText: { fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_DARK },
})