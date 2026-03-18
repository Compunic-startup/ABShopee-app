// import React, { useState, useRef, useEffect, useCallback } from 'react'
// import {
//     View,
//     Text,
//     TouchableOpacity,
//     ToastAndroid,
//     Animated,
//     StatusBar,
//     ScrollView,
//     KeyboardAvoidingView,
//     Platform,
//     ActivityIndicator,
//     TextInput,
//     StyleSheet,
//     FlatList,
// } from 'react-native'
// import { useNavigation, useRoute } from '@react-navigation/native'
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
// import FONTS from '../../utils/fonts'
// import BASE_URL from '../../services/api'

// /* ─── palette ─── */
// const BLUE = '#0B77A7'
// const BLUE_DARK = '#085f87'
// const BLUE_LIGHT = '#E8F4FB'
// const BLUE_MID = '#C2E0F0'
// const WHITE = '#FFFFFF'
// const BG = '#F4F9FC'
// const TEXT_DARK = '#0D1B2A'
// const TEXT_MID = '#4A6070'
// const TEXT_LIGHT = '#8FA8B8'
// const BORDER = '#DCE8F0'
// const SUCCESS = '#22C55E'
// const SUCCESS_LIGHT = '#F0FDF4'
// const SUCCESS_BORDER = '#BBF7D0'
// const ERROR = '#F87171'
// const ERROR_BG = '#FFF5F5'
// const WARNING = '#F59E0B'
// const WARNING_BG = '#FFFBEB'
// const WARNING_BORDER = '#FDE68A'

// const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
// const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// const PHONE_REGEX = /^[6-9]\d{9}$/
// const RAPID_API_KEY = '1d550a7dcfmsh641a25ca55510d5p1de5bdjsnc84e2976ceec'
// const RAPID_API_HOST = 'gst-verification-api-get-profile-returns-data.p.rapidapi.com'

// // Indian States and Union Territories
// const INDIAN_STATES = [
//     'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
//     'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
//     'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
//     'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
//     'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
//     'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
//     'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
// ]

// const ADDRESS_LABELS = [
//     { value: 'home', label: 'Home', icon: 'home-outline' },
//     { value: 'office', label: 'Office', icon: 'office-building-outline' },
//     { value: 'shop', label: 'Shop', icon: 'store-outline' },
//     { value: 'warehouse', label: 'Warehouse', icon: 'warehouse' },
//     { value: 'other', label: 'Other', icon: 'map-marker-outline' },
// ]

// /* ─── REGISTRATION FLOW STEPS ─── */
// const STEPS = {
//     NAME: 'name',
//     CONTACT: 'contact',
//     GST_CHOICE: 'gst_choice',
//     GST_VERIFY: 'gst_verify',
//     BILLING_ADDRESS: 'billing_address',
//     SHIPPING_ADDRESS: 'shipping_address',
// }

// /* ─── sub-components ─── */

// function ProgressBar({ currentStep, hasGst }) {
//     // Dynamic step order based on GST status
//     const stepOrder = hasGst === true
//         ? [STEPS.NAME, STEPS.CONTACT, STEPS.GST_CHOICE, STEPS.GST_VERIFY, STEPS.BILLING_ADDRESS, STEPS.SHIPPING_ADDRESS]
//         : [STEPS.NAME, STEPS.CONTACT, STEPS.GST_CHOICE, STEPS.BILLING_ADDRESS, STEPS.SHIPPING_ADDRESS]

//     const currentIndex = stepOrder.indexOf(currentStep)
//     const progress = ((currentIndex + 1) / stepOrder.length) * 100

//     return (
//         <View style={styles.progressBarContainer}>
//             <View style={styles.progressBarBg}>
//                 <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
//             </View>
//             <Text style={styles.progressText}>Step {currentIndex + 1} of {stepOrder.length}</Text>
//         </View>
//     )
// }

// function SectionHeader({ icon, title, subtitle }) {
//     return (
//         <View style={styles.sectionHeader}>
//             <View style={styles.sectionIconBox}>
//                 <Icon name={icon} size={18} color={BLUE} />
//             </View>
//             <View style={{ flex: 1 }}>
//                 <Text style={styles.sectionTitle}>{title}</Text>
//                 {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
//             </View>
//         </View>
//     )
// }

// function FieldInput({
//     label, value, onChangeText, placeholder, keyboardType = 'default',
//     autoCapitalize = 'sentences', icon, error, hint, required = false,
//     autoFilled = false, editable = true, loading = false,
// }) {
//     const [focused, setFocused] = useState(false)

//     return (
//         <View style={styles.fieldWrap}>
//             <Text style={styles.fieldLabel}>
//                 {label}{required && <Text style={{ color: ERROR }}> *</Text>}
//             </Text>
//             <View style={[
//                 styles.inputWrap,
//                 focused && styles.inputWrapFocused,
//                 error && styles.inputWrapError,
//                 autoFilled && styles.inputWrapAutoFilled,
//                 !editable && styles.inputWrapDisabled,
//             ]}>
//                 {icon ? (
//                     <Icon
//                         name={icon}
//                         size={16}
//                         color={autoFilled ? SUCCESS : (focused ? BLUE : TEXT_LIGHT)}
//                         style={styles.inputIcon}
//                     />
//                 ) : null}
//                 <TextInput
//                     style={styles.input}
//                     value={value}
//                     onChangeText={onChangeText}
//                     placeholder={placeholder}
//                     placeholderTextColor={TEXT_LIGHT}
//                     keyboardType={keyboardType}
//                     autoCapitalize={autoCapitalize}
//                     onFocus={() => setFocused(true)}
//                     onBlur={() => setFocused(false)}
//                     editable={editable}
//                 />
//                 {loading && <ActivityIndicator size="small" color={BLUE} style={{ marginLeft: 4 }} />}
//                 {autoFilled && !loading && (
//                     <Icon name="auto-fix" size={16} color={SUCCESS} style={{ marginLeft: 4 }} />
//                 )}
//             </View>
//             {error ? (
//                 <View style={styles.fieldError}>
//                     <Icon name="alert-circle-outline" size={12} color={ERROR} />
//                     <Text style={styles.fieldErrorText}>{error}</Text>
//                 </View>
//             ) : hint ? (
//                 <Text style={styles.fieldHint}>{hint}</Text>
//             ) : null}
//         </View>
//     )
// }

// // State Picker with Search
// function StatePicker({ value, onChange, autoFilled, error }) {
//     const [open, setOpen] = useState(false)
//     const [searchQuery, setSearchQuery] = useState('')

//     const filteredStates = INDIAN_STATES.filter(state =>
//         state.toLowerCase().includes(searchQuery.toLowerCase())
//     )

//     return (
//         <View style={styles.fieldWrap}>
//             <Text style={styles.fieldLabel}>State <Text style={{ color: ERROR }}>*</Text></Text>
//             <TouchableOpacity
//                 style={[
//                     styles.inputWrap,
//                     styles.pickerBtn,
//                     autoFilled && styles.inputWrapAutoFilled,
//                     error && styles.inputWrapError,
//                 ]}
//                 onPress={() => setOpen(o => !o)}
//                 activeOpacity={0.8}
//             >
//                 <Icon
//                     name="map-outline"
//                     size={16}
//                     color={autoFilled ? SUCCESS : (value ? BLUE : TEXT_LIGHT)}
//                     style={styles.inputIcon}
//                 />
//                 <Text style={[styles.input, !value && { color: TEXT_LIGHT }]}>
//                     {value || 'Select state'}
//                 </Text>
//                 {autoFilled && <Icon name="auto-fix" size={16} color={SUCCESS} style={{ marginRight: 8 }} />}
//                 <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={TEXT_LIGHT} />
//             </TouchableOpacity>

//             {error && (
//                 <View style={styles.fieldError}>
//                     <Icon name="alert-circle-outline" size={12} color={ERROR} />
//                     <Text style={styles.fieldErrorText}>{error}</Text>
//                 </View>
//             )}

//             {open && (
//                 <View style={styles.statePickerDropdown}>
//                     <View style={styles.searchInputWrap}>
//                         <Icon name="magnify" size={16} color={TEXT_LIGHT} style={styles.inputIcon} />
//                         <TextInput
//                             style={styles.searchInput}
//                             value={searchQuery}
//                             onChangeText={setSearchQuery}
//                             placeholder="Search state..."
//                             placeholderTextColor={TEXT_LIGHT}
//                         />
//                         {searchQuery ? (
//                             <TouchableOpacity onPress={() => setSearchQuery('')}>
//                                 <Icon name="close-circle" size={16} color={TEXT_LIGHT} />
//                             </TouchableOpacity>
//                         ) : null}
//                     </View>
//                     <FlatList
//                         data={filteredStates}
//                         keyExtractor={(item) => item}
//                         style={styles.stateList}
//                         keyboardShouldPersistTaps="handled"
//                         renderItem={({ item }) => (
//                             <TouchableOpacity
//                                 style={[styles.pickerOption, item === value && styles.pickerOptionActive]}
//                                 onPress={() => { onChange(item); setOpen(false); setSearchQuery('') }}
//                                 activeOpacity={0.75}
//                             >
//                                 <Text style={[styles.pickerOptionText, item === value && styles.pickerOptionTextActive]}>
//                                     {item}
//                                 </Text>
//                                 {item === value && <Icon name="check" size={16} color={BLUE} />}
//                             </TouchableOpacity>
//                         )}
//                         ListEmptyComponent={
//                             <View style={styles.emptyState}>
//                                 <Icon name="alert-circle-outline" size={32} color={TEXT_LIGHT} />
//                                 <Text style={styles.emptyStateText}>No states found</Text>
//                             </View>
//                         }
//                     />
//                 </View>
//             )}
//         </View>
//     )
// }

// // City Input with Postal Code Detection
// function CityInput({
//     value,
//     onChange,
//     autoFilled,
//     onCitySelect,
//     cities = [],
//     loading = false,
//     error
// }) {
//     const [focused, setFocused] = useState(false)
//     const [showSuggestions, setShowSuggestions] = useState(false)

//     const handleCityChange = (text) => {
//         onChange(text)
//         setShowSuggestions(text.length > 0 && cities.length > 0)
//     }

//     const selectCity = (cityData) => {
//         onChange(cityData.city)
//         if (onCitySelect) onCitySelect(cityData)
//         setShowSuggestions(false)
//     }

//     return (
//         <View style={styles.fieldWrap}>
//             <Text style={styles.fieldLabel}>City <Text style={{ color: ERROR }}>*</Text></Text>
//             <View style={[
//                 styles.inputWrap,
//                 focused && styles.inputWrapFocused,
//                 autoFilled && styles.inputWrapAutoFilled,
//                 error && styles.inputWrapError,
//             ]}>
//                 <Icon
//                     name="city-variant-outline"
//                     size={16}
//                     color={autoFilled ? SUCCESS : (focused ? BLUE : TEXT_LIGHT)}
//                     style={styles.inputIcon}
//                 />
//                 <TextInput
//                     style={styles.input}
//                     value={value}
//                     onChangeText={handleCityChange}
//                     placeholder="Enter city"
//                     placeholderTextColor={TEXT_LIGHT}
//                     autoCapitalize="words"
//                     onFocus={() => setFocused(true)}
//                     onBlur={() => setTimeout(() => setFocused(false), 200)}
//                 />
//                 {loading && <ActivityIndicator size="small" color={BLUE} style={{ marginLeft: 4 }} />}
//                 {autoFilled && !loading && (
//                     <Icon name="auto-fix" size={16} color={SUCCESS} style={{ marginLeft: 4 }} />
//                 )}
//             </View>

//             {error && (
//                 <View style={styles.fieldError}>
//                     <Icon name="alert-circle-outline" size={12} color={ERROR} />
//                     <Text style={styles.fieldErrorText}>{error}</Text>
//                 </View>
//             )}

//             {showSuggestions && cities.length > 0 && (
//                 <View style={styles.suggestionsDropdown}>
//                     {cities.slice(0, 5).map((cityData, idx) => (
//                         <TouchableOpacity
//                             key={idx}
//                             style={styles.suggestionItem}
//                             onPress={() => selectCity(cityData)}
//                             activeOpacity={0.75}
//                         >
//                             <Icon name="map-marker" size={14} color={BLUE} />
//                             <View style={{ flex: 1, marginLeft: 8 }}>
//                                 <Text style={styles.suggestionCityText}>{cityData.city}</Text>
//                                 <Text style={styles.suggestionPinText}>PIN: {cityData.postalCode}</Text>
//                             </View>
//                             <Icon name="chevron-right" size={16} color={TEXT_LIGHT} />
//                         </TouchableOpacity>
//                     ))}
//                 </View>
//             )}
//         </View>
//     )
// }

// // Address Label Picker
// function AddressLabelPicker({ value, onChange, error }) {
//     return (
//         <View style={styles.fieldWrap}>
//             <Text style={styles.fieldLabel}>Address Type <Text style={{ color: ERROR }}>*</Text></Text>
//             <View style={styles.addressLabelGrid}>
//                 {ADDRESS_LABELS.map(label => (
//                     <TouchableOpacity
//                         key={label.value}
//                         style={[
//                             styles.addressLabelCard,
//                             value === label.value && styles.addressLabelCardActive,
//                             error && !value && styles.inputWrapError,
//                         ]}
//                         onPress={() => onChange(label.value)}
//                         activeOpacity={0.7}
//                     >
//                         <Icon
//                             name={label.icon}
//                             size={20}
//                             color={value === label.value ? BLUE : TEXT_LIGHT}
//                         />
//                         <Text style={[
//                             styles.addressLabelText,
//                             value === label.value && styles.addressLabelTextActive
//                         ]}>
//                             {label.label}
//                         </Text>
//                     </TouchableOpacity>
//                 ))}
//             </View>
//             {error && (
//                 <View style={styles.fieldError}>
//                     <Icon name="alert-circle-outline" size={12} color={ERROR} />
//                     <Text style={styles.fieldErrorText}>{error}</Text>
//                 </View>
//             )}
//         </View>
//     )
// }

// /* ─── Saving overlay ─── */
// function SavingOverlay({ visible }) {
//     if (!visible) return null
//     return (
//         <View style={styles.overlay}>
//             <View style={styles.overlayCard}>
//                 <ActivityIndicator size="large" color={BLUE} />
//                 <Text style={styles.overlayText}>Registering your profile…</Text>
//             </View>
//         </View>
//     )
// }

// export default function ProfileInfoScreen({ setIsLoggedIn }) {
//     const navigation = useNavigation()
//     const route = useRoute()
//     const businessId = 'ad1351af-4c82-4206-9dee-2db2545acd19'

//     const lastFetchedGst = useRef(null)
//     const postalCodeTimeout = useRef(null)
//     const citySearchTimeout = useRef(null)

//     const [currentStep, setCurrentStep] = useState(STEPS.NAME)
//     const [identifier, setIdentifier] = useState('')
//     const [identifierType, setIdentifierType] = useState('')

//     const [form, setForm] = useState({
//         name: '',
//         phone: '',
//         email: '',
//         gstNumber: '',
//         legalName: '',
//         billingAddress: {
//             label: 'billing',
//             addressLine1: '',
//             addressLine2: '',
//             city: '',
//             state: '',
//             postalCode: '',
//             country: 'India',
//         },
//         shippingAddress: {
//             label: '',
//             addressLine1: '',
//             addressLine2: '',
//             city: '',
//             state: '',
//             postalCode: '',
//             country: 'India',
//         }
//     })

//     const [hasGst, setHasGst] = useState(null)
//     const [sameAsBilling, setSameAsBilling] = useState(false)
//     const [gstStatus, setGstStatus] = useState('idle')
//     const [saving, setSaving] = useState(false)
//     const [gstAutoFilled, setGstAutoFilled] = useState(false)
//     const [postalLoading, setPostalLoading] = useState(false)
//     const [cityLoading, setCityLoading] = useState(false)
//     const [citySuggestions, setCitySuggestions] = useState([])
//     const [errors, setErrors] = useState({})

//     const headerAnim = useRef(new Animated.Value(0)).current
//     const fadeAnim = useRef(new Animated.Value(0)).current
//     const gstShake = useRef(new Animated.Value(0)).current

//     useEffect(() => {
//         Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
//         Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
//         loadIdentifier()
//     }, [])

//     const loadIdentifier = async () => {
//         try {
//             const storedIdentifier = await AsyncStorage.getItem('Identifier')

//             console.log('RAW Identifier from storage:', storedIdentifier)

//             const cleaned = storedIdentifier?.replace(/"/g, '').trim()

//             console.log('CLEANED Identifier:', cleaned)

//             if (cleaned) {
//                 setIdentifier(cleaned)

//                 const isEmail = EMAIL_REGEX.test(cleaned)
//                 const isPhone = PHONE_REGEX.test(cleaned)

//                 console.log('Is Email?', isEmail)
//                 console.log('Is Phone?', isPhone)

//                 if (isEmail) {
//                     console.log('SETTING IDENTIFIER TYPE: EMAIL')
//                     setIdentifierType('email')
//                     setForm(prev => ({ ...prev, email: cleaned }))
//                 } else if (isPhone) {
//                     console.log('SETTING IDENTIFIER TYPE: PHONE')
//                     setIdentifierType('phone')
//                     setForm(prev => ({ ...prev, phone: cleaned }))
//                 } else {
//                     console.log('❌ Identifier not matching anything')
//                 }
//             }
//         } catch (err) {
//             console.log('Error loading identifier:', err)
//         }
//     }

//     const fetchLocationFromPostalCode = useCallback(async (pincode, addressType = 'billingAddress') => {
//         if (pincode.length !== 6) return

//         try {
//             setPostalLoading(true)
//             const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
//             const data = await response.json()

//             if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
//                 const postOffice = data[0].PostOffice[0]

//                 setForm(prev => ({
//                     ...prev,
//                     [addressType]: {
//                         ...prev[addressType],
//                         city: postOffice.District || prev[addressType].city,
//                         state: postOffice.State || prev[addressType].state,
//                     }
//                 }))

//                 ToastAndroid.show('Location auto-filled from postal code ✓', ToastAndroid.SHORT)
//             } else {
//                 ToastAndroid.show('Invalid postal code', ToastAndroid.SHORT)
//             }
//         } catch (err) {
//             console.log('Postal code fetch error:', err)
//         } finally {
//             setPostalLoading(false)
//         }
//     }, [])

//     const fetchPostalCodesForCity = useCallback(async (cityName) => {
//         if (cityName.length < 3) {
//             setCitySuggestions([])
//             return
//         }

//         try {
//             setCityLoading(true)
//             const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`)
//             const data = await response.json()

//             if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
//                 const uniqueCities = []
//                 const seen = new Set()

//                 data[0].PostOffice.forEach(po => {
//                     const key = `${po.District}-${po.Pincode}`
//                     if (!seen.has(key)) {
//                         seen.add(key)
//                         uniqueCities.push({
//                             city: po.District,
//                             postalCode: po.Pincode,
//                             state: po.State,
//                         })
//                     }
//                 })

//                 setCitySuggestions(uniqueCities)
//             } else {
//                 setCitySuggestions([])
//             }
//         } catch (err) {
//             console.log('City search error:', err)
//             setCitySuggestions([])
//         } finally {
//             setCityLoading(false)
//         }
//     }, [])

//     const validateGst = (val) => {
//         const upper = val.toUpperCase()

//         if (!upper) { setGstStatus('idle'); return }
//         if (upper.length < 15) { setGstStatus('idle'); return }

//         if (GST_REGEX.test(upper)) {
//             setGstStatus('valid')
//             if (lastFetchedGst.current !== upper) {
//                 lastFetchedGst.current = upper
//                 fetchGstDetails(upper)
//             }
//         } else {
//             setGstStatus('invalid')
//             Animated.sequence([
//                 Animated.timing(gstShake, { toValue: 8, duration: 60, useNativeDriver: true }),
//                 Animated.timing(gstShake, { toValue: -8, duration: 60, useNativeDriver: true }),
//                 Animated.timing(gstShake, { toValue: 6, duration: 50, useNativeDriver: true }),
//                 Animated.timing(gstShake, { toValue: -6, duration: 50, useNativeDriver: true }),
//                 Animated.timing(gstShake, { toValue: 0, duration: 40, useNativeDriver: true }),
//             ]).start()
//         }
//     }

//     const handleGstChange = (val) => {
//         const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)
//         setForm(prev => ({ ...prev, gstNumber: upper }))
//         setGstAutoFilled(false)
//         validateGst(upper)
//     }

//     const fetchGstDetails = useCallback(async (gstValue) => {
//         try {
//             setGstStatus('loading')

//             const res = await fetch(
//                 `https://${RAPID_API_HOST}/v1/gstin/${gstValue}/details`,
//                 {
//                     method: 'GET',
//                     headers: {
//                         'X-RapidAPI-Key': RAPID_API_KEY,
//                         'X-RapidAPI-Host': RAPID_API_HOST,
//                     },
//                 }
//             )

//             const json = await res.json()
//             console.log('GST API raw response:', json)

//             const d = json.data
//             const addr = d.place_of_business_principal?.address

//             const addressParts = [
//                 addr?.door_num,
//                 addr?.floor_num,
//                 addr?.building_name,
//                 addr?.street,
//                 addr?.location
//             ].filter(Boolean)

//             const addressLine1 = addressParts[0] || ''
//             const addressLine2 = addressParts.slice(1).join(', ') || ''

//             const legalName = d.legal_name || ''
//             const businessName = legalName
//                 .replace(/\s*(PRIVATE LIMITED|PVT LTD|PVT\. LTD\.|LIMITED|LTD|LLP|PARTNERSHIP)\s*$/i, '')
//                 .trim()

//             setForm(prev => ({
//                 ...prev,
//                 name: prev.name || businessName,
//                 legalName: legalName,
//                 billingAddress: {
//                     label: 'billing',
//                     addressLine1: addressLine1,
//                     addressLine2: addressLine2,
//                     city: addr?.district || addr?.city || addr?.location || '',
//                     state: addr?.state || '',
//                     postalCode: addr?.pin_code || '',
//                     country: 'India',
//                 }
//             }))

//             setGstStatus('verified')
//             setGstAutoFilled(true)

//             ToastAndroid.show('Business details auto-filled from GSTIN ✓', ToastAndroid.SHORT)
//         } catch (err) {
//             console.log('GST fetch error:', err)
//             setGstStatus('idle')
//             ToastAndroid.show('Could not verify GSTIN. Please try again.', ToastAndroid.SHORT)
//         }
//     }, [])

//     const updateAddress = (addressType, field, value) => {
//         setForm(prev => ({
//             ...prev,
//             [addressType]: {
//                 ...prev[addressType],
//                 [field]: value
//             }
//         }))
//     }

//     const handlePostalCodeChange = (val, addressType = 'billingAddress') => {
//         const cleaned = val.replace(/[^0-9]/g, '').slice(0, 6)
//         updateAddress(addressType, 'postalCode', cleaned)

//         if (postalCodeTimeout.current) {
//             clearTimeout(postalCodeTimeout.current)
//         }

//         if (cleaned.length === 6) {
//             postalCodeTimeout.current = setTimeout(() => {
//                 fetchLocationFromPostalCode(cleaned, addressType)
//             }, 500)
//         }
//     }

//     const handleCityChange = (val, addressType = 'billingAddress') => {
//         updateAddress(addressType, 'city', val)

//         if (citySearchTimeout.current) {
//             clearTimeout(citySearchTimeout.current)
//         }

//         if (val.length >= 3) {
//             citySearchTimeout.current = setTimeout(() => {
//                 fetchPostalCodesForCity(val)
//             }, 500)
//         } else {
//             setCitySuggestions([])
//         }
//     }

//     const handleCitySelect = (cityData, addressType = 'billingAddress') => {
//         setForm(prev => ({
//             ...prev,
//             [addressType]: {
//                 ...prev[addressType],
//                 city: cityData.city,
//                 postalCode: cityData.postalCode,
//                 state: cityData.state,
//             }
//         }))
//         setCitySuggestions([])
//         ToastAndroid.show('Location auto-filled ✓', ToastAndroid.SHORT)
//     }

//     const validateStep = () => {
//         const newErrors = {}

//         switch (currentStep) {
//             case STEPS.NAME:
//                 if (!form.name.trim() || form.name.trim().length < 2) {
//                     newErrors.name = 'Name must be at least 2 characters'
//                 }
//                 break

//             case STEPS.CONTACT:
//                 if (identifierType === 'email') {
//                     if (!form.phone.trim() || !PHONE_REGEX.test(form.phone)) {
//                         newErrors.phone = 'Enter a valid 10-digit mobile number'
//                     }
//                 } else {
//                     if (!form.email.trim() || !EMAIL_REGEX.test(form.email)) {
//                         newErrors.email = 'Enter a valid email address'
//                     }
//                 }
//                 break

//             case STEPS.GST_VERIFY:
//                 if (hasGst && gstStatus !== 'verified') {
//                     newErrors.gst = 'Please enter and verify a valid GSTIN'
//                 }
//                 if (hasGst && !form.legalName.trim()) {
//                     newErrors.legalName = 'Legal business name is required'
//                 }
//                 break

//             case STEPS.BILLING_ADDRESS:
//                 const billing = form.billingAddress
//                 if (!billing.addressLine1.trim()) newErrors.billingAddressLine1 = 'Address is required'
//                 if (!billing.city.trim()) newErrors.billingCity = 'City is required'
//                 if (!billing.state.trim()) newErrors.billingState = 'State is required'
//                 if (!billing.postalCode.trim() || billing.postalCode.length !== 6) {
//                     newErrors.billingPostalCode = 'Enter valid 6-digit postal code'
//                 }
//                 break

//             case STEPS.SHIPPING_ADDRESS:
//                 if (!sameAsBilling) {
//                     const shipping = form.shippingAddress
//                     if (!shipping.label) newErrors.shippingLabel = 'Select address type'
//                     if (!shipping.addressLine1.trim()) newErrors.shippingAddressLine1 = 'Address is required'
//                     if (!shipping.city.trim()) newErrors.shippingCity = 'City is required'
//                     if (!shipping.state.trim()) newErrors.shippingState = 'State is required'
//                     if (!shipping.postalCode.trim() || shipping.postalCode.length !== 6) {
//                         newErrors.shippingPostalCode = 'Enter valid 6-digit postal code'
//                     }
//                 }
//                 break
//         }

//         setErrors(newErrors)
//         return Object.keys(newErrors).length === 0
//     }

//     const handleNext = () => {
//         if (!validateStep()) {
//             ToastAndroid.show('Please fix the errors', ToastAndroid.SHORT)
//             return
//         }

//         switch (currentStep) {
//             case STEPS.NAME:
//                 setCurrentStep(STEPS.CONTACT)
//                 break
//             case STEPS.CONTACT:
//                 setCurrentStep(STEPS.GST_CHOICE)
//                 break
//             case STEPS.GST_CHOICE:
//                 if (hasGst === true) {
//                     setCurrentStep(STEPS.GST_VERIFY)
//                 } else if (hasGst === false) {
//                     setCurrentStep(STEPS.BILLING_ADDRESS)
//                 }
//                 break
//             case STEPS.GST_VERIFY:
//                 setCurrentStep(STEPS.BILLING_ADDRESS)
//                 break
//             case STEPS.BILLING_ADDRESS:
//                 setCurrentStep(STEPS.SHIPPING_ADDRESS)
//                 break
//             case STEPS.SHIPPING_ADDRESS:
//                 handleSubmit()
//                 break
//         }
//     }

//     const handleBack = () => {
//         switch (currentStep) {
//             case STEPS.CONTACT:
//                 setCurrentStep(STEPS.NAME)
//                 break
//             case STEPS.GST_CHOICE:
//                 setCurrentStep(STEPS.CONTACT)
//                 break
//             case STEPS.GST_VERIFY:
//                 setCurrentStep(STEPS.GST_CHOICE)
//                 break
//             case STEPS.BILLING_ADDRESS:
//                 if (hasGst) {
//                     setCurrentStep(STEPS.GST_VERIFY)
//                 } else {
//                     setCurrentStep(STEPS.GST_CHOICE)
//                 }
//                 break
//             case STEPS.SHIPPING_ADDRESS:
//                 setCurrentStep(STEPS.BILLING_ADDRESS)
//                 break
//         }
//     }

//     const handleSubmit = async () => {
//         if (!businessId) {
//             ToastAndroid.show('Business ID not found', ToastAndroid.SHORT)
//             return
//         }

//         try {
//             setSaving(true)
//             const token = await AsyncStorage.getItem('userToken')

//             const rawIdentifier = await AsyncStorage.getItem('Identifier')

//             const storedIdentifier = rawIdentifier?.replace(/"/g, '').trim()

//             const phoneFromStorage = PHONE_REGEX.test(storedIdentifier) ? storedIdentifier : ''
//             const emailFromStorage = EMAIL_REGEX.test(storedIdentifier) ? storedIdentifier : ''

//             const payload = {
//                 name: form.name.trim(),
//                 phone: form.phone.trim() || phoneFromStorage,
//                 email: form.email.trim() || emailFromStorage,
//                 billingAddress: {
//                     label: 'billing',
//                     address: {
//                         addressLine1: form.billingAddress.addressLine1.trim(),
//                         ...(form.billingAddress.addressLine2 && { addressLine2: form.billingAddress.addressLine2.trim() }),
//                         city: form.billingAddress.city.trim(),
//                         state: form.billingAddress.state.trim(),
//                         postalCode: form.billingAddress.postalCode.trim(),
//                         country: 'India',
//                     }
//                 }
//             }

//             // Add GST details if user has GST
//             if (hasGst && gstStatus === 'verified') {
//                 payload.gstNumber = form.gstNumber
//                 payload.legalName = form.legalName.trim()
//             }

//             // Always add shipping address
//             if (sameAsBilling) {
//                 // Copy billing address as shipping with office label
//                 payload.shippingAddress = {
//                     label: 'office',
//                     address: {
//                         addressLine1: form.billingAddress.addressLine1.trim(),
//                         ...(form.billingAddress.addressLine2 && { addressLine2: form.billingAddress.addressLine2.trim() }),
//                         city: form.billingAddress.city.trim(),
//                         state: form.billingAddress.state.trim(),
//                         postalCode: form.billingAddress.postalCode.trim(),
//                         country: 'India',
//                     }
//                 }
//             } else {
//                 payload.shippingAddress = {
//                     label: form.shippingAddress.label,
//                     address: {
//                         addressLine1: form.shippingAddress.addressLine1.trim(),
//                         ...(form.shippingAddress.addressLine2 && { addressLine2: form.shippingAddress.addressLine2.trim() }),
//                         city: form.shippingAddress.city.trim(),
//                         state: form.shippingAddress.state.trim(),
//                         postalCode: form.shippingAddress.postalCode.trim(),
//                         country: 'India',
//                     }
//                 }
//             }

//             console.log('B2B REGISTRATION PAYLOAD →', JSON.stringify(payload, null, 2))

//             const res = await fetch(`${BASE_URL}/customer/business/${businessId}/b2b-register`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify(payload),
//             })

//             const json = await res.json()
//             console.log('B2B registration response:', json)

//             if (!res.ok || !json.success) throw json

//             ToastAndroid.show('Registration successful 🎉', ToastAndroid.SHORT)

//             if (setIsLoggedIn) setIsLoggedIn(true)
//             else navigation.goBack()

//         } catch (err) {
//             const msg = err?.error?.message || err?.message || 'Registration failed'
//             ToastAndroid.show(msg, ToastAndroid.LONG)
//             console.error('Registration error:', err)
//         } finally {
//             setSaving(false)
//         }
//     }

//     const renderStepContent = () => {
//         switch (currentStep) {
//             case STEPS.NAME:
//                 return (
//                     <View style={styles.section}>
//                         <SectionHeader
//                             icon="account-outline"
//                             title="What should we call you?"
//                             subtitle="Enter your full name or business name"
//                         />
//                         <FieldInput
//                             label="Full Name"
//                             value={form.name}
//                             onChangeText={v => setForm(prev => ({ ...prev, name: v }))}
//                             placeholder="Enter your full name"
//                             icon="account-outline"
//                             required={true}
//                             error={errors.name}
//                         />
//                     </View>
//                 )

//             case STEPS.CONTACT:
//                 return (
//                     <View style={styles.section}>
//                         <SectionHeader
//                             icon="email-outline"
//                             title="Contact Information"
//                             subtitle={identifierType === 'email' ? 'We need your phone number' : 'We need your email address'}
//                         />

//                         {identifierType === 'email' ? (
//                             <>
//                                 <FieldInput
//                                     label="Email Address"
//                                     value={form.email}
//                                     onChangeText={() => { }}
//                                     placeholder="Email"
//                                     icon="email-outline"
//                                     editable={false}
//                                     autoFilled={true}
//                                 />
//                                 <FieldInput
//                                     label="Phone Number"
//                                     value={form.phone}
//                                     onChangeText={v => setForm(prev => ({ ...prev, phone: v.replace(/[^0-9]/g, '').slice(0, 10) }))}
//                                     placeholder="Enter 10-digit mobile number"
//                                     icon="phone-outline"
//                                     keyboardType="phone-pad"
//                                     required={true}
//                                     error={errors.phone}
//                                     hint="We'll use this for order updates"
//                                 />
//                             </>
//                         ) : (
//                             <>
//                                 <FieldInput
//                                     label="Phone Number"
//                                     value={form.phone}
//                                     onChangeText={() => { }}
//                                     placeholder="Phone"
//                                     icon="phone-outline"
//                                     editable={false}
//                                     autoFilled={true}
//                                 />
//                                 <FieldInput
//                                     label="Email Address"
//                                     value={form.email}
//                                     onChangeText={v => setForm(prev => ({ ...prev, email: v.toLowerCase().trim() }))}
//                                     placeholder="Enter your email"
//                                     icon="email-outline"
//                                     keyboardType="email-address"
//                                     autoCapitalize="none"
//                                     required={true}
//                                     error={errors.email}
//                                     hint="We'll send order confirmations here"
//                                 />
//                             </>
//                         )}
//                     </View>
//                 )

//             case STEPS.GST_CHOICE:
//                 return (
//                     <View style={styles.section}>
//                         <SectionHeader
//                             icon="office-building-outline"
//                             title="Are you GST registered?"
//                             subtitle="This helps us provide better service"
//                         />

//                         <View style={styles.choiceContainer}>
//                             <TouchableOpacity
//                                 style={[styles.choiceCard, hasGst === true && styles.choiceCardActive]}
//                                 onPress={() => setHasGst(true)}
//                                 activeOpacity={0.7}
//                             >
//                                 <Icon name="check-circle" size={24} color={hasGst === true ? BLUE : TEXT_LIGHT} />
//                                 <Text style={[styles.choiceTitle, hasGst === true && styles.choiceTextActive]}>
//                                     Yes, I have GST
//                                 </Text>
//                                 <Text style={styles.choiceSubtitle}>
//                                     We'll auto-fill your business details
//                                 </Text>
//                             </TouchableOpacity>

//                             <TouchableOpacity
//                                 style={[styles.choiceCard, hasGst === false && styles.choiceCardActive]}
//                                 onPress={() => setHasGst(false)}
//                                 activeOpacity={0.7}
//                             >
//                                 <Icon name="close-circle" size={24} color={hasGst === false ? BLUE : TEXT_LIGHT} />
//                                 <Text style={[styles.choiceTitle, hasGst === false && styles.choiceTextActive]}>
//                                     No, I don't have GST
//                                 </Text>
//                                 <Text style={styles.choiceSubtitle}>
//                                     You can still register and shop
//                                 </Text>
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 )

//             case STEPS.GST_VERIFY:
//                 return (
//                     <View style={styles.section}>
//                         <SectionHeader
//                             icon="card-account-details-outline"
//                             title="Enter your GSTIN"
//                             subtitle="We'll verify and auto-fill your business details"
//                         />

//                         <Animated.View style={{ transform: [{ translateX: gstShake }] }}>
//                             <View style={styles.fieldWrap}>
//                                 <Text style={styles.fieldLabel}>
//                                     GSTIN <Text style={{ color: ERROR }}>*</Text>
//                                 </Text>
//                                 <View style={[
//                                     styles.inputWrap,
//                                     {
//                                         borderColor: {
//                                             idle: BORDER,
//                                             valid: SUCCESS,
//                                             invalid: ERROR,
//                                             loading: BLUE,
//                                             verified: SUCCESS,
//                                         }[gstStatus]
//                                     },
//                                     gstStatus === 'verified' && styles.inputWrapAutoFilled,
//                                 ]}>
//                                     <Icon
//                                         name="card-account-details-outline"
//                                         size={16}
//                                         color={
//                                             gstStatus === 'verified' ? SUCCESS
//                                                 : gstStatus === 'invalid' ? ERROR
//                                                     : TEXT_LIGHT
//                                         }
//                                         style={styles.inputIcon}
//                                     />
//                                     <TextInput
//                                         style={styles.input}
//                                         value={form.gstNumber}
//                                         onChangeText={handleGstChange}
//                                         placeholder="Enter 15-character GSTIN"
//                                         placeholderTextColor={TEXT_LIGHT}
//                                         autoCapitalize="characters"
//                                         maxLength={15}
//                                     />
//                                     {gstStatus === 'loading' && <ActivityIndicator size="small" color={BLUE} />}
//                                     {gstStatus === 'verified' && <Icon name="check-decagram" size={20} color={SUCCESS} />}
//                                     {gstStatus === 'invalid' && <Icon name="alert-circle-outline" size={20} color={ERROR} />}
//                                     {gstStatus === 'valid' && <ActivityIndicator size="small" color={BLUE} />}
//                                 </View>
//                                 <Text style={[styles.gstCharCount, { color: form.gstNumber.length === 15 ? BLUE : TEXT_LIGHT }]}>
//                                     {form.gstNumber.length}/15
//                                 </Text>
//                             </View>
//                         </Animated.View>

//                         {gstStatus === 'invalid' && (
//                             <View style={styles.statusRow}>
//                                 <Icon name="alert-circle-outline" size={13} color={ERROR} />
//                                 <Text style={[styles.statusText, { color: ERROR }]}>
//                                     Invalid GSTIN format. Check and try again.
//                                 </Text>
//                             </View>
//                         )}
//                         {gstStatus === 'valid' && (
//                             <View style={styles.statusRow}>
//                                 <Icon name="information-outline" size={13} color={BLUE} />
//                                 <Text style={[styles.statusText, { color: BLUE }]}>
//                                     Format looks valid — Verifying...
//                                 </Text>
//                             </View>
//                         )}
//                         {gstStatus === 'verified' && (
//                             <>
//                                 <View style={[styles.statusRow, styles.verifiedBanner]}>
//                                     <Icon name="check-decagram" size={14} color="#166534" />
//                                     <Text style={[styles.statusText, { color: '#166534', fontFamily: FONTS.Bold }]}>
//                                         GSTIN verified · Business details loaded
//                                     </Text>
//                                 </View>

//                                 <FieldInput
//                                     label="Legal Business Name"
//                                     value={form.legalName}
//                                     onChangeText={v => setForm(prev => ({ ...prev, legalName: v }))}
//                                     placeholder="Enter legal business name"
//                                     icon="briefcase-outline"
//                                     required={true}
//                                     autoFilled={gstAutoFilled}
//                                     error={errors.legalName}
//                                 />
//                             </>
//                         )}
//                     </View>
//                 )

//             case STEPS.BILLING_ADDRESS:
//                 return (
//                     <View style={styles.section}>
//                         <SectionHeader
//                             icon="map-marker-outline"
//                             title={hasGst ? "Billing Address" : "Your Address"}
//                             subtitle={hasGst ? "Where should we send invoices?" : "We'll use this for billing and shipping"}
//                         />

//                         <FieldInput
//                             label="Address Line 1"
//                             value={form.billingAddress.addressLine1}
//                             onChangeText={v => updateAddress('billingAddress', 'addressLine1', v)}
//                             placeholder="Building, Street"
//                             icon="home-outline"
//                             required={true}
//                             autoFilled={gstAutoFilled}
//                             error={errors.billingAddressLine1}
//                         />

//                         <FieldInput
//                             label="Address Line 2"
//                             value={form.billingAddress.addressLine2}
//                             onChangeText={v => updateAddress('billingAddress', 'addressLine2', v)}
//                             placeholder="Landmark, Area (Optional)"
//                             icon="map-marker-plus-outline"
//                             autoFilled={gstAutoFilled}
//                         />

//                         <CityInput
//                             value={form.billingAddress.city}
//                             onChange={v => handleCityChange(v, 'billingAddress')}
//                             autoFilled={gstAutoFilled}
//                             onCitySelect={(data) => handleCitySelect(data, 'billingAddress')}
//                             cities={citySuggestions}
//                             loading={cityLoading}
//                             error={errors.billingCity}
//                         />

//                         <StatePicker
//                             value={form.billingAddress.state}
//                             onChange={v => updateAddress('billingAddress', 'state', v)}
//                             autoFilled={gstAutoFilled}
//                             error={errors.billingState}
//                         />

//                         <FieldInput
//                             label="Postal Code"
//                             value={form.billingAddress.postalCode}
//                             onChangeText={v => handlePostalCodeChange(v, 'billingAddress')}
//                             placeholder="Enter 6-digit postal code"
//                             icon="mailbox-outline"
//                             keyboardType="number-pad"
//                             required={true}
//                             autoFilled={gstAutoFilled}
//                             loading={postalLoading}
//                             error={errors.billingPostalCode}
//                         />
//                     </View>
//                 )

//             case STEPS.SHIPPING_ADDRESS:
//                 return (
//                     <View style={styles.section}>
//                         <SectionHeader
//                             icon="package-variant"
//                             title="Shipping Address"
//                             subtitle="Where should we deliver your orders?"
//                         />

//                         <TouchableOpacity
//                             style={styles.checkboxRow}
//                             onPress={() => setSameAsBilling(!sameAsBilling)}
//                             activeOpacity={0.7}
//                         >
//                             <Icon
//                                 name={sameAsBilling ? 'checkbox-marked' : 'checkbox-blank-outline'}
//                                 size={24}
//                                 color={sameAsBilling ? BLUE : TEXT_LIGHT}
//                             />
//                             <Text style={styles.checkboxText}>
//                                 Same as {hasGst ? 'billing' : 'above'} address
//                             </Text>
//                         </TouchableOpacity>

//                         {!sameAsBilling && (
//                             <>
//                                 <AddressLabelPicker
//                                     value={form.shippingAddress.label}
//                                     onChange={v => updateAddress('shippingAddress', 'label', v)}
//                                     error={errors.shippingLabel}
//                                 />

//                                 <FieldInput
//                                     label="Address Line 1"
//                                     value={form.shippingAddress.addressLine1}
//                                     onChangeText={v => updateAddress('shippingAddress', 'addressLine1', v)}
//                                     placeholder="Building, Street"
//                                     icon="home-outline"
//                                     required={true}
//                                     error={errors.shippingAddressLine1}
//                                 />

//                                 <FieldInput
//                                     label="Address Line 2"
//                                     value={form.shippingAddress.addressLine2}
//                                     onChangeText={v => updateAddress('shippingAddress', 'addressLine2', v)}
//                                     placeholder="Landmark, Area (Optional)"
//                                     icon="map-marker-plus-outline"
//                                 />

//                                 <CityInput
//                                     value={form.shippingAddress.city}
//                                     onChange={v => handleCityChange(v, 'shippingAddress')}
//                                     onCitySelect={(data) => handleCitySelect(data, 'shippingAddress')}
//                                     cities={citySuggestions}
//                                     loading={cityLoading}
//                                     error={errors.shippingCity}
//                                 />

//                                 <StatePicker
//                                     value={form.shippingAddress.state}
//                                     onChange={v => updateAddress('shippingAddress', 'state', v)}
//                                     error={errors.shippingState}
//                                 />

//                                 <FieldInput
//                                     label="Postal Code"
//                                     value={form.shippingAddress.postalCode}
//                                     onChangeText={v => handlePostalCodeChange(v, 'shippingAddress')}
//                                     placeholder="Enter 6-digit postal code"
//                                     icon="mailbox-outline"
//                                     keyboardType="number-pad"
//                                     required={true}
//                                     loading={postalLoading}
//                                     error={errors.shippingPostalCode}
//                                 />
//                             </>
//                         )}
//                     </View>
//                 )

//             default:
//                 return null
//         }
//     }

//     const isNextDisabled = () => {
//         switch (currentStep) {
//             case STEPS.NAME:
//                 return !form.name.trim() || form.name.trim().length < 2
//             case STEPS.CONTACT:
//                 if (identifierType === 'email') {
//                     return !form.phone.trim() || !PHONE_REGEX.test(form.phone)
//                 } else {
//                     return !form.email.trim() || !EMAIL_REGEX.test(form.email)
//                 }
//             case STEPS.GST_CHOICE:
//                 return hasGst === null
//             case STEPS.GST_VERIFY:
//                 return gstStatus !== 'verified' || !form.legalName.trim()
//             case STEPS.BILLING_ADDRESS:
//                 return !form.billingAddress.addressLine1.trim() ||
//                     !form.billingAddress.city.trim() ||
//                     !form.billingAddress.state.trim() ||
//                     form.billingAddress.postalCode.length !== 6
//             case STEPS.SHIPPING_ADDRESS:
//                 if (sameAsBilling) return false
//                 return !form.shippingAddress.label ||
//                     !form.shippingAddress.addressLine1.trim() ||
//                     !form.shippingAddress.city.trim() ||
//                     !form.shippingAddress.state.trim() ||
//                     form.shippingAddress.postalCode.length !== 6
//             default:
//                 return false
//         }
//     }

//     const getButtonText = () => {
//         switch (currentStep) {
//             case STEPS.SHIPPING_ADDRESS:
//                 return 'Complete Registration'
//             default:
//                 return 'Continue'
//         }
//     }

//     return (
//         <View style={styles.container}>
//             <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />
//             <SavingOverlay visible={saving} />

//             <Animated.View
//                 style={[
//                     styles.header,
//                     {
//                         opacity: headerAnim,
//                         transform: [{
//                             translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }),
//                         }],
//                     },
//                 ]}
//             >
//                 {currentStep !== STEPS.NAME && (
//                     <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.75}>
//                         <Icon name="arrow-left" size={22} color={WHITE} />
//                     </TouchableOpacity>
//                 )}

//                 <View style={styles.headerCenter}>
//                     <Text style={styles.headerEyebrow}>B2B Registration</Text>
//                     <Text style={styles.headerTitle}>Complete Your Profile</Text>
//                 </View>
//             </Animated.View>

//             <ProgressBar currentStep={currentStep} hasGst={hasGst} />

//             <KeyboardAvoidingView
//                 style={{ flex: 1 }}
//                 behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//                 keyboardVerticalOffset={0}
//             >
//                 <Animated.ScrollView
//                     style={{ opacity: fadeAnim }}
//                     showsVerticalScrollIndicator={false}
//                     contentContainerStyle={{ paddingBottom: 48 }}
//                     keyboardShouldPersistTaps="handled"
//                 >
//                     {renderStepContent()}
//                 </Animated.ScrollView>
//             </KeyboardAvoidingView>

//             <View style={styles.bottomNav}>
//                 <TouchableOpacity
//                     style={[styles.nextBtn, (isNextDisabled() || saving) && styles.nextBtnDisabled]}
//                     onPress={handleNext}
//                     activeOpacity={0.85}
//                     disabled={isNextDisabled() || saving}
//                 >
//                     {saving ? (
//                         <ActivityIndicator size="small" color={WHITE} />
//                     ) : (
//                         <>
//                             <Text style={styles.nextBtnText}>{getButtonText()}</Text>
//                             <Icon name="arrow-right" size={20} color={WHITE} />
//                         </>
//                     )}
//                 </TouchableOpacity>
//             </View>
//         </View>
//     )
// }

// /* ─── styles ─── */
// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: BG },

//     header: {
//         backgroundColor: BLUE,
//         paddingTop: Platform.OS === 'android' ? 14 : 52,
//         paddingBottom: 14,
//         paddingHorizontal: 16,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         shadowColor: BLUE_DARK,
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.2,
//         shadowRadius: 8,
//         elevation: 6,
//     },
//     backBtn: {
//         width: 40, height: 40, borderRadius: 20,
//         justifyContent: 'center', alignItems: 'center',
//     },
//     headerCenter: { flex: 1, alignItems: 'center' },
//     headerEyebrow: {
//         fontSize: 10, color: 'rgba(255,255,255,0.65)',
//         fontFamily: FONTS.Medium, letterSpacing: 1.2, textTransform: 'uppercase',
//     },
//     headerTitle: {
//         fontSize: 18, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: -0.2,
//     },

//     progressBarContainer: {
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: WHITE,
//         borderBottomWidth: 1,
//         borderBottomColor: BORDER,
//     },
//     progressBarBg: {
//         height: 4,
//         backgroundColor: BLUE_LIGHT,
//         borderRadius: 2,
//         overflow: 'hidden',
//     },
//     progressBarFill: {
//         height: '100%',
//         backgroundColor: BLUE,
//         borderRadius: 2,
//     },
//     progressText: {
//         fontSize: 11,
//         fontFamily: FONTS.Medium,
//         color: TEXT_MID,
//         marginTop: 6,
//         textAlign: 'center',
//     },

//     section: {
//         marginHorizontal: 16,
//         marginTop: 16,
//         marginBottom: 12,
//         backgroundColor: WHITE,
//         borderRadius: 16,
//         padding: 16,
//         borderWidth: 1,
//         borderColor: BORDER,
//         shadowColor: BLUE,
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 6,
//         elevation: 1,
//     },
//     sectionHeader: {
//         flexDirection: 'row', alignItems: 'center',
//         gap: 10, marginBottom: 16,
//         paddingBottom: 12,
//         borderBottomWidth: 1, borderBottomColor: BORDER,
//     },
//     sectionIconBox: {
//         width: 36, height: 36, borderRadius: 9,
//         backgroundColor: BLUE_LIGHT,
//         justifyContent: 'center', alignItems: 'center',
//     },
//     sectionTitle: { fontSize: 15, fontFamily: FONTS.Bold, color: TEXT_DARK },
//     sectionSubtitle: { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT, marginTop: 1 },

//     choiceContainer: {
//         gap: 12,
//     },
//     choiceCard: {
//         padding: 16,
//         borderWidth: 2,
//         borderColor: BORDER,
//         borderRadius: 12,
//         backgroundColor: BG,
//         alignItems: 'center',
//     },
//     choiceCardActive: {
//         borderColor: BLUE,
//         backgroundColor: BLUE_LIGHT,
//     },
//     choiceTitle: {
//         fontSize: 15,
//         fontFamily: FONTS.Bold,
//         color: TEXT_DARK,
//         marginTop: 8,
//     },
//     choiceTextActive: {
//         color: BLUE,
//     },
//     choiceSubtitle: {
//         fontSize: 12,
//         fontFamily: FONTS.Regular,
//         color: TEXT_LIGHT,
//         marginTop: 4,
//         textAlign: 'center',
//     },

//     checkboxRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//         paddingVertical: 12,
//         paddingHorizontal: 12,
//         backgroundColor: BLUE_LIGHT,
//         borderRadius: 10,
//         marginBottom: 16,
//     },
//     checkboxText: {
//         fontSize: 14,
//         fontFamily: FONTS.Medium,
//         color: TEXT_DARK,
//         flex: 1,
//     },

//     addressLabelGrid: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 10,
//     },
//     addressLabelCard: {
//         flex: 1,
//         minWidth: '30%',
//         padding: 12,
//         borderWidth: 2,
//         borderColor: BORDER,
//         borderRadius: 10,
//         alignItems: 'center',
//         backgroundColor: BG,
//     },
//     addressLabelCardActive: {
//         borderColor: BLUE,
//         backgroundColor: BLUE_LIGHT,
//     },
//     addressLabelText: {
//         fontSize: 12,
//         fontFamily: FONTS.Medium,
//         color: TEXT_MID,
//         marginTop: 4,
//     },
//     addressLabelTextActive: {
//         color: BLUE,
//     },

//     fieldWrap: { marginBottom: 14 },
//     fieldLabel: {
//         fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_MID,
//         textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
//     },
//     inputWrap: {
//         flexDirection: 'row', alignItems: 'center',
//         borderWidth: 1.5, borderColor: BORDER,
//         borderRadius: 10, backgroundColor: BG,
//         paddingHorizontal: 12, minHeight: 46,
//     },
//     inputWrapFocused: { borderColor: BLUE, backgroundColor: '#F0F8FC' },
//     inputWrapError: { borderColor: ERROR, backgroundColor: ERROR_BG },
//     inputWrapAutoFilled: { borderColor: SUCCESS, backgroundColor: SUCCESS_LIGHT },
//     inputWrapDisabled: { opacity: 0.5 },
//     inputIcon: { marginRight: 8 },
//     input: {
//         flex: 1, fontSize: 14, fontFamily: FONTS.Regular,
//         color: TEXT_DARK, paddingVertical: 0,
//     },
//     fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
//     fieldErrorText: { fontSize: 11, color: ERROR, fontFamily: FONTS.Regular },
//     fieldHint: { fontSize: 11, color: TEXT_LIGHT, fontFamily: FONTS.Regular, marginTop: 4 },

//     gstCharCount: {
//         fontSize: 11, fontFamily: FONTS.Regular,
//         textAlign: 'right', marginTop: 4,
//     },
//     statusRow: {
//         flexDirection: 'row', alignItems: 'flex-start',
//         gap: 5, marginTop: 2, marginBottom: 8,
//     },
//     statusText: {
//         fontSize: 11, fontFamily: FONTS.Regular,
//         flex: 1, lineHeight: 16,
//     },
//     verifiedBanner: {
//         backgroundColor: SUCCESS_LIGHT,
//         borderRadius: 8,
//         paddingHorizontal: 10,
//         paddingVertical: 8,
//         borderWidth: 1,
//         borderColor: SUCCESS_BORDER,
//         marginBottom: 10,
//     },

//     pickerBtn: { justifyContent: 'space-between' },
//     statePickerDropdown: {
//         marginTop: 4, borderWidth: 1, borderColor: BORDER,
//         borderRadius: 10, backgroundColor: WHITE, overflow: 'hidden',
//         maxHeight: 280,
//     },
//     searchInputWrap: {
//         flexDirection: 'row', alignItems: 'center',
//         borderBottomWidth: 1, borderBottomColor: BORDER,
//         paddingHorizontal: 12, paddingVertical: 10,
//         backgroundColor: BG,
//     },
//     searchInput: {
//         flex: 1, fontSize: 14, fontFamily: FONTS.Regular,
//         color: TEXT_DARK, paddingVertical: 0,
//     },
//     stateList: {
//         maxHeight: 230,
//     },
//     pickerOption: {
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//         paddingHorizontal: 14, paddingVertical: 12,
//         borderBottomWidth: 1, borderBottomColor: BORDER,
//     },
//     pickerOptionActive: { backgroundColor: BLUE_LIGHT },
//     pickerOptionText: { fontSize: 14, fontFamily: FONTS.Regular, color: TEXT_DARK },
//     pickerOptionTextActive: { color: BLUE, fontFamily: FONTS.Medium },
//     emptyState: {
//         paddingVertical: 40,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     emptyStateText: {
//         fontSize: 13,
//         fontFamily: FONTS.Regular,
//         color: TEXT_LIGHT,
//         marginTop: 8,
//     },

//     suggestionsDropdown: {
//         marginTop: 4, borderWidth: 1, borderColor: BORDER,
//         borderRadius: 10, backgroundColor: WHITE, overflow: 'hidden',
//     },
//     suggestionItem: {
//         flexDirection: 'row', alignItems: 'center',
//         paddingHorizontal: 12, paddingVertical: 10,
//         borderBottomWidth: 1, borderBottomColor: BORDER,
//     },
//     suggestionCityText: {
//         fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_DARK,
//     },
//     suggestionPinText: {
//         fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT,
//         marginTop: 2,
//     },

//     bottomNav: {
//         padding: 16,
//         backgroundColor: WHITE,
//         borderTopWidth: 1,
//         borderTopColor: BORDER,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//         elevation: 4,
//     },
//     nextBtn: {
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//         gap: 8,
//         backgroundColor: BLUE, paddingVertical: 15,
//         borderRadius: 14,
//         shadowColor: BLUE_DARK,
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.25,
//         shadowRadius: 8,
//         elevation: 4,
//     },
//     nextBtnDisabled: { opacity: 0.6 },
//     nextBtnText: {
//         fontSize: 16, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: 0.2,
//     },

//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.35)',
//         zIndex: 99,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     overlayCard: {
//         backgroundColor: WHITE, borderRadius: 16,
//         paddingHorizontal: 36, paddingVertical: 28,
//         alignItems: 'center', gap: 14,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 6 },
//         shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
//     },
//     overlayText: { fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_DARK },
// })

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    ToastAndroid,
    Animated,
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    TextInput,
    StyleSheet,
    FlatList,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../utils/fonts'
import BASE_URL from '../../services/api'

/* ─── palette ─── */
const BLUE = '#0B77A7'
const BLUE_DARK = '#085f87'
const BLUE_LIGHT = '#E8F4FB'
const WHITE = '#FFFFFF'
const BG = '#F4F9FC'
const TEXT_DARK = '#0D1B2A'
const TEXT_MID = '#4A6070'
const TEXT_LIGHT = '#8FA8B8'
const BORDER = '#DCE8F0'
const SUCCESS = '#22C55E'
const SUCCESS_LIGHT = '#F0FDF4'
const SUCCESS_BORDER = '#BBF7D0'
const ERROR = '#F87171'
const ERROR_BG = '#FFF5F5'

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[6-9]\d{9}$/
const RAPID_API_KEY = '1d550a7dcfmsh641a25ca55510d5p1de5bdjsnc84e2976ceec'
const RAPID_API_HOST = 'gst-verification-api-get-profile-returns-data.p.rapidapi.com'

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
]

const ADDRESS_LABELS = [
    { value: 'home', label: 'Home', icon: 'home-outline' },
    { value: 'office', label: 'Office', icon: 'office-building-outline' },
    { value: 'shop', label: 'Shop', icon: 'store-outline' },
    { value: 'warehouse', label: 'Warehouse', icon: 'warehouse' },
    { value: 'other', label: 'Other', icon: 'map-marker-outline' },
]

/* ─── sub-components ─── */

function SectionHeader({ icon, title, subtitle }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
                <Icon name={icon} size={18} color={BLUE} />
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
    autoCapitalize = 'sentences', icon, error, hint, required = false,
    autoFilled = false, editable = true, loading = false,
}) {
    const [focused, setFocused] = useState(false)

    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>
                {label}{required && <Text style={{ color: ERROR }}> *</Text>}
            </Text>
            <View style={[
                styles.inputWrap,
                focused && styles.inputWrapFocused,
                error && styles.inputWrapError,
                autoFilled && styles.inputWrapAutoFilled,
                !editable && styles.inputWrapDisabled,
            ]}>
                {icon ? (
                    <Icon
                        name={icon}
                        size={16}
                        color={autoFilled ? SUCCESS : (focused ? BLUE : TEXT_LIGHT)}
                        style={styles.inputIcon}
                    />
                ) : null}
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={TEXT_LIGHT}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    editable={editable}
                />
                {loading && <ActivityIndicator size="small" color={BLUE} style={{ marginLeft: 4 }} />}
                {autoFilled && !loading && (
                    <Icon name="auto-fix" size={16} color={SUCCESS} style={{ marginLeft: 4 }} />
                )}
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

function StatePicker({ value, onChange, autoFilled, error }) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredStates = INDIAN_STATES.filter(state =>
        state.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>State <Text style={{ color: ERROR }}>*</Text></Text>
            <TouchableOpacity
                style={[
                    styles.inputWrap,
                    styles.pickerBtn,
                    autoFilled && styles.inputWrapAutoFilled,
                    error && styles.inputWrapError,
                ]}
                onPress={() => setOpen(o => !o)}
                activeOpacity={0.8}
            >
                <Icon
                    name="map-outline"
                    size={16}
                    color={autoFilled ? SUCCESS : (value ? BLUE : TEXT_LIGHT)}
                    style={styles.inputIcon}
                />
                <Text style={[styles.input, !value && { color: TEXT_LIGHT }]}>
                    {value || 'Select state'}
                </Text>
                {autoFilled && <Icon name="auto-fix" size={16} color={SUCCESS} style={{ marginRight: 8 }} />}
                <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={TEXT_LIGHT} />
            </TouchableOpacity>

            {error && (
                <View style={styles.fieldError}>
                    <Icon name="alert-circle-outline" size={12} color={ERROR} />
                    <Text style={styles.fieldErrorText}>{error}</Text>
                </View>
            )}

            {open && (
                <View style={styles.statePickerDropdown}>
                    <View style={styles.searchInputWrap}>
                        <Icon name="magnify" size={16} color={TEXT_LIGHT} style={styles.inputIcon} />
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search state..."
                            placeholderTextColor={TEXT_LIGHT}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Icon name="close-circle" size={16} color={TEXT_LIGHT} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <FlatList
                        data={filteredStates}
                        keyExtractor={(item) => item}
                        style={styles.stateList}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.pickerOption, item === value && styles.pickerOptionActive]}
                                onPress={() => { onChange(item); setOpen(false); setSearchQuery('') }}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.pickerOptionText, item === value && styles.pickerOptionTextActive]}>
                                    {item}
                                </Text>
                                {item === value && <Icon name="check" size={16} color={BLUE} />}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Icon name="alert-circle-outline" size={32} color={TEXT_LIGHT} />
                                <Text style={styles.emptyStateText}>No states found</Text>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    )
}

function CityInput({ value, onChange, autoFilled, onCitySelect, cities = [], loading = false, error }) {
    const [focused, setFocused] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)

    const handleCityChange = (text) => {
        onChange(text)
        setShowSuggestions(text.length > 0 && cities.length > 0)
    }

    const selectCity = (cityData) => {
        onChange(cityData.city)
        if (onCitySelect) onCitySelect(cityData)
        setShowSuggestions(false)
    }

    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>City <Text style={{ color: ERROR }}>*</Text></Text>
            <View style={[
                styles.inputWrap,
                focused && styles.inputWrapFocused,
                autoFilled && styles.inputWrapAutoFilled,
                error && styles.inputWrapError,
            ]}>
                <Icon
                    name="city-variant-outline"
                    size={16}
                    color={autoFilled ? SUCCESS : (focused ? BLUE : TEXT_LIGHT)}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={handleCityChange}
                    placeholder="Enter city"
                    placeholderTextColor={TEXT_LIGHT}
                    autoCapitalize="words"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                />
                {loading && <ActivityIndicator size="small" color={BLUE} style={{ marginLeft: 4 }} />}
                {autoFilled && !loading && (
                    <Icon name="auto-fix" size={16} color={SUCCESS} style={{ marginLeft: 4 }} />
                )}
            </View>

            {error && (
                <View style={styles.fieldError}>
                    <Icon name="alert-circle-outline" size={12} color={ERROR} />
                    <Text style={styles.fieldErrorText}>{error}</Text>
                </View>
            )}

            {showSuggestions && cities.length > 0 && (
                <View style={styles.suggestionsDropdown}>
                    {cities.slice(0, 5).map((cityData, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.suggestionItem}
                            onPress={() => selectCity(cityData)}
                            activeOpacity={0.75}
                        >
                            <Icon name="map-marker" size={14} color={BLUE} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.suggestionCityText}>{cityData.city}</Text>
                                <Text style={styles.suggestionPinText}>PIN: {cityData.postalCode}</Text>
                            </View>
                            <Icon name="chevron-right" size={16} color={TEXT_LIGHT} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    )
}

function AddressLabelPicker({ value, onChange, error }) {
    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Address Type <Text style={{ color: ERROR }}>*</Text></Text>
            <View style={styles.addressLabelGrid}>
                {ADDRESS_LABELS.map(label => (
                    <TouchableOpacity
                        key={label.value}
                        style={[
                            styles.addressLabelCard,
                            value === label.value && styles.addressLabelCardActive,
                            error && !value && styles.inputWrapError,
                        ]}
                        onPress={() => onChange(label.value)}
                        activeOpacity={0.7}
                    >
                        <Icon
                            name={label.icon}
                            size={20}
                            color={value === label.value ? BLUE : TEXT_LIGHT}
                        />
                        <Text style={[
                            styles.addressLabelText,
                            value === label.value && styles.addressLabelTextActive
                        ]}>
                            {label.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {error && (
                <View style={styles.fieldError}>
                    <Icon name="alert-circle-outline" size={12} color={ERROR} />
                    <Text style={styles.fieldErrorText}>{error}</Text>
                </View>
            )}
        </View>
    )
}

function SavingOverlay({ visible }) {
    if (!visible) return null
    return (
        <View style={styles.overlay}>
            <View style={styles.overlayCard}>
                <ActivityIndicator size="large" color={BLUE} />
                <Text style={styles.overlayText}>Saving your profile…</Text>
            </View>
        </View>
    )
}

export default function ProfileInfoScreen({ setIsLoggedIn }) {
    const navigation = useNavigation()
    const businessId = 'ad1351af-4c82-4206-9dee-2db2545acd19'

    const lastFetchedGst = useRef(null)
    const postalCodeTimeout = useRef(null)
    const citySearchTimeout = useRef(null)

    const [identifier, setIdentifier] = useState('')
    const [identifierType, setIdentifierType] = useState('')

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        gstNumber: '',
        legalName: '',
        billingAddress: {
            label: 'billing',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
        },
        shippingAddress: {
            label: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
        }
    })

    const [hasGst, setHasGst] = useState(false)
    const [sameAsBilling, setSameAsBilling] = useState(true)
    const [gstStatus, setGstStatus] = useState('idle')
    const [saving, setSaving] = useState(false)
    const [gstAutoFilled, setGstAutoFilled] = useState(false)
    const [postalLoading, setPostalLoading] = useState(false)
    const [cityLoading, setCityLoading] = useState(false)
    const [citySuggestions, setCitySuggestions] = useState([])
    const [errors, setErrors] = useState({})

    const fadeAnim = useRef(new Animated.Value(0)).current
    const gstShake = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
        loadIdentifier()
    }, [])

    const loadIdentifier = async () => {
        try {
            const storedIdentifier = await AsyncStorage.getItem('Identifier')
            const cleaned = storedIdentifier?.replace(/"/g, '').trim()

            if (cleaned) {
                setIdentifier(cleaned)
                const isEmail = EMAIL_REGEX.test(cleaned)
                const isPhone = PHONE_REGEX.test(cleaned)

                if (isEmail) {
                    setIdentifierType('email')
                    setForm(prev => ({ ...prev, email: cleaned }))
                } else if (isPhone) {
                    setIdentifierType('phone')
                    setForm(prev => ({ ...prev, phone: cleaned }))
                }
            }
        } catch (err) {
            console.log('Error loading identifier:', err)
        }
    }

    const fetchLocationFromPostalCode = useCallback(async (pincode, addressType = 'billingAddress') => {
        if (pincode.length !== 6) return

        try {
            setPostalLoading(true)
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
            const data = await response.json()

            if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                const postOffice = data[0].PostOffice[0]

                setForm(prev => ({
                    ...prev,
                    [addressType]: {
                        ...prev[addressType],
                        city: postOffice.District || prev[addressType].city,
                        state: postOffice.State || prev[addressType].state,
                    }
                }))

                ToastAndroid.show('Location auto-filled ✓', ToastAndroid.SHORT)
            }
        } catch (err) {
            console.log('Postal code fetch error:', err)
        } finally {
            setPostalLoading(false)
        }
    }, [])

    const fetchPostalCodesForCity = useCallback(async (cityName) => {
        if (cityName.length < 3) {
            setCitySuggestions([])
            return
        }

        try {
            setCityLoading(true)
            const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`)
            const data = await response.json()

            if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                const uniqueCities = []
                const seen = new Set()

                data[0].PostOffice.forEach(po => {
                    const key = `${po.District}-${po.Pincode}`
                    if (!seen.has(key)) {
                        seen.add(key)
                        uniqueCities.push({
                            city: po.District,
                            postalCode: po.Pincode,
                            state: po.State,
                        })
                    }
                })

                setCitySuggestions(uniqueCities)
            } else {
                setCitySuggestions([])
            }
        } catch (err) {
            console.log('City search error:', err)
            setCitySuggestions([])
        } finally {
            setCityLoading(false)
        }
    }, [])

    const validateGst = (val) => {
        const upper = val.toUpperCase()

        if (!upper) { setGstStatus('idle'); return }
        if (upper.length < 15) { setGstStatus('idle'); return }

        if (GST_REGEX.test(upper)) {
            setGstStatus('valid')
            if (lastFetchedGst.current !== upper) {
                lastFetchedGst.current = upper
                fetchGstDetails(upper)
            }
        } else {
            setGstStatus('invalid')
            Animated.sequence([
                Animated.timing(gstShake, { toValue: 8, duration: 60, useNativeDriver: true }),
                Animated.timing(gstShake, { toValue: -8, duration: 60, useNativeDriver: true }),
                Animated.timing(gstShake, { toValue: 6, duration: 50, useNativeDriver: true }),
                Animated.timing(gstShake, { toValue: -6, duration: 50, useNativeDriver: true }),
                Animated.timing(gstShake, { toValue: 0, duration: 40, useNativeDriver: true }),
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

            const res = await fetch(
                `https://${RAPID_API_HOST}/v1/gstin/${gstValue}/details`,
                {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': RAPID_API_KEY,
                        'X-RapidAPI-Host': RAPID_API_HOST,
                    },
                }
            )

            const json = await res.json()
            const d = json.data
            const addr = d.place_of_business_principal?.address

            const addressParts = [
                addr?.door_num,
                addr?.floor_num,
                addr?.building_name,
                addr?.street,
                addr?.location
            ].filter(Boolean)

            const addressLine1 = addressParts[0] || ''
            const addressLine2 = addressParts.slice(1).join(', ') || ''

            const legalName = d.legal_name || ''
            const businessName = legalName
                .replace(/\s*(PRIVATE LIMITED|PVT LTD|PVT\. LTD\.|LIMITED|LTD|LLP|PARTNERSHIP)\s*$/i, '')
                .trim()

            setForm(prev => ({
                ...prev,
                name: prev.name || businessName,
                legalName: legalName,
                billingAddress: {
                    label: 'billing',
                    addressLine1: addressLine1,
                    addressLine2: addressLine2,
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
        setForm(prev => ({
            ...prev,
            [addressType]: {
                ...prev[addressType],
                [field]: value
            }
        }))
    }

    const handlePostalCodeChange = (val, addressType = 'billingAddress') => {
        const cleaned = val.replace(/[^0-9]/g, '').slice(0, 6)
        updateAddress(addressType, 'postalCode', cleaned)

        if (postalCodeTimeout.current) {
            clearTimeout(postalCodeTimeout.current)
        }

        if (cleaned.length === 6) {
            postalCodeTimeout.current = setTimeout(() => {
                fetchLocationFromPostalCode(cleaned, addressType)
            }, 500)
        }
    }

    const handleCityChange = (val, addressType = 'billingAddress') => {
        updateAddress(addressType, 'city', val)

        if (citySearchTimeout.current) {
            clearTimeout(citySearchTimeout.current)
        }

        if (val.length >= 3) {
            citySearchTimeout.current = setTimeout(() => {
                fetchPostalCodesForCity(val)
            }, 500)
        } else {
            setCitySuggestions([])
        }
    }

    const handleCitySelect = (cityData, addressType = 'billingAddress') => {
        setForm(prev => ({
            ...prev,
            [addressType]: {
                ...prev[addressType],
                city: cityData.city,
                postalCode: cityData.postalCode,
                state: cityData.state,
            }
        }))
        setCitySuggestions([])
        ToastAndroid.show('Location auto-filled ✓', ToastAndroid.SHORT)
    }

    const validate = () => {
        const newErrors = {}

        if (!form.name.trim() || form.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters'
        }

        if (identifierType === 'email') {
            if (!form.phone.trim() || !PHONE_REGEX.test(form.phone)) {
                newErrors.phone = 'Enter a valid 10-digit mobile number'
            }
        } else {
            if (!form.email.trim() || !EMAIL_REGEX.test(form.email)) {
                newErrors.email = 'Enter a valid email address'
            }
        }

        if (hasGst) {
            if (gstStatus !== 'verified') {
                newErrors.gst = 'Please enter and verify a valid GSTIN'
            }
            if (!form.legalName.trim()) {
                newErrors.legalName = 'Legal business name is required'
            }
        }

        const billing = form.billingAddress
        if (!billing.addressLine1.trim()) newErrors.billingAddressLine1 = 'Address is required'
        if (!billing.city.trim()) newErrors.billingCity = 'City is required'
        if (!billing.state.trim()) newErrors.billingState = 'State is required'
        if (!billing.postalCode.trim() || billing.postalCode.length !== 6) {
            newErrors.billingPostalCode = 'Enter valid 6-digit postal code'
        }

        if (!sameAsBilling) {
            const shipping = form.shippingAddress
            if (!shipping.label) newErrors.shippingLabel = 'Select address type'
            if (!shipping.addressLine1.trim()) newErrors.shippingAddressLine1 = 'Address is required'
            if (!shipping.city.trim()) newErrors.shippingCity = 'City is required'
            if (!shipping.state.trim()) newErrors.shippingState = 'State is required'
            if (!shipping.postalCode.trim() || shipping.postalCode.length !== 6) {
                newErrors.shippingPostalCode = 'Enter valid 6-digit postal code'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) {
            ToastAndroid.show('Please fix all errors', ToastAndroid.LONG)
            return
        }

        if (!businessId) {
            ToastAndroid.show('Business ID not found', ToastAndroid.SHORT)
            return
        }

        try {
            setSaving(true)
            const token = await AsyncStorage.getItem('userToken')

            const rawIdentifier = await AsyncStorage.getItem('Identifier')
            const storedIdentifier = rawIdentifier?.replace(/"/g, '').trim()

            const phoneFromStorage = PHONE_REGEX.test(storedIdentifier) ? storedIdentifier : ''
            const emailFromStorage = EMAIL_REGEX.test(storedIdentifier) ? storedIdentifier : ''

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

            if (hasGst && gstStatus === 'verified') {
                payload.gstNumber = form.gstNumber
                payload.legalName = form.legalName.trim()
            }

            if (sameAsBilling) {
                payload.shippingAddress = {
                    label: 'office',
                    address: {
                        addressLine1: form.billingAddress.addressLine1.trim(),
                        ...(form.billingAddress.addressLine2 && { addressLine2: form.billingAddress.addressLine2.trim() }),
                        city: form.billingAddress.city.trim(),
                        state: form.billingAddress.state.trim(),
                        postalCode: form.billingAddress.postalCode.trim(),
                        country: 'India',
                    }
                }
            } else {
                payload.shippingAddress = {
                    label: form.shippingAddress.label,
                    address: {
                        addressLine1: form.shippingAddress.addressLine1.trim(),
                        ...(form.shippingAddress.addressLine2 && { addressLine2: form.shippingAddress.addressLine2.trim() }),
                        city: form.shippingAddress.city.trim(),
                        state: form.shippingAddress.state.trim(),
                        postalCode: form.shippingAddress.postalCode.trim(),
                        country: 'India',
                    }
                }
            }

            console.log('B2B REGISTRATION PAYLOAD →', JSON.stringify(payload, null, 2))

            const res = await fetch(`${BASE_URL}/customer/business/${businessId}/b2b-register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            const json = await res.json()
            console.log('B2B registration response:', json)

            if (!res.ok || !json.success) throw json

            ToastAndroid.show('Profile saved successfully 🎉', ToastAndroid.SHORT)

            if (setIsLoggedIn) setIsLoggedIn(true)
            else navigation.goBack()

        } catch (err) {
            const msg = err?.error?.message || err?.message || 'Registration failed'
            ToastAndroid.show(msg, ToastAndroid.LONG)
            console.error('Registration error:', err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />
            <SavingOverlay visible={saving} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
                    <Icon name="arrow-left" size={22} color={WHITE} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerEyebrow}>B2B REGISTRATION</Text>
                    <Text style={styles.headerTitle}>Complete Your Profile</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <Animated.ScrollView
                    style={{ opacity: fadeAnim }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Basic Info */}
                    <View style={styles.section}>
                        <SectionHeader
                            icon="account-outline"
                            title="Basic Information"
                            subtitle="Your name and contact details"
                        />
                        
                        <FieldInput
                            label="Full Name"
                            value={form.name}
                            onChangeText={v => setForm(prev => ({ ...prev, name: v }))}
                            placeholder="Enter your full name"
                            icon="account-outline"
                            required={true}
                            error={errors.name}
                        />

                        {identifierType === 'email' ? (
                            <>
                                <FieldInput
                                    label="Email Address"
                                    value={form.email}
                                    onChangeText={() => { }}
                                    placeholder="Email"
                                    icon="email-outline"
                                    editable={false}
                                    autoFilled={true}
                                />
                                <FieldInput
                                    label="Phone Number"
                                    value={form.phone}
                                    onChangeText={v => setForm(prev => ({ ...prev, phone: v.replace(/[^0-9]/g, '').slice(0, 10) }))}
                                    placeholder="Enter 10-digit mobile number"
                                    icon="phone-outline"
                                    keyboardType="phone-pad"
                                    required={true}
                                    error={errors.phone}
                                />
                            </>
                        ) : (
                            <>
                                <FieldInput
                                    label="Phone Number"
                                    value={form.phone}
                                    onChangeText={() => { }}
                                    placeholder="Phone"
                                    icon="phone-outline"
                                    editable={false}
                                    autoFilled={true}
                                />
                                <FieldInput
                                    label="Email Address"
                                    value={form.email}
                                    onChangeText={v => setForm(prev => ({ ...prev, email: v.toLowerCase().trim() }))}
                                    placeholder="Enter your email"
                                    icon="email-outline"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    required={true}
                                    error={errors.email}
                                />
                            </>
                        )}
                    </View>

                    {/* GST Section */}
                    <View style={styles.section}>
                        <SectionHeader
                            icon="card-account-details-outline"
                            title="GST Details (Optional)"
                            subtitle="Add GST for business purchases"
                        />

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setHasGst(!hasGst)}
                            activeOpacity={0.7}
                        >
                            <Icon
                                name={hasGst ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                size={24}
                                color={hasGst ? BLUE : TEXT_LIGHT}
                            />
                            <Text style={styles.checkboxText}>
                                I have a GSTIN (GST Number)
                            </Text>
                        </TouchableOpacity>

                        {hasGst && (
                            <>
                                <Animated.View style={{ transform: [{ translateX: gstShake }] }}>
                                    <View style={styles.fieldWrap}>
                                        <Text style={styles.fieldLabel}>
                                            GSTIN <Text style={{ color: ERROR }}>*</Text>
                                        </Text>
                                        <View style={[
                                            styles.inputWrap,
                                            {
                                                borderColor: {
                                                    idle: BORDER,
                                                    valid: SUCCESS,
                                                    invalid: ERROR,
                                                    loading: BLUE,
                                                    verified: SUCCESS,
                                                }[gstStatus]
                                            },
                                            gstStatus === 'verified' && styles.inputWrapAutoFilled,
                                        ]}>
                                            <Icon
                                                name="card-account-details-outline"
                                                size={16}
                                                color={
                                                    gstStatus === 'verified' ? SUCCESS
                                                        : gstStatus === 'invalid' ? ERROR
                                                            : TEXT_LIGHT
                                                }
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                value={form.gstNumber}
                                                onChangeText={handleGstChange}
                                                placeholder="Enter 15-character GSTIN"
                                                placeholderTextColor={TEXT_LIGHT}
                                                autoCapitalize="characters"
                                                maxLength={15}
                                            />
                                            {gstStatus === 'loading' && <ActivityIndicator size="small" color={BLUE} />}
                                            {gstStatus === 'verified' && <Icon name="check-decagram" size={20} color={SUCCESS} />}
                                            {gstStatus === 'invalid' && <Icon name="alert-circle-outline" size={20} color={ERROR} />}
                                            {gstStatus === 'valid' && <ActivityIndicator size="small" color={BLUE} />}
                                        </View>
                                        <Text style={[styles.gstCharCount, { color: form.gstNumber.length === 15 ? BLUE : TEXT_LIGHT }]}>
                                            {form.gstNumber.length}/15
                                        </Text>
                                    </View>
                                </Animated.View>

                                {gstStatus === 'invalid' && (
                                    <View style={styles.statusRow}>
                                        <Icon name="alert-circle-outline" size={13} color={ERROR} />
                                        <Text style={[styles.statusText, { color: ERROR }]}>
                                            Invalid GSTIN format
                                        </Text>
                                    </View>
                                )}
                                {gstStatus === 'verified' && (
                                    <>
                                        <View style={[styles.statusRow, styles.verifiedBanner]}>
                                            <Icon name="check-decagram" size={14} color="#166534" />
                                            <Text style={[styles.statusText, { color: '#166534', fontFamily: FONTS.Bold }]}>
                                                GSTIN verified · Business details loaded
                                            </Text>
                                        </View>

                                        <FieldInput
                                            label="Legal Business Name"
                                            value={form.legalName}
                                            onChangeText={v => setForm(prev => ({ ...prev, legalName: v }))}
                                            placeholder="Enter legal business name"
                                            icon="briefcase-outline"
                                            required={true}
                                            autoFilled={gstAutoFilled}
                                            error={errors.legalName}
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </View>

                    {/* Billing Address */}
                    <View style={styles.section}>
                        <SectionHeader
                            icon="map-marker-outline"
                            title="Billing Address"
                            subtitle="Where should we send invoices?"
                        />

                        <FieldInput
                            label="Address Line 1"
                            value={form.billingAddress.addressLine1}
                            onChangeText={v => updateAddress('billingAddress', 'addressLine1', v)}
                            placeholder="Building, Street"
                            icon="home-outline"
                            required={true}
                            autoFilled={gstAutoFilled}
                            error={errors.billingAddressLine1}
                        />

                        <FieldInput
                            label="Address Line 2"
                            value={form.billingAddress.addressLine2}
                            onChangeText={v => updateAddress('billingAddress', 'addressLine2', v)}
                            placeholder="Landmark, Area (Optional)"
                            icon="map-marker-plus-outline"
                            autoFilled={gstAutoFilled}
                        />

                        <CityInput
                            value={form.billingAddress.city}
                            onChange={v => handleCityChange(v, 'billingAddress')}
                            autoFilled={gstAutoFilled}
                            onCitySelect={(data) => handleCitySelect(data, 'billingAddress')}
                            cities={citySuggestions}
                            loading={cityLoading}
                            error={errors.billingCity}
                        />

                        <StatePicker
                            value={form.billingAddress.state}
                            onChange={v => updateAddress('billingAddress', 'state', v)}
                            autoFilled={gstAutoFilled}
                            error={errors.billingState}
                        />

                        <FieldInput
                            label="Postal Code"
                            value={form.billingAddress.postalCode}
                            onChangeText={v => handlePostalCodeChange(v, 'billingAddress')}
                            placeholder="Enter 6-digit postal code"
                            icon="mailbox-outline"
                            keyboardType="number-pad"
                            required={true}
                            autoFilled={gstAutoFilled}
                            loading={postalLoading}
                            error={errors.billingPostalCode}
                        />
                    </View>

                    {/* Shipping Address */}
                    <View style={styles.section}>
                        <SectionHeader
                            icon="package-variant"
                            title="Shipping Address"
                            subtitle="Where should we deliver orders?"
                        />

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setSameAsBilling(!sameAsBilling)}
                            activeOpacity={0.7}
                        >
                            <Icon
                                name={sameAsBilling ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                size={24}
                                color={sameAsBilling ? BLUE : TEXT_LIGHT}
                            />
                            <Text style={styles.checkboxText}>
                                Same as billing address
                            </Text>
                        </TouchableOpacity>

                        {!sameAsBilling && (
                            <>
                                <AddressLabelPicker
                                    value={form.shippingAddress.label}
                                    onChange={v => updateAddress('shippingAddress', 'label', v)}
                                    error={errors.shippingLabel}
                                />

                                <FieldInput
                                    label="Address Line 1"
                                    value={form.shippingAddress.addressLine1}
                                    onChangeText={v => updateAddress('shippingAddress', 'addressLine1', v)}
                                    placeholder="Building, Street"
                                    icon="home-outline"
                                    required={true}
                                    error={errors.shippingAddressLine1}
                                />

                                <FieldInput
                                    label="Address Line 2"
                                    value={form.shippingAddress.addressLine2}
                                    onChangeText={v => updateAddress('shippingAddress', 'addressLine2', v)}
                                    placeholder="Landmark, Area (Optional)"
                                    icon="map-marker-plus-outline"
                                />

                                <CityInput
                                    value={form.shippingAddress.city}
                                    onChange={v => handleCityChange(v, 'shippingAddress')}
                                    onCitySelect={(data) => handleCitySelect(data, 'shippingAddress')}
                                    cities={citySuggestions}
                                    loading={cityLoading}
                                    error={errors.shippingCity}
                                />

                                <StatePicker
                                    value={form.shippingAddress.state}
                                    onChange={v => updateAddress('shippingAddress', 'state', v)}
                                    error={errors.shippingState}
                                />

                                <FieldInput
                                    label="Postal Code"
                                    value={form.shippingAddress.postalCode}
                                    onChangeText={v => handlePostalCodeChange(v, 'shippingAddress')}
                                    placeholder="Enter 6-digit postal code"
                                    icon="mailbox-outline"
                                    keyboardType="number-pad"
                                    required={true}
                                    loading={postalLoading}
                                    error={errors.shippingPostalCode}
                                />
                            </>
                        )}
                    </View>
                </Animated.ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={WHITE} />
                    ) : (
                        <>
                            <Text style={styles.nextBtnText}>Save Profile</Text>
                            <Icon name="check" size={20} color={WHITE} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

/* ─── styles ─── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    header: {
        backgroundColor: BLUE,
        paddingTop: Platform.OS === 'android' ? 14 : 52,
        paddingBottom: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: BLUE_DARK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerEyebrow: {
        fontSize: 10, color: 'rgba(255,255,255,0.65)',
        fontFamily: FONTS.Medium, letterSpacing: 1.2,
    },
    headerTitle: {
        fontSize: 18, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: -0.2,
    },

    section: {
        marginHorizontal: 16,
        marginTop: 16,
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
    sectionTitle: { fontSize: 15, fontFamily: FONTS.Bold, color: TEXT_DARK },
    sectionSubtitle: { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT, marginTop: 1 },

    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: BLUE_LIGHT,
        borderRadius: 10,
        marginBottom: 16,
    },
    checkboxText: {
        fontSize: 14,
        fontFamily: FONTS.Medium,
        color: TEXT_DARK,
        flex: 1,
    },

    addressLabelGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    addressLabelCard: {
        flex: 1,
        minWidth: '30%',
        padding: 12,
        borderWidth: 2,
        borderColor: BORDER,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: BG,
    },
    addressLabelCardActive: {
        borderColor: BLUE,
        backgroundColor: BLUE_LIGHT,
    },
    addressLabelText: {
        fontSize: 12,
        fontFamily: FONTS.Medium,
        color: TEXT_MID,
        marginTop: 4,
    },
    addressLabelTextActive: {
        color: BLUE,
    },

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
    inputWrapFocused: { borderColor: BLUE, backgroundColor: '#F0F8FC' },
    inputWrapError: { borderColor: ERROR, backgroundColor: ERROR_BG },
    inputWrapAutoFilled: { borderColor: SUCCESS, backgroundColor: SUCCESS_LIGHT },
    inputWrapDisabled: { opacity: 0.5 },
    inputIcon: { marginRight: 8 },
    input: {
        flex: 1, fontSize: 14, fontFamily: FONTS.Regular,
        color: TEXT_DARK, paddingVertical: 0,
    },
    fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    fieldErrorText: { fontSize: 11, color: ERROR, fontFamily: FONTS.Regular },
    fieldHint: { fontSize: 11, color: TEXT_LIGHT, fontFamily: FONTS.Regular, marginTop: 4 },

    gstCharCount: {
        fontSize: 11, fontFamily: FONTS.Regular,
        textAlign: 'right', marginTop: 4,
    },
    statusRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        gap: 5, marginTop: 2, marginBottom: 8,
    },
    statusText: {
        fontSize: 11, fontFamily: FONTS.Regular,
        flex: 1, lineHeight: 16,
    },
    verifiedBanner: {
        backgroundColor: SUCCESS_LIGHT,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: SUCCESS_BORDER,
        marginBottom: 10,
    },

    pickerBtn: { justifyContent: 'space-between' },
    statePickerDropdown: {
        marginTop: 4, borderWidth: 1, borderColor: BORDER,
        borderRadius: 10, backgroundColor: WHITE, overflow: 'hidden',
        maxHeight: 280,
    },
    searchInputWrap: {
        flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: BORDER,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: BG,
    },
    searchInput: {
        flex: 1, fontSize: 14, fontFamily: FONTS.Regular,
        color: TEXT_DARK, paddingVertical: 0,
    },
    stateList: {
        maxHeight: 230,
    },
    pickerOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    pickerOptionActive: { backgroundColor: BLUE_LIGHT },
    pickerOptionText: { fontSize: 14, fontFamily: FONTS.Regular, color: TEXT_DARK },
    pickerOptionTextActive: { color: BLUE, fontFamily: FONTS.Medium },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 13,
        fontFamily: FONTS.Regular,
        color: TEXT_LIGHT,
        marginTop: 8,
    },

    suggestionsDropdown: {
        marginTop: 4, borderWidth: 1, borderColor: BORDER,
        borderRadius: 10, backgroundColor: WHITE, overflow: 'hidden',
    },
    suggestionItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    suggestionCityText: {
        fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_DARK,
    },
    suggestionPinText: {
        fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT,
        marginTop: 2,
    },

    bottomNav: {
        padding: 16,
        backgroundColor: WHITE,
        borderTopWidth: 1,
        borderTopColor: BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 4,
    },
    nextBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8,
        backgroundColor: BLUE, paddingVertical: 15,
        borderRadius: 14,
        shadowColor: BLUE_DARK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    nextBtnDisabled: { opacity: 0.6 },
    nextBtnText: {
        fontSize: 16, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: 0.2,
    },

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