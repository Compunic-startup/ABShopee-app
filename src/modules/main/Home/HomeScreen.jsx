import { ScrollView, StyleSheet, Text, View, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native'
import HomeHeader from '../../../core/components/local/Home/HomeHeader'
import HomeCategories from '../../../core/components/local/Home/CategoryArray'
import RecommendedScreen from '../../../core/components/local/Home/RecommendedScreen'
import CouponsHeader from '../../../core/components/local/Categories/CouponsHeader'
import React, { useEffect, useState, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import color from '../../../core/utils/color'

const { height } = Dimensions.get('window')

const HomeScreen = () => {

  const [showModal, setShowModal] = useState(false)
  const hasChecked = useRef(false)
  const slideAnim = useRef(new Animated.Value(height)).current
  const navigation = useNavigation()

  useEffect(() => {
    const checkProfile = async () => {
      if (hasChecked.current) return
      hasChecked.current = true

      try {
        const storedProfile = await AsyncStorage.getItem('userProfile')

        if (!storedProfile) {
          setTimeout(() => {
            setShowModal(true)
          }, 800)
        }

      } catch (err) {
        console.log('Profile check error', err)
      }
    }

    checkProfile()
  }, [])

  useEffect(() => {
    if (showModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true
      }).start()
    }
  }, [showModal])

  const handleNavigate = () => {
    setShowModal(false)
    setTimeout(() => {
      navigation.navigate('ProfileInfoScreen')
    }, 300)
  }

  const handleClose = () => {
    setShowModal(false)
  }
  
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent'}}>
      <ScrollView>
        <HomeHeader />
        <HomeCategories />
        <CouponsHeader />
        <RecommendedScreen />
      </ScrollView>

      <Modal transparent visible={showModal} animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={handleClose}
        >
          <Animated.View 
            style={[
              styles.modalBox,
              { transform: [{ translateY: slideAnim }] }
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>!</Text>
              </View>
            </View>

            {/* Content */}
            <Text style={styles.title}>Complete Your Business Profile</Text>
            <Text style={styles.subtitle}>
              Your profile is incomplete. Complete it now.
            </Text>

            {/* Buttons */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleNavigate}>
              <Text style={styles.primaryButtonText}>Complete Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end'
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3'
  },
  iconText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0'
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  }
})