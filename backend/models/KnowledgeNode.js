module.exports = (sequelize, Sequelize) => {
  const KnowledgeNode = sequelize.define('knowledge_nodes', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    type: {
      type: Sequelize.STRING,
      defaultValue: 'concept',
      validate: {
        isIn: [['axiom', 'concept', 'stage', 'mechanism', 'conclusion']]
      }
    },
    position_x: {
      type: Sequelize.FLOAT,
      defaultValue: 50
    },
    position_y: {
      type: Sequelize.FLOAT,
      defaultValue: 50
    },
    is_center: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    related_nodes: {
      type: Sequelize.ARRAY(Sequelize.UUID),
      defaultValue: []
    }
  }, {
    tableName: 'knowledge_nodes',
    timestamps: true,
    underscored: true
  });

  KnowledgeNode.associate = (models) => {
    KnowledgeNode.belongsToMany(models.KnowledgeNode, {
      through: 'knowledge_relations',
      as: 'related',
      foreignKey: 'source_id',
      otherKey: 'target_id'
    });
  };

  return KnowledgeNode;
};