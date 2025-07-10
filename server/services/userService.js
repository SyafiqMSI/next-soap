const { pool } = require('../config/database');

class UserService {
  async getAllUsers() {
    try {
      const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
      return {
        success: true,
        data: rows,
        message: 'Users retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Error retrieving users: ${error.message}`
      };
    }
  }

  async getUserById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (rows.length === 0) {
        return {
          success: false,
          data: null,
          message: 'User not found'
        };
      }
      return {
        success: true,
        data: rows[0],
        message: 'User retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Error retrieving user: ${error.message}`
      };
    }
  }

  async createUser(userData) {
    try {
      const { name, email, phone } = userData;
      
      if (!name || !email) {
        return {
          success: false,
          data: null,
          message: 'Name and email are required'
        };
      }

      const [result] = await pool.execute(
        'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone || null]
      );

      const newUser = {
        id: result.insertId,
        name,
        email,
        phone,
        created_at: new Date(),
        updated_at: new Date()
      };

      return {
        success: true,
        data: newUser,
        message: 'User created successfully'
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          data: null,
          message: 'Email already exists'
        };
      }
      return {
        success: false,
        data: null,
        message: `Error creating user: ${error.message}`
      };
    }
  }

  async updateUser(id, userData) {
    try {
      const { name, email, phone } = userData;
      
      const [existingUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (existingUser.length === 0) {
        return {
          success: false,
          data: null,
          message: 'User not found'
        };
      }

      await pool.execute(
        'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
        [name, email, phone || null, id]
      );

      const updatedUser = {
        id: parseInt(id),
        name,
        email,
        phone,
        created_at: existingUser[0].created_at,
        updated_at: new Date()
      };

      return {
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          data: null,
          message: 'Email already exists'
        };
      }
      return {
        success: false,
        data: null,
        message: `Error updating user: ${error.message}`
      };
    }
  }

  async deleteUser(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return {
          success: false,
          data: null,
          message: 'User not found'
        };
      }

      return {
        success: true,
        data: { id: parseInt(id) },
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Error deleting user: ${error.message}`
      };
    }
  }
}

module.exports = new UserService(); 