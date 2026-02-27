import React from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { TextInput, Button } from 'react-native-paper'
import { ScaledSheet } from 'react-native-size-matters'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'

export default function HomeHeader() {
  const navigation = useNavigation()
  return (
    <View style={styles.container}>
      {/* Welcome Text */}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>Ayush Khale</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 22 , marginRight: 5}}>
          <TouchableOpacity onPress={() => navigation.navigate('WishlistScreen')}>
            <Icon name="heart-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('CartScreen')}>
            <Icon name="basket-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TextInput
        mode="outlined"
        placeholder="Search For Anti-Virus"
        left={<TextInput.Icon icon="magnify" />}
        outlineColor="transparent"
        activeOutlineColor={color.primary}
        style={styles.searchInput}
        theme={{ roundness: 10 }}
      />

      {/* Banner */}
      <View style={styles.banner}>
        <Image
          source={require('../../../assets/images/constants/bannerimage.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    backgroundColor: color.primary,
    paddingHorizontal: '16@s',
    paddingTop: '20@vs',
  },

  welcomeText: {
    color: '#EAF6FF',
    FONTSize: '12@ms',
    fontFamily: FONTS.MontRegular,
  },

  userName: {
    color: '#fff',
    FONTSize: '16@ms',
    fontFamily: FONTS.MontBold,
    marginBottom: '14@vs',
  },

  searchInput: {
    backgroundColor: '#fff',
    height: '42@vs',
    marginBottom: '18@vs',
    fontSize: '14@ms',
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '16@s',
    marginVertical: '-45@vs',
    paddingHorizontal: '20@s',
  },

  bannerImage: {
    width: '350@s',
    height: '240@vs',
    marginHorizontal: '30@s',
  },
})
