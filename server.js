require('dotenv').config();
const express = require('express');
const cors = require('cors');
// O bcryptjs não é mais necessário, o Supabase gerencia isso
// const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Inicializa Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); // Usar a chave ANON para auth do cliente

// MIDDLEWARE DE AUTENTICAÇÃO (JWT) - Sem alterações
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = payload; 
    next();
  });
};

// --- NOVAS ROTAS DE AUTENTICAÇÃO ---

// Registrar: agora usa supabase.auth.signUp
app.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).send('Por favor, forneça email, senha e nome.');
    }

    // PONTO CRUCIAL 1: Validação do domínio do e-mail
    if (!email.endsWith('@viapaineis.com.br')) {
        return res.status(400).send('Cadastro permitido apenas para e-mails do domínio @viapaineis.com.br.');
    }

    // PONTO CRUCIAL 2: Usa o método signUp do Supabase
    // Ele cria o usuário e envia o e-mail de confirmação automaticamente
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Armazena dados adicionais, como o nome, no momento do cadastro
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      console.error('Erro no registro do Supabase:', error.message);
      // Retorna uma mensagem de erro mais genérica para o usuário
      return res.status(400).send(error.message || 'Erro ao registrar usuário.');
    }
    
    // O usuário foi criado mas precisa confirmar o e-mail.
    res.status(201).send('Usuário registrado com sucesso! Por favor, verifique seu e-mail para confirmar a conta.');

  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor ao tentar registrar.');
  }
});

// Login: agora usa supabase.auth.signInWithPassword
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send('Por favor, forneça email e senha.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      // O Supabase retorna um erro específico se o e-mail não foi confirmado
      if (error.message === 'Email not confirmed') {
        return res.status(401).send('Login falhou: E-mail ainda não confirmado. Verifique sua caixa de entrada.');
      }
      console.error('Erro de login do Supabase:', error.message);
      return res.status(400).send('Email ou senha inválidos.');
    }

    // Se o login for bem-sucedido, o `data.session.access_token` é o JWT
    // Usamos o segredo do seu .env para criar um token consistente com o resto da sua aplicação
    const userPayload = { 
        id: data.user.id, 
        name: data.user.user_metadata.full_name 
    };
    const appToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({ token: appToken, user: userPayload });

  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor ao tentar fazer login.');
  }
});


// --- ROTAS DE PROPOSTAS (Sem alterações) ---

app.get('/propostas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    res.status(500).send('Erro no servidor ao buscar propostas.');
  }
});

app.post('/propostas', authenticateToken, async (req, res) => {
  try {
    const { title, data: proposalData } = req.body; // Renomeado para evitar conflito
    const userId = req.user.id;

    const { data: inserted, error } = await supabase
      .from('proposals')
      .insert([{ user_id: userId, title: title, data: proposalData }])
      .select();

    if (error) throw error;
    res.status(201).send('Proposta salva com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar proposta:', error);
    res.status(500).send('Erro no servidor ao salvar proposta.');
  }
});


app.listen(PORT, () => {
  console.log(`Servidor backend a correr na porta ${PORT}`);
});