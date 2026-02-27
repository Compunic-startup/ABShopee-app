import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ToastAndroid,
} from 'react-native'
import { TextInput } from 'react-native-paper'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'

import { Animated, Easing } from 'react-native'
import { useRef } from 'react'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import ProductBottomSheet from '../Home/ProductAddSheet'
import AsyncStorage from '@react-native-async-storage/async-storage'

function AutoScrollTitleDesc({
  title,
  description,
  style,
  height = 34,
}) {
  const translateTitle = useRef(new Animated.Value(0)).current
  const translateDesc = useRef(new Animated.Value(height)).current
  const titleOpacity = useRef(new Animated.Value(1)).current
  const descOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!description) return

    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),

        Animated.parallel([
          Animated.timing(translateTitle, {
            toValue: -height,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(translateDesc, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(descOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),

        Animated.delay(1500),

        Animated.parallel([
          Animated.timing(translateDesc, {
            toValue: height,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(descOpacity, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(translateTitle, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start()
  }, [description])

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.Text
        style={[
          style,
          {
            position: 'absolute',
            transform: [{ translateY: translateTitle }],
            opacity: titleOpacity,
          },
        ]}
      >
        {title}
      </Animated.Text>

      {!!description && (
        <Animated.Text
          style={[
            style,
            {
              position: 'absolute',
              transform: [{ translateY: translateDesc }],
              opacity: descOpacity,
              color: '#555',
              fontSize: 11,
            },
          ]}
        >
          {description}
        </Animated.Text>
      )}
    </View>
  )
}


const API_URL =
  `${BASE_URL}/business/da81a423-2230-4586-b47b-07268479cb24/products`

const PLACEHOLDER_IMAGE =
  'https://cdn3d.iconscout.com/3d/premium/thumb/super-mario-block-11279445-9032287.png'

export default function ExploreInventoryScreen() {
  const navigation = useNavigation()
  const [wishlistIds, setWishlistIds] = useState(new Set())


  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [sheetVisible, setSheetVisible] = useState(false)

  //search ke liye states
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const searchTimeoutRef = React.useRef(null)
  const abortControllerRef = React.useRef(null)

  //wishlist ke liye 
  const toggleWishlist = async itemId => {
    const isWishlisted = wishlistIds.has(itemId)

    try {
      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const url = isWishlisted
        ? `/customer/business/${businessId}/items/${itemId}/wishlist/remove`
        : `/customer/business/${businessId}/items/${itemId}/wishlist/add`

      const res = await fetch(BASE_URL + url, {
        method: isWishlisted ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('wishlist failed')
      if (res.ok) {
        ToastAndroid.show(
          isWishlisted
            ? 'Removed from wishlist'
            : 'Added to wishlist',
          ToastAndroid.SHORT
        )

      }


      setWishlistIds(prev => {
        const next = new Set(prev)
        isWishlisted ? next.delete(itemId) : next.add(itemId)
        return next
      })
    } catch (e) {
      alert('Wishlist failed')
    }
  }

  const WishlistHeart = ({ active, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current

    const handlePress = () => {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.3,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start()

      onPress()
    }

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.heartBtn}
      >
        <Animated.Text
          style={[
            styles.heartIcon,
            { transform: [{ scale }] },
          ]}
        >
          {active ? '❤️' : '🤍'}
        </Animated.Text>
      </TouchableOpacity>
    )
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch(BASE_URL + '/customer/business/da81a423-2230-4586-b47b-07268479cb24/products')
      const json = await res.json()
      console.log('Fetched products', json)

      const mapped = json?.data?.rows?.map(item => {
        const price = item.prices?.[0]
        const inventory = item.inventories?.[0]
        const digitalAssetsCount = item.digitalAssets?.length || 0
        const category = item.Categories?.[0]
        const featuredAttr = item.attributes?.find(
          a => a.key === 'is_featured'
        )
        const shortDescAttr = item.attributes?.find(
          a => a.key === 'short_description'
        )

        return {
          id: item.id,
          title: item.title,
          itemType: item.itemType,
          image:
            item.media?.[0]?.url
              ? { uri: item.media[0].url }
              : { uri: PLACEHOLDER_IMAGE },
          price: price
            ? `${price.currency === 'INR' ? '₹' : ''}${price.amount}`
            : '—',
          inStock:
            item.itemType === 'digital'
              ? digitalAssetsCount > 0
              : inventory && inventory.quantityAvailable > 0,
          inventoryCount:
            item.itemType === 'digital'
              ? digitalAssetsCount
              : inventory?.quantityAvailable || 0,
          category: category?.name,
          featured: featuredAttr?.value === true,
          shortDescription: shortDescAttr?.value,
        }
      })

      setProducts(mapped)
    } catch (e) {
      console.log('Product fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async query => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setSearching(true)

      const res = await fetch(
        `${BASE_URL}/customer/business/da81a423-2230-4586-b47b-07268479cb24/search/items?q=${encodeURIComponent(query)}&limit=20`,
        { signal: controller.signal }
      )

      const json = await res.json()
      console.log('Search results', json)

      const mapped = json?.items?.map(item => {
        const price = item.prices?.[0]
        const inventory = item.inventories?.[0]
        const category = item.Categories?.[0]
        const featuredAttr = item.attributes?.find(a => a.key === 'is_featured')
        const shortDescAttr = item.attributes?.find(
          a => a.key === 'short_description'
        )

        return {
          id: item.id,
          title: item.title,
          image: item.media?.[0]?.url
            ? { uri: item.media[0].url }
            : { uri: PLACEHOLDER_IMAGE },
          price: price
            ? `${price.currency === 'INR' ? '₹' : ''}${price.amount}`
            : '—',
          inStock: inventory && inventory.quantityAvailable > 0,
          category: category?.name,
          featured: featuredAttr?.value === true,
          shortDescription: shortDescAttr?.value,
        }
      })

      setProducts(mapped)
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.log('Search error', e)
      }
    } finally {
      setSearching(false)
    }
  }

  const handleSearchChange = text => {
    setSearchQuery(text)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (text.trim().length < 3) {
      fetchProducts()
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(text.trim())
    }, 400)
  }

  const renderItem = ({ item }) => {
    const isDigital = item.itemType === 'digital'

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isDigital && styles.digitalCard,
        ]}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            itemId: item.id,
          })
        }
      >
        <View style={{ marginBottom: 8, height: 220 }}>
          <View style={{ position: 'relative' }}>
            <View style={styles.badge(isDigital)}>
              <Text style={styles.badgeText}>
                {isDigital ? 'DIGITAL' : 'PHYSICAL'}
              </Text>
            </View>

            <Image source={item.image} style={styles.productImage} />

            <WishlistHeart
              active={wishlistIds.has(item.id)}
              onPress={() => toggleWishlist(item.id)}
            />
          </View>

          <Text
            style={[
              styles.price,
              isDigital && { color: '#000000' },
            ]}
          >
            {item.price}
          </Text>

          <AutoScrollTitleDesc
            title={item.title}
            description={item.shortDescription}
            style={[
              styles.productName,
              isDigital && { color: '#515151' },
            ]}
            height={34}
          />

          {!!item.category && (
            <Text
              style={[
                styles.category,
                isDigital && { color: '#bbb' },
              ]}
            >
              {item.category}
            </Text>
          )}

          <Text
            style={[
              styles.stock,
              { color: item.inStock ? '#2E7D32' : '#C62828' },
            ]}
          >
            {isDigital
              ? item.inStock
                ? ` In Stock`
                : 'Out Of Stock'
              : item.inStock
                ? 'In Stock'
                : 'Out of Stock'}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.productList}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchProducts}
      />
    </View>
  )
}


const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },

  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '20@vs',
    gap: 20,
    marginBottom: 15
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15
  },

  backArrow: {
    fontSize: '20@ms',
    marginRight: '8@s',
  },

  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    height: '40@vs',
    borderRadius: 20
  },

  storeName: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
  },

  location: {
    fontSize: '11@ms',
    color: '#2E7D32',
    marginBottom: '12@vs',
    fontWeight: 800
  },

  filterRow: {
    paddingVertical: '10@vs',
  },

  filterChip: {
    paddingHorizontal: '14@s',
    paddingVertical: '6@vs',
    borderRadius: '6@ms',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: '8@s',
  },

  activeFilter: {
    backgroundColor: color.primary,
    borderWidth: 0,
  },

  filterText: {
    fontSize: '12@ms',
    color: '#555',
    fontFamily: FONTS.Medium,
  },

  activeFilterText: {
    color: '#fff',
  },
  productList: {
    paddingBottom: '20@vs',
  },
  card: {
    width: '48%',
    borderRadius: '10@ms',
    borderWidth: 1,
    borderColor: '#00ff73',
    padding: '10@s',
    marginBottom: '14@vs',
    backgroundColor: '#00ff7321',
  },
  productImage: {
    width: '100%',
    height: '110@vs',
    resizeMode: 'contain',
    marginBottom: '6@vs',
  },
  oldPrice: {
    fontSize: '11@ms',
    color: '#999',
    textDecorationLine: 'line-through',
  },

  price: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: color.primary,
    marginBottom: '4@vs',
  },

  productName: {
    fontSize: '12@ms',
    fontFamily: FONTS.Medium,
    marginBottom: '4@vs',
    lineHeight: '16@ms',
  },
  cartBtn: {
    backgroundColor: '#0B77A7',
    paddingVertical: '8@vs',
    borderRadius: '6@ms',
    alignItems: 'center',
  },

  cartText: {
    color: '#fff',
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
  },
  category: {
    fontSize: '10@ms',
    color: '#555',
    marginBottom: '4@vs',
  },
  stock: {
    fontSize: '10@ms',
    fontFamily: FONTS.Medium,
    marginBottom: '6@vs',
  },
  heartBtn: {
    position: 'absolute',
    top: '6@vs',
    right: '6@s',
    backgroundColor: '#fff',
    borderRadius: '16@ms',
    padding: '4@s',
    elevation: 3,
  },

  heartIcon: {
    fontSize: '16@ms',
  },

  digitalCard: {
    backgroundColor: '#00e1ff2b',
    borderColor: '#00e1ff',
  },

  badge: isDigital => ({
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: isDigital ? '#005fd2' : '#048300',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 2,
  }),

  badgeText: {
    fontSize: '8@ms',
    fontFamily: FONTS.MontBold,
    color: '#fff',
  },
})