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

// 習慣一覧タブのヘッダー右側：「＋」ボタン + 設定ギア
function HabitListHeaderRight() {
  const colorScheme = useColorScheme();
  const { openAdd } = useAddHabit();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 14 }}>
      <Pressable onPress={openAdd} accessibilityLabel="習慣を追加">
        <View style={{
          width: 30, height: 30, borderRadius: 15,
          backgroundColor: '#007AFF',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <FontAwesome name="plus" size={15} color="#fff" />
        </View>
      </Pressable>
      <Pressable onPress={() => router.push('/settings')}>
        {({ pressed }) => (
          <FontAwesome
            name="cog"
            size={22}
            color={Colors[colorScheme ?? 'light'].text}
            style={{ opacity: pressed ? 0.5 : 1 }}
          />
        )}
      </Pressable>
    </View>
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
              headerRight: () => <HabitListHeaderRight />,
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: 'カレンダー',
              tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
            }}
          />
          <Tabs.Screen
            name="stats"
            options={{
              title: '統計',
              tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
            }}
          />
          {/* add-tab.tsx はルートとして残すが、タブバーには表示しない */}
          <Tabs.Screen
            name="add-tab"
            options={{ href: null }}
          />
        </Tabs>
      </AddHabitProvider>
    </SelectedDateProvider>
  );
}
