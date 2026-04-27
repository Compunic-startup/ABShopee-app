import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import noimage from '../../../assets/images/Categories/preloader.gif'

// ─── Auto scroll title ↔ description ─────────────────────────────────────────
// (logic untouched)
function AutoScrollTitleDesc({ title, description, style, height = 38 }) {
  const translateTitle = useRef(new Animated.Value(0)).current
  const translateDesc  = useRef(new Animated.Value(height)).current
  const titleOpacity   = useRef(new Animated.Value(1)).current
  const descOpacity    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!description) return
    Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(translateTitle, { toValue: -height, duration: 800, useNativeDriver: true }),
          Animated.timing(titleOpacity,   { toValue: 0,       duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateDesc, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(descOpacity,   { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.delay(1800),
        Animated.parallel([
          Animated.timing(translateDesc,  { toValue: height, duration: 0, useNativeDriver: true }),
          Animated.timing(descOpacity,    { toValue: 0,      duration: 0, useNativeDriver: true }),
          Animated.timing(translateTitle, { toValue: 0,      duration: 0, useNativeDriver: true }),
          Animated.timing(titleOpacity,   { toValue: 1,      duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start()
  }, [description])

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.Text
        style={[style, { position: 'absolute', transform: [{ translateY: translateTitle }], opacity: titleOpacity }]}
        numberOfLines={2}
      >
        {title}
      </Animated.Text>
      {!!description && (
        <Animated.Text
          style={[style, { position: 'absolute', transform: [{ translateY: translateDesc }], opacity: descOpacity, fontSize: ms(11), color: '#888' }]}
          numberOfLines={2}
        >
          {description}
        </Animated.Text>
      )}
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WishlistScreen() {
  const navigation = useNavigation()
  const [wishlist,      setWishlist]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [removingItems, setRemovingItems] = useState(new Set())
  const [addingToCart,  setAddingToCart]  = useState(new Set())
  const [fadeAnim]                        = useState(new Animated.Value(0))

  useEffect(() => { fetchWishlist() }, [])

  useEffect(() => {
    if (!loading && wishlist.length > 0) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }
  }, [loading, wishlist])

  // ── all logic untouched ─────────────────────────────────────────────────────
  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res  = await fetch(`${BASE_URL}/customer/business/${businessId}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      setWishlist(json.data?.rows || [])
    } catch (err) {
      console.log('Wishlist fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => { setRefreshing(true); fetchWishlist() }

  const removeFromWishlist = async itemId => {
    setRemovingItems(prev => new Set(prev).add(itemId))
    try {
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res  = await fetch(
        `${BASE_URL}/customer/business/${businessId}/items/${itemId}/wishlist/remove`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Remove failed')
      setWishlist(prev => prev.filter(item => item.id !== itemId))
    } catch {
      await fetchWishlist()
    } finally {
      setRemovingItems(prev => { const n = new Set(prev); n.delete(itemId); return n })
    }
  }

  const addToCart = async item => {
    setAddingToCart(prev => new Set(prev).add(item.id))
    try {
      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')
      const res  = await fetch(
        `${BASE_URL}/customer/business/${businessId}/items/${item.id}/cart/add`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ quantity: 1, selectedAttributes: [] }),
        }
      )
      const json = await res.json()
    } catch (err) {
      if (err?.code === 'MISSING_REQUIRED_ATTRIBUTE') {
        Alert.alert('Select Options', 'This product requires you to select options', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Product', onPress: () => navigation.navigate('ProductDetail', { itemId: item.id }) },
        ])
      } else if (err?.code === 'OUT_OF_STOCK') {
        Alert.alert('Out of Stock', 'This item is currently unavailable')
      } else {
        Alert.alert('Error', 'Unable to add to cart')
      }
    } finally {
      setAddingToCart(prev => { const n = new Set(prev); n.delete(item.id); return n })
    }
  }

  const moveAllToCart = async () => {
    const inStockItems = wishlist.filter(item => {
      const isDigital = item.itemType === 'digital'
      const stock = isDigital ? item.digitalAssets?.length ?? 0 : item.inventories?.[0]?.quantityAvailable ?? 0
      return stock > 0
    })
    if (inStockItems.length === 0) { Alert.alert('No Items', 'No in-stock items to move to cart'); return }
    Alert.alert('Move All to Cart', `Move ${inStockItems.length} in-stock items to cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Move All', onPress: async () => { for (const item of inStockItems) await addToCart(item) } },
    ])
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Icon name="arrow-left" size={ms(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={styles.loaderText}>Loading your wishlist…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          {wishlist.length > 0 && (
            <Text style={styles.headerSub}>
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="share-variant-outline" size={ms(20)} color={color.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Empty state ── */}
      {wishlist.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Icon name="heart-outline" size={ms(48)} color={color.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>Save items you love to buy them later</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('ExploreInventoryScreen')}
            activeOpacity={0.85}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
            <Icon name="arrow-right" size={ms(18)} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── Move all bar — Flipkart style: full-width outlined button ── */}
          {/* <View style={styles.moveAllBar}>
            <TouchableOpacity style={styles.moveAllBtn} onPress={moveAllToCart} activeOpacity={0.8}>
              <Icon name="cart-arrow-right" size={ms(16)} color={color.primary} />
              <Text style={styles.moveAllText}>Move All to Cart</Text>
            </TouchableOpacity>
          </View> */}

          {/* ── List ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[color.primary]}
                tintColor={color.primary}
              />
            }
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {wishlist.map((item) => {
                const imageUrl       = item.media?.[0]?.url
                const price          = item.prices?.[0]?.amount
                const isDigital      = item.itemType === 'digital'
                const stock          = isDigital
                  ? item.digitalAssets?.length ?? 0
                  : item.inventories?.[0]?.quantityAvailable ?? 0
                const shortDescAttr  = item.attributes?.find(a => a.key === 'short_description')
                const isRemoving     = removingItems.has(item.id)
                const isAddingCart   = addingToCart.has(item.id)
                const inStock        = stock > 0

                return (
                  // ── Flipkart card: flat, 1px border, no heavy shadow ──
                  <View key={item.id} style={styles.card}>

                    {/* Top section: image + info */}
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ProductDetail', { itemId: item.id })}
                      activeOpacity={0.75}
                      style={styles.cardTop}
                    >
                      {/* Product image */}
                      <View style={styles.imgWrap}>
                        <Image
                          source={imageUrl ? { uri: imageUrl } : noimage}
                          style={styles.productImg}
                        />
                        {/* Digital badge */}
                        {isDigital && (
                          <View style={styles.digitalBadge}>
                            <Icon name="download" size={ms(9)} color="#fff" />
                          </View>
                        )}
                        {/* Heart / remove icon — top-right of image */}
                        <TouchableOpacity
                          style={styles.heartBtn}
                          onPress={() => removeFromWishlist(item.id)}
                          disabled={isRemoving}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          {isRemoving
                            ? <ActivityIndicator size="small" color="#C62828" />
                            : <Icon name="heart" size={ms(18)} color="#C62828" />
                          }
                        </TouchableOpacity>
                      </View>

                      {/* Product info */}
                      <View style={styles.infoWrap}>
                        {/* Category chip */}
                        {item.Categories?.length > 0 && (
                          <View style={styles.catChip}>
                            <Text style={styles.catChipText}>
                              {item.Categories.map(c => c.name).join(' · ')}
                            </Text>
                          </View>
                        )}

                        {/* Title / desc scroll */}
                        <AutoScrollTitleDesc
                          title={item.title}
                          description={shortDescAttr?.value}
                          style={styles.productTitle}
                          height={38}
                        />

                        {/* Price */}
                        <Text style={styles.price}>₹{price}</Text>

                        {/* Stock status */}
                        <View style={[
                          styles.stockPill,
                          { backgroundColor: inStock ? '#E8F5E9' : '#FFEBEE' },
                        ]}>
                          <Icon
                            name={inStock ? 'check-circle' : 'close-circle'}
                            size={ms(10)}
                            color={inStock ? '#2E7D32' : '#C62828'}
                          />
                          <Text style={[
                            styles.stockText,
                            { color: inStock ? '#2E7D32' : '#C62828' },
                          ]}>
                            {inStock ? 'In Stock' : 'Out of Stock'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Action row: Remove (outline) | Move to Cart (filled) */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeFromWishlist(item.id)}
                        disabled={isRemoving}
                        activeOpacity={0.7}
                      >
                        {isRemoving
                          ? <ActivityIndicator size="small" color="#C62828" />
                          : <>
                              <Icon name="delete-outline" size={ms(16)} color="#C62828" />
                              <Text style={styles.removeBtnText}>Remove</Text>
                            </>
                        }
                      </TouchableOpacity>

                      <View style={styles.actionDivider} />

                      {/* <TouchableOpacity
                        style={[styles.cartBtn, !inStock && styles.cartBtnDisabled]}
                        onPress={() => addToCart(item)}
                        disabled={!inStock || isAddingCart}
                        activeOpacity={0.8}
                      >
                        {isAddingCart
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <>
                              <Icon name="cart-plus" size={ms(16)} color={inStock ? '#fff' : '#aaa'} />
                              <Text style={[styles.cartBtnText, !inStock && { color: '#aaa' }]}>
                                Move to Cart
                              </Text>
                            </>
                        }
                      </TouchableOpacity> */}
                    </View>
                  </View>
                )
              })}
            </Animated.View>
          </ScrollView>
        </>
      )}
    </View>
  )
}

// ─── Styles — ONLY color.* values ────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: '10@vs' },
  loaderText: { fontSize: '14@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '8@vs' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '12@vs',
    paddingBottom: '13@vs',
    paddingHorizontal: '14@s',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    gap: '10@s',
  },
  headerBtn: {
    width: '36@s', height: '36@s', borderRadius: '18@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff' },
  headerSub:   { fontSize: '12@ms', color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.Medium, marginTop: '1@vs' },

  // ── Move all bar ──────────────────────────────────────────────────────────
  moveAllBar: {
    backgroundColor: '#fff',
    paddingHorizontal: '14@s',
    paddingVertical: '10@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  moveAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '8@s',
    paddingVertical: '10@vs',
    borderRadius: '6@ms',
    borderWidth: 1.5,
    borderColor: color.primary,
  },
  moveAllText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.primary },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: { paddingBottom: vs(24) },

  // ── Card — Flipkart flat style ────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderBottomWidth: '8@vs',           // thick grey separator between cards
    borderBottomColor: color.background,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '14@s',
    gap: '12@s',
  },

  // Image
  imgWrap: {
    width: '110@s', height: '110@s',
    borderRadius: '6@ms',
    backgroundColor: color.primary + 20,
    position: 'relative',
    borderWidth: 1, borderColor: '#EEE',
  },
  productImg: {
    width: '100%', height: '100%',
    borderRadius: '6@ms',
    resizeMode: 'contain',
  },
  digitalBadge: {
    position: 'absolute', bottom: '5@vs', left: '5@s',
    backgroundColor: color.primary,
    width: '18@s', height: '18@s', borderRadius: '9@ms',
    justifyContent: 'center', alignItems: 'center',
  },
  heartBtn: {
    position: 'absolute', top: '5@vs', right: '5@s',
    width: '26@s', height: '26@s', borderRadius: '13@ms',
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 2,
  },

  // Info
  infoWrap: { flex: 1 },
  catChip: {
    alignSelf: 'flex-start',
    backgroundColor: color.primary + 20,
    paddingHorizontal: '7@s', paddingVertical: '2@vs',
    borderRadius: '4@ms', marginBottom: '6@vs',
  },
  catChipText: { fontSize: '10@ms', color: color.primary, fontFamily: FONTS.Bold },
  productTitle: {
    fontSize: '14@ms', fontFamily: FONTS.Bold,
    color: color.text, lineHeight: '19@ms',
  },
  price: {
    fontSize: '17@ms', fontFamily: FONTS.Bold,
    color: color.text, marginTop: '6@vs', marginBottom: '6@vs',
  },
  stockPill: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    alignSelf: 'flex-start',
    paddingHorizontal: '8@s', paddingVertical: '3@vs',
    borderRadius: '4@ms',
  },
  stockText: { fontSize: '10@ms', fontFamily: FONTS.Bold },

  // Action row
  cardDivider: { height: 1, backgroundColor: '#F0F0F0' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '46@vs',
  },
  actionDivider: { width: 1, height: '22@vs', backgroundColor: '#E0E0E0' },

  removeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '6@s', height: '100%',
  },
  removeBtnText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#C62828' },

  cartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: '6@s', height: '100%',
    backgroundColor: color.primary,
  },
  cartBtnDisabled: { backgroundColor: '#F0F0F0' },
  cartBtnText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: s(40),
  },
  emptyIconWrap: {
    width: '90@s', height: '90@s', borderRadius: '45@ms',
    backgroundColor: color.primary + 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: '20@vs',
    borderWidth: 1, borderColor: '#EEE',
  },
  emptyTitle: {
    fontSize: '20@ms', fontFamily: FONTS.Bold,
    color: color.text, marginBottom: '8@vs',
  },
  emptySubtitle: {
    fontSize: '13@ms', color: '#888',
    fontFamily: FONTS.Medium, textAlign: 'center', marginBottom: '28@vs',
  },
  shopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: '8@s',
    backgroundColor: color.primary,
    paddingHorizontal: '28@s', paddingVertical: '13@vs',
    borderRadius: '6@ms', elevation: 2,
  },
  shopBtnText: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#fff' },
})