import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import HomeHeader from '../../../core/components/local/Home/HomeHeader'
import HomeCategories from '../../../core/components/local/Home/CategoryArray'
import RecommendedScreen from '../../../core/components/local/Home/RecommendedScreen'

const HomeScreen = () => {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <HomeHeader />
      <HomeCategories />
      <RecommendedScreen />
    </ScrollView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({})