require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares globais
app.use(cors());
app.use(express.json());

// inicializa Supabase (usar service_role apenas no server)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// MIDDLEWARE DE AUTENTICAÇÃO (JWT)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = payload; // contém { id, name } criado no login
    next();
  });
};

// rota pública de teste
app.get('/', (req, res) => res.send('API da Via Painéis a funcionar!'));

// rota de consulta do próprio usuário (protegida)
app.get('/me', authenticateToken, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name });
});

// Registrar: persiste em Supabase (tabela public.users)
app.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).send('Por favor, forneça email, senha e nome.');

    const { data: existing, error: selErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (selErr) {
      console.error('Erro ao consultar base de dados:', selErr);
      return res.status(500).send('Erro ao consultar base de dados.');
    }

    if (existing && existing.length > 0) return res.status(400).send('Este email já está registado.');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash, name }])
      .select();

    if (error) {
      console.error('Erro inserindo user:', error);
      return res.status(500).send('Erro ao registar utilizador.');
    }

    res.status(201).send('Utilizador registado com sucesso!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor ao tentar registar.');
  }
});

// Login: valida credenciais a partir da tabela users
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send('Por favor, forneça email e senha.');

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('Erro a buscar user:', error);
      return res.status(500).send('Erro ao consultar utilizador.');
    }

    if (!users || users.length === 0) {
      return res.status(400).send('Email ou senha inválidos.');
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).send('Email ou senha inválidos.');

    // cria token JWT local
    const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor ao tentar fazer login.');
  }
});

// Rotas de propostas (protegidas)
app.get('/propostas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro a buscar propostas:', error);
      return res.status(500).send('Erro ao buscar propostas.');
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor.');
  }
});

app.post('/propostas', authenticateToken, async (req, res) => {
  try {
    const { title, data } = req.body;
    const userId = req.user.id;

    const { data: inserted, error } = await supabase
      .from('proposals')
      .insert([{ user_id: userId, title: title, data: data }])
      .select();

    if (error) {
      console.error('Erro ao inserir proposta:', error);
      return res.status(500).send('Erro ao salvar proposta.');
    }

    res.status(201).send('Proposta salva com sucesso!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend a correr na porta ${PORT}`);
});