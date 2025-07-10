const express = require('express');
const soap = require('soap');
const cors = require('cors');
const path = require('path');
const { testConnection, initDatabase } = require('./config/database');
const userService = require('./services/userService');

const app = express();
const PORT = process.env.PORT || 9720;

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

const corsOptions = {
  origin: [
    'http://localhost:30000',
    'http://localhost:3000',
    'https://soap-sister.syafiqibra.site',
    'http://soap-sister.syafiqibra.site',
    'http://localhost:9720',
    'https://api-soap-sister.syafiqibra.site',
    'http://api-soap-sister.syafiqibra.site',
    '*'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'SOAPAction', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'User-Agent',
    'Host'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options('*', cors(corsOptions));

const userSoapService = {
  UserService: {
    UserPort: {
      getAllUsers: async function(args) {
        try {
          const result = await userService.getAllUsers();
          return {
            success: result.success || false,
            data: result.data ? JSON.stringify(result.data) : '[]',
            message: result.message || 'Operation completed'
          };
        } catch (error) {
          return {
            success: false,
            data: '[]',
            message: error.message || 'Internal server error'
          };
        }
      },

      getUserById: async function(args) {
        try {
          const result = await userService.getUserById(args.id);
          return {
            success: result.success || false,
            data: result.data ? JSON.stringify(result.data) : null,
            message: result.message || 'Operation completed'
          };
        } catch (error) {
          return {
            success: false,
            data: null,
            message: error.message || 'Internal server error'
          };
        }
      },

      createUser: async function(args) {
        try {
          const userData = {
            name: args.name || '',
            email: args.email || '',
            phone: args.phone || ''
          };
          const result = await userService.createUser(userData);
          return {
            success: result.success || false,
            data: result.data ? JSON.stringify(result.data) : null,
            message: result.message || 'Operation completed'
          };
        } catch (error) {
          return {
            success: false,
            data: null,
            message: error.message || 'Internal server error'
          };
        }
      },

      updateUser: async function(args) {
        try {
          const userData = {
            name: args.name || '',
            email: args.email || '',
            phone: args.phone || ''
          };
          const result = await userService.updateUser(args.id, userData);
          return {
            success: result.success || false,
            data: result.data ? JSON.stringify(result.data) : null,
            message: result.message || 'Operation completed'
          };
        } catch (error) {
          return {
            success: false,
            data: null,
            message: error.message || 'Internal server error'
          };
        }
      },

      deleteUser: async function(args) {
        try {
          const result = await userService.deleteUser(args.id);
          return {
            success: result.success || false,
            data: result.data ? JSON.stringify(result.data) : null,
            message: result.message || 'Operation completed'
          };
        } catch (error) {
          return {
            success: false,
            data: null,
            message: error.message || 'Internal server error'
          };
        }
      }
    }
  }
};

const xml = require('fs').readFileSync(path.join(__dirname, 'wsdl', 'user.wsdl'), 'utf8');

let soapServer;
try {
  soapServer = soap.listen(app, '/soap', userSoapService, xml);

  soapServer.on('error', function(err) {
    console.error('SOAP Server Error:', err);
  });

  soapServer.log = (type, data) => {
    if (type === 'received') {
      console.log('SOAP Request received:', data);
    } else if (type === 'replied') {
      console.log('SOAP Response sent:', data);
    }
  };

  soapServer.on('unhandledRejection', (reason, promise) => {
    console.error('SOAP Unhandled Rejection at:', promise, 'reason:', reason);
  });

  console.log('SOAP Server initialized successfully');
} catch (error) {
  console.error('Failed to initialize SOAP server:', error);
  process.exit(1);
}

app.use('/soap', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, SOAPAction, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, User-Agent, Host');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await userService.getAllUsers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await userService.getUserById(req.params.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/ping', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

app.get('/wsdl', (req, res) => {
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

app.get('/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'SOAP User Service'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'SOAP User Service API',
    endpoints: {
      soap: '/soap',
      wsdl: '/wsdl',
      rest: '/api/users',
      health: '/health',
      testCors: '/test-cors'
    },
    documentation: 'Use SOAP client to access /soap endpoint or get WSDL from /wsdl'
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    console.log('Starting SOAP Server...');
    console.log('Environment:', {
      PORT: process.env.PORT || 9720,
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_NAME: process.env.DB_NAME || 'soap_db',
      NODE_ENV: process.env.NODE_ENV || 'development'
    });

    console.log('Testing database connection...');
    await testConnection();
    console.log('Database connection successful');
    
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialization successful');
    
    const server = app.listen(PORT, () => {
      console.log(`SOAP Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
      console.error('HTTP Server Error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 