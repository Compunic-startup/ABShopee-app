import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../core/utils/fonts'
import color from '../../core/utils/color'
import BASE_URL from '../../core/services/api'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const FILTERS = [
  { key: 'all', label: 'All Orders', icon: 'format-list-bulleted' },
  { key: 'pending', label: 'Pending Approvals', icon: 'clock-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'truck-delivery' },
  { key: 'delivered', label: 'Delivered', icon: 'check-all' },
  { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
]

// ─── Order Card for Seller ─────────────────────────────────────────────────
function SellerOrderCard({ item, navigation, fadeAnim, onApprove, onReject }) {
  const statusConfig = {
    pending_approval: { color: color.secondary, bg: color.secondarylight, icon: 'clock-outline', label: 'Pending Approval' },
    created: { color: color.primary, bg: '#E8EDFF', icon: 'check-circle-outline', label: 'Created' },
    confirmed: { color: color.primary, bg: '#E8EDFF', icon: 'check-circle-outline', label: 'Confirmed' },
    processing: { color: color.primary, bg: '#E8EDFF', icon: 'package-variant', label: 'Processing' },
    shipped: { color: color.primary, bg: '#E8EDFF', icon: 'truck-delivery', label: 'Shipped' },
    delivered: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-all', label: 'Delivered' },
    cancelled: { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Cancelled' },
  }[item.status?.toLowerCase()] || {
    color: color.text, bg: color.background, icon: 'help-circle-outline', label: item.status,
  }

  const firstItem = item.items?.[0]
  const orderDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const isPendingApproval = item.status === 'pending_approval'
  const itemCount = item.items?.reduce((total, item) => total + (item.quantity || 1), 0) || 0

  return (
    <Animated.View style={[styles.card, {
      opacity: fadeAnim,
      transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.orderId?.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{orderDate}</Text>
          {itemCount > 0 && (
            <Text style={styles.itemCount}>{itemCount} items</Text>
          )}
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
          <Icon name={statusConfig.icon} size={ms(11)} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      {/* Item Preview */}
      <View style={styles.itemRow}>
        <View style={styles.itemThumb}>
          <Icon
            name={firstItem?.itemSnapshot?.itemType === 'digital' ? 'download-box' : 'cube-outline'}
            size={ms(26)}
            color={color.primary}
          />
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {firstItem?.itemSnapshot?.title || 'Product'}
          </Text>
          {itemCount > 1 && (
            <Text style={styles.moreItems}>+{itemCount - 1} more item{itemCount > 2 ? 's' : ''}</Text>
          )}
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>₹{item.pricing?.amount || item.totalAmount}</Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.customerRow}>
        <Icon name="account-outline" size={ms(14)} color="#888" />
        <Text style={styles.customerLabel}>Customer</Text>
        <Text style={styles.customerName}>
          {item.customerName || item.addresses?.[0]?.contactSnapshot?.name || 'Unknown'}
        </Text>
      </View>

      <View style={styles.separator} />

      {/* Action Buttons for Pending Approval */}
      {isPendingApproval && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => onApprove(item)}
            activeOpacity={0.8}
          >
            <Icon name="check-circle" size={ms(16)} color="#fff" />
            <Text style={styles.approveBtnText}>Approve Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onReject(item)}
            activeOpacity={0.8}
          >
            <Icon name="close-circle" size={ms(16)} color="#C62828" />
            <Text style={styles.rejectBtnText}>Reject Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SellerDashboardScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [fadeAnim] = useState(new Animated.Value(0))
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [processingAction, setProcessingAction] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    if (!loading && orders.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start()
    }
  }, [loading, orders])

  useFocusEffect(useCallback(() => { fetchOrders() }, []))

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      
      if (!token || !businessId) {
        Alert.alert('Error', 'Authentication required. Please login again.')
        return
      }
      
      // Add approvalStatus filter for pending orders
      const url = selectedFilter === 'pending' 
        ? `${BASE_URL}/seller/business/${businessId}/orders?approvalStatus=pending`
        : `${BASE_URL}/seller/business/${businessId}/orders`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        Alert.alert('Error', errorData?.message || 'Failed to fetch orders')
        return
      }
      
      const json = await res.json()
      setOrders(json?.data?.orders || [])
    } catch (e) {
      console.log('Seller orders fetch error', e)
      Alert.alert('Error', 'Failed to fetch orders. Please check your connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const approveOrder = async (order) => {
    try {
      setProcessingAction(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      
      const res = await fetch(
        `${BASE_URL}/seller/business/${businessId}/orders/${order.orderId}/approve`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          }
        }
      )
      
      if (res.ok) {
        Alert.alert('Success', 'Order approved successfully')
        fetchOrders() // Refresh the list
      } else {
        const error = await res.json()
        Alert.alert('Error', error?.message || 'Failed to approve order')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve order')
    } finally {
      setProcessingAction(false)
    }
  }

  const rejectOrder = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection')
      return
    }

    try {
      setProcessingAction(true)
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      
      const res = await fetch(
        `${BASE_URL}/seller/business/${businessId}/orders/${selectedOrder.orderId}/reject`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ reason: rejectReason.trim() })
        }
      )
      
      if (res.ok) {
        Alert.alert('Success', 'Order rejected successfully')
        setRejectModalVisible(false)
        setRejectReason('')
        setSelectedOrder(null)
        fetchOrders() // Refresh the list
      } else {
        const error = await res.json()
        Alert.alert('Error', error?.message || 'Failed to reject order')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reject order')
    } finally {
      setProcessingAction(false)
    }
  }

  const openRejectModal = (order) => {
    setSelectedOrder(order)
    setRejectModalVisible(true)
  }

  const closeRejectModal = () => {
    setRejectModalVisible(false)
    setRejectReason('')
    setSelectedOrder(null)
  }

  const filteredOrders = selectedFilter === 'all'
    ? orders
    : orders.filter(o => {
        if (selectedFilter === 'pending') return o.status === 'pending_approval'
        return o.status?.toLowerCase() === selectedFilter
      })

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={color.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => {
            const active = selectedFilter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f.key)}
                activeOpacity={0.7}
              >
                <Icon name={f.icon} size={ms(13)} color={active ? color.primary : '#888'} />
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Order Count */}
      {!loading && orders.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
          </Text>
        </View>
      )}

      {/* Orders List */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Fetching orders…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.orderId}
          renderItem={({ item }) => (
            <SellerOrderCard 
              item={item} 
              navigation={navigation} 
              fadeAnim={fadeAnim}
              onApprove={approveOrder}
              onReject={openRejectModal}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconBg}>
                <Icon name="package-variant" size={ms(48)} color={color.primary} />
              </View>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptyHint}>
                {selectedFilter === 'pending' 
                  ? 'No orders pending approval' 
                  : `No ${selectedFilter} orders found.`}
              </Text>
              {selectedFilter !== 'all' && (
                <TouchableOpacity onPress={() => setSelectedFilter('all')} style={styles.clearFilter}>
                  <Text style={styles.clearFilterText}>View all orders</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders() }}
              colors={[color.primary]}
              tintColor={color.primary}
            />
          }
        />
      )}

      {/* Reject Order Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeRejectModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Order</Text>
              <TouchableOpacity onPress={closeRejectModal} style={styles.modalClose}>
                <Icon name="close" size={ms(20)} color="#888" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Order #{selectedOrder?.orderId?.slice(-8).toUpperCase()}
            </Text>
            
            <Text style={styles.modalLabel}>Reason for rejection:</Text>
            <TextInput
              style={styles.reasonInput}
              multiline
              numberOfLines={4}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Please provide a reason for rejecting this order..."
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={closeRejectModal}
                disabled={processingAction}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.rejectModalBtn]}
                onPress={rejectOrder}
                disabled={processingAction || !rejectReason.trim()}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.rejectModalBtnText}>Reject Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // Header
  header: {
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '14@vs',
    paddingHorizontal: '16@s',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Filter bar
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  filterScroll: { paddingHorizontal: '12@s', paddingVertical: '10@vs', gap: '8@s' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: '5@s',
    paddingHorizontal: '14@s', paddingVertical: '6@vs',
    borderRadius: '20@ms',
    backgroundColor: color.background,
    borderWidth: 1, borderColor: '#DEDEDE',
  },
  filterChipActive: {
    backgroundColor: color.primary + '20',
    borderColor: color.primary,
  },
  filterLabel: { fontSize: '12@ms', fontFamily: FONTS.Medium, color: '#888' },
  filterLabelActive: { color: color.primary, fontFamily: FONTS.Bold },

  // Summary
  summaryBar: {
    paddingHorizontal: '16@s',
    paddingVertical: '8@vs',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  summaryText: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },

  // List
  list: { paddingHorizontal: '12@s', paddingTop: '12@vs', paddingBottom: '32@vs', gap: '10@vs' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: '8@ms',
    paddingHorizontal: '14@s',
    paddingVertical: '12@vs',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    marginBottom: '10@vs',
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10@vs',
  },
  orderId: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text },
  orderDate: { fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  itemCount: { fontSize: '10@ms', color: '#666', fontFamily: FONTS.Medium, marginTop: '2@vs' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    paddingHorizontal: '10@s', paddingVertical: '4@vs',
    borderRadius: '20@ms',
  },
  statusText: { fontSize: '11@ms', fontFamily: FONTS.Bold },

  separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: '10@vs' },

  // Item row
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', marginBottom: '10@vs' },
  itemThumb: {
    width: '56@s', height: '56@s', borderRadius: '6@ms',
    backgroundColor: color.primary + '20',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EEE',
  },
  itemMeta: { flex: 1 },
  itemTitle: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, lineHeight: '18@ms' },
  moreItems: { fontSize: '11@ms', color: color.primary, fontFamily: FONTS.Bold, marginTop: '6@vs' },

  amountCol: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  amountLabel: { fontSize: '10@ms', color: '#999', fontFamily: FONTS.Medium },
  amountValue: { fontSize: '16@ms', fontFamily: FONTS.Bold, color: color.text, marginTop: '2@vs' },

  // Customer row
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginBottom: '8@vs' },
  customerLabel: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },
  customerName: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.text, flex: 1 },

  // Actions
  actionRow: { flexDirection: 'row', gap: '10@s', marginTop: '4@vs' },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '6@s', paddingVertical: '10@vs', borderRadius: '6@ms',
    backgroundColor: '#4CAF50',
  },
  approveBtnText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#fff' },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '6@s', paddingVertical: '10@vs', borderRadius: '6@ms',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#C62828',
  },
  rejectBtnText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#C62828' },

  // Loading
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '60@vs' },
  loadingText: { marginTop: '14@vs', fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: '60@vs', paddingHorizontal: '32@s' },
  emptyIconBg: {
    width: '96@s', height: '96@s', borderRadius: '48@ms',
    backgroundColor: color.primary + '20',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: '20@vs',
  },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs' },
  emptyHint: { fontSize: '13@ms', color: '#999', fontFamily: FONTS.Medium, textAlign: 'center' },
  clearFilter: {
    marginTop: '20@vs', paddingHorizontal: '24@s', paddingVertical: '10@vs',
    borderRadius: '6@ms', borderWidth: 1.5, borderColor: color.primary,
  },
  clearFilterText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@s',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    width: '100%',
    maxWidth: '400@s',
    padding: '20@s',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  modalTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text },
  modalClose: { padding: '5@s' },
  modalSubtitle: {
    fontSize: '14@ms',
    color: '#666',
    marginBottom: '16@vs',
    fontFamily: FONTS.Medium,
  },
  modalLabel: {
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    color: color.text,
    marginBottom: '8@vs',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: '8@ms',
    padding: '12@s',
    fontSize: '14@ms',
    fontFamily: FONTS.Regular,
    color: color.text,
    minHeight: '100@vs',
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: '12@s',
    marginTop: '20@vs',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: '12@vs',
    borderRadius: '8@ms',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelModalBtnText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#666',
  },
  rejectModalBtn: {
    backgroundColor: '#C62828',
  },
  rejectModalBtnText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
})
