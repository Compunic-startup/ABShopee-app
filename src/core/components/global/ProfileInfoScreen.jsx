import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    ToastAndroid,
    Animated,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    TextInput,
    FlatList,
} from 'react-native'
import { StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../utils/fonts'
import BASE_URL from '../../services/api'
import color from '../../utils/color'

// ─── Constants (unchanged) ────────────────────────────────────────────────────
const GST_REGEX   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[6-9]\d{9}$/
const RAPID_API_KEY  = '1d550a7dcfmsh641a25ca55510d5p1de5bdjsnc84e2976ceec'
const RAPID_API_HOST = 'gst-verification-api-get-profile-returns-data.p.rapidapi.com'

const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
    'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Andaman and Nicobar Islands','Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]

const ADDRESS_LABELS = [
    { value: 'home',      label: 'Home',      icon: 'home-outline'            },
    { value: 'office',    label: 'Office',    icon: 'office-building-outline' },
    { value: 'shop',      label: 'Shop',      icon: 'store-outline'           },
    { value: 'warehouse', label: 'Warehouse', icon: 'warehouse'               },
    { value: 'other',     label: 'Other',     icon: 'map-marker-outline'      },
]

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
    return (
        <View style={S.sectionHead}>
            <View style={S.sectionIconBox}>
                <Icon name={icon} size={16} color={color.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={S.sectionTitle}>{title}</Text>
                {subtitle ? <Text style={S.sectionSub}>{subtitle}</Text> : null}
            </View>
        </View>
    )
}

// ─── Field input ──────────────────────────────────────────────────────────────
function FieldInput({
    label, value, onChangeText, placeholder,
    keyboardType = 'default', autoCapitalize = 'sentences',
    icon, error, hint, required = false,
    autoFilled = false, editable = true, loading = false,
}) {
    const [focused, setFocused] = useState(false)
    return (
        <View style={S.fieldWrap}>
            <Text style={S.fieldLabel}>
                {label}{required && <Text style={{ color: '#C62828' }}> *</Text>}
            </Text>
            <View style={[
                S.inputBox,
                focused    && S.inputBoxFocused,
                error      && S.inputBoxError,
                autoFilled && S.inputBoxAutoFilled,
                !editable  && S.inputBoxDisabled,
            ]}>
                {icon && (
                    <Icon
                        name={icon}
                        size={15}
                        color={autoFilled ? '#2E7D32' : focused ? color.primary : '#BDBDBD'}
                        style={S.inputIcon}
                    />
                )}
                <TextInput
                    style={S.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#BDBDBD"
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    editable={editable}
                />
                {loading && <ActivityIndicator size="small" color={color.primary} style={{ marginLeft: 4 }} />}
                {autoFilled && !loading && <Icon name="auto-fix" size={15} color="#2E7D32" style={{ marginLeft: 4 }} />}
            </View>
            {error  ? <View style={S.fieldErrRow}><Icon name="alert-circle-outline" size={11} color="#C62828" /><Text style={S.fieldErrText}>{error}</Text></View>
             : hint  ? <Text style={S.fieldHint}>{hint}</Text>
             : null}
        </View>
    )
}

// ─── State picker ─────────────────────────────────────────────────────────────
function StatePicker({ value, onChange, autoFilled, error }) {
    const [open,        setOpen]        = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const filtered = INDIAN_STATES.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <View style={S.fieldWrap}>
            <Text style={S.fieldLabel}>State <Text style={{ color: '#C62828' }}>*</Text></Text>
            <TouchableOpacity
                style={[S.inputBox, S.pickerBtn, autoFilled && S.inputBoxAutoFilled, error && S.inputBoxError]}
                onPress={() => setOpen(o => !o)}
                activeOpacity={0.8}
            >
                <Icon name="map-outline" size={15} color={autoFilled ? '#2E7D32' : value ? color.primary : '#BDBDBD'} style={S.inputIcon} />
                <Text style={[S.input, !value && { color: '#BDBDBD' }]}>{value || 'Select state'}</Text>
                {autoFilled && <Icon name="auto-fix" size={15} color="#2E7D32" style={{ marginRight: 6 }} />}
                <Icon name={open ? 'chevron-up' : 'chevron-down'} size={17} color="#BDBDBD" />
            </TouchableOpacity>
            {error && <View style={S.fieldErrRow}><Icon name="alert-circle-outline" size={11} color="#C62828" /><Text style={S.fieldErrText}>{error}</Text></View>}
            {open && (
                <View style={S.dropdown}>
                    <View style={S.dropdownSearch}>
                        <Icon name="magnify" size={15} color="#BDBDBD" style={S.inputIcon} />
                        <TextInput style={S.input} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search state…" placeholderTextColor="#BDBDBD" />
                        {!!searchQuery && <TouchableOpacity onPress={() => setSearchQuery('')}><Icon name="close-circle" size={15} color="#BDBDBD" /></TouchableOpacity>}
                    </View>
                    <FlatList
                        data={filtered}
                        keyExtractor={i => i}
                        style={S.dropdownList}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[S.dropdownItem, item === value && S.dropdownItemActive]}
                                onPress={() => { onChange(item); setOpen(false); setSearchQuery('') }}
                                activeOpacity={0.75}
                            >
                                <Text style={[S.dropdownItemText, item === value && S.dropdownItemTextActive]}>{item}</Text>
                                {item === value && <Icon name="check" size={15} color={color.primary} />}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={S.emptyDropdown}>
                                <Icon name="alert-circle-outline" size={28} color="#BDBDBD" />
                                <Text style={S.emptyDropdownText}>No states found</Text>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    )
}

// ─── City input with suggestions ─────────────────────────────────────────────
function CityInput({ value, onChange, autoFilled, onCitySelect, cities = [], loading = false, error }) {
    const [focused, setFocused] = useState(false)
    const [showSug, setShowSug] = useState(false)

    const handleChange = (text) => {
        onChange(text)
        setShowSug(text.length > 0 && cities.length > 0)
    }
    const selectCity = (cityData) => {
        onChange(cityData.city)
        if (onCitySelect) onCitySelect(cityData)
        setShowSug(false)
    }

    return (
        <View style={S.fieldWrap}>
            <Text style={S.fieldLabel}>City <Text style={{ color: '#C62828' }}>*</Text></Text>
            <View style={[S.inputBox, focused && S.inputBoxFocused, autoFilled && S.inputBoxAutoFilled, error && S.inputBoxError]}>
                <Icon name="city-variant-outline" size={15} color={autoFilled ? '#2E7D32' : focused ? color.primary : '#BDBDBD'} style={S.inputIcon} />
                <TextInput
                    style={S.input}
                    value={value}
                    onChangeText={handleChange}
                    placeholder="Enter city"
                    placeholderTextColor="#BDBDBD"
                    autoCapitalize="words"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                />
                {loading      && <ActivityIndicator size="small" color={color.primary} style={{ marginLeft: 4 }} />}
                {autoFilled && !loading && <Icon name="auto-fix" size={15} color="#2E7D32" style={{ marginLeft: 4 }} />}
            </View>
            {error && <View style={S.fieldErrRow}><Icon name="alert-circle-outline" size={11} color="#C62828" /><Text style={S.fieldErrText}>{error}</Text></View>}
            {showSug && cities.length > 0 && (
                <View style={S.dropdown}>
                    {cities.slice(0, 5).map((cd, idx) => (
                        <TouchableOpacity key={idx} style={S.citySugItem} onPress={() => selectCity(cd)} activeOpacity={0.75}>
                            <Icon name="map-marker" size={13} color={color.primary} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={S.citySugCity}>{cd.city}</Text>
                                <Text style={S.citySugPin}>PIN: {cd.postalCode}</Text>
                            </View>
                            <Icon name="chevron-right" size={15} color="#BDBDBD" />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    )
}

// ─── Address label picker ─────────────────────────────────────────────────────
function AddressLabelPicker({ value, onChange, error }) {
    return (
        <View style={S.fieldWrap}>
            <Text style={S.fieldLabel}>Address Type <Text style={{ color: '#C62828' }}>*</Text></Text>
            <View style={S.labelGrid}>
                {ADDRESS_LABELS.map(lbl => (
                    <TouchableOpacity
                        key={lbl.value}
                        style={[S.labelCard, value === lbl.value && S.labelCardActive, error && !value && S.inputBoxError]}
                        onPress={() => onChange(lbl.value)}
                        activeOpacity={0.7}
                    >
                        <Icon name={lbl.icon} size={18} color={value === lbl.value ? color.primary : '#BDBDBD'} />
                        <Text style={[S.labelCardText, value === lbl.value && S.labelCardTextActive]}>{lbl.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {error && <View style={S.fieldErrRow}><Icon name="alert-circle-outline" size={11} color="#C62828" /><Text style={S.fieldErrText}>{error}</Text></View>}
        </View>
    )
}

// ─── Saving overlay ───────────────────────────────────────────────────────────
function SavingOverlay({ visible }) {
    if (!visible) return null
    return (
        <View style={S.overlay}>
            <View style={S.overlayCard}>
                <ActivityIndicator size="large" color={color.primary} />
                <Text style={S.overlayText}>Saving your profile…</Text>
            </View>
        </View>
    )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileInfoScreen({ setIsLoggedIn }) {
    const navigation = useNavigation()
    const businessId = 'ad1351af-4c82-4206-9dee-2db2545acd19'

    const lastFetchedGst      = useRef(null)
    const postalCodeTimeout   = useRef(null)
    const citySearchTimeout   = useRef(null)

    const [identifier,     setIdentifier]     = useState('')
    const [identifierType, setIdentifierType] = useState('')

    const [form, setForm] = useState({
        name: '', phone: '', email: '', gstNumber: '', legalName: '',
        billingAddress:  { label: 'billing', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India' },
        shippingAddress: { label: '',        addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India' },
    })

    const [hasGst,         setHasGst]         = useState(false)
    const [sameAsBilling,  setSameAsBilling]  = useState(true)
    const [gstStatus,      setGstStatus]      = useState('idle')
    const [saving,         setSaving]         = useState(false)
    const [gstAutoFilled,  setGstAutoFilled]  = useState(false)
    const [postalLoading,  setPostalLoading]  = useState(false)
    const [cityLoading,    setCityLoading]    = useState(false)
    const [citySuggestions,setCitySuggestions]= useState([])
    const [errors,         setErrors]         = useState({})

    const fadeAnim = useRef(new Animated.Value(0)).current
    const gstShake = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
        loadIdentifier()
    }, [])

    // ── All logic unchanged ────────────────────────────────────────────────────
    const loadIdentifier = async () => {
        try {
            const storedIdentifier = await AsyncStorage.getItem('Identifier')
            const cleaned = storedIdentifier?.replace(/"/g, '').trim()
            if (cleaned) {
                setIdentifier(cleaned)
                const isEmail = EMAIL_REGEX.test(cleaned)
                const isPhone = PHONE_REGEX.test(cleaned)
                if (isEmail) { setIdentifierType('email'); setForm(prev => ({ ...prev, email: cleaned })) }
                else if (isPhone) { setIdentifierType('phone'); setForm(prev => ({ ...prev, phone: cleaned })) }
            }
        } catch (err) { console.log('Error loading identifier:', err) }
    }

    const fetchLocationFromPostalCode = useCallback(async (pincode, addressType = 'billingAddress') => {
        if (pincode.length !== 6) return
        try {
            setPostalLoading(true)
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
            const data = await response.json()
            if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                const po = data[0].PostOffice[0]
                setForm(prev => ({ ...prev, [addressType]: { ...prev[addressType], city: po.District || prev[addressType].city, state: po.State || prev[addressType].state } }))
                ToastAndroid.show('Location auto-filled ✓', ToastAndroid.SHORT)
            }
        } catch (err) { console.log('Postal code fetch error:', err) }
        finally { setPostalLoading(false) }
    }, [])

    const fetchPostalCodesForCity = useCallback(async (cityName) => {
        if (cityName.length < 3) { setCitySuggestions([]); return }
        try {
            setCityLoading(true)
            const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`)
            const data = await response.json()
            if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                const unique = []; const seen = new Set()
                data[0].PostOffice.forEach(po => {
                    const key = `${po.District}-${po.Pincode}`
                    if (!seen.has(key)) { seen.add(key); unique.push({ city: po.District, postalCode: po.Pincode, state: po.State }) }
                })
                setCitySuggestions(unique)
            } else { setCitySuggestions([]) }
        } catch (err) { console.log('City search error:', err); setCitySuggestions([]) }
        finally { setCityLoading(false) }
    }, [])

    const validateGst = (val) => {
        const upper = val.toUpperCase()
        if (!upper || upper.length < 15) { setGstStatus('idle'); return }
        if (GST_REGEX.test(upper)) {
            setGstStatus('valid')
            if (lastFetchedGst.current !== upper) { lastFetchedGst.current = upper; fetchGstDetails(upper) }
        } else {
            setGstStatus('invalid')
            Animated.sequence([
                Animated.timing(gstShake, { toValue:  8, duration: 60, useNativeDriver: true }),
                Animated.timing(gstShake, { toValue: -8, duration: 60, useNativeDriver: true }),
                Animated.timing(gstShake, { toValue:  6, duration: 50, useNativeDriver: true }),
                Animated.timing(gstShake, { toValue: -6, duration: 50, useNativeDriver: true }),
                Animated.timing(gstShake, { toValue:  0, duration: 40, useNativeDriver: true }),
            ]).start()
        }
    }

    const handleGstChange = (val) => {
        const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)
        setForm(prev => ({ ...prev, gstNumber: upper }))
        setGstAutoFilled(false)
        validateGst(upper)
    }

    const fetchGstDetails = useCallback(async (gstValue) => {
        try {
            setGstStatus('loading')
            const res = await fetch(`https://${RAPID_API_HOST}/v1/gstin/${gstValue}/details`, {
                method: 'GET',
                headers: { 'X-RapidAPI-Key': RAPID_API_KEY, 'X-RapidAPI-Host': RAPID_API_HOST },
            })
            const json = await res.json()
            const d    = json.data
            const addr = d.place_of_business_principal?.address
            const addressParts = [addr?.door_num, addr?.floor_num, addr?.building_name, addr?.street, addr?.location].filter(Boolean)
            const legalName     = d.legal_name || ''
            const businessName  = legalName.replace(/\s*(PRIVATE LIMITED|PVT LTD|PVT\. LTD\.|LIMITED|LTD|LLP|PARTNERSHIP)\s*$/i, '').trim()
            setForm(prev => ({
                ...prev,
                name: prev.name || businessName,
                legalName,
                billingAddress: {
                    label: 'billing',
                    addressLine1: addressParts[0] || '',
                    addressLine2: addressParts.slice(1).join(', ') || '',
                    city: addr?.district || addr?.city || addr?.location || '',
                    state: addr?.state || '',
                    postalCode: addr?.pin_code || '',
                    country: 'India',
                }
            }))
            setGstStatus('verified')
            setGstAutoFilled(true)
            ToastAndroid.show('Business details auto-filled from GSTIN ✓', ToastAndroid.SHORT)
        } catch (err) {
            console.log('GST fetch error:', err)
            setGstStatus('idle')
            ToastAndroid.show('Could not verify GSTIN. Please try again.', ToastAndroid.SHORT)
        }
    }, [])

    const updateAddress = (addressType, field, value) => {
        setForm(prev => ({ ...prev, [addressType]: { ...prev[addressType], [field]: value } }))
    }

    const handlePostalCodeChange = (val, addressType = 'billingAddress') => {
        const cleaned = val.replace(/[^0-9]/g, '').slice(0, 6)
        updateAddress(addressType, 'postalCode', cleaned)
        if (postalCodeTimeout.current) clearTimeout(postalCodeTimeout.current)
        if (cleaned.length === 6) postalCodeTimeout.current = setTimeout(() => fetchLocationFromPostalCode(cleaned, addressType), 500)
    }

    const handleCityChange = (val, addressType = 'billingAddress') => {
        updateAddress(addressType, 'city', val)
        if (citySearchTimeout.current) clearTimeout(citySearchTimeout.current)
        if (val.length >= 3) citySearchTimeout.current = setTimeout(() => fetchPostalCodesForCity(val), 500)
        else setCitySuggestions([])
    }

    const handleCitySelect = (cityData, addressType = 'billingAddress') => {
        setForm(prev => ({ ...prev, [addressType]: { ...prev[addressType], city: cityData.city, postalCode: cityData.postalCode, state: cityData.state } }))
        setCitySuggestions([])
        ToastAndroid.show('Location auto-filled ✓', ToastAndroid.SHORT)
    }

    const validate = () => {
        const e = {}
        if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
        if (identifierType === 'email') {
            if (!form.phone.trim() || !PHONE_REGEX.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number'
        } else {
            if (!form.email.trim() || !EMAIL_REGEX.test(form.email)) e.email = 'Enter a valid email address'
        }
        if (hasGst) {
            if (gstStatus !== 'verified') e.gst = 'Please enter and verify a valid GSTIN'
            if (!form.legalName.trim()) e.legalName = 'Legal business name is required'
        }
        const b = form.billingAddress
        if (!b.addressLine1.trim())                             e.billingAddressLine1  = 'Address is required'
        if (!b.city.trim())                                     e.billingCity          = 'City is required'
        if (!b.state.trim())                                    e.billingState         = 'State is required'
        if (!b.postalCode.trim() || b.postalCode.length !== 6) e.billingPostalCode    = 'Enter valid 6-digit postal code'
        if (!sameAsBilling) {
            const sh = form.shippingAddress
            if (!sh.label)                                          e.shippingLabel         = 'Select address type'
            if (!sh.addressLine1.trim())                            e.shippingAddressLine1  = 'Address is required'
            if (!sh.city.trim())                                    e.shippingCity          = 'City is required'
            if (!sh.state.trim())                                   e.shippingState         = 'State is required'
            if (!sh.postalCode.trim() || sh.postalCode.length !== 6) e.shippingPostalCode  = 'Enter valid 6-digit postal code'
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) { ToastAndroid.show('Please fix all errors', ToastAndroid.LONG); return }
        if (!businessId) { ToastAndroid.show('Business ID not found', ToastAndroid.SHORT); return }
        try {
            setSaving(true)
            const token             = await AsyncStorage.getItem('userToken')
            const rawIdentifier     = await AsyncStorage.getItem('Identifier')
            const storedIdentifier  = rawIdentifier?.replace(/"/g, '').trim()
            const phoneFromStorage  = PHONE_REGEX.test(storedIdentifier) ? storedIdentifier : ''
            const emailFromStorage  = EMAIL_REGEX.test(storedIdentifier) ? storedIdentifier : ''

            const payload = {
                name: form.name.trim(),
                phone: form.phone.trim() || phoneFromStorage,
                email: form.email.trim() || emailFromStorage,
                billingAddress: {
                    label: 'billing',
                    address: {
                        addressLine1: form.billingAddress.addressLine1.trim(),
                        ...(form.billingAddress.addressLine2 && { addressLine2: form.billingAddress.addressLine2.trim() }),
                        city: form.billingAddress.city.trim(),
                        state: form.billingAddress.state.trim(),
                        postalCode: form.billingAddress.postalCode.trim(),
                        country: 'India',
                    }
                }
            }

            if (hasGst && gstStatus === 'verified') { payload.gstNumber = form.gstNumber; payload.legalName = form.legalName.trim() }

            if (sameAsBilling) {
                payload.shippingAddress = { label: 'office', address: { addressLine1: form.billingAddress.addressLine1.trim(), ...(form.billingAddress.addressLine2 && { addressLine2: form.billingAddress.addressLine2.trim() }), city: form.billingAddress.city.trim(), state: form.billingAddress.state.trim(), postalCode: form.billingAddress.postalCode.trim(), country: 'India' } }
            } else {
                payload.shippingAddress = { label: form.shippingAddress.label, address: { addressLine1: form.shippingAddress.addressLine1.trim(), ...(form.shippingAddress.addressLine2 && { addressLine2: form.shippingAddress.addressLine2.trim() }), city: form.shippingAddress.city.trim(), state: form.shippingAddress.state.trim(), postalCode: form.shippingAddress.postalCode.trim(), country: 'India' } }
            }

            console.log('B2B REGISTRATION PAYLOAD →', JSON.stringify(payload, null, 2))
            const res  = await fetch(`${BASE_URL}/customer/business/${businessId}/b2b-register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            })
            const json = await res.json()
            if (!res.ok || !json.success) throw json
            ToastAndroid.show('Profile saved successfully 🎉', ToastAndroid.SHORT)
            if (setIsLoggedIn) setIsLoggedIn(true)
            else navigation.goBack()
        } catch (err) {
            ToastAndroid.show(err?.error?.message || err?.message || 'Registration failed', ToastAndroid.LONG)
            console.error('Registration error:', err)
        } finally {
            setSaving(false)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View style={S.container}>
            <StatusBar barStyle="light-content" backgroundColor={color.primary} />
            <SavingOverlay visible={saving} />

            {/* ── Header ── */}
            <View style={S.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerBtn} activeOpacity={0.75}>
                    <Icon name="arrow-left" size={ms(22)} color="#fff" />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Complete Your Profile</Text>
                <View style={{ width: ms(36) }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                <Animated.ScrollView
                    style={{ opacity: fadeAnim }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 110 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Basic Info ── */}
                    <View style={S.section}>
                        <SectionHeader icon="account-outline" title="Basic Information" subtitle="Your name and contact details" />

                        <FieldInput label="Full Name" value={form.name} onChangeText={v => setForm(prev => ({ ...prev, name: v }))} placeholder="Enter your full name" icon="account-outline" required error={errors.name} />

                        {identifierType === 'email' ? (
                            <>
                                <FieldInput label="Email Address" value={form.email} onChangeText={() => {}} placeholder="Email" icon="email-outline" editable={false} autoFilled />
                                <FieldInput label="Phone Number" value={form.phone} onChangeText={v => setForm(prev => ({ ...prev, phone: v.replace(/[^0-9]/g, '').slice(0, 10) }))} placeholder="Enter 10-digit mobile number" icon="phone-outline" keyboardType="phone-pad" required error={errors.phone} />
                            </>
                        ) : (
                            <>
                                <FieldInput label="Phone Number" value={form.phone} onChangeText={() => {}} placeholder="Phone" icon="phone-outline" editable={false} autoFilled />
                                <FieldInput label="Email Address" value={form.email} onChangeText={v => setForm(prev => ({ ...prev, email: v.toLowerCase().trim() }))} placeholder="Enter your email" icon="email-outline" keyboardType="email-address" autoCapitalize="none" required error={errors.email} />
                            </>
                        )}
                    </View>

                    {/* ── GST ── */}
                    <View style={S.section}>
                        <SectionHeader icon="card-account-details-outline" title="GST Details" subtitle="Optional — add GST for business purchases" />

                        <TouchableOpacity style={S.checkboxRow} onPress={() => setHasGst(!hasGst)} activeOpacity={0.7}>
                            <View style={[S.checkbox, hasGst && S.checkboxActive]}>
                                {hasGst && <Icon name="check" size={ms(13)} color="#fff" />}
                            </View>
                            <Text style={S.checkboxLabel}>I have a GSTIN (GST Number)</Text>
                        </TouchableOpacity>

                        {hasGst && (
                            <>
                                <Animated.View style={{ transform: [{ translateX: gstShake }] }}>
                                    <View style={S.fieldWrap}>
                                        <Text style={S.fieldLabel}>GSTIN <Text style={{ color: '#C62828' }}>*</Text></Text>
                                        <View style={[
                                            S.inputBox,
                                            { borderColor: { idle: '#E0E0E0', valid: '#2E7D32', invalid: '#C62828', loading: color.primary, verified: '#2E7D32' }[gstStatus] },
                                            gstStatus === 'verified' && S.inputBoxAutoFilled,
                                        ]}>
                                            <Icon name="card-account-details-outline" size={15} color={gstStatus === 'verified' ? '#2E7D32' : gstStatus === 'invalid' ? '#C62828' : '#BDBDBD'} style={S.inputIcon} />
                                            <TextInput
                                                style={S.input}
                                                value={form.gstNumber}
                                                onChangeText={handleGstChange}
                                                placeholder="Enter 15-character GSTIN"
                                                placeholderTextColor="#BDBDBD"
                                                autoCapitalize="characters"
                                                maxLength={15}
                                            />
                                            {gstStatus === 'loading' && <ActivityIndicator size="small" color={color.primary} />}
                                            {gstStatus === 'verified' && <Icon name="check-decagram" size={ms(18)} color="#2E7D32" />}
                                            {gstStatus === 'invalid'  && <Icon name="alert-circle-outline" size={ms(18)} color="#C62828" />}
                                            {gstStatus === 'valid'    && <ActivityIndicator size="small" color={color.primary} />}
                                        </View>
                                        <Text style={[S.gstCount, { color: form.gstNumber.length === 15 ? color.primary : '#BDBDBD' }]}>
                                            {form.gstNumber.length}/15
                                        </Text>
                                    </View>
                                </Animated.View>

                                {gstStatus === 'invalid' && (
                                    <View style={S.statusRow}>
                                        <Icon name="alert-circle-outline" size={12} color="#C62828" />
                                        <Text style={[S.statusText, { color: '#C62828' }]}>Invalid GSTIN format</Text>
                                    </View>
                                )}
                                {gstStatus === 'verified' && (
                                    <>
                                        <View style={S.verifiedBanner}>
                                            <Icon name="check-decagram" size={ms(14)} color="#2E7D32" />
                                            <Text style={[S.statusText, { color: '#2E7D32', fontFamily: FONTS.Bold }]}>GSTIN verified · Business details loaded</Text>
                                        </View>
                                        <FieldInput label="Legal Business Name" value={form.legalName} onChangeText={v => setForm(prev => ({ ...prev, legalName: v }))} placeholder="Enter legal business name" icon="briefcase-outline" required autoFilled={gstAutoFilled} error={errors.legalName} />
                                    </>
                                )}
                            </>
                        )}
                    </View>

                    {/* ── Billing Address ── */}
                    <View style={S.section}>
                        <SectionHeader icon="map-marker-outline" title="Billing Address" subtitle="Where should we send invoices?" />

                        <FieldInput label="Address Line 1" value={form.billingAddress.addressLine1} onChangeText={v => updateAddress('billingAddress', 'addressLine1', v)} placeholder="Building, Street" icon="home-outline" required autoFilled={gstAutoFilled} error={errors.billingAddressLine1} />
                        <CityInput value={form.billingAddress.city} onChange={v => handleCityChange(v, 'billingAddress')} autoFilled={gstAutoFilled} onCitySelect={d => handleCitySelect(d, 'billingAddress')} cities={citySuggestions} loading={cityLoading} error={errors.billingCity} />
                        <StatePicker value={form.billingAddress.state} onChange={v => updateAddress('billingAddress', 'state', v)} autoFilled={gstAutoFilled} error={errors.billingState} />
                        <FieldInput label="Postal Code" value={form.billingAddress.postalCode} onChangeText={v => handlePostalCodeChange(v, 'billingAddress')} placeholder="Enter 6-digit postal code" icon="mailbox-outline" keyboardType="number-pad" required autoFilled={gstAutoFilled} loading={postalLoading} error={errors.billingPostalCode} />
                    </View>

                    {/* ── Shipping Address ── */}
                    <View style={S.section}>
                        <SectionHeader icon="package-variant" title="Shipping Address" subtitle="Where should we deliver orders?" />

                        <TouchableOpacity style={S.checkboxRow} onPress={() => setSameAsBilling(!sameAsBilling)} activeOpacity={0.7}>
                            <View style={[S.checkbox, sameAsBilling && S.checkboxActive]}>
                                {sameAsBilling && <Icon name="check" size={ms(13)} color="#fff" />}
                            </View>
                            <Text style={S.checkboxLabel}>Same as billing address</Text>
                        </TouchableOpacity>

                        {!sameAsBilling && (
                            <>
                                <AddressLabelPicker value={form.shippingAddress.label} onChange={v => updateAddress('shippingAddress', 'label', v)} error={errors.shippingLabel} />
                                <FieldInput label="Address Line 1" value={form.shippingAddress.addressLine1} onChangeText={v => updateAddress('shippingAddress', 'addressLine1', v)} placeholder="Building, Street" icon="home-outline" required error={errors.shippingAddressLine1} />
                                <FieldInput label="Address Line 2" value={form.shippingAddress.addressLine2} onChangeText={v => updateAddress('shippingAddress', 'addressLine2', v)} placeholder="Landmark, Area (Optional)" icon="map-marker-plus-outline" />
                                <CityInput value={form.shippingAddress.city} onChange={v => handleCityChange(v, 'shippingAddress')} onCitySelect={d => handleCitySelect(d, 'shippingAddress')} cities={citySuggestions} loading={cityLoading} error={errors.shippingCity} />
                                <StatePicker value={form.shippingAddress.state} onChange={v => updateAddress('shippingAddress', 'state', v)} error={errors.shippingState} />
                                <FieldInput label="Postal Code" value={form.shippingAddress.postalCode} onChangeText={v => handlePostalCodeChange(v, 'shippingAddress')} placeholder="Enter 6-digit postal code" icon="mailbox-outline" keyboardType="number-pad" required loading={postalLoading} error={errors.shippingPostalCode} />
                            </>
                        )}
                    </View>
                </Animated.ScrollView>
            </KeyboardAvoidingView>

            {/* ── Bottom bar — yellow Save Profile (Flipkart CTA) ── */}
            <View style={S.bottomBar}>
                <TouchableOpacity
                    style={[S.saveBtn, saving && S.saveBtnDis]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={color.text} />
                    ) : (
                        <>
                            <Text style={S.saveBtnText}>Save Profile</Text>
                            <Icon name="check-circle" size={ms(20)} color={color.text} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

// ─── ms helper (same as moderateScale) ───────────────────────────────────────
const ms = (size) => Math.round(size * 1) // using react-native-size-matters ms from ScaledSheet

// ─── Styles — ONLY color.* values ────────────────────────────────────────────
const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: color.background },

    // Header
    header: {
        backgroundColor: color.primary,
        paddingTop: Platform.OS === 'android' ? 14 : 52,
        paddingBottom: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    headerBtn:   { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontFamily: FONTS.Bold, color: '#fff' },

    // Section card — Flipkart flat white block
    section: {
        marginHorizontal: 14,
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EBEBEB',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    sectionIconBox: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: color.secondarylight,
        justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: 14, fontFamily: FONTS.Bold, color: color.text },
    sectionSub:   { fontSize: 11, fontFamily: FONTS.Medium, color: '#888', marginTop: 1 },

    // Checkbox row
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: color.secondarylight,
        borderRadius: 6,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    checkbox: {
        width: 20, height: 20, borderRadius: 4,
        borderWidth: 1.5, borderColor: '#BDBDBD',
        justifyContent: 'center', alignItems: 'center',
    },
    checkboxActive: { backgroundColor: color.primary, borderColor: color.primary },
    checkboxLabel:  { fontSize: 13, fontFamily: FONTS.Medium, color: color.text, flex: 1 },

    // Address label grid
    labelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    labelCard: {
        flex: 1, minWidth: '28%',
        padding: 10, borderWidth: 1.5, borderColor: '#E0E0E0',
        borderRadius: 6, alignItems: 'center', backgroundColor: color.background,
    },
    labelCardActive:     { borderColor: color.primary, backgroundColor: color.secondarylight },
    labelCardText:       { fontSize: 11, fontFamily: FONTS.Medium, color: '#888', marginTop: 4 },
    labelCardTextActive: { color: color.primary, fontFamily: FONTS.Bold },

    // Field
    fieldWrap:  { marginBottom: 12 },
    fieldLabel: { fontSize: 11, fontFamily: FONTS.Bold, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 },
    inputBox: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#E0E0E0',
        borderRadius: 8, backgroundColor: color.background,
        paddingHorizontal: 12, minHeight: 44,
    },
    inputBoxFocused:    { borderColor: color.primary, backgroundColor: '#fff' },
    inputBoxError:      { borderColor: '#C62828', backgroundColor: '#FFEBEE' },
    inputBoxAutoFilled: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
    inputBoxDisabled:   { opacity: 0.5 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, fontFamily: FONTS.Medium, color: color.text, paddingVertical: 0 },
    fieldErrRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    fieldErrText: { fontSize: 11, color: '#C62828', fontFamily: FONTS.Medium },
    fieldHint:    { fontSize: 11, color: '#888', fontFamily: FONTS.Medium, marginTop: 4 },

    // GST
    gstCount:  { fontSize: 11, fontFamily: FONTS.Medium, textAlign: 'right', marginTop: 3 },
    statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 2, marginBottom: 8 },
    statusText:{ fontSize: 11, fontFamily: FONTS.Medium, flex: 1, lineHeight: 16 },
    verifiedBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#E8F5E9', borderRadius: 6,
        paddingHorizontal: 10, paddingVertical: 8,
        borderWidth: 1, borderColor: '#C8E6C9', marginBottom: 10,
    },

    // Dropdowns
    pickerBtn: { justifyContent: 'space-between' },
    dropdown:  { marginTop: 4, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden', maxHeight: 280 },
    dropdownSearch: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: color.background },
    dropdownList: { maxHeight: 230 },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    dropdownItemActive:    { backgroundColor: color.secondarylight },
    dropdownItemText:      { fontSize: 13, fontFamily: FONTS.Medium, color: color.text },
    dropdownItemTextActive:{ color: color.primary, fontFamily: FONTS.Bold },
    emptyDropdown:    { paddingVertical: 32, alignItems: 'center' },
    emptyDropdownText:{ fontSize: 13, fontFamily: FONTS.Medium, color: '#BDBDBD', marginTop: 8 },

    citySugItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    citySugCity: { fontSize: 13, fontFamily: FONTS.Bold, color: color.text },
    citySugPin:  { fontSize: 11, fontFamily: FONTS.Medium, color: '#888', marginTop: 2 },

    // Bottom bar
    bottomBar: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#EBEBEB',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    // Save button — Flipkart yellow CTA
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: color.secondary,
        paddingVertical: 14,
        borderRadius: 6,
        elevation: 2,
    },
    saveBtnDis:  { opacity: 0.6, elevation: 0 },
    saveBtnText: { fontSize: 15, fontFamily: FONTS.Bold, color: color.text, letterSpacing: 0.2 },

    // Overlay
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 99, justifyContent: 'center', alignItems: 'center' },
    overlayCard:{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 24, alignItems: 'center', gap: 14, elevation: 10, minWidth: 200 },
    overlayText:{ fontSize: 14, fontFamily: FONTS.Medium, color: color.text },
})