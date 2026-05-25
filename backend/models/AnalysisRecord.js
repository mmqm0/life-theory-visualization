module.exports = (sequelize, Sequelize) => {
  const AnalysisRecord = sequelize.define('analysis_records', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    session_id: {
      type: Sequelize.UUID,
      allowNull: false
    },
    turn_number: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    user_input: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    ai_analysis: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    entropy_stage: {
      type: Sequelize.STRING,
      allowNull: true
    },
    self_adaptation_score: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    continuation_score: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    extracted_concepts: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      defaultValue: []
    }
  }, {
    tableName: 'analysis_records',
    timestamps: true,
    underscored: true
  });

  AnalysisRecord.associate = (models) => {
    AnalysisRecord.belongsTo(models.AnalysisSession, {
      foreignKey: 'session_id',
      as: 'session'
    });
    AnalysisRecord.hasMany(models.AnalysisVector, {
      foreignKey: 'record_id',
      as: 'vectors'
    });
  };

  return AnalysisRecord;
};
