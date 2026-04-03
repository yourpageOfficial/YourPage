package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	AdminID    uuid.UUID `gorm:"type:uuid"`
	Action     string
	TargetType *string
	TargetID   *uuid.UUID `gorm:"type:uuid"`
	Details    *string    `gorm:"type:jsonb"`
	IPAddress  string
	CreatedAt  interface{}
}

func (AuditLog) TableName() string { return "admin_audit_logs" }

func AdminAudit(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Only log mutating actions
		if c.Request.Method == "GET" || c.Writer.Status() >= 400 {
			return
		}

		adminID, exists := c.Get("user_id")
		if !exists { return }

		uid, ok := adminID.(uuid.UUID)
		if !ok { return }

		db.Create(&AuditLog{
			ID:        uuid.New(),
			AdminID:   uid,
			Action:    c.Request.Method + " " + c.FullPath(),
			IPAddress: c.ClientIP(),
		})
	}
}
