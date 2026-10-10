import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const safetySteps = [
  { icon: '◉', title: 'Check your readiness', description: 'A quick check before you begin your journey.' },
  { icon: '⌁', title: 'Stay protected on the road', description: 'DriveWatch monitors for possible fatigue and risky driving.' },
  { icon: '⌕', title: 'Get help when you need it', description: 'Understand car warnings and find nearby workshops.' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.topRow}>
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>D</Text></View>
          <Text style={styles.brand}>DriveSafe</Text>
          <Text style={styles.step}>01 / 03</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.orbitLarge} />
          <View style={styles.orbitSmall} />
          <View style={styles.shield}><Text style={styles.shieldIcon}>⌁</Text></View>
          <Text style={styles.eyebrow}>YOUR SMART ROAD COMPANION</Text>
          <Text style={styles.title}>Every journey{`\n`}starts safer.</Text>
          <Text style={styles.subtitle}>DriveSafe supports safer decisions before, during, and after every trip.</Text>
        </View>

        <View style={styles.stepsCard}>
          {safetySteps.map((item, index) => (
            <View key={item.title} style={[styles.stepRow, index < safetySteps.length - 1 && styles.stepBorder]}>
              <View style={styles.stepIcon}><Text style={styles.stepIconText}>{item.icon}</Text></View>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryButtonText}>Get started</Text><Text style={styles.arrow}>→</Text>
        </Pressable>
        <Text style={styles.privacy}>Your camera data stays on your device by default.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#081C22' },
  screen: { flex: 1, paddingHorizontal: 24, paddingBottom: 22 },
  topRow: { alignItems: 'center', flexDirection: 'row', height: 72 },
  logoMark: { alignItems: 'center', backgroundColor: '#B5F34A', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  logoMarkText: { color: '#081C22', fontSize: 20, fontWeight: '900' },
  brand: { color: '#F3F8F6', fontSize: 19, fontWeight: '800', marginLeft: 10 },
  step: { color: '#83A7A2', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginLeft: 'auto' },
  hero: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 285, overflow: 'hidden' },
  orbitLarge: { borderColor: '#1B464B', borderRadius: 180, borderWidth: 1, height: 330, position: 'absolute', width: 330 },
  orbitSmall: { borderColor: '#28575A', borderRadius: 130, borderWidth: 1, height: 240, position: 'absolute', transform: [{ rotate: '-24deg' }], width: 240 },
  shield: { alignItems: 'center', backgroundColor: '#163D40', borderColor: '#B5F34A', borderRadius: 33, borderWidth: 1.5, height: 66, justifyContent: 'center', marginBottom: 23, width: 66 },
  shieldIcon: { color: '#B5F34A', fontSize: 34, fontWeight: '700' },
  eyebrow: { color: '#B5F34A', fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 12 },
  title: { color: '#F6FBF9', fontSize: 39, fontWeight: '800', letterSpacing: -1.4, lineHeight: 43, textAlign: 'center' },
  subtitle: { color: '#A2BCB7', fontSize: 15, lineHeight: 22, marginTop: 15, maxWidth: 305, textAlign: 'center' },
  stepsCard: { backgroundColor: '#103036', borderColor: '#214A4D', borderRadius: 20, borderWidth: 1, marginTop: 10, paddingHorizontal: 16 },
  stepRow: { alignItems: 'center', flexDirection: 'row', paddingVertical: 14 },
  stepBorder: { borderBottomColor: '#214A4D', borderBottomWidth: StyleSheet.hairlineWidth },
  stepIcon: { alignItems: 'center', backgroundColor: '#193F42', borderRadius: 12, height: 40, justifyContent: 'center', marginRight: 13, width: 40 },
  stepIconText: { color: '#B5F34A', fontSize: 20, fontWeight: '700' },
  stepCopy: { flex: 1 },
  stepTitle: { color: '#EDF7F4', fontSize: 14, fontWeight: '700' },
  stepDescription: { color: '#9DB6B1', fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  primaryButton: { alignItems: 'center', backgroundColor: '#B5F34A', borderRadius: 15, flexDirection: 'row', justifyContent: 'center', marginTop: 17, minHeight: 54, paddingHorizontal: 18 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  primaryButtonText: { color: '#092027', fontSize: 16, fontWeight: '800' },
  arrow: { color: '#092027', fontSize: 22, fontWeight: '700', marginLeft: 10 },
  privacy: { color: '#71918C', fontSize: 11, marginTop: 12, textAlign: 'center' },
});
