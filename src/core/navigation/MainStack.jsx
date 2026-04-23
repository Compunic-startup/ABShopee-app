import { createNativeStackNavigator } from '@react-navigation/native-stack'
import TabNavigator from './TabNavigator'
import ExploreInventoryScreen from '../components/local/Home/ExploreInventoryScreen'
import ProductDetailScreen from '../components/local/Home/ProductDetailScreen'
import CartScreen from '../components/local/Home/CartScreen'
import WishlistScreen from '../components/local/Home/WishlistScreen'
import BuyInstantScreen from '../components/local/Home/BuyInstantScreen'
import OrderPlacedAnimation from '../components/global/OrderPlacedAnimation'
import OrderDetailsScreen from '../components/local/Home/OrderDetailsScreen'
import OrderPendingApprovalScreen from '../components/local/Home/OrderPendingApprovalScreen'
import coupondiscounts from '../components/local/Categories/CouponsDiscounts'
import UserRefunds from '../../core/components/local/payments/UserRefunds'
import UserTransactions from '../../core/components/local/payments/UserTransactions'
import NotificationsScreen from '../components/local/Home/NotificationsScreen'
import EditProfileScreen from '../components/local/Account/EditProfileScreen'
import ProfileInfoScreen from '../components/global/ProfileInfoScreen'
import AddressesScreen from '../components/local/Account/AddressesScreen'
import SellerDashboardScreen from '../../modules/main/SellerDashboardScreen'
import ReturnsReplacemnet from '../components/local/payments/ReturnsReplacement'
import ReturnReplaceDetails from '../components/local/payments/ReturnReplaceDetails'
import CreateReturn from '../components/local/payments/CreateReturn'
import { SafeAreaView } from 'react-native-safe-area-context'

const Stack = createNativeStackNavigator()

export default function MainStack({ setIsLoggedIn }) {
  return (


    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        options={{ headerShown: false }}
      >
        {(props) => (
          <TabNavigator {...props} setIsLoggedIn={setIsLoggedIn} />
        )}
      </Stack.Screen>
      
        {/* Extra Screens */}
        <Stack.Screen name="ExploreInventoryScreen" component={ExploreInventoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="coupondiscounts" component={coupondiscounts} options={{ headerShown: false }} />

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
        <Stack.Screen
          name="OrderPendingApprovalScreen"
          component={OrderPendingApprovalScreen} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="userrefunds"
          component={UserRefunds} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="returnreplacement"
          component={ReturnsReplacemnet} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="returnreplacedetails"
          component={ReturnReplaceDetails} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="usertransactions"
          component={UserTransactions} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="createreturn"
          component={CreateReturn} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationsScreen"
          component={NotificationsScreen} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfileScreen"
          component={EditProfileScreen} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileInfoScreen"
          component={ProfileInfoScreen} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddressesScreen"
          component={AddressesScreen} options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SellerDashboardScreen"
          component={SellerDashboardScreen} options={{ headerShown: false }}
        />
    </Stack.Navigator>

  )
}
