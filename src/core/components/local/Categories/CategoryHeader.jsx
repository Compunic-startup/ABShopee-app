import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../../utils/fonts'
import ProductRAMs from './ProductRAMs'
import ProductAntivirus from './ProductAntivirus'

const { width } = Dimensions.get('window')

const CATEGORIES = [
  {
    id: 'antivirus',
    title: 'Antivirus',
    subtitle: 'Software Licenses',
    icon: 'shield-check',
    color: '#2196F3',
    bgColor: '#E3F2FD',

    count: 12,
  },
  {
    id: 'ram',
    title: 'RAM',
    subtitle: 'Memory Modules',
    icon: 'memory',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    count: 24,
  },
  {
    id: 'ssd',
    title: 'SSD',
    subtitle: 'Solid State Drives',
    icon: 'harddisk',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    count: 18,
  },
  {
    id: 'storage',
    title: 'Storage',
    subtitle: 'External & HDD',
    icon: 'database',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    count: 32,
  },
  {
    id: 'processor',
    title: 'Processor',
    subtitle: 'CPU Chips',
    icon: 'cpu-64-bit',
    color: '#F44336',
    bgColor: '#FFEBEE',
    count: 16,
  },
  {
    id: 'graphics',
    title: 'Graphics',
    subtitle: 'GPU Cards',
    icon: 'expansion-card',
    color: '#00BCD4',
    bgColor: '#E0F7FA',
    count: 20,
  },
]

export default function HardwareCategories() {
  const navigation = useNavigation()
  const [activeCategory, setActiveCategory] = useState('antivirus')
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
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

  const activeCategoryData = CATEGORIES.find(
    c => c.id === activeCategory
  )

  const CATEGORY_COMPONENTS = {
    antivirus: ProductAntivirus,
    ram: null,
    ssd: null,
    storage: null,
    processor: null,
    graphics: null,
  }

  const ActiveComponent = CATEGORY_COMPONENTS[activeCategory]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B77A7" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="apps" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Categories</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('SearchScreen')}
        >
          <Icon name="magnify" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
        <Animated.View style={[styles.categoryInfoCard, { opacity: fadeAnim }]}>
          <View
            style={[
              styles.categoryIconContainer,
              { backgroundColor: activeCategoryData?.bgColor },
            ]}
          >
            <Icon
              name={activeCategoryData?.icon}
              size={32}
              color={activeCategoryData?.color}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.categoryMainTitle}>
              {activeCategoryData?.title}
            </Text>
            <Text style={styles.categorySubtitle}>
              {activeCategoryData?.subtitle}
            </Text>
            <Text style={styles.productCountText}>
              {activeCategoryData?.count} Products
            </Text>
          </View>
        </Animated.View>

        <View style={styles.tabsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map(item => {
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
            {ActiveComponent ? <ActiveComponent /> : <ProductRAMs />}
          </View>
        </Animated.View>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    backgroundColor: '#F5F7FA',
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
    borderRadius: '16@ms',
    alignItems: 'center',
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
  productCard: {
    backgroundColor: '#fff',
    padding: '16@s',
    borderRadius: '14@ms',
    marginBottom: '14@vs',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
  },
  productPrice: {
    marginTop: '4@vs',
    fontSize: '13@ms',
    color: '#4CAF50',
  },
  buyBtn: {
    backgroundColor: '#0B77A7',
    paddingHorizontal: '16@s',
    paddingVertical: '8@vs',
    borderRadius: '20@ms',
  },
  buyText: {
    color: '#fff',
    fontFamily: FONTS.Bold,
    fontSize: '12@ms',
  },
})