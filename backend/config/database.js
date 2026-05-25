require('dotenv').config();

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'LifeTheory@2024',
    database: process.env.POSTGRES_DB || 'life_theory_db',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    schema: process.env.POSTGRES_SCHEMA || 'public',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true
    }
  },
  test: {
    username: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'LifeTheory@2024',
    database: process.env.TEST_POSTGRES_DB || 'life_theory_test',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    schema: process.env.POSTGRES_SCHEMA || 'public',
    logging: false
  },
  production: {
    username: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'LifeTheory@2024',
    database: process.env.POSTGRES_DB || 'life_theory_db',
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    schema: process.env.POSTGRES_SCHEMA || 'public',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};