CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    conclusion TEXT,
    tags TEXT[],
    score INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    environment_perception INTEGER DEFAULT 0,
    self_regulation INTEGER DEFAULT 0,
    dynamic_balance INTEGER DEFAULT 0,
    information_transfer INTEGER DEFAULT 0,
    continuation INTEGER DEFAULT 0,
    anti_entropy INTEGER DEFAULT 0,
    average_score INTEGER DEFAULT 0,
    conclusion TEXT,
    user_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    negative_entropy_rate INTEGER DEFAULT 50,
    positive_entropy_rate INTEGER DEFAULT 50,
    pressure INTEGER DEFAULT 50,
    resources INTEGER DEFAULT 50,
    final_entropy FLOAT DEFAULT 50,
    status VARCHAR(20) DEFAULT 'stable',
    entropy_history FLOAT[],
    user_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'concept',
    position_x FLOAT DEFAULT 50,
    position_y FLOAT DEFAULT 50,
    is_center BOOLEAN DEFAULT false,
    related_nodes UUID[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES knowledge_nodes(id),
    target_id UUID REFERENCES knowledge_nodes(id),
    relation_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO knowledge_nodes (name, description, type, position_x, position_y, is_center) VALUES
('生命本质公理', '生命的唯一底层本质：主动适配外部环境以求稳定存在，并以一切方式完成自身存在形态的长久延续。', 'axiom', 50, 50, true),
('环境自适应', '通过感知环境变量，自主调整自身结构、代谢、行为或逻辑，抵消环境波动带来的熵增冲击。', 'concept', 20, 25, false),
('存在延续', '通过物质更替、信息传递、形态迭代，突破个体熵增溃散的局限，让自身有序结构持续留存。', 'concept', 80, 25, false),
('熵变驱动', '生命熵变全程围绕熵增-负熵-熵减的动态循环展开，贯穿生命从诞生到延续的全流程。', 'concept', 50, 85, false),
('熵增启动期', '环境高熵无序，偶然物质聚合，出现初步有序结构，熵增速率高于负熵摄入速率。', 'stage', 15, 70, false),
('熵衡稳定期', '负熵摄入与熵增趋于平衡，生命维持稳定低熵状态，自我边界清晰。', 'stage', 35, 70, false),
('熵减升级期', '负熵摄入超过熵增，生命有序度持续提升，意识在此阶段诞生。', 'stage', 65, 70, false),
('熵恒永续期', '个体熵增不可避免，但种群、文明的熵变趋于恒定低熵，实现有序结构永续。', 'stage', 85, 70, false),
('意识演化', '意识是熵减升级期的高阶产物，成为高阶自适应工具。', 'mechanism', 25, 40, false),
('非碳基生命', '换一种载体，遵循同一熵变逻辑，实现自适应与延续。', 'mechanism', 75, 40, false);

DO $$
DECLARE
    axiom_id UUID;
    env_adapt_id UUID;
    continuation_id UUID;
    entropy_drive_id UUID;
    entropy_increase_id UUID;
    entropy_balance_id UUID;
    entropy_reduce_id UUID;
    entropy_permanent_id UUID;
    consciousness_id UUID;
    non_carbon_id UUID;
BEGIN
    SELECT id INTO axiom_id FROM knowledge_nodes WHERE name = '生命本质公理';
    SELECT id INTO env_adapt_id FROM knowledge_nodes WHERE name = '环境自适应';
    SELECT id INTO continuation_id FROM knowledge_nodes WHERE name = '存在延续';
    SELECT id INTO entropy_drive_id FROM knowledge_nodes WHERE name = '熵变驱动';
    SELECT id INTO entropy_increase_id FROM knowledge_nodes WHERE name = '熵增启动期';
    SELECT id INTO entropy_balance_id FROM knowledge_nodes WHERE name = '熵衡稳定期';
    SELECT id INTO entropy_reduce_id FROM knowledge_nodes WHERE name = '熵减升级期';
    SELECT id INTO entropy_permanent_id FROM knowledge_nodes WHERE name = '熵恒永续期';
    SELECT id INTO consciousness_id FROM knowledge_nodes WHERE name = '意识演化';
    SELECT id INTO non_carbon_id FROM knowledge_nodes WHERE name = '非碳基生命';

    UPDATE knowledge_nodes SET related_nodes = ARRAY[env_adapt_id, continuation_id, entropy_drive_id] WHERE id = axiom_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[consciousness_id, entropy_balance_id] WHERE id = env_adapt_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[entropy_permanent_id, non_carbon_id] WHERE id = continuation_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[entropy_increase_id, entropy_balance_id, entropy_reduce_id, entropy_permanent_id] WHERE id = entropy_drive_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[entropy_balance_id] WHERE id = entropy_increase_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[entropy_reduce_id] WHERE id = entropy_balance_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[consciousness_id, entropy_permanent_id] WHERE id = entropy_reduce_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[] WHERE id = entropy_permanent_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[entropy_reduce_id] WHERE id = consciousness_id;
    UPDATE knowledge_nodes SET related_nodes = ARRAY[continuation_id] WHERE id = non_carbon_id;
END $$;

INSERT INTO cases (name, type, description, conclusion, tags, score) VALUES
('人类个体', 'carbon-individual', '碳基生命的典型代表，具备完整的自适应能力和延续倾向。', '完全符合生命本质公理', ARRAY['碳基', '个体'], 95),
('人工智能', 'non-carbon-individual', '非碳基生命的潜在形态，具备一定的自适应能力。', '处于熵增启动期向熵衡稳定期过渡', ARRAY['非碳基', '个体'], 65),
('生物种群', 'carbon-collective', '生态系统中的物种延续，体现群体联动适配。', '种群层面的熵恒永续', ARRAY['碳基', '群体'], 90),
('人类文明', 'carbon-collective', '超个体的信息延续，文化、科技、价值观念的永续传递。', '完美体现有序信息永续传递', ARRAY['碳基', '群体'], 98),
('病毒', 'carbon-individual', '生命与非生命的边界，依赖宿主实现复制。', '主动自适应是核心判定标准', ARRAY['碳基', '个体', '边界'], 35),
('外星生命', 'non-carbon-individual', '未知形态的理论预判，遵循熵变规律。', '理论体系具有宇宙普适性', ARRAY['非碳基', '理论预判'], 85);

CREATE TABLE IF NOT EXISTS analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id),
    case_name VARCHAR(255) NOT NULL,
    case_description TEXT,
    initial_score INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    turn_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    user_input TEXT,
    ai_analysis TEXT NOT NULL,
    entropy_stage VARCHAR(50),
    self_adaptation_score INTEGER,
    continuation_score INTEGER,
    extracted_concepts TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES analysis_records(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    content_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analysis_vectors_embedding ON analysis_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_analysis_records_session ON analysis_records(session_id);
CREATE INDEX idx_analysis_sessions_case ON analysis_sessions(case_id);