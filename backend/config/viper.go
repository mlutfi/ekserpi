package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

func NewViper() *viper.Viper {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config := viper.New()
	config.SetDefault("app.name", "POS Backend API")
	config.SetDefault("web.port", 4001)
	config.SetDefault("web.prefork", false)
	config.SetDefault("database.host", "localhost")
	config.SetDefault("database.port", 5432)
	config.SetDefault("database.name", "pos_db")
	config.SetDefault("database.username", "postgres")
	config.SetDefault("database.password", "postgres")
	config.SetDefault("database.sslmode", "disable")
	config.SetDefault("database.pool.idle", 10)
	config.SetDefault("database.pool.max", 10)
	config.SetDefault("database.pool.lifetime", 300)
	config.SetDefault("database.pgbouncer", false)
	config.SetDefault("database.connection_limit", 5)
	config.SetDefault("jwt.secret", "your-secret-key-change-in-production")
	config.SetDefault("jwt.expiration", 24)
	config.SetDefault("midtrans.env", "sandbox")

	// Bind environment variables
	config.BindEnv("web.port", "PORT")
	config.BindEnv("database.host", "DB_HOST")
	config.BindEnv("database.port", "DB_PORT")
	config.BindEnv("database.name", "DB_NAME")
	config.BindEnv("database.username", "DB_USER")
	config.BindEnv("database.password", "DB_PASSWORD")
	config.BindEnv("database.sslmode", "DB_SSLMODE")
	config.BindEnv("database.pool.idle", "DB_POOL_IDLE")
	config.BindEnv("database.pool.max", "DB_POOL_MAX")
	config.BindEnv("database.pool.lifetime", "DB_POOL_LIFETIME")
	config.BindEnv("database.pgbouncer", "DB_PGBOUNCER")
	config.BindEnv("database.connection_limit", "DB_CONNECTION_LIMIT")
	config.BindEnv("jwt.secret", "JWT_SECRET")
	config.BindEnv("jwt.expiration", "JWT_EXPIRATION")
	config.BindEnv("midtrans.merchant_id", "MIDTRANS_MERCHANT_ID")
	config.BindEnv("midtrans.client_key", "MIDTRANS_CLIENT_KEY")
	config.BindEnv("midtrans.server_key", "MIDTRANS_SERVER_KEY")
	config.BindEnv("midtrans.env", "MIDTRANS_ENV")

	// Set from environment if available
	if port := os.Getenv("PORT"); port != "" {
		config.Set("web.port", parseInt(port))
	}
	if dbHost := os.Getenv("DB_HOST"); dbHost != "" {
		config.Set("database.host", dbHost)
	}
	if dbPort := os.Getenv("DB_PORT"); dbPort != "" {
		config.Set("database.port", parseInt(dbPort))
	}
	if dbName := os.Getenv("DB_NAME"); dbName != "" {
		config.Set("database.name", dbName)
	}
	if dbUser := os.Getenv("DB_USER"); dbUser != "" {
		config.Set("database.username", dbUser)
	}
	if dbPass := os.Getenv("DB_PASSWORD"); dbPass != "" {
		config.Set("database.password", dbPass)
	}
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		config.Set("jwt.secret", jwtSecret)
	}
	if midtransServerKey := os.Getenv("MIDTRANS_SERVER_KEY"); midtransServerKey != "" {
		config.Set("midtrans.server_key", midtransServerKey)
	}
	if midtransClientKey := os.Getenv("MIDTRANS_CLIENT_KEY"); midtransClientKey != "" {
		config.Set("midtrans.client_key", midtransClientKey)
	}
	if midtransMerchantID := os.Getenv("MIDTRANS_MERCHANT_ID"); midtransMerchantID != "" {
		config.Set("midtrans.merchant_id", midtransMerchantID)
	}
	if midtransEnv := os.Getenv("MIDTRANS_ENV"); midtransEnv != "" {
		config.Set("midtrans.env", midtransEnv)
	}

	return config
}

func parseInt(s string) int {
	var result int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			result = result*10 + int(c-'0')
		}
	}
	return result
}
