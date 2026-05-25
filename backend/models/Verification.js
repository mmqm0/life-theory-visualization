module.exports = (sequelize, Sequelize) => {
  const Verification = sequelize.define('verifications', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    environment_perception: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    self_regulation: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    dynamic_balance: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    information_transfer: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    continuation: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    anti_entropy: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    average_score: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    conclusion: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true
    }
  }, {
    tableName: 'verifications',
    timestamps: true,
    underscored: true
  });

  Verification.associate = (models) => {
    Verification.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' });
  };

  return Verification;
};