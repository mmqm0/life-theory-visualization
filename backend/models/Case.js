module.exports = (sequelize, Sequelize) => {
  const Case = sequelize.define('cases', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isIn: [['carbon-individual', 'carbon-collective', 'non-carbon-individual', 'non-carbon-collective']]
      }
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    conclusion: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    tags: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: []
    },
    score: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    is_published: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true
    }
  }, {
    tableName: 'cases',
    timestamps: true,
    underscored: true
  });

  Case.associate = (models) => {
    Case.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
    Case.belongsTo(models.User, { as: 'updater', foreignKey: 'updated_by' });
  };

  return Case;
};