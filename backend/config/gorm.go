package config

import (
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDatabase(viper *viper.Viper, log *logrus.Logger) *gorm.DB {
	username := viper.GetString("database.username")
	password := viper.GetString("database.password")
	host := viper.GetString("database.host")
	port := viper.GetInt("database.port")
	database := viper.GetString("database.name")
	idleConnection := viper.GetInt("database.pool.idle")
	maxConnection := viper.GetInt("database.pool.max")
	maxLifeTimeConnection := viper.GetInt("database.pool.lifetime")
	sslmode := viper.GetString("database.sslmode")
	pgbouncer := viper.GetBool("database.pgbouncer")
	connectionLimit := viper.GetInt("database.connection_limit")

	// Build DSN with optional pgbouncer settings
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=%s TimeZone=Asia/Jakarta", host, username, password, database, port, sslmode)

	// If using pgbouncer, adjust connection settings
	if pgbouncer {
		// For pgbouncer, use the connection_limit as max open connections
		// and ensure we don't exceed the pooler's limits
		if connectionLimit > 0 && connectionLimit < maxConnection {
			maxConnection = connectionLimit
		}
		// For pgbouncer transaction mode, set shorter lifetime
		// to avoid connection issues
		if maxLifeTimeConnection > 300 {
			maxLifeTimeConnection = 300
		}
		log.Infof("PgBouncer mode enabled: maxConnections=%d, connectionLimit=%d", maxConnection, connectionLimit)
	}

	gormConfig := &gorm.Config{
		Logger: logger.New(&logrusWriter{Logger: log}, logger.Config{
			SlowThreshold:             time.Second * 5,
			Colorful:                  false,
			IgnoreRecordNotFoundError: true,
			ParameterizedQueries:      true,
			LogLevel:                  logger.Info,
		}),
	}

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // disables implicit prepared statement caching to avoid "prepared statement already exists" errors
	}), gormConfig)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	connection, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get database connection: %v", err)
	}

	connection.SetMaxIdleConns(idleConnection)
	connection.SetMaxOpenConns(maxConnection)
	connection.SetConnMaxLifetime(time.Second * time.Duration(maxLifeTimeConnection))

	return db
}

type logrusWriter struct {
	Logger *logrus.Logger
}

func (l *logrusWriter) Printf(message string, args ...interface{}) {
	l.Logger.Tracef(message, args...)
}
