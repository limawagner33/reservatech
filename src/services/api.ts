import axios from 'axios';

// Configuração do motor de requisições
const api = axios.create({
  // DICA DE OURO: No emulador do Android Studio, "localhost" não funciona para chamar o Java.
  // O IP correto que o Android usa para enxergar a sua máquina física é o 10.0.2.2
  // Quando formos colocar na nuvem, trocaremos isso pela URL do Render.
  baseURL: 'http://10.0.2.2:8080/api',
  
  // QA Block: Timeout de segurança. Se o servidor Java demorar mais de 10 segundos,
  // a requisição é cancelada automaticamente para não congelar a tela do usuário.
  timeout: 10000, 
  
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor: Malha fina de QA Global para a Rede
api.interceptors.response.use(
  (response) => {
    // Se o Java respondeu com sucesso (Status 200 ou 201), passa direto
    return response;
  },
  (error) => {
    // Se o Java estiver desligado ou der erro 500, o sistema intercepta aqui
    // antes de quebrar a tela do aplicativo
    console.error('QA Network Block - Falha na comunicação com o servidor:', error.message);
    return Promise.reject(error);
  }
);

export default api;