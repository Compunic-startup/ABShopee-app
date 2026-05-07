import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { TextInput } from 'react-native-paper'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { StyleSheet } from 'react-native'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import color from '../../../utils/color'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ─── Label icons ──────────────────────────────────────────────────────────────
const LABEL_ICONS = { 
  home: 'home-outline', 
  office: 'briefcase-outline', 
  work: 'briefcase-outline', 
  other: 'map-marker-outline' 
}
const getLabelIcon = label => LABEL_ICONS[label] ?? 'map-marker-outline'

// ─── Address Bottom Sheet ─────────────────────────────────────────────────────
function AddressBottomSheet({ visible, onClose, onSaved, editData }) {
  const slideAnim   = useRef(new Animated.Value(SCREEN_HEIGHT)).current
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
    isDefault: false 
  })

  // Populate form when editing
  useEffect(() => {
    console.log('AddressBottomSheet useEffect - editData:', editData)
    if (editData) {
      console.log('Populating form from editData.address:', editData.address)
      const newForm = {
        label: editData.label ?? '',
        name: editData.contactInfo?.name ?? '',
        phone: editData.contactInfo?.phone ?? '',
        line1: editData.address?.addressLine1 ?? '',
        city: editData.address?.city ?? '',
        state: editData.address?.state ?? '',
        postalCode: editData.address?.postalCode ?? '',
        country: editData.address?.country ?? 'India',
        isDefault: editData.isDefault ?? false
      }
      console.log('Setting form to:', newForm)
      setForm(newForm)
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
        isDefault: false
      })
    }
  }, [editData, visible])

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { 
          toValue: 0, 
          tension: 65, 
          friction: 11, 
          useNativeDriver: true 
        }),
        Animated.timing(backdropAnim, { 
          toValue: 1, 
          duration: 280, 
          useNativeDriver: true 
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { 
          toValue: SCREEN_HEIGHT, 
          duration: 240, 
          useNativeDriver: true 
        }),
        Animated.timing(backdropAnim, { 
          toValue: 0, 
          duration: 200, 
          useNativeDriver: true 
        }),
      ]).start()
    }
  }, [visible])

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const validate = () => {
    const { label, name, phone, line1, city, state, postalCode } = form
    if (!label.trim()) { 
      ToastAndroid.show('Label is required', ToastAndroid.SHORT)
      return false 
    }
    if (!name.trim()) { 
      ToastAndroid.show('Contact name is required', ToastAndroid.SHORT)
      return false 
    }
    if (!phone.trim() || phone.trim().length < 10) { 
      ToastAndroid.show('Enter a valid 10-digit phone number', ToastAndroid.SHORT)
      return false 
    }
    if (!line1.trim()) { 
      ToastAndroid.show('Address line 1 is required', ToastAndroid.SHORT)
      return false 
    }
    if (!city.trim()) { 
      ToastAndroid.show('City is required', ToastAndroid.SHORT)
      return false 
    }
    if (!state.trim()) { 
      ToastAndroid.show('State is required', ToastAndroid.SHORT)
      return false 
    }
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
          country: form.country.trim() || 'India' 
        },
        contactInfo: { 
          name: form.name.trim(), 
          phone: form.phone.trim() 
        },
        isDefault: form.isDefault,
      }
      const url = isEdit 
        ? `${BASE_URL}/user/profile/addresses/${editData.id}` 
        : `${BASE_URL}/user/profile/addresses`
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        }, 
        body: JSON.stringify(payload) 
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw json
      ToastAndroid.show(
        isEdit ? 'Address updated successfully!' : 'Address saved successfully!', 
        ToastAndroid.SHORT
      )
      onSaved(json.data)
      onClose()
    } catch (err) {
      ToastAndroid.show(
        err?.error?.message || err?.message || 'Failed to save address', 
        ToastAndroid.LONG
      )
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
        <Animated.View style={[sh.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={sh.kavWrap} 
        pointerEvents="box-none"
      >
        <Animated.View style={[sh.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={sh.handle} />

          {/* Sheet header */}
          <View style={sh.sheetHead}>
            <View style={sh.sheetHeadLeft}>
              <View style={sh.sheetIconWrap}>
                <Icon 
                  name={isEdit ? 'pencil-outline' : 'map-marker-plus-outline'} 
                  size={ms(18)} 
                  color={color.primary} 
                />
              </View>
              <View>
                <Text style={sh.sheetTitle}>
                  {isEdit ? 'Edit Address' : 'Add New Address'}
                </Text>
                <Text style={sh.sheetSub}>
                  {isEdit ? 'Update your saved address' : 'Fields marked * are required'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={sh.closeBtn} activeOpacity={0.7}>
              <Icon name="close" size={ms(20)} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={sh.formScroll} 
            keyboardShouldPersistTaps="handled"
          >
            {/* Label */}
            <Text style={sh.fieldLabel}>
              Label <Text style={sh.required}>*</Text>
            </Text>
            <View style={sh.labelRow}>
              {LABEL_OPTIONS.map(opt => (
                <TouchableOpacity 
                  key={opt} 
                  style={[sh.labelChip, form.label === opt && sh.labelChipActive]} 
                  onPress={() => setField('label', opt)} 
                  activeOpacity={0.7}
                >
                  <Icon 
                    name={getLabelIcon(opt)} 
                    size={ms(14)} 
                    color={form.label === opt ? '#fff' : '#555'} 
                  />
                  <Text style={[sh.labelChipText, form.label === opt && sh.labelChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              {!LABEL_OPTIONS.includes(form.label) && form.label !== '' && (
                <View style={[sh.labelChip, sh.labelChipActive]}>
                  <Icon name="map-marker-outline" size={ms(14)} color="#fff" />
                  <Text style={sh.labelChipTextActive}>{form.label}</Text>
                </View>
              )}
            </View>

            <Text style={sh.fieldLabel}>
              Contact Name <Text style={sh.required}>*</Text>
            </Text>
            <TextInput 
              mode="outlined" 
              label="Full Name *" 
              placeholder="John Doe" 
              placeholderTextColor="#bbb" 
              value={form.name} 
              onChangeText={v => setField('name', v)} 
              outlineColor="#E0E0E0" 
              activeOutlineColor={color.primary} 
              left={<TextInput.Icon icon="account-outline" color="#aaa" />} 
              style={sh.input} 
              dense 
            />

            <Text style={sh.fieldLabel}>
              Phone <Text style={sh.required}>*</Text>
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
              activeOutlineColor={color.primary} 
              left={<TextInput.Icon icon="phone-outline" color="#aaa" />} 
              style={sh.input} 
              dense 
            />

            <Text style={sh.fieldLabel}>
              Address <Text style={sh.required}>*</Text>
            </Text>
            <TextInput
              mode="outlined"
              label="Address Line 1 *"
              placeholder="House/Flat No., Street"
              placeholderTextColor="#bbb"
              value={form.line1}
              onChangeText={v => setField('line1', v)}
              outlineColor="#E0E0E0"
              activeOutlineColor={color.primary}
              left={<TextInput.Icon icon="home-outline" color="#aaa" />}
              style={sh.input}
              dense
            />
  
            <View style={sh.rowDouble}>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>
                  City <Text style={sh.required}>*</Text>
                </Text>
                <TextInput 
                  mode="outlined" 
                  label="City *" 
                  placeholder="Mumbai" 
                  placeholderTextColor="#bbb" 
                  value={form.city} 
                  onChangeText={v => setField('city', v)} 
                  outlineColor="#E0E0E0" 
                  activeOutlineColor={color.primary} 
                  style={sh.input} 
                  dense 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>
                  State <Text style={sh.required}>*</Text>
                </Text>
                <TextInput 
                  mode="outlined" 
                  label="State *" 
                  placeholder="Maharashtra" 
                  placeholderTextColor="#bbb" 
                  value={form.state} 
                  onChangeText={v => setField('state', v)} 
                  outlineColor="#E0E0E0" 
                  activeOutlineColor={color.primary} 
                  style={sh.input} 
                  dense 
                />
              </View>
            </View>

            <View style={sh.rowDouble}>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>
                  Postal Code <Text style={sh.required}>*</Text>
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
                  activeOutlineColor={color.primary} 
                  style={sh.input} 
                  dense 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Country</Text>
                <TextInput 
                  mode="outlined" 
                  label="Country" 
                  placeholder="India" 
                  placeholderTextColor="#bbb" 
                  value={form.country} 
                  onChangeText={v => setField('country', v)} 
                  outlineColor="#E0E0E0" 
                  activeOutlineColor={color.primary} 
                  style={sh.input} 
                  dense 
                />
              </View>
            </View>

            <TouchableOpacity 
              style={sh.defaultRow} 
              onPress={() => setField('isDefault', !form.isDefault)} 
              activeOpacity={0.7}
            >
              <View style={[sh.checkbox, form.isDefault && sh.checkboxActive]}>
                {form.isDefault && <Icon name="check" size={ms(13)} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.defaultLabel}>Set as default address</Text>
                <Text style={sh.defaultSub}>
                  This address will be pre-selected at checkout
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[sh.saveBtn, saving && sh.saveBtnDisabled]} 
              onPress={handleSave} 
              disabled={saving} 
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon 
                    name={isEdit ? 'content-save-outline' : 'map-marker-plus-outline'} 
                    size={ms(18)} 
                    color="#fff" 
                  />
                  <Text style={sh.saveBtnText}>
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

// ─── Main Addresses Screen ────────────────────────────────────────────────────
export default function AddressesScreen() {
  const navigation = useNavigation()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const fadeAnim = useRef(new Animated.Value(0)).current

  const isProfileEmpty = profile => {
    if (!profile) return true
    const addrEmpty = !profile.address || !profile.address.addressLine1 || !profile.address.city || !profile.address.state || !profile.address.postalCode
    const upEmpty = !profile.userProfile || !profile.userProfile.firstName || !profile.userProfile.phone
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
            Authorization: `Bearer ${token}` 
          } 
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

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const res = await fetch(`${BASE_URL}/user/profile/addresses`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const json = await res.json()
      console.log(json);
      if (json.success) {
        setAddresses(json.data ?? [])
      }
    } catch (err) {
      console.log('Fetch addresses error', err)
      ToastAndroid.show('Failed to load addresses', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserProfile()
    fetchAddresses()
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: 400, 
      useNativeDriver: true 
    }).start()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile()
      fetchAddresses()
    }, [])
  )

  const handleSaved = useCallback(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const openEdit = addr => {
    setEditTarget(addr)
    setSheetVisible(true)
  }

  const openAdd = () => {
    setEditTarget(null)
    setSheetVisible(true)
  }

  const handleDelete = async (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(addressId)
              const token = await AsyncStorage.getItem('userToken')
              const res = await fetch(
                `${BASE_URL}/user/profile/addresses/${addressId}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                }
              )
              const json = await res.json()
              if (!res.ok || !json.success) throw json
              ToastAndroid.show('Address deleted successfully', ToastAndroid.SHORT)
              fetchAddresses()
            } catch (err) {
              ToastAndroid.show(
                err?.message || 'Failed to delete address',
                ToastAndroid.SHORT
              )
            } finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

  const handleSetDefault = async (addressId) => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const res = await fetch(
        `${BASE_URL}/user/profile/addresses/${addressId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isDefault: true }),
        }
      )
      const json = await res.json()
      if (!res.ok || !json.success) throw json
      ToastAndroid.show('Default address updated', ToastAndroid.SHORT)
      fetchAddresses()
    } catch (err) {
      ToastAndroid.show(
        err?.message || 'Failed to update default address',
        ToastAndroid.SHORT
      )
    }
  }

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={S.headerBtn}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>My Addresses</Text>
        <TouchableOpacity 
          onPress={openAdd} 
          style={S.headerBtn}
          activeOpacity={0.7}
        >
        </TouchableOpacity>
      </View>

      {profileLoading || loading ? (
        <View style={S.loadingContainer}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={S.loadingText}>
            {profileLoading ? 'Checking profile...' : 'Loading addresses...'}
          </Text>
        </View>
      ) : isProfileEmpty(userProfile) ? (
        <View style={S.incompleteContainer}>
          <View style={S.incompleteIconWrap}>
            <Icon name="account-alert-outline" size={ms(64)} color={color.primary} />
          </View>
          <Text style={S.incompleteTitle}>Profile Incomplete</Text>
          <Text style={S.incompleteText}>
            To manage delivery addresses, you need to complete your profile first. 
            Please add your basic information and business details.
          </Text>
          <TouchableOpacity 
            style={S.completeProfileBtn} 
            onPress={() => navigation.navigate('ProfileInfoScreen')}
            activeOpacity={0.8}
          >
            <Icon name="account-edit-outline" size={ms(20)} color="#fff" />
            <Text style={S.completeProfileText}>Complete Profile</Text>
            <Icon name="arrow-right" size={ms(20)} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {addresses.length === 0 ? (
            <View style={S.emptyContainer}>
              <View style={S.emptyIconWrap}>
                <Icon name="map-marker-off-outline" size={ms(64)} color={color.primary} />
              </View>
              <Text style={S.emptyTitle}>No Addresses Yet</Text>
              <Text style={S.emptyText}>
                Add your first delivery address to make checkout faster
              </Text>
              <TouchableOpacity 
                style={S.emptyBtn} 
                onPress={openAdd}
                activeOpacity={0.8}
              >
                <Icon name="plus-circle" size={ms(20)} color="#fff" />
                <Text style={S.emptyBtnText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.scrollContent}
            >
              {addresses.map(addr => (
                <View key={addr.id} style={S.addressCard}>
                  {/* Header row */}
                  <View style={S.cardTopRow}>
                    <View style={S.labelBadge}>
                      <Icon 
                        name={getLabelIcon(addr.label)} 
                        size={ms(12)} 
                        color={color.primary} 
                      />
                      <Text style={S.labelText}>{addr.label}</Text>
                    </View>
                    {addr.isDefault && (
                      <View style={S.defaultBadge}>
                        <Icon name="star" size={ms(10)} color="#F59E0B" />
                        <Text style={S.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>

                  {/* Address details */}
                  <Text style={S.addressLine1} numberOfLines={2}>
                    {addr.address?.addressLine1}
                  </Text>
                  <Text style={S.addressLine2}>
                    {[
                      addr.address?.city, 
                      addr.address?.state, 
                      addr.address?.postalCode
                    ].filter(Boolean).join(', ')}
                  </Text>

                  {/* Contact info */}
                  <View style={S.contactRow}>
                    <Icon name="account-outline" size={ms(13)} color="#888" />
                    <Text style={S.contactText}>{addr.contactInfo?.name}</Text>
                    <View style={S.dotSep} />
                    <Icon name="phone-outline" size={ms(13)} color="#888" />
                    <Text style={S.contactText}>{addr.contactInfo?.phone}</Text>
                  </View>

                  {/* Action buttons */}
                  <View style={S.actionRow}>
                    {!addr.isDefault && (
                      <TouchableOpacity 
                        style={S.actionBtn}
                        onPress={() => handleSetDefault(addr.id)}
                        activeOpacity={0.7}
                      >
                        <Icon name="star-outline" size={ms(16)} color="#F59E0B" />
                        <Text style={[S.actionText, { color: '#F59E0B' }]}>
                          Set Default
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={S.actionBtn}
                      onPress={() => openEdit(addr)}
                      activeOpacity={0.7}
                    >
                      <Icon name="pencil-outline" size={ms(16)} color={color.primary} />
                      <Text style={[S.actionText, { color: color.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity 
                      style={S.actionBtn}
                      onPress={() => handleDelete(addr.id)}
                      activeOpacity={0.7}
                      disabled={deletingId === addr.id}
                    >
                      {deletingId === addr.id ? (
                        <ActivityIndicator size="small" color="#C62828" />
                      ) : (
                        <>
                          <Icon name="delete-outline" size={ms(16)} color="#C62828" />
                          <Text style={[S.actionText, { color: '#C62828' }]}>
                            Delete
                          </Text>
                        </>
                      )}
                    </TouchableOpacity> */}
                  </View>
                </View>
              ))}

              {/* Add new address card */}
              <TouchableOpacity 
                style={S.addCard} 
                onPress={openAdd}
                activeOpacity={0.8}
              >
                <View style={S.addIconWrap}>
                  <Icon name="plus" size={ms(24)} color={color.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.addTitle}>Add New Address</Text>
                  <Text style={S.addSubtitle}>
                    Save a new delivery location
                  </Text>
                </View>
                <Icon name="chevron-right" size={ms(20)} color={color.primary} />
              </TouchableOpacity>

              <View style={{ height: vs(20) }} />
            </ScrollView>
          )}
        </Animated.View>
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

// ─── Bottom Sheet Styles ──────────────────────────────────────────────────────
const sh = ScaledSheet.create({
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.45)' 
  },
  kavWrap: { 
    flex: 1, 
    justifyContent: 'flex-end' 
  },
  sheet: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: '20@ms', 
    borderTopRightRadius: '20@ms', 
    maxHeight: SCREEN_HEIGHT * 0.9, 
    elevation: 20 
  },
  handle: { 
    width: '40@s', 
    height: '4@vs', 
    borderRadius: '2@ms', 
    backgroundColor: '#E0E0E0', 
    alignSelf: 'center', 
    marginTop: '10@vs', 
    marginBottom: '4@vs' 
  },
  sheetHead: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: '20@s', 
    paddingVertical: '14@vs', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F5F5F5' 
  },
  sheetHeadLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '12@s' 
  },
  sheetIconWrap: { 
    width: '38@s', 
    height: '38@s', 
    borderRadius: '10@ms', 
    backgroundColor: color.primary + '20', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sheetTitle: { 
    fontSize: '16@ms', 
    fontFamily: FONTS.Bold, 
    color: color.text 
  },
  sheetSub: { 
    fontSize: '11@ms', 
    color: '#888', 
    fontFamily: FONTS.Medium, 
    marginTop: '1@vs' 
  },
  closeBtn: { 
    width: '34@s', 
    height: '34@s', 
    borderRadius: '17@ms', 
    backgroundColor: color.background, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E0E0E0' 
  },
  formScroll: { 
    paddingHorizontal: '20@s', 
    paddingTop: '14@vs' 
  },
  fieldLabel: { 
    fontSize: '12@ms', 
    fontFamily: FONTS.Bold, 
    color: color.text, 
    marginBottom: '4@vs', 
    marginTop: '6@vs' 
  },
  required: { 
    color: '#C62828', 
    fontSize: '13@ms' 
  },
  labelRow: { 
    flexDirection: 'row', 
    gap: '8@s', 
    flexWrap: 'wrap', 
    marginBottom: '8@vs' 
  },
  labelChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '5@s', 
    borderWidth: 1.5, 
    borderColor: '#E0E0E0', 
    borderRadius: '8@ms', 
    paddingHorizontal: '12@s', 
    paddingVertical: '6@vs', 
    backgroundColor: color.background 
  },
  labelChipActive: { 
    borderColor: color.primary, 
    backgroundColor: color.primary 
  },
  labelChipText: { 
    fontSize: '12@ms', 
    fontFamily: FONTS.Bold, 
    color: '#555' 
  },
  labelChipTextActive: { 
    color: '#fff', 
    fontSize: '12@ms', 
    fontFamily: FONTS.Bold 
  },
  input: { 
    backgroundColor: '#fff', 
    marginBottom: '6@vs' 
  },
  rowDouble: { 
    flexDirection: 'row', 
    gap: '10@s' 
  },
  defaultRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: '12@s', 
    backgroundColor: color.background, 
    borderRadius: '10@ms', 
    padding: '14@s', 
    marginTop: '8@vs', 
    marginBottom: '14@vs', 
    borderWidth: 1, 
    borderColor: '#E0E0E0' 
  },
  checkbox: { 
    width: '22@s', 
    height: '22@s', 
    borderRadius: '6@ms', 
    borderWidth: 2, 
    borderColor: '#BDBDBD', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: '1@vs' 
  },
  checkboxActive: { 
    backgroundColor: color.primary, 
    borderColor: color.primary 
  },
  defaultLabel: { 
    fontSize: '13@ms', 
    fontFamily: FONTS.Bold, 
    color: color.text 
  },
  defaultSub: { 
    fontSize: '11@ms', 
    color: '#888', 
    marginTop: '2@vs', 
    fontFamily: FONTS.Medium 
  },
  saveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '10@s', 
    backgroundColor: color.primary, 
    borderRadius: '10@ms', 
    paddingVertical: '14@vs', 
    elevation: 3 
  },
  saveBtnDisabled: { 
    opacity: 0.7 
  },
  saveBtnText: { 
    fontSize: '15@ms', 
    fontFamily: FONTS.Bold, 
    color: '#fff' 
  },
})

// ─── Main Screen Styles ───────────────────────────────────────────────────────
const S = ScaledSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: color.background 
  },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: '14@s', 
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs', 
    paddingBottom: '13@vs', 
    backgroundColor: color.primary, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 4 
  },
  headerBtn: { 
    width: '36@s', 
    height: '36@s', 
    borderRadius: '18@ms', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: '18@ms', 
    fontFamily: FONTS.Bold, 
    color: '#fff', 
    flex: 1, 
    textAlign: 'center' 
  },

  // Loading
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: '12@vs' 
  },
  loadingText: { 
    fontSize: '14@ms', 
    color: '#888', 
    fontFamily: FONTS.Medium 
  },

  // Incomplete profile state
  incompleteContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: '30@s' 
  },
  incompleteIconWrap: { 
    width: '120@s', 
    height: '120@s', 
    borderRadius: '60@ms', 
    backgroundColor: color.primary + '20', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: '20@vs',
    borderWidth: 2,
    borderColor: color.primary + '40',
  },
  incompleteTitle: { 
    fontSize: '20@ms', 
    fontFamily: FONTS.Bold, 
    color: color.text, 
    marginBottom: '8@vs' 
  },
  incompleteText: { 
    fontSize: '14@ms', 
    color: '#888', 
    textAlign: 'center', 
    lineHeight: '20@ms', 
    fontFamily: FONTS.Medium, 
    marginBottom: '24@vs' 
  },
  completeProfileBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '8@s', 
    backgroundColor: color.primary, 
    paddingHorizontal: '24@s', 
    paddingVertical: '14@vs', 
    borderRadius: '10@ms', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  completeProfileText: { 
    fontSize: '15@ms', 
    fontFamily: FONTS.Bold, 
    color: '#fff' 
  },

  // Empty state
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: '30@s' 
  },
  emptyIconWrap: { 
    width: '120@s', 
    height: '120@s', 
    borderRadius: '60@ms', 
    backgroundColor: color.primary + '20', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: '20@vs' 
  },
  emptyTitle: { 
    fontSize: '20@ms', 
    fontFamily: FONTS.Bold, 
    color: color.text, 
    marginBottom: '8@vs' 
  },
  emptyText: { 
    fontSize: '14@ms', 
    color: '#888', 
    textAlign: 'center', 
    lineHeight: '20@ms', 
    fontFamily: FONTS.Medium, 
    marginBottom: '24@vs' 
  },
  emptyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '8@s', 
    backgroundColor: color.primary, 
    paddingHorizontal: '24@s', 
    paddingVertical: '12@vs', 
    borderRadius: '10@ms', 
    elevation: 2 
  },
  emptyBtnText: { 
    fontSize: '15@ms', 
    fontFamily: FONTS.Bold, 
    color: '#fff' 
  },

  // Scroll content
  scrollContent: { 
    paddingHorizontal: '14@s', 
    paddingTop: '14@vs' 
  },

  // Address card
  addressCard: { 
    backgroundColor: '#fff', 
    borderRadius: '12@ms', 
    padding: '16@s', 
    marginBottom: '12@vs', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    borderWidth: 1, 
    borderColor: '#EBEBEB' 
  },
  cardTopRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '8@s', 
    marginBottom: '12@vs', 
    flexWrap: 'wrap' 
  },
  labelBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '5@s', 
    backgroundColor: color.primary + '20', 
    borderRadius: '8@ms', 
    paddingHorizontal: '10@s', 
    paddingVertical: '4@vs', 
    borderWidth: 1, 
    borderColor: color.primary + '40' 
  },
  labelText: { 
    fontSize: '12@ms', 
    fontFamily: FONTS.Bold, 
    color: color.primary 
  },
  defaultBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '4@s', 
    backgroundColor: '#FFFBEB', 
    borderRadius: '8@ms', 
    paddingHorizontal: '8@s', 
    paddingVertical: '4@vs', 
    borderWidth: 1, 
    borderColor: '#FDE68A' 
  },
  defaultText: { 
    fontSize: '11@ms', 
    fontFamily: FONTS.Bold, 
    color: '#D97706' 
  },
  addressLine1: { 
    fontSize: '14@ms', 
    fontFamily: FONTS.Bold, 
    color: color.text, 
    lineHeight: '20@ms', 
    marginBottom: '4@vs' 
  },
  addressLine2: { 
    fontSize: '13@ms', 
    color: '#888', 
    fontFamily: FONTS.Medium, 
    marginBottom: '10@vs' 
  },
  contactRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '5@s', 
    flexWrap: 'wrap', 
    marginBottom: '12@vs' 
  },
  contactText: { 
    fontSize: '12@ms', 
    color: '#888', 
    fontFamily: FONTS.Medium 
  },
  dotSep: { 
    width: '3@s', 
    height: '3@s', 
    borderRadius: '2@ms', 
    backgroundColor: '#BDBDBD', 
    marginHorizontal: '2@s' 
  },
  actionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '8@s', 
    paddingTop: '10@vs', 
    borderTopWidth: 1, 
    borderTopColor: '#F5F5F5' 
  },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '5@s', 
    paddingVertical: '6@vs', 
    paddingHorizontal: '10@s', 
    borderRadius: '6@ms', 
    backgroundColor: color.background 
  },
  actionText: { 
    fontSize: '12@ms', 
    fontFamily: FONTS.Bold 
  },

  // Add new address card
  addCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: '12@s', 
    backgroundColor: '#fff', 
    borderRadius: '12@ms', 
    padding: '16@s', 
    marginBottom: '12@vs', 
    borderWidth: 1.5, 
    borderColor: color.primary, 
    borderStyle: 'dashed' 
  },
  addIconWrap: { 
    width: '48@s', 
    height: '48@s', 
    borderRadius: '24@ms', 
    backgroundColor: color.primary + '20', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  addTitle: { 
    fontSize: '14@ms', 
    fontFamily: FONTS.Bold, 
    color: color.primary, 
    marginBottom: '2@vs' 
  },
  addSubtitle: { 
    fontSize: '12@ms', 
    color: '#888', 
    fontFamily: FONTS.Medium 
  },
})