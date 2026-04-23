import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import color from '../../../utils/color'
import FONTS from '../../../utils/fonts'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import HomeBanner from '../Categories/HomeBanner'

export default function HomeHeader() {

  const navigation = useNavigation()
  const [name, setName] = useState('Customer')

  const isProfileEmpty = (profile) => {
    if (!profile) return true

    const addressEmpty = !profile.address ||
      (!profile.address.addressLine1 &&
        !profile.address.city &&
        !profile.address.state &&
        !profile.address.postalCode)

    const userProfileEmpty = !profile.userProfile ||
      (!profile.userProfile.firstName &&
        !profile.userProfile.lastName &&
        !profile.userProfile.displayName &&
        !profile.userProfile.phone)

    return addressEmpty && userProfileEmpty
  }

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const storedProfile = await AsyncStorage.getItem('userProfile')

          if (!storedProfile) {
            setName('Customer')
            return
          }

          const profile = JSON.parse(storedProfile)
          console.log(profile, 'Loaded profile from AsyncStorage')

          if (isProfileEmpty(profile)) {
            setName('Customer')
            return
          }

          const userProfile = profile?.userProfile || {}

          const displayName =
            userProfile.displayName ||
            [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ')

          setName(displayName || 'Customer')

        } catch (err) {
          console.log('Profile read error', err)
          setName('Customer')
        }
      }

      loadProfile()
    }, [])
  )
  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{name}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 28, marginRight: 5 , zIndex: 10}}>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen')}>
            <Icon name="bell-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('WishlistScreen')}>
            <Icon name="heart-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* <View style={styles.banner}>
        <Image
          source={require('../../../assets/images/constants/bannerimage.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </View> */}
      
      <HomeBanner/>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    backgroundColor: color.primary,
    paddingHorizontal: '16@s',
    paddingTop: '15@vs',
    paddingBottom: '12@vs',
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


// import React, { useState } from 'react'
// import { View, Text, Image, TouchableOpacity } from 'react-native'
// import { ScaledSheet } from 'react-native-size-matters'
// import color from '../../../utils/color'
// import FONTS from '../../../utils/fonts'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
// import { useNavigation } from '@react-navigation/native'
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import { useFocusEffect } from '@react-navigation/native'
// import { useCallback } from 'react'

// export default function HomeHeader() {

//   const navigation = useNavigation()
//   const [name, setName] = useState('Customer')

//   const isProfileEmpty = (profile) => {
//     if (!profile) return true

//     const addressEmpty = !profile.address ||
//       (!profile.address.addressLine1 &&
//         !profile.address.city &&
//         !profile.address.state &&
//         !profile.address.postalCode)

//     const userProfileEmpty = !profile.userProfile ||
//       (!profile.userProfile.firstName &&
//         !profile.userProfile.lastName &&
//         !profile.userProfile.displayName &&
//         !profile.userProfile.phone)

//     return addressEmpty && userProfileEmpty
//   }

//   useFocusEffect(
//     useCallback(() => {
//       const loadProfile = async () => {
//         try {
//           const storedProfile = await AsyncStorage.getItem('userProfile')

//           if (!storedProfile) {
//             setName('Customer')
//             return
//           }

//           const profile = JSON.parse(storedProfile)
//           console.log(profile, 'Loaded profile from AsyncStorage')

//           if (isProfileEmpty(profile)) {
//             setName('Customer')
//             return
//           }

//           const userProfile = profile?.userProfile || {}

//           const displayName =
//             userProfile.displayName ||
//             [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ')

//           setName(displayName || 'Customer')

//         } catch (err) {
//           console.log('Profile read error', err)
//           setName('Customer')
//         }
//       }

//       loadProfile()
//     }, [])
//   )
//   return (
//     <View style={styles.container}>
//       <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//         <View>
//           <Text style={styles.welcomeText}>Welcome,</Text>
//           <Text style={styles.userName}>{name}</Text>
//         </View>

//         <View style={{ flexDirection: 'row', gap: 28, marginRight: 5 , zIndex: 10}}>
//           <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen')}>
//             <Icon name="bell-outline" size={28} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity onPress={() => navigation.navigate('WishlistScreen')}>
//             <Icon name="heart-outline" size={28} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.banner}>
//         <Image
//           source={require('../../../assets/images/constants/bannerimage.png')}
//           style={styles.bannerImage}
//           resizeMode="contain"
//         />
//       </View>
//     </View>
//   )
// }

// const styles = ScaledSheet.create({
//   container: {
//     backgroundColor: color.primary,
//     paddingHorizontal: '16@s',
//     paddingTop: '20@vs',
//   },

//   welcomeText: {
//     color: '#EAF6FF',
//     FONTSize: '12@ms',
//     fontFamily: FONTS.MontRegular,
//   },

//   userName: {
//     color: '#fff',
//     FONTSize: '16@ms',
//     fontFamily: FONTS.MontBold,
//     marginBottom: '14@vs',
//   },

//   searchInput: {
//     backgroundColor: '#fff',
//     height: '42@vs',
//     marginBottom: '18@vs',
//     fontSize: '14@ms',
//   },

//   banner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginLeft: '16@s',
//     marginVertical: '-45@vs',
//     paddingHorizontal: '20@s',
//   },

//   bannerImage: {
//     width: '350@s',
//     height: '240@vs',
//     marginHorizontal: '30@s',
//   },
// })
