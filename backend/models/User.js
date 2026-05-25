module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('users', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.STRING,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'moderator', 'admin']]
      }
    },
    avatar_url: {
      type: Sequelize.STRING,
      allowNull: true
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    last_login_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  User.associate = (models) => {
    User.hasMany(models.Case, { as: 'created_cases', foreignKey: 'created_by' });
    User.hasMany(models.Case, { as: 'updated_cases', foreignKey: 'updated_by' });
    User.hasMany(models.Verification, { as: 'verifications', foreignKey: 'user_id' });
    User.hasMany(models.Simulation, { as: 'simulations', foreignKey: 'user_id' });
  };

  return User;
};