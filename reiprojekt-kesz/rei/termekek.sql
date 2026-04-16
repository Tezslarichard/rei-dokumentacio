
CREATE DATABASE IF NOT EXISTS rei_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rei_db;


CREATE TABLE IF NOT EXISTS kategoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) UNIQUE,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS termekek (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price VARCHAR(50) NOT NULL,
    color VARCHAR(50),
    description TEXT,
    kategoria_id INT,
    image_url VARCHAR(500),
    stock INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategoria_id) REFERENCES kategoria(id) ON DELETE SET NULL,
    INDEX idx_kategoria (kategoria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS felhasznalok (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    is_admin TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rendeles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES felhasznalok(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS rendeles_tetel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rendeles_id INT NOT NULL,
    termek_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price VARCHAR(50) NOT NULL,
    FOREIGN KEY (rendeles_id) REFERENCES rendeles(id) ON DELETE CASCADE,
    FOREIGN KEY (termek_id) REFERENCES termekek(id) ON DELETE RESTRICT,
    INDEX idx_rendeles (rendeles_id),
    INDEX idx_termek (termek_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hirlevel_feliratkozas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kapcsolat_uzenet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    subject VARCHAR(500),
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO kategoria (id, name, slug) 
VALUES
    (1, 'Pulcsik', 'pulcsik'),
    (2, 'Pólók', 'polok'),
    (3, 'Nadrágok', 'nadragok'),
    (4, 'Kabátok', 'kabatok')
ON DUPLICATE KEY UPDATE name=VALUES(name);


INSERT INTO termekek (id, name, price, color, description, kategoria_id, stock) 
VALUES
    (1, 'OVERSIZED PULÓ', '19 990 Ft', '#292524', 'Kényelmes oversized pulóver a téli hideg ellen.', 1, 10),
    (2, 'PREMIUM CIPŐ', '32 990 Ft', '#7f1d1d', 'Prémium minőségű cipő mindennapi viseletre.', 3, 5),
    (3, 'BD CARGO NADRÁG', '21 990 Ft', '#312e81', 'Stílusos cargo nadrág sok zsebbel.', 3, 8),
    (4, 'VINTAGE BOMBER DZSEKI', '42 990 Ft', '#f43f5e', 'Vintage bomber dzseki időtálló formával.', 4, 4),
    (5, 'STATEMENT GRAPHIC PÓLÓ', '16 990 Ft', '#67e8f9', 'Grafikus póló kiemelt dizájnnal.', 2, 20)
ON DUPLICATE KEY UPDATE name=VALUES(name);


INSERT INTO felhasznalok (id, name, email, password_hash, is_admin) 
VALUES
    (1, 'Admin', 'admin@rei.hu', 'changeme', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

CREATE TABLE IF NOT EXISTS kosar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    felhasznalo_id INT NOT NULL,
    termek_id INT NOT NULL,
    mennyiseg INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_termek (felhasznalo_id, termek_id),
    FOREIGN KEY (felhasznalo_id) REFERENCES felhasznalok(id) ON DELETE CASCADE,
    FOREIGN KEY (termek_id) REFERENCES termekek(id) ON DELETE CASCADE,
    INDEX idx_felhasznalo (felhasznalo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


UPDATE felhasznalok SET password_hash = SHA2('admin123', 256) WHERE email = 'admin@rei.hu';
