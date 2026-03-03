import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import ProductRAMs from './ProductRAMs'
import BASE_URL from '../../../services/api'

const { width } = Dimensions.get('window')

export default function HardwareCategories() {
  const navigation = useNavigation()

  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/categories`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      console.log(json)

      const mapped = (json?.data || []).map(item => ({
        id: item.id,
        title: item.name,
        subtitle: item.description || 'Products',
        count: item.productCount || 0,
        icon: 'shape',
        color: '#0B77A7',
        bgColor: '#E3F2FD',
      }))

      setCategories(mapped)

      if (mapped.length > 0) {
        setActiveCategory(mapped[0].id)
      }
    } catch (e) {
      console.log('Category fetch error', e)
      ToastAndroid.show('Failed to load categories', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeCategory) return

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [activeCategory])

  const activeCategoryData = categories.find(
    c => c.id === activeCategory
  )

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0B77A7" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="apps" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Categories</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SearchScreen')}>
          <Icon name="magnify" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {activeCategoryData && (
        <Animated.View style={[styles.categoryInfoCard, { opacity: fadeAnim }]}>
          <View
            style={[
              styles.categoryIconContainer,
              { backgroundColor: activeCategoryData.bgColor },
            ]}
          >
            <Icon
              name={activeCategoryData.icon}
              size={32}
              color={activeCategoryData.color}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.categoryMainTitle}>
              {activeCategoryData.title}
            </Text>
            <Text style={styles.categorySubtitle}>
              {activeCategoryData.subtitle}
            </Text>
            <Text style={styles.productCountText}>
              {activeCategoryData.count} Products
            </Text>
          </View>
        </Animated.View>
      )}

      <ScrollView>
        <View style={styles.tabsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(item => {
              const isActive = item.id === activeCategory

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveCategory(item.id)}
                  style={[
                    styles.card,
                    isActive && { borderColor: item.color },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={26}
                    color={isActive ? item.color : '#999'}
                  />
                  <Text
                    style={[
                      styles.title,
                      { color: isActive ? item.color : '#666' },
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.productsContainer}>
            <ProductRAMs categoryId={activeCategory} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingVertical: '14@vs',
    backgroundColor: '#0B77A7',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12@s',
  },
  headerTitle: {
    fontSize: '20@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  categoryInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: '16@s',
    padding: '16@s',
    borderRadius: '10@ms',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#c1c1c1',
  },
  categoryIconContainer: {
    width: '64@s',
    height: '64@s',
    borderRadius: '32@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '16@s',
  },
  categoryMainTitle: {
    fontSize: '18@ms',
    fontFamily: FONTS.Bold,
  },
  categorySubtitle: {
    fontSize: '13@ms',
    color: '#666',
    marginBottom: '6@vs',
  },
  productCountText: {
    fontSize: '12@ms',
    color: '#999',
  },
  tabsSection: {
    paddingHorizontal: '16@s',
  },
  card: {
    backgroundColor: '#fff',
    padding: '14@s',
    borderRadius: '14@ms',
    alignItems: 'center',
    marginRight: '12@s',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    width: '100@s',
  },
  title: {
    marginTop: '6@vs',
    fontSize: '13@ms',
    fontFamily: FONTS.Bold,
  },
  productsContainer: {
    marginTop: '20@vs',
  },
})