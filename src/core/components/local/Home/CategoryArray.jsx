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
    screen: 'ExploreInventoryScreen',
  },
  {
    id: 2,
    title: 'Shop By\nCategory',
    image: require('../../../assets/images/Categories/category.webp'),
    screen: 'Categories',
  },
  {
    id: 3,
    title: 'Coupons\nDiscounts',
    image: require('../../../assets/images/Categories/discount.webp'),
    screen: 'coupondiscounts',
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
            onPress={() => {
              if (item.screen === 'Categories') {
                navigation.navigate('Tabs', { screen: 'Categories' })
              } else {
                navigation.navigate(item.screen)
              }
            }}
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
    paddingVertical: '14@vs',
  },

  scrollContainer: {
    paddingHorizontal: '12@s',
  },

  card: {
    width: '102@s',
    height: '110@vs',
    backgroundColor: color.primary,
    borderRadius: '8@ms',
    marginRight: '10@s',
    padding: '14@s',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: color.primary,
  },

  title: {
    textAlign: 'center',
    fontSize: '13@ms',
    color: color.secondary,
    fontFamily: FONTS.MontExtraBold,
  },

  image: {
    width: '80@s',
    height: '75@vs',
  },
})
