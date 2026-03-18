import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState(''); // Novo Campo Visual
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleLogin = () => {
    Keyboard.dismiss(); setErro('');
    if (matricula.length < 4 || senha.length < 3) {
      setErro('Verifique sua matrícula e senha.'); return;
    }

    setSucesso(true); // Dispara toast verde
    setTimeout(() => {
      setSucesso(false);
      if (matricula === '9999') { router.replace('/admin'); } else { router.replace('/home'); }
    }, 1500);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {sucesso && (
        <View style={styles.toastSucesso}>
          <Text style={styles.txtToastSucesso}>✓ Login Bem-Sucedido</Text>
        </View>
      )}

      <View style={styles.cardLogin}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>RT</Text>
          </View>
          <Text style={styles.title}>ReservaTech</Text>
          <Text style={styles.subtitle}>Gestão de Infraestrutura</Text>
        </View>

        <Text style={styles.labelInput}>Matrícula</Text>
        <TextInput style={styles.inputLogin} placeholder="Ex: 1234" placeholderTextColor="#A1A1AA" keyboardType="numeric" value={matricula} onChangeText={setMatricula} maxLength={6} />

        <Text style={styles.labelInput}>Senha</Text>
        <TextInput style={styles.inputLogin} placeholder="••••••••" placeholderTextColor="#A1A1AA" secureTextEntry value={senha} onChangeText={setSenha} />

        {erro ? (
          <View style={styles.caixaErro}><Text style={styles.textoErro}>{erro}</Text></View>
        ) : null}

        <TouchableOpacity style={styles.btnEntrar} onPress={handleLogin}>
          <Text style={styles.txtEntrar}>Acessar Sistema</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 24 },
  toastSucesso: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, zIndex: 9999, flexDirection: 'row', alignItems: 'center' },
  txtToastSucesso: { color: '#047857', fontSize: 14, fontWeight: 'bold' },
  brandContainer: { alignItems: 'center', marginBottom: 32 },
  logoBadge: { backgroundColor: '#F8FAFC', width: 70, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0047AB', marginBottom: 16 },
  logoText: { color: '#0047AB', fontSize: 28, fontWeight: '900' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#171717' }, subtitle: { fontSize: 12, color: '#52525B', textTransform: 'uppercase', letterSpacing: 1 },
  cardLogin: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  labelInput: { color: '#52525B', marginBottom: 8, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  inputLogin: { backgroundColor: '#F8FAFC', color: '#171717', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  caixaErro: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444', marginBottom: 20 },
  textoErro: { color: '#B91C1C', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  btnEntrar: { backgroundColor: '#0047AB', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 }, txtEntrar: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
});