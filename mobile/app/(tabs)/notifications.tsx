import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Tela nativa de notificações — acessível via deep link pratosolidario://notificacoes
// e pelo PushBridge quando o usuário toca numa notificação com data.url = '/notificacoes'
export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔔</Text>
        <Text style={styles.title}>Nenhuma notificação ainda</Text>
        <Text style={styles.subtitle}>
          Quando houver doações disponíveis perto de você, elas aparecerão aqui.
          Mantenha as notificações ativadas para não perder nenhuma oportunidade.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
})
