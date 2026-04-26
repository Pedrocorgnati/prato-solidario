import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'

interface ConsentModalProps {
  visible: boolean
  loading?: boolean
  onAccept: () => void
  onDecline: () => void
}

// Tela de contexto LGPD exibida ANTES de requestPermissionsAsync()
// Exibida apenas 1x por instalação — flag gerenciada pelo usePushToken hook
export function ConsentModal({ visible, loading, onAccept, onDecline }: ConsentModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={styles.title}>Ativar notificações?</Text>
          <Text style={styles.body}>
            Ative notificações para receber alertas quando uma doação estiver
            disponível perto de você ou quando alguém for buscar sua doação.
          </Text>
          <Text style={styles.lgpd}>
            Suas preferências são armazenadas conforme a LGPD (Art. 7).
            Você pode revogar este consentimento nas configurações do app.
          </Text>
          <Pressable
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={onAccept}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Ativar notificações</Text>
            )}
          </Pressable>
          <Pressable style={styles.btnSecondary} onPress={onDecline} disabled={loading}>
            <Text style={styles.btnSecondaryText}>Agora não</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
  },
  lgpd: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  btnPrimary: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  btnSecondary: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#6B7280',
    fontSize: 15,
  },
})
