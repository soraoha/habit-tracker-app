import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/contexts/AuthContext';
import { SelectedDateProvider } from '@/contexts/SelectedDateContext';
import { AddHabitProvider, useAddHabit } from '@/contexts/AddHabitContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

// タブバー内「＋」ボタン（AddHabitProviderの内側で呼ばれる）
function AddTabButton({ style }: { style?: object }) {
  const { openAdd } = useAddHabit();
  return (
    <Pressable
      onPress={openAdd}
      style={[style, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
      accessibilityRole="button"
      accessibilityLabel="習慣を追加"
    >
      <View style={{
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: '#007AFF',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35, shadowRadius: 6, elevation: 5,
      }}>
        <FontAwesome name="plus" size={22} color="#fff" />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  return (
    <SelectedDateProvider>
      <AddHabitProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: useClientOnlyValue(false, true),
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: '習慣一覧',
              tabBarIcon: ({ color }) => <TabBarIcon name="check-square-o" color={color} />,
              headerRight: () => (
                <Pressable
                  onPress={() => router.push('/settings')}
                  style={{ marginRight: 16 }}>
                  {({ pressed }) => (
                    <FontAwesome
                      name="cog"
                      size={22}
                      color={Colors[colorScheme ?? 'light'].text}
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              ),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: 'カレンダー',
              tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
            }}
          />
          {/* タブバー中央の「＋」ボタン（ナビゲーションなし） */}
          <Tabs.Screen
            name="add-tab"
            options={{
              title: '',
              tabBarLabel: () => null,
              tabBarIcon: () => null,
              tabBarButton: (props) => <AddTabButton style={props.style} />,
            }}
          />
          <Tabs.Screen
            name="stats"
            options={{
              title: '統計',
              tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
            }}
          />
        </Tabs>
      </AddHabitProvider>
    </SelectedDateProvider>
  );
}
