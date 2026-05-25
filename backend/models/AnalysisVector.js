module.exports = (sequelize, Sequelize) => {
  const AnalysisVector = sequelize.define('analysis_vectors', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    record_id: {
      type: Sequelize.UUID,
      allowNull: false
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    embedding: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    content_type: {
      type: Sequelize.STRING,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'analysis_vectors',
    timestamps: true,
    underscored: true
  });

  AnalysisVector.associate = (models) => {
    AnalysisVector.belongsTo(models.AnalysisRecord, {
      foreignKey: 'record_id',
      as: 'record'
    });
  };

  return AnalysisVector;
};