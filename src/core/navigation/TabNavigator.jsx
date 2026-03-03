import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import HomeScreen from '../../modules/main/Home/HomeScreen'
import CategoriesScreen from '../../modules/main/CategoriesScreen'
import OrdersScreen from '../../modules/main/OrdersScreen'
import AccountScreen from '../../modules/main/AccountScreen'
import color from '../utils/color'

const Tab = createBottomTabNavigator()

export default function TabNavigator({ setIsLoggedIn }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: color.primary,
        tabBarStyle: { backgroundColor: '#fff', height: 80, borderRadius: 15, paddingVertical: 10, elevation: 5, paddingTop: 10 },
        tabBarLabelStyle: { fontSize: 12, marginTop: 5 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="home" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="dots-grid" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="cube-send" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="account" color={color} size={26} />
          ),
        }}
      >
        {(props) => (
          <AccountScreen {...props} setIsLoggedIn={setIsLoggedIn} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
