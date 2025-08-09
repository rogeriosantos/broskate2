-- BroSkate Database Schema
-- PostgreSQL database for skateboarding social network

-- Create the broskate schema
CREATE SCHEMA IF NOT EXISTS broskate;

-- Set the search path to use the broskate schema
SET search_path TO broskate, public;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for skaters
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255), -- bcrypt hashed password
    profile_image_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
    favorite_tricks TEXT[], -- Array of favorite trick names
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_guest BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Shops table for skate shops
CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_email VARCHAR(255),
    website_url TEXT,
    logo_url TEXT,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Skate spots table
CREATE TABLE skate_spots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    spot_type VARCHAR(50) CHECK (spot_type IN ('park', 'street', 'bowl', 'vert', 'mini_ramp', 'plaza', 'stairs')),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    features TEXT[], -- Array of features like 'rails', 'ledges', 'stairs', 'bowl', etc.
    image_urls TEXT[], -- Array of image URLs
    added_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Shop memberships (many-to-many relationship)
CREATE TABLE shop_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'team_rider', 'admin')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, shop_id)
);

-- Spot check-ins
CREATE TABLE spot_checkins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    spot_id INTEGER REFERENCES skate_spots(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- User follows (social feature)
CREATE TABLE user_follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Shop events
CREATE TABLE shop_events (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) CHECK (event_type IN ('session', 'competition', 'demo', 'sale', 'meet')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location TEXT,
    image_url TEXT,
    max_participants INTEGER,
    created_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Event RSVPs
CREATE TABLE event_rsvps (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES shop_events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rsvp_status VARCHAR(20) DEFAULT 'going' CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
    rsvp_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Indexes for performance optimization

-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Shop indexes
CREATE INDEX idx_shops_location ON shops(latitude, longitude);
CREATE INDEX idx_shops_name ON shops(name);
CREATE INDEX idx_shops_created_at ON shops(created_at);
CREATE INDEX idx_shops_owner_id ON shops(owner_id);

-- Skate spots indexes (critical for geo-queries)
CREATE INDEX idx_spots_location ON skate_spots(latitude, longitude);
CREATE INDEX idx_spots_type ON skate_spots(spot_type);
CREATE INDEX idx_spots_difficulty ON skate_spots(difficulty_level);
CREATE INDEX idx_spots_created_at ON skate_spots(created_at);
CREATE INDEX idx_spots_added_by ON skate_spots(added_by_user_id);

-- Membership indexes
CREATE INDEX idx_memberships_user_id ON shop_memberships(user_id);
CREATE INDEX idx_memberships_shop_id ON shop_memberships(shop_id);

-- Check-in indexes
CREATE INDEX idx_checkins_user_id ON spot_checkins(user_id);
CREATE INDEX idx_checkins_spot_id ON spot_checkins(spot_id);
CREATE INDEX idx_checkins_time ON spot_checkins(checked_in_at);

-- Follow indexes
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Event indexes
CREATE INDEX idx_events_shop_id ON shop_events(shop_id);
CREATE INDEX idx_events_start_time ON shop_events(start_time);
CREATE INDEX idx_events_type ON shop_events(event_type);

-- RSVP indexes
CREATE INDEX idx_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_rsvps_user_id ON event_rsvps(user_id);

-- Composite indexes for common queries
CREATE INDEX idx_spots_location_type ON skate_spots(latitude, longitude, spot_type);
CREATE INDEX idx_spots_active_approved ON skate_spots(is_active, is_approved);
CREATE INDEX idx_events_shop_time ON shop_events(shop_id, start_time) WHERE is_active = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spots_updated_at BEFORE UPDATE ON skate_spots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();