/**
 * DiplomaTemplate — template PDF do diploma anual.
 *
 * USA @react-pdf/renderer (Document, Page, View, Text, StyleSheet).
 * INSTALAÇÃO: npm install @react-pdf/renderer
 *
 * Este componente só é importado dinamicamente em diploma.service.ts
 * dentro de um try/catch — o build nunca quebra se a lib não estiver instalada.
 *
 * @see intake-review/TASK-17/ST001
 */

// Importações lazy — TypeScript não verifica a existência em build-time aqui
// porque o módulo é carregado dinamicamente em diploma.service.ts
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'

export interface DiplomaData {
  name: string
  city?: string
  year: number
  totalMeals: number
  kgFoodSaved: number
  kgCO2Avoided: number
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 60,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dcfce7',
    textAlign: 'center',
  },
  body: {
    alignItems: 'center',
    marginBottom: 32,
  },
  certifyText: {
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 12,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  cityText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    border: '1pt solid #86efac',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15803d',
    textAlign: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#166534',
    textAlign: 'center',
  },
  envRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  envBox: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    border: '1pt solid #93c5fd',
  },
  envValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d4ed8',
    textAlign: 'center',
    marginBottom: 2,
  },
  envLabel: {
    fontSize: 9,
    color: '#1e40af',
    textAlign: 'center',
  },
  footer: {
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
})

export function DiplomaTemplate({ data }: { data: DiplomaData }) {
  return (
    <Document
      title={`Diploma Prato Solidário — ${data.name} ${data.year}`}
      author="Prato Solidário"
      subject="Diploma de Reconhecimento"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🍽️ Diploma de Reconhecimento</Text>
          <Text style={styles.headerSubtitle}>Prato Solidário — {data.year}</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.certifyText}>Certificamos com orgulho que</Text>
          <Text style={styles.nameText}>{data.name}</Text>
          {data.city && (
            <Text style={styles.cityText}>{data.city}</Text>
          )}
          <Text style={styles.certifyText}>
            contribuiu generosamente com a rede Prato Solidário em {data.year}
          </Text>

          {/* Stats principais */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.totalMeals}</Text>
              <Text style={styles.statLabel}>Refeições Doadas</Text>
            </View>
          </View>

          {/* Impacto ambiental */}
          <View style={styles.envRow}>
            <View style={styles.envBox}>
              <Text style={styles.envValue}>{data.kgFoodSaved} kg</Text>
              <Text style={styles.envLabel}>Alimento salvo do desperdício</Text>
            </View>
            <View style={styles.envBox}>
              <Text style={styles.envValue}>{data.kgCO2Avoided} kg</Text>
              <Text style={styles.envLabel}>CO₂ evitado (IPCC)</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Emitido em {new Date().toLocaleDateString('pt-BR')} · pratosolidario.com.br
          </Text>
        </View>
      </Page>
    </Document>
  )
}
