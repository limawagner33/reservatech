import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecursos } from '../../src/context/RecursosContext';

interface Recurso {
  id: number;
  tipo: string;
  nome: string;
  minHoras: number;
  maxHoras: number;
  reservas?: any[];
}

export default function AdminScreen() {
  const router = useRouter();
  const { recursos, adicionarRecurso } = useRecursos();

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('SALA'); 
  
  // Motores de entrada do Relógio Digital
  const [minH, setMinH] = useState('');
  const [minM, setMinM] = useState('');
  const [maxH, setMaxH] = useState('');
  const [maxM, setMaxM] = useState('');
  
  const [aviso, setAviso] = useState('');
  const [tipoAviso, setTipoAviso] = useState<'erro' | 'sucesso' | ''>('');

  const categorias = ['SALA', 'EQUIPAMENTO', 'VEICULO', 'LABORATORIO', 'SOFTWARE'];

  const validarEntradaTempo = (texto: string, maximo: number, setValor: (v: string) => void) => {
    const valorNum = texto.replace(/[^0-9]/g, '');
    if (valorNum === '') { setValor(''); return; }
    if (parseInt(valorNum) <= maximo) setValor(valorNum);
  };

  const handleCadastrarRecurso = () => {
    Keyboard.dismiss();
    setAviso(''); setTipoAviso('');

    if (!nome.trim()) {
      setTipoAviso('erro'); setAviso('O Nome do recurso é obrigatório.'); return;
    }

    const nomeJaExiste = recursos.some((r: Recurso) => r.nome.toLowerCase() === nome.toLowerCase());
    if (nomeJaExiste) {
      setTipoAviso('erro'); setAviso('Já existe um recurso com este nome.'); return;
    }

    if (!minH || !minM || !maxH || !maxM) {
      setTipoAviso('erro'); setAviso('Preencha todos os campos do relógio digital.'); return;
    }

    const minDecimal = parseInt(minH) + (parseInt(minM) / 60);
    const maxDecimal = parseInt(maxH) + (parseInt(maxM) / 60);

    if (minDecimal <= 0 || maxDecimal <= 0) {
      setTipoAviso('erro'); setAviso('O tempo de reserva não pode ser zero.'); return;
    }
    if (minDecimal > maxDecimal) {
      setTipoAviso('erro'); setAviso('O tempo mínimo não pode ser maior que o máximo.'); return;
    }

    adicionarRecurso({ nome, tipo, minHoras: minDecimal, maxHoras: maxDecimal });
    
    setTipoAviso('sucesso'); setAviso(`SUCESSO: ${nome} cadastrado.`);
    setNome(''); setTipo('SALA');
    setMinH(''); setMinM(''); setMaxH(''); setMaxM('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.saudacao}>Painel Admin</Text>
            <Text style={styles.subSaudacao}>Cadastro de Infraestrutura</Text>
          </View>
          <TouchableOpacity style={styles.btnSair} onPress={() => router.replace('/')}>
            <Text style={styles.txtSair}>Sair</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnGerenciar} onPress={() => router.push('/admin-lista')}>
          <Text style={styles.txtGerenciar}>Acessar Recursos Cadastrados</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Novo Recurso</Text>

          <Text style={styles.label}>Nome do Recurso</Text>
          <TextInput style={styles.input} placeholder="Ex: Laboratório Maker" placeholderTextColor="#52525B" value={nome} onChangeText={setNome} />

          <Text style={styles.label}>Categoria do Recurso</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollChips} keyboardShouldPersistTaps="handled">
            {categorias.map(cat => (
              <TouchableOpacity key={cat} style={[styles.chip, tipo === cat && styles.chipAtivo]} onPress={() => setTipo(cat)}>
                <Text style={[styles.chipTexto, tipo === cat && styles.chipTextoAtivo]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.blocoTempo}>
            <Text style={styles.labelTempo}>TEMPO MÍNIMO (HH:MM)</Text>
            <View style={styles.relogioDigitalContainer}>
              <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={minH} onChangeText={(v) => validarEntradaTempo(v, 48, setMinH)} />
              <Text style={styles.separadorRelogio}>:</Text>
              <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={minM} onChangeText={(v) => validarEntradaTempo(v, 59, setMinM)} />
            </View>
          </View>

          <View style={styles.blocoTempo}>
            <Text style={styles.labelTempo}>TEMPO MÁXIMO (HH:MM)</Text>
            <View style={styles.relogioDigitalContainer}>
              <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={maxH} onChangeText={(v) => validarEntradaTempo(v, 48, setMaxH)} />
              <Text style={styles.separadorRelogio}>:</Text>
              <TextInput style={styles.inputRelogio} placeholder="00" placeholderTextColor="#52525B" keyboardType="numeric" maxLength={2} value={maxM} onChangeText={(v) => validarEntradaTempo(v, 59, setMaxM)} />
            </View>
          </View>

          {aviso ? (
            <View style={[styles.caixaMensagem, tipoAviso === 'erro' ? styles.caixaErro : styles.caixaSucesso]}>
              <Text style={[styles.textoMensagem, tipoAviso === 'erro' ? styles.textoErro : styles.textoSucesso]}>{aviso}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.btnConfirmar} onPress={handleCadastrarRecurso}>
            <Text style={styles.txtConfirmar}>Registrar no Sistema</Text>
          </TouchableOpacity>
        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 32 },
  saudacao: { fontSize: 24, fontWeight: 'bold', color: '#06B6D4', letterSpacing: -0.5 },
  subSaudacao: { fontSize: 14, color: '#A1A1AA', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  btnSair: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#27272A' },
  txtSair: { color: '#EF4444', fontWeight: '600', textTransform: 'uppercase', fontSize: 12 },
  btnGerenciar: { backgroundColor: '#18181B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#06B6D4', alignItems: 'center', marginBottom: 24 },
  txtGerenciar: { color: '#06B6D4', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#18181B', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#27272A' },
  sectionTitle: { fontSize: 14, color: '#FAFAFA', fontWeight: '700', textTransform: 'uppercase', marginBottom: 24, letterSpacing: 1 },
  label: { color: '#D4D4D8', marginBottom: 8, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#09090B', color: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  scrollChips: { marginBottom: 24, flexDirection: 'row' },
  chip: { backgroundColor: '#09090B', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#27272A', marginRight: 10, height: 45, justifyContent: 'center' },
  chipAtivo: { backgroundColor: '#131316', borderColor: '#06B6D4' },
  chipTexto: { color: '#A1A1AA', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  chipTextoAtivo: { color: '#06B6D4' },
  blocoTempo: { backgroundColor: '#09090B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginBottom: 20 },
  labelTempo: { color: '#06B6D4', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  btnConfirmar: { backgroundColor: '#06B6D4', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  txtConfirmar: { color: '#09090B', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  caixaMensagem: { padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4 },
  caixaErro: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeftColor: '#EF4444' },
  caixaSucesso: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeftColor: '#10B981' },
  textoMensagem: { fontSize: 14, fontWeight: '600' },
  textoErro: { color: '#FCA5A5' },
  textoSucesso: { color: '#6EE7B7' },
  relogioDigitalContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#131316', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', marginTop: 8 },
  inputRelogio: { backgroundColor: '#09090B', color: '#06B6D4', fontSize: 32, fontWeight: 'bold', textAlign: 'center', width: 80, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#3F3F46' },
  separadorRelogio: { color: '#FAFAFA', fontSize: 32, fontWeight: 'bold', marginHorizontal: 16, paddingBottom: 6 },
});