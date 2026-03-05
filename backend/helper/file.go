package helper

import (
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// CreateDirIfNotExists creates a directory if it does not exist
func CreateDirIfNotExists(dir string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		err = os.MkdirAll(dir, 0755)
		if err != nil {
			return err
		}
	}
	return nil
}

// GenerateSafeFilename generates a unique safe filename with original extension
func GenerateSafeFilename(originalFilename string) string {
	ext := strings.ToLower(filepath.Ext(originalFilename))
	// only allow image extensions, default to .png if empty or unknown
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		ext = ".png"
	}

	newFileName := uuid.New().String() + "-" + time.Now().Format("20060102150405") + ext
	return newFileName
}
