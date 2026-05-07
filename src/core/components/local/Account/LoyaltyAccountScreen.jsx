import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { 
  getLoyaltyBalance, 
  getCustomerLoyaltyInfo, 
  getLoyaltyAnalytics, 
  getPointsExpiry 
} from '../../../services/loyaltyapi'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const LoyaltyAccountScreen = () => {
  const navigation = useNavigation()
  const [balance, setBalance] = useState(null)
  const [loyaltyInfo, setLoyaltyInfo] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [expiryInfo, setExpiryInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
      ),
      headerTitle: 'My Points',
      headerStyle: { backgroundColor: color.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontFamily: FONTS.Bold, fontSize: '18@ms' },
    })
  }, [navigation])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [balanceRes, infoRes, analyticsRes, expiryRes] = await Promise.all([
        getLoyaltyBalance(),
        getCustomerLoyaltyInfo(),
        getLoyaltyAnalytics(90),
        getPointsExpiry(30)
      ])

      if (balanceRes.success) setBalance(balanceRes.data)
      if (infoRes.success) setLoyaltyInfo(infoRes.data)
      if (analyticsRes.success) setAnalytics(analyticsRes.data)
      if (expiryRes.success) setExpiryInfo(expiryRes.data)

    } catch (error) {
      console.error('Error fetching loyalty data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (dateString) => {
    const expiryDate = new Date(dateString)
    const today = new Date()
    const diffTime = expiryDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading your points...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const points = balance?.loyaltyPointsBalance || 0
  const conversionRate = loyaltyInfo?.loyaltyRule?.conversionRate || 0.10
  const rupeeValue = points * conversionRate
  const minPoints = loyaltyInfo?.loyaltyRule?.minPointsToRedeem || 100
  const maxPoints = loyaltyInfo?.loyaltyRule?.maxRedeemCappedValue || 500

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Icon name="star-circle" size={ms(32)} color="#fff" />
            <Text style={styles.balanceTitle}>Available Points</Text>
          </View>
          <Text style={styles.balanceAmount}>{points.toFixed(2)}</Text>
          <Text style={styles.balanceValue}>≈ ₹{rupeeValue.toFixed(2)}</Text>
          <View style={styles.balanceFooter}>
            <Text style={styles.balanceFooterText}>
              1 point = ₹{conversionRate.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('LoyaltyHistoryScreen')}
          >
            <Icon name="history" size={ms(24)} color={color.primary} />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ExploreInventoryScreen')}
          >
            <Icon name="cart" size={ms(24)} color={color.primary} />
            <Text style={styles.actionText}>Shop & Earn</Text>
          </TouchableOpacity>
        </View>

        {/* Rules Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="information-outline" size={ms(20)} color={color.primary} />
            <Text style={styles.sectionTitle}>Redemption Rules</Text>
          </View>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Icon name="check-circle" size={ms(16)} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Minimum {minPoints} points to redeem
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Icon name="check-circle" size={ms(16)} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Maximum {maxPoints} points per order
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Icon name="check-circle" size={ms(16)} color="#4CAF50" />
              <Text style={styles.ruleText}>
                1 point = ₹{conversionRate.toFixed(2)} value
              </Text>
            </View>
          </View>
        </View>

        {/* Analytics Section */}
        {analytics && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="chart-line" size={ms(20)} color={color.primary} />
              <Text style={styles.sectionTitle}>Points Activity (Last 90 Days)</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatNumber(analytics.totalEarned || 0)}</Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatNumber(analytics.totalRedeemed || 0)}</Text>
                <Text style={styles.statLabel}>Redeemed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{analytics.redemptionRate?.toFixed(1) || 0}%</Text>
                <Text style={styles.statLabel}>Usage Rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Expiry Warning */}
        {expiryInfo && expiryInfo.totalExpiring > 0 && (
          <View style={[styles.sectionCard, styles.warningCard]}>
            <View style={styles.sectionHeader}>
              <Icon name="clock-alert" size={ms(20)} color="#FF9800" />
              <Text style={[styles.sectionTitle, styles.warningTitle]}>
                Points Expiring Soon
              </Text>
            </View>
            <Text style={styles.warningText}>
              {expiryInfo.totalExpiring} points will expire in the next 30 days
            </Text>
            {expiryInfo.expiringPoints?.map((point, index) => (
              <View key={index} style={styles.expiryItem}>
                <Icon name="star" size={ms(14)} color="#FF9800" />
                <Text style={styles.expiryText}>
                  {point.points} points expire in {getDaysUntilExpiry(point.expiresAt)} days
                </Text>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.useNowButton}
              onPress={() => navigation.navigate('ExploreInventoryScreen')}
            >
              <Text style={styles.useNowText}>Use Points Now</Text>
              <Icon name="arrow-right" size={ms(16)} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Monthly Trends */}
        {analytics?.monthlyTrends && analytics.monthlyTrends.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="trending-up" size={ms(20)} color={color.primary} />
              <Text style={styles.sectionTitle}>Monthly Trends</Text>
            </View>
            {analytics.monthlyTrends.map((trend, index) => (
              <View key={index} style={styles.trendRow}>
                <Text style={styles.trendMonth}>{trend.month}</Text>
                <View style={styles.trendBars}>
                  <View style={styles.trendItem}>
                    <Text style={[styles.trendValue, styles.positive]}>+{trend.earned}</Text>
                  </View>
                  <View style={styles.trendItem}>
                    <Text style={[styles.trendValue, styles.negative]}>-{trend.redeemed}</Text>
                  </View>
                  <View style={styles.trendItem}>
                    <Text style={styles.trendValue}>={trend.net}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Transactions Preview */}
        {analytics?.recentTransactions && analytics.recentTransactions.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="receipt-text" size={ms(20)} color={color.primary} />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            {analytics.recentTransactions.slice(0, 3).map((transaction, index) => (
              <View key={index} style={styles.recentItem}>
                <View style={styles.recentLeft}>
                  <Icon 
                    name={transaction.type === 'earn' ? 'plus-circle' : 'minus-circle'} 
                    size={ms(16)} 
                    color={transaction.type === 'earn' ? '#4CAF50' : '#F44336'} 
                  />
                  <View>
                    <Text style={styles.recentTitle}>
                      {transaction.type === 'earn' ? 'Points Earned' : 'Points Redeemed'}
                    </Text>
                    <Text style={styles.recentDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.recentPoints,
                  transaction.type === 'earn' ? styles.positive : styles.negative
                ]}>
                  {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                </Text>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('LoyaltyHistoryScreen')}
            >
              <Text style={styles.viewAllText}>View All History</Text>
              <Icon name="arrow-right" size={ms(16)} color={color.primary} />
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: '12@vs',
    fontSize: '16@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  scrollContent: {
    padding: '14@s',
    paddingBottom: '30@vs',
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
    marginBottom: '12@vs',
  },
  balanceTitle: {
    fontSize: '16@ms',
    color: '#fff',
    fontFamily: FONTS.Medium,
    marginLeft: '8@s',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: '48@ms',
    color: '#fff',
    fontFamily: FONTS.Bold,
  },
  balanceValue: {
    fontSize: '20@ms',
    color: '#fff',
    fontFamily: FONTS.SemiBold,
    opacity: 0.8,
    marginTop: '4@vs',
  },
  balanceFooter: {
    marginTop: '16@vs',
    paddingTop: '12@vs',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    width: '100%',
  },
  balanceFooterText: {
    fontSize: '12@ms',
    color: '#fff',
    fontFamily: FONTS.Regular,
    textAlign: 'center',
    opacity: 0.7,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: '12@s',
    marginBottom: '16@vs',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    padding: '16@s',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color.border,
    elevation: 2,
  },
  actionText: {
    fontSize: '14@ms',
    color: color.text,
    fontFamily: FONTS.Medium,
    marginTop: '8@vs',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    padding: '16@s',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: color.border,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  sectionTitle: {
    fontSize: '16@ms',
    color: color.text,
    fontFamily: FONTS.SemiBold,
    marginLeft: '10@s',
  },
  rulesList: {
    gap: '12@vs',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@s',
  },
  ruleText: {
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    padding: '12@s',
  },
  statValue: {
    fontSize: '24@ms',
    color: color.text,
    fontFamily: FONTS.Bold,
  },
  statLabel: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginTop: '4@vs',
  },
  warningCard: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF8E1',
  },
  warningTitle: {
    color: '#FF9800',
  },
  warningText: {
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginBottom: '12@vs',
  },
  expiryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    marginBottom: '8@vs',
  },
  expiryText: {
    fontSize: '13@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
  },
  useNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primary,
    paddingVertical: '12@vs',
    paddingHorizontal: '20@s',
    borderRadius: '8@ms',
    marginTop: '16@vs',
    gap: '8@s',
  },
  useNowText: {
    fontSize: '14@ms',
    color: '#fff',
    fontFamily: FONTS.SemiBold,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  trendMonth: {
    fontSize: '14@ms',
    color: color.text,
    fontFamily: FONTS.Medium,
    width: '80@s',
  },
  trendBars: {
    flexDirection: 'row',
    gap: '16@s',
    flex: 1,
    justifyContent: 'flex-end',
  },
  trendItem: {
    alignItems: 'center',
  },
  trendValue: {
    fontSize: '14@ms',
    fontFamily: FONTS.SemiBold,
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#F44336',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@s',
  },
  recentTitle: {
    fontSize: '14@ms',
    color: color.text,
    fontFamily: FONTS.Medium,
  },
  recentDate: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginTop: '2@vs',
  },
  recentPoints: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '16@vs',
    paddingVertical: '8@vs',
    gap: '8@s',
  },
  viewAllText: {
    fontSize: '14@ms',
    color: color.primary,
    fontFamily: FONTS.Medium,
  },
  headerBtn: {
    marginLeft: '14@s',
  },
})

export default LoyaltyAccountScreen
