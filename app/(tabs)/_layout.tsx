import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: { name: string; title: string; icon: IoniconsName }[] = [
  { name: 'index',        title: 'Home',     icon: 'home'      },
  { name: 'add',          title: 'Add',      icon: 'add-circle'},
  { name: 'transactions', title: 'History',  icon: 'list'      },
  { name: 'budgets',      title: 'Budgets',  icon: 'wallet'    },
  { name: 'insights',     title: 'Insights', icon: 'bar-chart' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0a0a1a', borderTopColor: '#1a1a38' },
        tabBarActiveTintColor: '#ff6ec7',
        tabBarInactiveTintColor: '#55557a',
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}