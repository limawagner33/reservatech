import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos } from '../context/RecursosContext';

export default function LoginScreen() {
  const router = useRouter();
  
  // PUXANDO O TEMA GLOBAL DO CONTEXTO
  const { tema, alternarTema } = useRecursos();
  
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  // PALETA DINÂMICA
  const isDark = tema === 'dark';
  const c = {
    bg: isDark ? '#09090B' : '#FFFFFF',
    card: isDark ? '#18181B' : '#F8FAFC',
    textoPri: isDark ? '#FAFAFA' : '#171717',
    textoSec: isDark ? '#A1A1AA' : '#52525B',
    borda: isDark ? '#27272A' : '#E2E8F0',
    inputBg: isDark ? '#09090B' : '#FFFFFF',
    destaque: '#0047AB'
  };

  const handleLogin = () => {
    Keyboard.dismiss(); setErro('');
    if (matricula.length < 4 || senha.length < 3) {
      setErro('Verifique sua matrícula e senha.'); return;
    }
    setSucesso(true);
    setTimeout(() => {
      setSucesso(false);
      if (matricula === '9999') { router.replace('/admin'); } else { router.replace('/home'); }
    }, 1500);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: c.bg }]}>
      
      {/* BOTÃO DE TEMA NO TOPO */}
      <View style={styles.headerLogin}>
        <TouchableOpacity onPress={alternarTema} style={[styles.btnTema, { backgroundColor: c.card, borderColor: c.borda }]}>
          <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {sucesso && (
        <View style={styles.toastSucesso}>
          <Text style={styles.txtToastSucesso}>✓ Login Bem-Sucedido</Text>
        </View>
      )}

      <View style={[styles.cardLogin, { backgroundColor: c.card, borderColor: c.borda }]}>
        <View style={styles.brandContainer}>
          <View style={[styles.logoBadge, { backgroundColor: c.inputBg }]}>
            <Text style={styles.logoText}>RT</Text>
          </View>
          <Text style={[styles.title, { color: c.textoPri }]}>ReservaTech</Text>
          <Text style={[styles.subtitle, { color: c.textoSec }]}>Gestão de Infraestrutura</Text>
        </View>

        <Text style={[styles.labelInput, { color: c.textoSec }]}>Matrícula</Text>
        <TextInput style={[styles.inputLogin, { backgroundColor: c.inputBg, color: c.textoPri, borderColor: c.borda }]} placeholder="Ex: 1234" placeholderTextColor={c.textoSec} keyboardType="numeric" value={matricula} onChangeText={(t) => {setMatricula(t); setErro('');}} maxLength={6} />

        <Text style={[styles.labelInput, { color: c.textoSec }]}>Senha</Text>
        <TextInput style={[styles.inputLogin, { backgroundColor: c.inputBg, color: c.textoPri, borderColor: c.borda }]} placeholder="••••••••" placeholderTextColor={c.textoSec} secureTextEntry value={senha} onChangeText={(t) => {setSenha(t); setErro('');}} />

        {erro ? (
          <View style={[styles.caixaErro, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderLeftColor: '#EF4444' }]}>
            <Text style={{ color: isDark ? '#FCA5A5' : '#B91C1C', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>{erro}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.btnEntrar, { backgroundColor: c.destaque }]} onPress={handleLogin}>
          <Text style={styles.txtEntrar}>Acessar Sistema</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  headerLogin: { position: 'absolute', top: 50, right: 24, zIndex: 10 },
  btnTema: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  toastSucesso: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, zIndex: 9999 },
  txtToastSucesso: { color: '#047857', fontSize: 14, fontWeight: 'bold' },
  brandContainer: { alignItems: 'center', marginBottom: 32 },
  logoBadge: { width: 70, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0047AB', marginBottom: 16 },
  logoText: { color: '#0047AB', fontSize: 28, fontWeight: '900' },
  title: { fontSize: 24, fontWeight: 'bold' }, 
  subtitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  cardLogin: { padding: 32, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  labelInput: { marginBottom: 8, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  inputLogin: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 20 },
  caixaErro: { padding: 12, borderRadius: 8, borderLeftWidth: 4, marginBottom: 20 },
  btnEntrar: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 }, 
  txtEntrar: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
});