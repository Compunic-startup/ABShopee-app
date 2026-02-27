import { createNativeStackNavigator } from '@react-navigation/native-stack'
import TabNavigator from './TabNavigator'
import ExploreInventoryScreen from '../components/local/Home/ExploreInventoryScreen'
import ProductDetailScreen from '../components/local/Home/ProductDetailScreen'
import CartScreen from '../components/local/Home/CartScreen'
import WishlistScreen from '../components/local/Home/WishlistScreen'
import BuyInstantScreen from '../components/local/Home/BuyInstantScreen'
import OrderPlacedAnimation from '../components/global/OrderPlacedAnimation'
import OrderDetailsScreen from '../components/local/Home/OrderDetailsScreen'

const Stack = createNativeStackNavigator()

export default function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      {/* Extra Screens */}
      <Stack.Screen name="ExploreInventoryScreen" component={ExploreInventoryScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen} options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CartScreen"
        component={CartScreen} options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WishlistScreen"
        component={WishlistScreen} options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BuyInstantScreen"
        component={BuyInstantScreen} options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderPlacedAnimation"
        component={OrderPlacedAnimation} options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetailsScreen"
        component={OrderDetailsScreen} options={{ headerShown: false }}
      />

    </Stack.Navigator>
  )
}
