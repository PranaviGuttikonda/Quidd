import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsDark } from '@/hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: { name: string; title: string; icon: IoniconsName }[] = [
  { name: 'index',        title: 'Home',     icon: 'home'      },
  { name: 'add',          title: 'Add',      icon: 'add-circle'},
  { name: 'transactions', title: 'History',  icon: 'list'      },
  { name: 'budgets',      title: 'Budgets',  icon: 'wallet'    },
  { name: 'insights',     title: 'Insights', icon: 'bar-chart' },
];

export default function TabLayout() {
  const isDark = useIsDark();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0a0a1a' : '#ffffff',
          borderTopColor: isDark ? '#1a1a38' : 'rgba(180,100,0,0.10)',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: isDark ? '#ff6ec7' : '#ff6b6b',
        tabBarInactiveTintColor: isDark ? '#55557a' : '#c09070',
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