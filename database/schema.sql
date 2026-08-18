-- CarbonRoute Relational Database Schema
-- Compatible with PostgreSQL 14+ / SQLite 3

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK(role IN ('admin', 'student', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presentations (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presentation_versions (
    id VARCHAR(64) PRIMARY KEY,
    presentation_id VARCHAR(64) REFERENCES presentations(id) ON DELETE CASCADE,
    version_tag VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploader_name VARCHAR(150) NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    presentation_date DATE NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pres_version UNIQUE (presentation_id, version_tag)
);

CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK(category IN ('presentation', 'report', 'dataset', 'diagram', 'documentation')),
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roadmap_milestones (
    id VARCHAR(64) PRIMARY KEY,
    phase_number INT NOT NULL,
    phase_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planned' CHECK(status IN ('completed', 'in-progress', 'planned')),
    dependencies JSONB DEFAULT '[]',
    deliverables JSONB DEFAULT '[]',
    start_date DATE,
    target_date DATE,
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details TEXT,
    performed_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pres_ver_tag ON presentation_versions(version_tag);
CREATE INDEX IF NOT EXISTS idx_res_cat ON resources(category);
