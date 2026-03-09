package middleware

import (
	"hris_backend/helper"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
)

type JWTClaims struct {
	UserID       string   `json:"userId"`
	Email        string   `json:"email"`
	Role         string   `json:"role"`
	Name         string   `json:"name"`
	Permissions  []string `json:"permissions,omitempty"`
	Is2FAPending bool     `json:"is2faPending"`
	jwt.RegisteredClaims
}

func AuthMiddleware(config *viper.Viper) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return helper.UnauthorizedResponse(c, "Authorization header is required")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return helper.UnauthorizedResponse(c, "Invalid authorization header format")
		}

		tokenString := parts[1]
		secret := config.GetString("jwt.secret")

		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil {
			return helper.UnauthorizedResponse(c, "Invalid or expired token")
		}

		if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
			c.Locals("userId", claims.UserID)
			c.Locals("email", claims.Email)
			c.Locals("role", claims.Role)
			c.Locals("name", claims.Name)
			c.Locals("permissions", claims.Permissions)
			return c.Next()
		}

		return helper.UnauthorizedResponse(c, "Invalid token claims")
	}
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, _ := c.Locals("role").(string)
		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}
		return helper.ForbiddenResponse(c, "You don't have permission to access this resource")
	}
}

func RequirePermission(codes ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		rawPermissions := c.Locals("permissions")
		permissions, ok := rawPermissions.([]string)
		if !ok || len(permissions) == 0 {
			return helper.ForbiddenResponse(c, "You don't have permission to access this resource")
		}

		allowed := map[string]struct{}{}
		for _, permission := range permissions {
			normalized := strings.ToLower(strings.TrimSpace(permission))
			if normalized == "" {
				continue
			}
			allowed[normalized] = struct{}{}
		}

		for _, code := range codes {
			normalized := strings.ToLower(strings.TrimSpace(code))
			if _, exists := allowed[normalized]; exists {
				return c.Next()
			}
		}

		return helper.ForbiddenResponse(c, "You don't have permission to access this resource")
	}
}
