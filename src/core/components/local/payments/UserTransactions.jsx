import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('all')

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(1, true)
    }, [])
  )

  const fetchTransactions = async (pageNumber = 1, reset = false) => {
    try {
      if (reset) setLoading(true)

      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const customerId = await AsyncStorage.getItem('customerId')

      let url = `${BASE_URL}/customer/business/${businessId}/customers/${customerId}/transactions?page=${pageNumber}&limit=10`

      if (selectedFilter !== 'all') {
        url += `&transactionType=${selectedFilter.toUpperCase()}`
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json()
      console.log(json)
      const newTransactions = json?.data?.transactions || []

      if (reset) {
        setTransactions(newTransactions)
      } else {
        setTransactions(prev => [...prev, ...newTransactions])
      }

      setHasMore(newTransactions.length === 10)
      setPage(pageNumber)
    } catch (e) {
      console.log('Transaction fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchTransactions(page + 1)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchTransactions(1, true)
  }

  const filters = [
    { key: 'all', label: 'All', icon: 'view-list' },
    { key: 'payment', label: 'Payments', icon: 'credit-card-outline' },
    { key: 'refund', label: 'Refunds', icon: 'cash-refund' },
    { key: 'escrow', label: 'Escrow', icon: 'shield-check' },
  ]

  const getStatusColor = status => {
    if (status === 'success') return '#4CAF50'
    if (status === 'failed') return '#F44336'
    return '#FF9800'
  }

  const renderItem = ({ item }) => {
    const date = new Date(item.createdAt).toLocaleDateString('en-IN')

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.amount}>₹{item.amount}</Text>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.type}>
          {item.type.toUpperCase()} • {item.provider}
        </Text>

        <Text style={styles.date}>{date}</Text>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <Icon name="receipt-text-outline" size={16} color="#666" />
          <Text style={styles.orderId}>Order: {item.orderId}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      <View style={styles.header}>
        <Text style={styles.heading}>My Transactions</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterBtn,
              selectedFilter === filter.key && styles.filterBtnActive,
            ]}
            onPress={() => {
              setSelectedFilter(filter.key)
              fetchTransactions(1, true)
            }}
          >
            <Icon
              name={filter.icon}
              size={16}
              color={selectedFilter === filter.key ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && transactions.length === 0 ? (
        <ActivityIndicator size="large" color="#0B77A7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.transactionId}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Icon name="wallet-outline" size={80} color="#E0E0E0" />
              <Text style={{ marginTop: 16, fontSize: 16, color: '#777' }}>
                No transactions found
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#0B77A7',
    padding: '16@s',
  },
  heading: {
    fontSize: '20@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },

  filterRow: {
    flexDirection: 'row',
    padding: '12@s',
    gap: '8@s',
    backgroundColor: '#fff',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    paddingHorizontal: '14@s',
    paddingVertical: '6@vs',
    borderRadius: '20@ms',
    backgroundColor: '#F0F0F0',
  },
  filterBtnActive: {
    backgroundColor: '#0B77A7',
  },
  filterText: {
    fontSize: '12@ms',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },

  card: {
    backgroundColor: '#fff',
    padding: '16@s',
    borderRadius: '14@ms',
    marginBottom: '12@vs',
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
    color: '#0B77A7',
  },
  status: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
  },
  type: {
    marginTop: '4@vs',
    fontSize: '13@ms',
    color: '#333',
  },
  date: {
    marginTop: '4@vs',
    fontSize: '12@ms',
    color: '#777',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: '10@vs',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
  },
  orderId: {
    fontSize: '12@ms',
    color: '#555',
  },
})