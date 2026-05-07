import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ToastAndroid,
  Dimensions,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import { getCustomerLoyaltyInfo, getLoyaltyHistory, getLoyaltyAnalytics, getPointsExpiry } from '../../../services/loyaltyapi'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Transaction Item Component
const TransactionItem = ({ item }) => {
  const isEarn = item.points > 0
  const isPending = item.status === 'pending'
  
  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: isEarn ? '#E8F5E9' : '#FFEBEE' }]}>
        <Icon 
          name={isEarn ? 'arrow-up-circle' : 'arrow-down-circle'} 
          size={ms(22)} 
          color={color.primary} 
        />
      </View>
      <View style={styles.transactionContent}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionType}>
            {isEarn ? 'Points Earned' : 'Points Redeemed'}
            {isPending && <Text style={styles.pendingBadge}> (Pending)</Text>}
          </Text>
          <Text style={[styles.transactionPoints, { color: color.primary }]}>
            {isEarn ? '+' : ''}{item.points}
          </Text>
        </View>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </Text>
        {item.orderId && (
          <Text style={styles.transactionOrder}>Order: {item.orderId.slice(-8)}</Text>
        )}
      </View>
    </View>
  )
}

// Policy Item Component
const PolicyItem = ({ icon, title, value, description }) => (
  <View style={styles.policyItem}>
    <View style={styles.policyIcon}>
      <Icon name={icon} size={ms(20)} color={color.primary} />
    </View>
    <View style={styles.policyContent}>
      <Text style={styles.policyTitle}>{title}</Text>
      <Text style={styles.policyValue}>{value}</Text>
      {description && <Text style={styles.policyDescription}>{description}</Text>}
    </View>
  </View>
)

export default function LoyaltyPointsScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loyaltyInfo, setLoyaltyInfo] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [expiryInfo, setExpiryInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'history' | 'policy'

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [infoRes, historyRes, analyticsRes, expiryRes] = await Promise.all([
        getCustomerLoyaltyInfo(),
        getLoyaltyHistory(1, 20),
        getLoyaltyAnalytics(90),
        getPointsExpiry(30)
      ])
      
      if (infoRes.success) setLoyaltyInfo(infoRes.data)
      if (historyRes.success) setTransactions(historyRes.data.transactions || [])
      if (analyticsRes.success) setAnalytics(analyticsRes.data)
      if (expiryRes.success) setExpiryInfo(expiryRes.data)
    } catch (error) {
      console.log('Error fetching loyalty data:', error)
      ToastAndroid.show('Failed to load loyalty data', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchAllData()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchAllData()
  }

  const renderOverview = () => (
    <>
      {/* Points Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Icon name="star-circle" size={ms(28)} color="#fff" />
          <Text style={styles.balanceTitle}>Available Points</Text>
        </View>
        <Text style={styles.balanceValue}>
          {loyaltyInfo?.loyaltyPointsBalance?.toFixed(0) || 0}
        </Text>
        <Text style={styles.balanceValueText}>
          = ₹{((loyaltyInfo?.loyaltyPointsBalance || 0) * (loyaltyInfo?.loyaltyRule?.conversionRate || 0.10)).toFixed(2)} value
        </Text>
        
        {expiryInfo?.totalExpiring > 0 && (
          <View style={styles.expiryAlert}>
            <Icon name="alert-circle" size={ms(16)} color={color.primary} />
            <Text style={styles.expiryText}>
              {expiryInfo.totalExpiring} points expiring soon!
            </Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      {analytics && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="arrow-up-circle" size={ms(24)} color={color.primary} />
            <Text style={styles.statValue}>{analytics.totalEarned?.toFixed(0) || 0}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="arrow-down-circle" size={ms(24)} color={color.primary} />
            <Text style={styles.statValue}>{analytics.totalRedeemed?.toFixed(0) || 0}</Text>
            <Text style={styles.statLabel}>Total Redeemed</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="percent" size={ms(24)} color={color.primary} />
            <Text style={styles.statValue}>{analytics.redemptionRate?.toFixed(1) || 0}%</Text>
            <Text style={styles.statLabel}>Redemption Rate</Text>
          </View>
        </View>
      )}

      {/* Recent Transactions Preview */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => setActiveTab('history')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {transactions.slice(0, 3).map((item, index) => (
          <TransactionItem key={item.id || index} item={item} />
        ))}
        {transactions.length === 0 && (
          <Text style={styles.emptyText}>No transactions yet</Text>
        )}
      </View>
    </>
  )

  const renderHistory = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Transaction History</Text>
      {transactions.map((item, index) => (
        <TransactionItem key={item.id || index} item={item} />
      ))}
      {transactions.length === 0 && (
        <Text style={styles.emptyText}>No transactions yet</Text>
      )}
    </View>
  )

  const renderPolicy = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Loyalty Policy</Text>
      
      {loyaltyInfo?.loyaltyRule ? (
        <>
          <PolicyItem
            icon="swap-horizontal"
            title="Conversion Rate"
            value={`1 Point = ₹${loyaltyInfo.loyaltyRule.conversionRate || 0.10}`}
            description="Each point is worth this amount when redeeming"
          />
          
          <PolicyItem
            icon="numeric"
            title="Minimum to Redeem"
            value={`${loyaltyInfo.loyaltyRule.minPointsToRedeem || 0} Points`}
            description="Minimum points required to start redeeming"
          />
          
          {loyaltyInfo.loyaltyRule.maxRedeemCappedValue && (
            <PolicyItem
              icon="trending-up"
              title="Max Per Order"
              value={`${loyaltyInfo.loyaltyRule.maxRedeemCappedValue} Points`}
              description="Maximum points you can use in a single order"
            />
          )}
          
          {loyaltyInfo.loyaltyRule.maxRedeemPercentage && (
            <PolicyItem
              icon="percent-circle"
              title="Max Order Coverage"
              value={`${loyaltyInfo.loyaltyRule.maxRedeemPercentage}% of order`}
              description="Points can cover up to this percentage of your order"
            />
          )}
          
          <PolicyItem
            icon="clock-outline"
            title="Point Expiry"
            value={`${loyaltyInfo.loyaltyRule.pointExpiryDays || 365} Days`}
            description="Points expire after this many days from earning"
          />
          
          <PolicyItem
            icon="calculator"
            title="Earning Method"
            value={loyaltyInfo.loyaltyRule.earnPointsType === 'percentage' 
              ? `${loyaltyInfo.loyaltyRule.earnPointsValue}% of order` 
              : `${loyaltyInfo.loyaltyRule.earnPointsValue} pts per order`}
            description={`Earn on ${loyaltyInfo.loyaltyRule.earnThresholdType} above ₹${loyaltyInfo.loyaltyRule.earnThresholdValue}`}
          />
          
          <PolicyItem
            icon="tag-multiple"
            title="Earn on Discounted"
            value={loyaltyInfo.loyaltyRule.earnOnDiscountedPrice ? 'Yes' : 'No'}
            description={loyaltyInfo.loyaltyRule.earnOnDiscountedPrice 
              ? "Points calculated after discounts applied" 
              : "Points calculated on original price"}
          />
        </>
      ) : (
        <Text style={styles.emptyText}>No loyalty policy configured</Text>
      )}
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={ms(24)} color={color.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loyalty Points</Text>
          <View style={{ width: ms(40) }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading your points...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={ms(24)} color={color.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Points</Text>
        <View style={{ width: ms(40) }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'policy' && styles.tabActive]}
          onPress={() => setActiveTab('policy')}
        >
          <Text style={[styles.tabText, activeTab === 'policy' && styles.tabTextActive]}>
            Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'policy' && renderPolicy()}
        
        <View style={{ height: vs(30) }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  backBtn: {
    width: '40@s',
    height: '40@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '12@vs',
    fontSize: '14@ms',
    color: '#888',
    fontFamily: FONTS.Medium,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: '16@s',
    paddingBottom: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: '10@vs',
    alignItems: 'center',
    borderRadius: '8@ms',
    marginHorizontal: '4@s',
  },
  tabActive: {
    backgroundColor: color.primary + '15',
  },
  tabText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    color: '#666',
  },
  tabTextActive: {
    color: color.primary,
    fontFamily: FONTS.SemiBold,
  },
  content: {
    flex: 1,
    padding: '16@s',
  },
  balanceCard: {
    backgroundColor: color.primary,
    borderRadius: '16@ms',
    padding: '24@s',
    marginBottom: '16@vs',
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    marginBottom: '12@vs',
  },
  balanceTitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.Medium,
    color: '#fff',
    opacity: 0.9,
  },
  balanceValue: {
    fontSize: '48@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  balanceValueText: {
    fontSize: '16@ms',
    fontFamily: FONTS.Medium,
    color: '#fff',
    opacity: 0.8,
    marginTop: '4@vs',
  },
  expiryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    borderRadius: '8@ms',
    marginTop: '16@vs',
  },
  expiryText: {
    fontSize: '13@ms',
    fontFamily: FONTS.Medium,
    color: color.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: '12@s',
    marginBottom: '16@vs',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    padding: '16@s',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statValue: {
    fontSize: '20@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
    marginTop: '8@vs',
    marginBottom: '4@vs',
  },
  statLabel: {
    fontSize: '11@ms',
    fontFamily: FONTS.Medium,
    color: '#888',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    padding: '16@s',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  sectionTitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.SemiBold,
    color: color.text,
  },
  seeAllText: {
    fontSize: '13@ms',
    fontFamily: FONTS.Medium,
    color: color.primary,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIcon: {
    width: '44@s',
    height: '44@s',
    borderRadius: '22@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    color: color.text,
  },
  pendingBadge: {
    fontSize: '12@ms',
    fontFamily: FONTS.Regular,
    color:color.primary,
  },
  transactionPoints: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
  },
  transactionDate: {
    fontSize: '12@ms',
    fontFamily: FONTS.Regular,
    color: '#888',
    marginTop: '4@vs',
  },
  transactionOrder: {
    fontSize: '11@ms',
    fontFamily: FONTS.Regular,
    color: '#AAA',
    marginTop: '2@vs',
  },
  emptyText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    color: '#888',
    textAlign: 'center',
    paddingVertical: '24@vs',
  },
  policyItem: {
    flexDirection: 'row',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  policyIcon: {
    width: '44@s',
    height: '44@s',
    borderRadius: '22@s',
    backgroundColor: color.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    color: '#666',
    marginBottom: '4@vs',
  },
  policyValue: {
    fontSize: '16@ms',
    fontFamily: FONTS.SemiBold,
    color: color.text,
    marginBottom: '4@vs',
  },
  policyDescription: {
    fontSize: '12@ms',
    fontFamily: FONTS.Regular,
    color: '#888',
  },
})
