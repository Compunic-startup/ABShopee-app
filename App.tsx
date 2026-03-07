import * as React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'
import { theme } from './src/core/utils/theme'
import RootNavigator from './src/core/navigation/RootNavigator'
import './src/core/utils/globalFonts'
import { getFCMToken } from './src/core/services/tokenfetcher'

export default function App() {
  
  React.useEffect(() => {
    getFCMToken()
  }, [])

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  )
}
