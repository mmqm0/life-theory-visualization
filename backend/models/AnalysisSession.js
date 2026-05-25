module.exports = (sequelize, Sequelize) => {
  const AnalysisSession = sequelize.define('analysis_sessions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    case_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    case_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    case_description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    initial_score: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'completed', 'archived']]
      }
    },
    turn_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'analysis_sessions',
    timestamps: true,
    underscored: true
  });

  AnalysisSession.associate = (models) => {
    AnalysisSession.hasMany(models.AnalysisRecord, {
      foreignKey: 'session_id',
      as: 'records'
    });
  };

  return AnalysisSession;
};
