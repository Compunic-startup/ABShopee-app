import * as React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'
import { theme } from './src/core/utils/theme'
import RootNavigator from './src/core/navigation/RootNavigator'
import './src/core/utils/globalFonts'
import { getFCMToken } from './src/core/services/tokenfetcher'
import AsyncStorage from '@react-native-async-storage/async-storage'

declare global {
  var logoutUser: (() => void) | undefined
}

const globalFetch = globalThis.fetch

export default function App() {
  
  React.useEffect(() => {
    getFCMToken()
  }, [])

  React.useEffect(() => {
    const originalFetch = globalThis.fetch as (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await originalFetch(input, init)
      
      console.log('Fetch middleware - status:', response.status, 'URL:', input)

      if (response.status === 401) {
        try {
          const clonedResponse = response.clone()
          const data = await clonedResponse.json()
          
          console.log('401 response data:', data)
          
          if (data.message === "Session Expired. Please login again") {
            console.log('Session expired detected, calling logout')
            await AsyncStorage.removeItem('userToken')
            globalThis.logoutUser?.()
          }
        } catch (error) {
          console.log('Error parsing 401 response:', error)
        }
      }

      return response
    }

    console.log('Fetch middleware registered')
    return () => {
      globalThis.fetch = originalFetch
    }
  }, [])
  
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  )
}
