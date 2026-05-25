module.exports = (sequelize, Sequelize) => {
  const Simulation = sequelize.define('simulations', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    negative_entropy_rate: {
      type: Sequelize.INTEGER,
      defaultValue: 50,
      validate: { min: 0, max: 100 }
    },
    positive_entropy_rate: {
      type: Sequelize.INTEGER,
      defaultValue: 50,
      validate: { min: 0, max: 100 }
    },
    pressure: {
      type: Sequelize.INTEGER,
      defaultValue: 50,
      validate: { min: 0, max: 100 }
    },
    resources: {
      type: Sequelize.INTEGER,
      defaultValue: 50,
      validate: { min: 0, max: 100 }
    },
    final_entropy: {
      type: Sequelize.FLOAT,
      defaultValue: 50
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: 'stable'
    },
    entropy_history: {
      type: Sequelize.ARRAY(Sequelize.FLOAT),
      defaultValue: []
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true
    }
  }, {
    tableName: 'simulations',
    timestamps: true,
    underscored: true
  });

  Simulation.associate = (models) => {
    Simulation.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' });
  };

  return Simulation;
};