require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const users = [];
let proposals = [];

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MIDDLEWARE DE AUTENTICAÇÃO
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/', (req, res) => res.send('API da Via Painéis a funcionar!'));

app.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) return res.status(400).send('Por favor, forneça email, senha e nome.');
        if (users.find(user => user.email === email)) return res.status(400).send('Este email já está registado.');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const newUser = { id: users.length + 1, email, password_hash, name };
        users.push(newUser);
        console.log('Utilizadores registados:', users);
        res.status(201).send('Utilizador registado com sucesso!');
    } catch (error) {
        res.status(500).send('Erro no servidor ao tentar registar.');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send('Por favor, forneça email e senha.');
        const user = users.find(u => u.email === email);
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.status(400).send('Email ou senha inválidos.');
        }
        const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).send('Erro no servidor ao tentar fazer login.');
    }
});

app.get('/propostas', authenticateToken, (req, res) => {
    const userProposals = proposals.filter(p => p.userId === req.user.id);
    res.json(userProposals);
});

app.post('/propostas', authenticateToken, (req, res) => {
    const { title, data } = req.body;
    const newProposal = {
        id: proposals.length + 1,
        userId: req.user.id,
        title: title,
        data: data,
        createdAt: new Date().toISOString()
    };
    proposals.push(newProposal);
    console.log("Propostas salvas:", proposals);
    res.status(201).send('Proposta salva com sucesso!');
});

app.listen(PORT, () => {
  console.log(`Servidor backend a correr na porta ${PORT}`);
});