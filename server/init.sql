USE soap_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO users (name, email, phone) VALUES
('John Doe', 'john@example.com', '08123456789'),
('Jane Smith', 'jane@example.com', '08123456788'),
('Bob Johnson', 'bob@example.com', '08123456787');

CREATE USER IF NOT EXISTS 'soap_user'@'%' IDENTIFIED BY 'soap_password';
GRANT ALL PRIVILEGES ON soap_db.* TO 'soap_user'@'%';
FLUSH PRIVILEGES; 