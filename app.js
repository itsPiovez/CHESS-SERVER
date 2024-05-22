const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const handlebars = require('express-handlebars');
const session = require('express-session');

const app = express();
const port = 3037;

// Configura il database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234', // Inserisci la tua password
  database: 'CHESS'
});

// Connetti al database
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');
});

// Middleware per il parsing del corpo delle richieste
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configura Handlebars
const hbs = handlebars.create({
  extname: '.html', // Estensione dei file template
  partialsDir: path.join(__dirname, 'front', 'views', 'partials'), // Percorso dei partials
  defaultLayout: false,
  helpers: {} // Aggiungi eventuali helper qui
});
app.engine('html', hbs.engine);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'front', 'views'));

// Configura sessioni
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Serve file statici dalla cartella /front/public
app.use('/public', express.static(path.join(__dirname, 'front', 'public')));

// Route per la pagina di registrazione
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Route per la pagina di login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Route per la homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index1.html'));
});


// Middleware per proteggere la pagina di gioco
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Route per il gioco, protetta
app.get('/game', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'views', 'index.html'));
});

// Route per la registrazione di un nuovo utente
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const newUser = { username, email, password };

  db.query('INSERT INTO users SET ?', newUser, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Registration failed');
    } else {
      console.log('User registered successfully');
      res.status(200).send('User registered successfully');
    }
  });
});

// Route per il login di un utente esistente
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Login failed');
    } else if (result.length > 0) {
      req.session.user = result[0];
      console.log('Login successful');
      require('dotenv').config();
      const path = require('path');
      require(path.join(__dirname, 'server', 'server.js'));
      res.redirect('http://localhost:3038');

    } else {
      res.status(401).send('Invalid username or password');
    }
  });
});

// Avvia il server principale
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

