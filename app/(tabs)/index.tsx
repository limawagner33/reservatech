import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [matricula, setMatricula] = useState('');
  const [erro, setErro] = useState('');

  const handleLogin = () => {
    Keyboard.dismiss();
    setErro('');

    // Roteamento Administrativo
    if (matricula === '9999') {
      router.replace('/admin');
      return;
    }

    // Roteamento do Colaborador (Mínimo de 4 dígitos)
    if (matricula.length >= 4) {
      router.replace('/home');
      return;
    }

    setErro('Acesso negado. A matrícula deve ter no mínimo 4 dígitos.');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>RT</Text>
          </View>
          <Text style={styles.title}>ReservaTech</Text>
          <Text style={styles.subtitle}>Sistema de Gestão de Infraestrutura</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Matrícula de Acesso</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1234"
            placeholderTextColor="#52525B"
            keyboardType="numeric"
            value={matricula}
            onChangeText={(texto) => {
              setMatricula(texto);
              setErro(''); // Limpa o erro ao digitar
            }}
            maxLength={6}
          />

          {erro ? (
            <View style={styles.caixaErro}>
              <Text style={styles.textoErro}>{erro}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.btnAcessar} onPress={handleLogin}>
            <Text style={styles.txtAcessar}>Entrar no Sistema</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', justifyContent: 'center', padding: 24 },
  
  brandContainer: { alignItems: 'center', marginBottom: 48 },
  logoBadge: { backgroundColor: '#18181B', width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#06B6D4', marginBottom: 16 },
  logoText: { color: '#06B6D4', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FAFAFA', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#A1A1AA', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },

  card: { backgroundColor: '#18181B', padding: 32, borderRadius: 24, borderWidth: 1, borderColor: '#27272A', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  label: { color: '#D4D4D8', marginBottom: 12, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#09090B', color: '#FAFAFA', borderRadius: 12, padding: 16, fontSize: 20, borderWidth: 1, borderColor: '#27272A', marginBottom: 24, textAlign: 'center', fontWeight: 'bold', letterSpacing: 2 },
  
  caixaErro: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444', marginBottom: 24 },
  textoErro: { color: '#FCA5A5', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  btnAcessar: { backgroundColor: '#06B6D4', padding: 18, borderRadius: 12, alignItems: 'center' },
  txtAcessar: { color: '#09090B', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});