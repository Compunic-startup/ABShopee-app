import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import HomeHeader from '../../../core/components/local/Home/HomeHeader'
import HomeCategories from '../../../core/components/local/Home/CategoryArray'
import RecommendedScreen from '../../../core/components/local/Home/RecommendedScreen'

import { FlatList } from 'react-native'

const HomeScreen = () => {
  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <>
          <HomeHeader />
          <HomeCategories />
          <RecommendedScreen />
        </>
      }
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: '#fff' }}
    />
  )
}

export default HomeScreen

const styles = StyleSheet.create({})