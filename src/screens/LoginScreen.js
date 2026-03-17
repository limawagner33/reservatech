import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState(''); 
  const [inputFocado, setInputFocado] = useState(null);

  const handleLogin = () => {
    setMensagem('');
    Keyboard.dismiss();

    // 1. Validação de campos vazios
    if (!matricula.trim() || !senha.trim()) {
      setTipoMensagem('erro');
      setMensagem('Matrícula e senha são obrigatórias.');
      return;
    }

    // 2. Simulação de Autenticação (Mock para a apresentação)
    // No mundo corporativo real, o React Native enviaria isso pro Java validar no banco.
    
    // Regra Admin
    if (matricula === '9999' && senha === 'admin') {
      setTipoMensagem('sucesso');
      setMensagem('Acesso Admin liberado. Redirecionando...');
      setTimeout(() => {
        router.replace('/admin');
      }, 1000);
      return;
    }

    // Regra Colaborador Comum
    if (matricula === '1234' && senha === 'user') {
      setTipoMensagem('sucesso');
      setMensagem('Acesso Colaborador liberado. Redirecionando...');
      setTimeout(() => {
        router.replace('/home');
      }, 1000);
      return;
    }

    // 3. QA Block: Se chegou aqui, não é nem admin nem usuário válido
    setTipoMensagem('erro');
    setMensagem('Credenciais incorretas. Acesso negado ao sistema.');
  };

  return (
    
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>RT</Text>
          </View>
          <Text style={styles.titulo}>Reserva<Text style={styles.tituloDestaque}>Tech</Text></Text>
          <Text style={styles.subtitulo}>Workspace Intelligence</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Matrícula Corporativa</Text>
          <TextInput
            style={[
              styles.input,
              inputFocado === 'matricula' && styles.inputAtivo,
              tipoMensagem === 'erro' && !matricula.trim() && styles.inputErro
            ]}
            placeholder="Ex: 1234/user ou 9999/admin"
            placeholderTextColor="#52525B"
            keyboardType="numeric"
            value={matricula}
            onChangeText={(text) => { setMatricula(text); setMensagem(''); }}
            onFocus={() => setInputFocado('matricula')}
            onBlur={() => setInputFocado(null)}
          />

          <Text style={styles.label}>Senha de Acesso</Text>
          <TextInput
            style={[
              styles.input,
              inputFocado === 'senha' && styles.inputAtivo,
              tipoMensagem === 'erro' && !senha.trim() && styles.inputErro
            ]}
            placeholder="••••••••"
            placeholderTextColor="#52525B"
            secureTextEntry
            value={senha}
            onChangeText={(text) => { setSenha(text); setMensagem(''); }}
            onFocus={() => setInputFocado('senha')}
            onBlur={() => setInputFocado(null)}
          />

          {mensagem ? (
            <View style={[styles.caixaMensagem, tipoMensagem === 'erro' ? styles.caixaErro : styles.caixaSucesso]}>
              <Text style={[styles.textoMensagem, tipoMensagem === 'erro' ? styles.textoErro : styles.textoSucesso]}>
                {mensagem}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.botao} onPress={handleLogin} activeOpacity={0.8}>
            <Text style={styles.botaoTexto}>Autenticar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    
  );
}

// Os estilos continuam os mesmos da versão Premium
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', justifyContent: 'center', padding: 24 },
  brandContainer: { alignItems: 'center', marginBottom: 48 },
  logoBadge: { width: 64, height: 64, backgroundColor: '#18181B', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#27272A' },
  logoText: { color: '#06B6D4', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  titulo: { fontSize: 32, fontWeight: '800', color: '#FAFAFA', letterSpacing: -0.5 },
  tituloDestaque: { color: '#06B6D4' },
  subtitulo: { fontSize: 14, color: '#A1A1AA', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' },
  card: { backgroundColor: '#18181B', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#27272A', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  label: { color: '#D4D4D8', marginBottom: 8, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#09090B', color: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  inputAtivo: { borderColor: '#06B6D4', backgroundColor: '#131316' },
  inputErro: { borderColor: '#EF4444' },
  caixaMensagem: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 },
  caixaErro: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeftColor: '#EF4444' },
  caixaSucesso: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeftColor: '#10B981' },
  textoMensagem: { fontSize: 14, fontWeight: '500' },
  textoErro: { color: '#FCA5A5' },
  textoSucesso: { color: '#6EE7B7' },
  botao: { backgroundColor: '#06B6D4', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#09090B', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }
});