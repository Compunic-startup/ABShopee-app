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
  FlatList,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { getLoyaltyHistory } from '../../../services/loyaltyapi'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'

const LoyaltyHistoryScreen = () => {
  const navigation = useNavigation()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
      ),
      headerTitle: 'Points History',
      headerStyle: { backgroundColor: color.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontFamily: FONTS.Bold, fontSize: '18@ms' },
    })
  }, [navigation])

  const fetchTransactions = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await getLoyaltyHistory(page, 20)
      
      if (response.success) {
        const newTransactions = response.data.transactions || []
        setTransactions(prev => append ? [...prev, ...newTransactions] : newTransactions)
        setPagination(response.data.pagination)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching loyalty history:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const onRefresh = () => {
    setRefreshing(true)
    setCurrentPage(1)
    fetchTransactions(1, false)
  }

  const loadMore = () => {
    if (pagination && currentPage < pagination.totalPages && !loadingMore) {
      fetchTransactions(currentPage + 1, true)
    }
  }

  const renderTransaction = ({ item }) => {
    const isEarned = item.type === 'earn'
    const isRedeemed = item.type === 'redeem'
    const isExpired = item.type === 'expired'
    
    let icon = 'star-circle'
    let iconColor = color.primary
    let pointsColor = color.text
    
    if (isEarned) {
      icon = 'plus-circle'
      iconColor = '#4CAF50'
      pointsColor = '#4CAF50'
    } else if (isRedeemed) {
      icon = 'minus-circle'
      iconColor = '#F44336'
      pointsColor = '#F44336'
    } else if (isExpired) {
      icon = 'clock-remove'
      iconColor = '#FF9800'
      pointsColor = '#FF9800'
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Icon name={icon} size={ms(20)} color={iconColor} />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>
              {item.metadata?.source || 
               (isEarned ? 'Points Earned' : 
                isRedeemed ? 'Points Redeemed' : 
                'Points Expired')}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.createdAt)}
            </Text>
            {item.orderId && (
              <TouchableOpacity 
                style={styles.orderLink}
                onPress={() => navigation.navigate('OrderDetailsScreen', { orderId: item.orderId })}
              >
                <Icon name="receipt" size={ms(12)} color={color.primary} />
                <Text style={styles.orderLinkText}>View Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.pointsAmount, { color: pointsColor }]}>
            {isEarned ? '+' : '-'}{Math.abs(item.points).toFixed(2)}
          </Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: 
              item.status === 'confirmed' ? '#E8F5E8' :
              item.status === 'pending' ? '#FFF3E0' :
              '#FFEBEE'
          }]}>
            <Text style={[styles.statusText, {
              color: 
                item.status === 'confirmed' ? '#2E7D32' :
                item.status === 'pending' ? '#F57C00' :
                '#C62828'
            }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={color.primary} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loadingText}>Loading points history...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={ms(48)} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>
              Start earning points by placing orders!
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            scrollEnabled={false}
          />
        )}
        
        {pagination && pagination.totalPages > 1 && (
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Showing {transactions.length} of {pagination.total} transactions
            </Text>
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
  },
  listContainer: {
    gap: '12@vs',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '14@s',
    borderRadius: '8@ms',
    borderWidth: 1,
    borderColor: color.border,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: '12@s',
  },
  iconContainer: {
    width: '40@ms',
    height: '40@ms',
    borderRadius: '20@ms',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.SemiBold,
    color: color.text,
    marginBottom: '2@vs',
  },
  transactionDate: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginBottom: '4@vs',
  },
  orderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    alignSelf: 'flex-start',
  },
  orderLinkText: {
    fontSize: '11@ms',
    color: color.primary,
    fontFamily: FONTS.Medium,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: '6@vs',
  },
  pointsAmount: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
  },
  statusBadge: {
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
    borderRadius: '4@ms',
  },
  statusText: {
    fontSize: '10@ms',
    fontFamily: FONTS.Medium,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '20@vs',
    gap: '8@s',
  },
  loadingMoreText: {
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: '60@vs',
  },
  emptyTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
    marginTop: '16@vs',
    marginBottom: '8@vs',
  },
  emptySubtitle: {
    fontSize: '14@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    textAlign: 'center',
    paddingHorizontal: '40@s',
  },
  paginationInfo: {
    alignItems: 'center',
    paddingVertical: '20@vs',
  },
  paginationText: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
  },
  headerBtn: {
    marginLeft: '14@s',
  },
})

export default LoyaltyHistoryScreen
