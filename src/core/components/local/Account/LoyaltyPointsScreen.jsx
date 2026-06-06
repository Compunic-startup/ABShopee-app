import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ToastAndroid,
  SafeAreaView,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import {
  getLoyaltyRewards,
  getLoyaltyAnalytics,
  getPointsExpiry
} from '../../../services/loyaltyapi'


// Transaction Item Component
const TransactionItem = ({ item }) => {
  const isEarn = item.points > 0
  const isPending = item.status === 'pending'

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: color.primary + '14' }]}>
        <Icon
          name={isEarn ? 'arrow-up' : 'arrow-down'}
          size={ms(18)}
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: ms(4) }}>
          <Text style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
          {item.orderId && (
            <Text style={styles.transactionOrder}>Order: #{item.orderId.slice(-8)}</Text>
          )}
        </View>
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.policyTitle}>{title}</Text>
        <Text style={styles.policyValue}>{value}</Text>
      </View>
      {description && <Text style={styles.policyDescription}>{description}</Text>}
    </View>
  </View>
)

export default function LoyaltyPointsScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rewardsData, setRewardsData] = useState(null)  // from GET /rewards
  const [milestones, setMilestones] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [expiryInfo, setExpiryInfo] = useState(null)
  const [rewardClaims, setRewardClaims] = useState([])
  const [nextMilestone, setNextMilestone] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'history' | 'milestones' | 'policy'



  const fetchAllData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel using only spec-compliant endpoints
      const [rewardsRes, analyticsRes, expiryRes] = await Promise.all([
        getLoyaltyRewards(),
        getLoyaltyAnalytics(90),
        getPointsExpiry(30),
      ])

      if (rewardsRes.success) {
        const data = rewardsRes.data
        setRewardsData(data)
        setMilestones(data.milestones || [])
        setRewardClaims(data.rewardClaims || [])
        setNextMilestone(data.nextMilestone)
      }
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
      {/* Premium Multi-Balance Card */}
      <View style={styles.premiumBalanceCard}>
        <View style={styles.premiumBalanceHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumBalanceLabel}>Available Points</Text>
            <Text style={styles.premiumBalanceValue}>
              {rewardsData?.availablePoints || 0}
            </Text>
          </View>
          <View style={styles.premiumBalanceIcon}>
            <Icon name="star-face" size={ms(32)} color={color.primary} />
          </View>
        </View>

        <View style={styles.balanceDivider} />

        <View style={styles.subBalancesRow}>
          <View style={styles.subBalanceItem}>
            <Text style={styles.subBalanceLabel}>Next Milestone</Text>
            <Text style={styles.subBalanceValue}>
              {rewardsData?.nextMilestone ? `${rewardsData.nextMilestone.pointsNeeded} pts away` : '—'}
            </Text>
            <Text style={styles.subBalanceDesc}>{rewardsData?.nextMilestone?.rewardTitle || 'No upcoming reward'}</Text>
          </View>
          <View style={[styles.subBalanceItem, styles.subBalanceBorder]}>
            <Text style={styles.subBalanceLabel}>Unlocked</Text>
            <Text style={styles.subBalanceValue}>{rewardsData?.totalUnlockedMilestones || 0}</Text>
            <Text style={styles.subBalanceDesc}>Total milestones</Text>
          </View>
        </View>

        {expiryInfo?.totalExpiring > 0 && (
          <View style={styles.premiumExpiryAlert}>
            <Icon name="clock-alert-outline" size={ms(14)} color="#FFD54F" />
            <Text style={styles.premiumExpiryText}>
              {expiryInfo.totalExpiring} points expiring in {expiryInfo.days || 30} days
            </Text>
          </View>
        )}
      </View>

      {/* Milestone Progress Section */}
      {milestones.length > 0 && (
        <View style={styles.milestoneSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Milestone Rewards</Text>
            <TouchableOpacity onPress={() => setActiveTab('milestones')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {milestones.slice(0, 1).map((milestone, idx) => {
            const isRedeemed = milestone.redeemed;
            const isUnlocked = milestone.unlocked || milestone.redeemable || milestone.pointsRemaining === 0;
            const progress = milestone.progressPercentage ?? milestone.percentComplete ?? (milestone.milestonePoints ? Math.min(100, Math.max(0, Math.round(((milestone.milestonePoints - (milestone.pointsRemaining || 0)) / milestone.milestonePoints) * 100))) : 0);

            return (
              <View key={idx} style={[styles.milestoneCard, isRedeemed ? styles.milestoneClaimedBorder : isUnlocked ? styles.milestoneUnlockedBorder : styles.milestoneProgressBorder]}>
                <View style={styles.milestoneInfo}>
                  <View style={styles.milestoneTextContent}>
                    <Text style={styles.milestoneName} numberOfLines={1}>{milestone.rewardTitle || milestone.policyName}</Text>
                    <Text style={styles.milestoneReward}>Target: {milestone.milestonePoints || milestone.targetPoints} pts</Text>
                    {milestone.maxClaimsPerUser !== undefined && (
                      <Text style={styles.milestoneLimit}>
                        Limit: {milestone.maxClaimsPerUser} {milestone.maxClaimsPerUser === 1 ? 'claim' : 'claims'} per user
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, isRedeemed ? styles.badgeClaimed : isUnlocked ? styles.badgeUnlocked : styles.badgeProgress]}>
                    <Icon
                      name={isRedeemed ? 'check-circle' : isUnlocked ? 'gift' : 'clock-outline'}
                      size={ms(13)}
                      color={isRedeemed ? color.primary : isUnlocked ? color.primary : '#475569'}
                    />
                    <Text style={[styles.statusBadgeText, isRedeemed ? styles.textClaimed : isUnlocked ? styles.textUnlocked : styles.textProgress]}>
                      {isRedeemed ? 'Claimed' : isUnlocked ? 'Unlocked' : `${progress}%`}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.milestoneProgressBar}>
                    <View style={[styles.milestoneProgressFill, { width: `${progress}%`, backgroundColor: color.primary }]} />
                  </View>
                  <View style={styles.milestoneFooterRow}>
                    <Text style={styles.milestoneFooter}>
                      {isRedeemed ? 'Claimed ✓' : isUnlocked ? 'Available in Cart! 🎉' : `${milestone.pointsRemaining || 0} pts remaining`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

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

      {/* Recent Activity from Analytics */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => setActiveTab('history')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {(analytics?.recentTransactions || []).slice(0, 3).map((item, index) => (
          <TransactionItem key={item.id || index} item={item} />
        ))}
        {(!analytics?.recentTransactions || analytics.recentTransactions.length === 0) && (
          <Text style={styles.emptyText}>No activity recorded yet</Text>
        )}
      </View>
    </>
  )

  const renderMilestones = () => (
    <View style={styles.milestoneList}>
      <Text style={styles.sectionTitle}>Active Milestones</Text>
      <Text style={styles.milestoneSubTitle}>Complete these goals to unlock exclusive rewards</Text>

      {milestones.length > 0 ? (
        milestones.map((milestone, idx) => {
          const isRedeemed = milestone.redeemed;
          const isUnlocked = milestone.unlocked || milestone.redeemable || milestone.pointsRemaining === 0;
          const progress = milestone.progressPercentage ?? milestone.percentComplete ?? (milestone.milestonePoints ? Math.min(100, Math.max(0, Math.round(((milestone.milestonePoints - (milestone.pointsRemaining || 0)) / milestone.milestonePoints) * 100))) : 0);

          return (
            <View key={idx} style={[styles.milestoneCard, { marginBottom: vs(12) }, isRedeemed ? styles.milestoneClaimedBorder : isUnlocked ? styles.milestoneUnlockedBorder : styles.milestoneProgressBorder]}>
              <View style={styles.milestoneInfo}>
                <View style={styles.milestoneTextContent}>
                  <Text style={styles.milestoneName} numberOfLines={1}>{milestone.rewardTitle || milestone.policyName}</Text>
                  <Text style={styles.milestoneReward}>
                    <Icon name="gift-outline" size={ms(14)} color={isRedeemed ? color.primary : isUnlocked ? color.primary : color.primary} /> {milestone.milestonePoints || milestone.targetPoints} Points
                  </Text>
                  {milestone.maxClaimsPerUser !== undefined && (
                    <Text style={styles.milestoneLimit}>
                      Limit: {milestone.maxClaimsPerUser} {milestone.maxClaimsPerUser === 1 ? 'claim' : 'claims'} per user
                    </Text>
                  )}
                </View>
                <View style={[styles.statusBadge, isRedeemed ? styles.badgeClaimed : isUnlocked ? styles.badgeUnlocked : styles.badgeProgress]}>
                  <Icon
                    name={isRedeemed ? 'check-circle' : isUnlocked ? 'gift' : 'clock-outline'}
                    size={ms(13)}
                    color={isRedeemed ? color.primary : isUnlocked ? color.primary : '#475569'}
                  />
                  <Text style={[styles.statusBadgeText, isRedeemed ? styles.textClaimed : isUnlocked ? styles.textUnlocked : styles.textProgress]}>
                    {isRedeemed ? 'Claimed' : isUnlocked ? 'Unlocked' : `${progress}%`}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.milestoneProgressBar}>
                  <View style={[styles.milestoneProgressFill, { width: `${progress}%`, backgroundColor: color.primary }]} />
                </View>
                <View style={styles.milestoneDetailsRow}>
                  <Text style={styles.milestoneFooter}>
                    {isRedeemed ? 'Claimed ✓' : isUnlocked ? 'Add to cart to claim as free gift!' : `${milestone.pointsRemaining || 0} pts remaining`}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="trophy-outline" size={ms(48)} color="#DDD" />
          <Text style={styles.emptyText}>No active milestones at the moment</Text>
        </View>
      )}
    </View>
  )

  const renderHistory = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Points Activity (Last 90 Days)</Text>
      {(analytics?.recentTransactions || []).map((item, index) => (
        <TransactionItem key={item.id || index} item={item} />
      ))}
      {(!analytics?.recentTransactions || analytics.recentTransactions.length === 0) && (
        <Text style={styles.emptyText}>No transactions yet</Text>
      )}
    </View>
  )

  const renderPolicy = () => (
    <View>
      <View style={styles.sectionCard}>
        <View style={styles.ruleHeader}>
          <Icon name="information-outline" size={ms(20)} color={color.primary} />
          <Text style={styles.sectionTitle}>Redemption Policy</Text>
        </View>

        <PolicyItem
          icon="star-circle-outline"
          title="Points Balance"
          value={`${rewardsData?.availablePoints || 0} pts`}
          description="Your current redeemable points balance"
        />

        <PolicyItem
          icon="gift-outline"
          title="Milestone Rewards"
          value={`${rewardsData?.totalUnlockedMilestones || 0} Unlocked`}
          description="Claim unlocked milestones to get free gifts on your orders"
        />

        <PolicyItem
          icon="swap-horizontal"
          title="Conversion Rate"
          value="1 Point = ₹0.10"
          description="Each point is worth this amount when redeeming at checkout"
        />

        <PolicyItem
          icon="clock-outline"
          title="Point Expiry"
          value="365 Days"
          description="Points expire 365 days from the date they were earned"
        />

        <PolicyItem
          icon="shield-check-outline"
          title="Redemption Limits"
          value="Applied at Checkout"
          description="Minimum points, max per order, and order coverage limits are shown live at checkout"
        />
      </View>
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
          style={[styles.tab, activeTab === 'milestones' && styles.tabActive]}
          onPress={() => setActiveTab('milestones')}
        >
          <Text style={[styles.tabText, activeTab === 'milestones' && styles.tabTextActive]}>
            Milestones
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
        {activeTab === 'milestones' && renderMilestones()}
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
    borderBottomColor: '#F1F5F9',
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
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    paddingVertical: '8@vs',
    alignItems: 'center',
    borderRadius: '4@ms',
    marginHorizontal: '4@s',
  },
  tabActive: {
    backgroundColor: color.primary,
  },
  tabText: {
    fontSize: '13@ms',
    fontFamily: FONTS.SemiBold,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: '16@s',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: '12@s',
    marginBottom: '16@vs',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '4@ms',
    padding: '16@s',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#64748B',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: '4@ms',
    padding: '16@s',
    marginBottom: '16@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderBottomColor: '#F1F5F9',
  },
  transactionIcon: {
    width: '40@s',
    height: '40@s',
    borderRadius: '4@ms',
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
    color: color.primary,
  },
  transactionPoints: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
  },
  transactionDate: {
    fontSize: '12@ms',
    fontFamily: FONTS.Regular,
    color: '#64748B',
  },
  transactionOrder: {
    fontSize: '11@ms',
    fontFamily: FONTS.Medium,
    color: '#94A3B8',
  },
  emptyText: {
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: '24@vs',
  },
  policyItem: {
    flexDirection: 'row',
    paddingVertical: '16@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  policyIcon: {
    width: '40@s',
    height: '40@s',
    borderRadius: '4@ms',
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
    color: '#64748B',
  },
  policyValue: {
    fontSize: '15@ms',
    fontFamily: FONTS.SemiBold,
    color: color.text,
  },
  policyDescription: {
    fontSize: '12@ms',
    fontFamily: FONTS.Regular,
    color: '#94A3B8',
    marginTop: '4@vs',
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    marginBottom: '12@vs',
    paddingBottom: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  // Premium Balance Card
  premiumBalanceCard: {
    backgroundColor: color.primary + '14',
    borderWidth: 1.5,
    borderColor: color.primary,
    borderRadius: '4@ms',
    padding: '16@s',
    marginBottom: '20@vs',
  },
  premiumBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  premiumBalanceLabel: {
    fontSize: '13@ms',
    fontFamily: FONTS.Medium,
    color: '#64748B',
    marginBottom: '4@vs',
  },
  premiumBalanceValue: {
    fontSize: '36@ms',
    fontFamily: FONTS.Bold,
    color: color.primary,
  },
  premiumBalanceIcon: {
    width: '56@s',
    height: '56@s',
    borderRadius: '4@ms',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  balanceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: '16@vs',
  },
  subBalancesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subBalanceItem: {
    flex: 1,
  },
  subBalanceBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: '16@s',
  },
  subBalanceLabel: {
    fontSize: '11@ms',
    fontFamily: FONTS.Medium,
    color: '#64748B',
    marginBottom: '2@vs',
  },
  subBalanceValue: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
  },
  subBalanceDesc: {
    fontSize: '11@ms',
    fontFamily: FONTS.Medium,
    color: '#94A3B8',
    marginTop: '2@vs',
  },
  premiumExpiryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primary + '14',
    padding: '10@s',
    borderRadius: '4@ms',
    marginTop: '16@vs',
    borderWidth: 1,
    borderColor: color.primary + '40',
  },
  premiumExpiryText: {
    marginLeft: '8@s',
    fontSize: '12@ms',
    fontFamily: FONTS.Medium,
    color: '#D97706',
  },
  // Milestones
  milestoneSection: {
    marginBottom: '16@vs',
  },
  milestoneCard: {
    backgroundColor: '#FFF',
    borderRadius: '4@ms',
    padding: '16@s',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  milestoneInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  milestoneTextContent: {
    flex: 1,
    marginRight: '8@s',
  },
  milestoneName: {
    fontSize: '15@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
  },
  milestoneReward: {
    fontSize: '13@ms',
    fontFamily: FONTS.Medium,
    color: color.primary,
    marginTop: '2@vs',
  },
  milestoneLimit: {
    fontSize: '11@ms',
    fontFamily: FONTS.Regular,
    color: '#64748B',
    marginTop: '2@vs',
  },
  claimGiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '5@s',
    backgroundColor: color.primary,
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '4@ms',
    alignSelf: 'flex-start',
  },
  claimGiftBtnDis: {
    backgroundColor: '#F1F5F9',
  },
  claimGiftBtnText: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  claimGiftBtnTextDis: {
    color: '#94A3B8',
  },
  milestoneProgressBar: {
    height: '8@vs',
    backgroundColor: '#F1F5F9',
    borderRadius: '2@ms',
    overflow: 'hidden',
    marginBottom: '8@vs',
  },
  milestoneProgressFill: {
    height: '100%',
    borderRadius: '2@ms',
  },
  milestoneFooter: {
    fontSize: '12@ms',
    fontFamily: FONTS.Medium,
    color: '#64748B',
  },
  milestoneList: {
    paddingBottom: '20@vs',
  },
  milestoneSubTitle: {
    fontSize: '13@ms',
    fontFamily: FONTS.Regular,
    color: '#64748B',
    marginBottom: '16@vs',
    marginTop: '-4@vs',
  },
  milestoneDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4@vs',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '40@vs',
    backgroundColor: '#FFF',
    borderRadius: '4@ms',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  milestoneClaimedBorder: {
    borderLeftWidth: 4,
    borderLeftColor: color.primary,
  },
  milestoneUnlockedBorder: {
    borderLeftWidth: 4,
    borderLeftColor: color.primary,
  },
  milestoneProgressBorder: {
    borderLeftWidth: 4,
    borderLeftColor: color.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '4@ms',
  },
  badgeClaimed: {
    backgroundColor: color.primary + '14',
  },
  badgeUnlocked: {
    backgroundColor: color.primary + '14',
  },
  badgeProgress: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: '11@ms',
    fontFamily: FONTS.Bold,
  },
  textClaimed: {
    color: color.primary,
  },
  textUnlocked: {
    color: color.primary,
  },
  textProgress: {
    color: '#475569',
  },
  progressBarContainer: {
    marginTop: '4@vs',
  },
})
