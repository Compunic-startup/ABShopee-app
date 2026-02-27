import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Image,
  ToastAndroid,
  Platform,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import noimage from '../../../assets/images/Categories/noimage.png'
import RNFS from 'react-native-fs'
import FileViewer from 'react-native-file-viewer'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function OrderDetailsScreen() {
  const navigation = useNavigation()
  const { orderId } = useRoute().params

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [])

  useEffect(() => {
    if (!loading && order) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }
  }, [loading, order])

  const fetchOrder = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      console.log('Order details response', json)
      setOrder(json?.data)
    } catch (e) {
      console.log('Order details error', e)
      ToastAndroid.show('Failed to load order details', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = async () => {
    try {
      setDownloading(true)
      const token = await AsyncStorage.getItem('userToken')
      const url = `${BASE_URL}/customer/business/da81a423-2230-4586-b47b-07268479cb24/orders/${orderId}/invoice`
      const filePath = `${RNFS.DownloadDirectoryPath}/Invoice-${orderId}.pdf`

      const options = {
        fromUrl: url,
        toFile: filePath,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      const result = await RNFS.downloadFile(options).promise
      console.log(result)

      if (result.statusCode === 200) {
        ToastAndroid.show('Invoice downloaded successfully', ToastAndroid.SHORT)
        await FileViewer.open(filePath)
      } else {
        ToastAndroid.show('Download failed', ToastAndroid.SHORT)
      }
    } catch (err) {
      console.log('Invoice download error', err)
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT)
    } finally {
      setDownloading(false)
    }
  }

  const getStatusConfig = status => {
    const configs = {
      created: {
        color: '#FF9800',
        bgColor: '#FFF3E0',
        icon: 'clock-outline',
        label: 'Order Placed',
      },
      confirmed: {
        color: '#2196F3',
        bgColor: '#E3F2FD',
        icon: 'check-circle-outline',
        label: 'Confirmed',
      },
      fulfilled: {
        color: '#9C27B0',
        bgColor: '#F3E5F5',
        icon: 'package-variant',
        label: 'Processing',
      },
      completed: {
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        icon: 'check-all',
        label: 'Completed',
      },
      cancelled: {
        color: '#F44336',
        bgColor: '#FFEBEE',
        icon: 'close-circle-outline',
        label: 'Cancelled',
      },
    }

    return (
      configs[status?.toLowerCase()] || {
        color: '#757575',
        bgColor: '#F5F5F5',
        icon: 'help-circle-outline',
        label: status,
      }
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0B77A7" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    )
  }

  if (!order) return null

  const address = order.addresses?.[0]
  const latestEvent = order.events?.[order.events.length - 1]
  const currentStatus = latestEvent?.toStatus || order.status
  const statusConfig = getStatusConfig(currentStatus)

  const isDigital = order.items?.every(
    i => i.itemSnapshot?.itemType === 'digital'
  )

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const paymentInfo = order.payment?.[0]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="share-variant" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusIconContainer,
                  { backgroundColor: statusConfig.bgColor },
                ]}
              >
                <Icon
                  name={statusConfig.icon}
                  size={32}
                  color={statusConfig.color}
                />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>Order Status</Text>
                <Text
                  style={[styles.statusValue, { color: statusConfig.color }]}
                >
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.orderIdContainer}>
              <Icon name="receipt" size={18} color="#666" />
              <Text style={styles.orderId}>Order ID: #{orderId.slice(0, 12)}</Text>
            </View>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Icon name="calendar-outline" size={16} color="#666" />
                <Text style={styles.dateTimeText}>{orderDate}</Text>
              </View>
              <View style={styles.dateTimeDivider} />
              <View style={styles.dateTimeItem}>
                <Icon name="clock-outline" size={16} color="#666" />
                <Text style={styles.dateTimeText}>{orderTime}</Text>
              </View>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="package-variant" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>
                Items ({order.items?.length || 0})
              </Text>
            </View>

            {order.pricing?.pricingSnapshot?.items?.map((item, index) => (
              <View key={item.itemId || index} style={styles.itemCard}>
                <Image
                  source={item.image ? { uri: item.image } : noimage}
                  style={styles.itemImage}
                />

                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.itemMetaRow}>
                    <View style={styles.qtyBadge}>
                      <Icon name="numeric" size={12} color="#666" />
                      <Text style={styles.qtyText}>Qty: {item.quantity}</Text>
                    </View>

                    {item.itemType === 'digital' && (
                      <View style={styles.digitalBadge}>
                        <Icon name="download" size={10} color="#1976D2" />
                        <Text style={styles.digitalText}>Digital</Text>
                      </View>
                    )}
                  </View>

                  {item.promotionDiscountTotal > 0 && (
                    <View style={styles.savingsRow}>
                      <Icon name="tag" size={12} color="#4CAF50" />
                      <Text style={styles.savingsText}>
                        Saved ₹{item.promotionDiscountTotal}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.itemPrice}>
                    ₹{item.finalLineTotal?.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Price Summary */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="calculator" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Price Summary</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>
                ₹{order.pricing?.pricingSnapshot?.subtotal}
              </Text>
            </View>

            {order.pricing?.pricingSnapshot?.discountTotal > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={[styles.priceValue, { color: '#4CAF50' }]}>
                  - ₹{order.pricing.pricingSnapshot.discountTotal}
                </Text>
              </View>
            )}

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charges</Text>
              <Text style={[styles.priceValue, { color: '#4CAF50' }]}>
                FREE
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₹{order.pricing?.pricingSnapshot?.total}
              </Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="credit-card-outline" size={22} color="#0B77A7" />
              <Text style={styles.sectionTitle}>Payment Information</Text>
            </View>

            <View style={styles.paymentInfoCard}>
              <View style={styles.paymentRow}>
                <Icon
                  name={
                    paymentInfo?.provider === 'razorpay'
                      ? 'cellphone'
                      : 'cash'
                  }
                  size={20}
                  color="#0B77A7"
                />
                <View style={styles.paymentTextContainer}>
                  <Text style={styles.paymentMethod}>
                    {paymentInfo?.method || 'N/A'}
                  </Text>
                  <Text
                    style={[
                      styles.paymentStatus,
                      {
                        color:
                          paymentInfo?.status === 'success'
                            ? '#4CAF50'
                            : '#FF9800',
                      },
                    ]}
                  >
                    {paymentInfo?.status || 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Delivery Address */}
          {!isDigital && address && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="map-marker" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>

              <View style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <Icon name="home" size={20} color="#4CAF50" />
                  <Text style={styles.addressType}>Home</Text>
                </View>

                <Text style={styles.addressName}>{address.fullName}</Text>
                <Text style={styles.addressPhone}>{address.phone}</Text>
                <Text style={styles.addressText}>
                  {address.addressLine1}
                </Text>
                <Text style={styles.addressText}>
                  {address.city}, {address.state} - {address.postalCode}
                </Text>
              </View>

              <View style={styles.deliveryInfoBox}>
                <Icon name="truck-fast" size={20} color="#4CAF50" />
                <Text style={styles.deliveryInfoText}>
                  Expected delivery in 3-5 business days
                </Text>
              </View>
            </View>
          )}

          {/* Digital Delivery */}
          {isDigital && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="download-circle" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Digital Delivery</Text>
              </View>

              <View style={styles.digitalDeliveryCard}>
                <Icon name="email-check" size={32} color="#1976D2" />
                <Text style={styles.digitalDeliveryTitle}>
                  Delivered to Email
                </Text>
                <Text style={styles.digitalDeliveryText}>
                  Your digital products have been sent to your registered email
                  address. Check your inbox for download links.
                </Text>
              </View>
            </View>
          )}

          {/* Order Timeline */}
          {order.events && order.events.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="timeline-clock" size={22} color="#0B77A7" />
                <Text style={styles.sectionTitle}>Order Timeline</Text>
              </View>

              {order.events.map((event, index) => {
                const eventConfig = getStatusConfig(event.toStatus)
                const eventDate = new Date(event.createdAt).toLocaleString(
                  'en-IN',
                  {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )

                return (
                  <View key={index} style={styles.timelineItem}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: eventConfig.color },
                      ]}
                    >
                      <Icon
                        name={eventConfig.icon}
                        size={12}
                        color="#fff"
                      />
                    </View>
                    {index < order.events.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>
                        {eventConfig.label}
                      </Text>
                      <Text style={styles.timelineDate}>{eventDate}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* Help Section */}
          <View style={styles.helpCard}>
            <Icon name="help-circle-outline" size={24} color="#0B77A7" />
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                Contact our support team for any queries about your order
              </Text>
            </View>
            <TouchableOpacity style={styles.helpBtn}>
              <Icon name="message-text" size={20} color="#0B77A7" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.floatingBtn}
          activeOpacity={0.8}
          onPress={downloadInvoice}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Icon name="file-download-outline" size={22} color="#fff" />
          )}
          <Text style={styles.floatingText}>
            {downloading ? 'Downloading...' : 'Download Invoice'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    backgroundColor: '#0B77A7',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backBtn: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerBtn: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Status Card
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: '16@s',
    marginTop: '16@vs',
    padding: '16@s',
    borderRadius: '16@ms',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  statusIconContainer: {
    width: '56@s',
    height: '56@s',
    borderRadius: '28@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: '12@ms',
    color: '#666',
    marginBottom: '4@vs',
  },
  statusValue: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: '10@s',
    borderRadius: '8@ms',
    marginBottom: '12@vs',
    gap: '8@s',
  },
  orderId: {
    fontSize: '13@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12@s',
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
  },
  dateTimeText: {
    fontSize: '13@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  dateTimeDivider: {
    width: 1,
    height: '14@vs',
    backgroundColor: '#E0E0E0',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: '16@s',
    marginTop: '12@vs',
    padding: '16@s',
    borderRadius: '16@ms',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs',
    gap: '10@s',
  },
  sectionTitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: '12@s',
    borderRadius: '12@ms',
    marginBottom: '12@vs',
  },
  itemImage: {
    width: '70@s',
    height: '70@s',
    borderRadius: '10@ms',
    marginRight: '12@s',
    backgroundColor: '#E0E0E0',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginBottom: '6@vs',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    marginBottom: '4@vs',
  },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
  },
  qtyText: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  digitalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
    borderRadius: '8@ms',
    gap: '3@s',
  },
  digitalText: {
    fontSize: '10@ms',
    color: '#1976D2',
    fontFamily: FONTS.Bold,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    marginBottom: '4@vs',
  },
  savingsText: {
    fontSize: '12@ms',
    color: '#4CAF50',
    fontFamily: FONTS.Bold,
  },
  itemPrice: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
  },

  // Price Summary
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '12@vs',
  },
  priceLabel: {
    fontSize: '14@ms',
    color: '#666',
  },
  priceValue: {
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: '12@vs',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: '20@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
  },

  // Payment Info
  paymentInfoCard: {
    backgroundColor: '#F8F9FA',
    padding: '14@s',
    borderRadius: '12@ms',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12@s',
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentMethod: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
  },
  paymentStatus: {
    fontSize: '12@ms',
    fontFamily: FONTS.Medium,
    marginTop: '2@vs',
  },

  // Address
  addressCard: {
    backgroundColor: '#F8F9FA',
    padding: '14@s',
    borderRadius: '12@ms',
    marginBottom: '12@vs',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    marginBottom: '8@vs',
  },
  addressType: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
  },
  addressName: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginBottom: '4@vs',
  },
  addressPhone: {
    fontSize: '13@ms',
    color: '#666',
    marginBottom: '8@vs',
  },
  addressText: {
    fontSize: '13@ms',
    color: '#555',
    lineHeight: '20@vs',
  },
  deliveryInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8F4',
    padding: '12@s',
    borderRadius: '10@ms',
    gap: '10@s',
  },
  deliveryInfoText: {
    flex: 1,
    fontSize: '13@ms',
    color: '#4CAF50',
    fontFamily: FONTS.Medium,
  },

  // Digital Delivery
  digitalDeliveryCard: {
    alignItems: 'center',
    padding: '20@s',
    backgroundColor: '#F8F9FA',
    borderRadius: '12@ms',
  },
  digitalDeliveryTitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginTop: '12@vs',
    marginBottom: '6@vs',
  },
  digitalDeliveryText: {
    fontSize: '13@ms',
    color: '#666',
    textAlign: 'center',
    lineHeight: '20@vs',
  },

  // Timeline
  timelineItem: {
    flexDirection: 'row',
    marginBottom: '16@vs',
    position: 'relative',
  },
  timelineDot: {
    width: '24@s',
    height: '24@s',
    borderRadius: '12@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: '12@s',
    top: '24@vs',
    bottom: '-16@vs',
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  timelineContent: {
    flex: 1,
    paddingTop: '2@vs',
  },
  timelineTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginBottom: '2@vs',
  },
  timelineDate: {
    fontSize: '12@ms',
    color: '#666',
  },

  // Help Card
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    marginHorizontal: '16@s',
    marginTop: '12@vs',
    padding: '16@s',
    borderRadius: '12@ms',
    gap: '12@s',
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    marginBottom: '2@vs',
  },
  helpText: {
    fontSize: '12@ms',
    color: '#666',
  },
  helpBtn: {
    width: '40@s',
    height: '40@s',
    borderRadius: '20@s',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  // Floating Actions
  floatingContainer: {
    position: 'absolute',
    bottom: '20@vs',
    left: '16@s',
    right: '16@s',
  },
  floatingBtn: {
    flexDirection: 'row',
    backgroundColor: '#0B77A7',
    paddingVertical: '14@vs',
    paddingHorizontal: '24@s',
    borderRadius: '30@ms',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8@s',
    elevation: 6,
    shadowColor: '#0B77A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingText: {
    color: '#fff',
    fontSize: '15@ms',
    fontFamily: FONTS.Bold,
  },

  // Loading
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '16@vs',
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
})
