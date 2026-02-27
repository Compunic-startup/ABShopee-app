import React from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import { useNavigation } from '@react-navigation/native'

const CATEGORIES = [
  {
    id: 1,
    title: 'Explore\nInventory',
    image: require('../../../assets/images/Categories/inventory.png'),
  },
  {
    id: 2,
    title: 'Shop\nBy Brands',
    image: require('../../../assets/images/Categories/brand.png'),
  },
  {
    id: 3,
    title: 'Shop By\nCategory',
    image: require('../../../assets/images/Categories/category.png'),
  },
  {
    id: 4,
    title: 'Our Best\nSellers',
    image: require('../../../assets/images/Categories/bestseller.png'),
  },
  {
    id: 5,
    title: 'Coupons &\nDiscounts',
    image: require('../../../assets/images/Categories/discount.png'),
  },
]

export default function HomeCategories() {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {CATEGORIES.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate('ExploreInventoryScreen')}
            activeOpacity={0.85}
            style={styles.card}
          >
            <Text style={styles.title}>{item.title}</Text>

            <Image
              source={item.image}
              style={styles.image}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    paddingVertical: '16@vs',
  },

  scrollContainer: {
    paddingHorizontal: '16@s',
  },

  card: {
    width: '90@s',
    height: '100@vs',
    backgroundColor: color.primary,
    borderRadius: '8@ms',
    marginRight: '14@s',
    padding: '14@s',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    textAlign: 'center',
    fontSize: '10@ms',
    color: '#fff',
    fontFamily: FONTS.Bold,
  },

  image: {
    width: '70@s',
    height: '70@vs',
    marginBottom: '10@vs',
  },
})
