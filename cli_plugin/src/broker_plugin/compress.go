/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package main

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"strings"
)

//Extract takes in a destination folder that a desired archive, along with any other directories or files, will be extracted to
func Extract(dest, archive, config, plugins string) error {
	r, err := zip.OpenReader(archive)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		fpath := filepath.Join(dest, f.Name)
		if f.FileInfo().IsDir() {

			err := os.MkdirAll(fpath, 0766)
			if err != nil {
				errorMsg := fmt.Sprintf("Error making directory \"%s\": %s", fpath, err.Error())
				return errors.New(errorMsg)
			}
		} else {

			target, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				errorMsg := fmt.Sprintf("Error making new file at \"%s\": %s", fpath, err.Error())
				return errors.New(errorMsg)
			}
			defer target.Close()

			rc, err := f.Open()
			if err != nil {
				errorMsg := fmt.Sprintf("Error reading in file from archive \"%s\": %s", f.Name, err.Error())
				return errors.New(errorMsg)
			}
			defer rc.Close()

			_, err = io.Copy(target, rc)
			if err != nil {
				errorMsg := fmt.Sprintf("Error copying contents to new file \"%s\": %s", fpath, err.Error())
				return errors.New(errorMsg)
			}
		}
	}

	var pathSuffix string
	pathSuffix = filepath.Base(config)
	tmpPath := dest + string(os.PathSeparator) + pathSuffix
	os.MkdirAll(tmpPath, 0766)
	err = CopyDir(config, tmpPath)
	if err != nil {
		return err
	}

	if len(plugins) > 0 {
		pathSuffix = filepath.Base(plugins)
		tmpPath = dest + string(os.PathSeparator) + pathSuffix
		os.MkdirAll(tmpPath, 0766)
		err = CopyDir(plugins, tmpPath)
		if err != nil {
			return err
		}
	}

	return nil
}

//Compress takes in a source directory and compresses its contents into a target archive
func Compress(source string, dest string) (string, error) {
	target, err := os.Create(dest)
	if err != nil {
		errorMsg := fmt.Sprintf("Error making new archive \"%s\": %s", dest, err.Error())
		return "", errors.New(errorMsg)
	}
	defer target.Close()

	archiveWriter := zip.NewWriter(target)
	defer archiveWriter.Close()

	walkfn := func(fpath string, info os.FileInfo, err error) error {
		if err != nil {
			errorMsg := fmt.Sprintf("Error walking file path: %s", err.Error())
			return errors.New(errorMsg)
		}

		fileHeader, err := zip.FileInfoHeader(info)
		if err != nil {
			errorMsg := fmt.Sprintf("Error getting file header: %s", err.Error())
			return errors.New(errorMsg)
		}

		name, err := filepath.Rel(source, fpath)
		if err != nil {
			return err
		}
		fileHeader.Name = filepath.ToSlash(name)

		if info.IsDir() {
			fileHeader.Name += "/"
		} else {
			//no need to compress what's already compressed
			ext := strings.ToLower(path.Ext(fileHeader.Name))
			if _, ok := compressedFormats[ext]; ok {
				fileHeader.Method = zip.Store
			} else {
				fileHeader.Method = zip.Deflate
			}
		}

		writer, err := archiveWriter.CreateHeader(fileHeader)
		if err != nil {
			errorMsg := fmt.Sprintf("Error adding filemetadata to archive: %s", err.Error())
			return errors.New(errorMsg)
		}

		if info.IsDir() {
			return nil
		}

		if fileHeader.Mode().IsRegular() {
			file, err := os.Open(fpath)
			if err != nil {
				errorMsg := fmt.Sprintf("Error reading in file \"%s\": %s", fpath, err.Error())
				return errors.New(errorMsg)
			}
			defer file.Close()

			_, err = io.Copy(writer, file)
			if err != nil {
				errorMsg := fmt.Sprintf("Error copying contents to new file \"%s\" in archive: %s", fileHeader.Name, err.Error())
				return errors.New(errorMsg)
			}
		}
		return nil
	}

	err = filepath.Walk(source, walkfn)
	if err != nil {
		return "", err
	}

	return dest, nil
}

//CopyFile takes in a source and destination string and copies a file at source to the destinaton
func CopyFile(source string, dest string) error {
	sourceFile, err := os.Open(source)
	if err != nil {
		errorMsg := fmt.Sprintf("Error reading in file \"%s\": %s", source, err.Error())
		return errors.New(errorMsg)
	}
	defer sourceFile.Close()

	sourceInfo, err := os.Stat(source)
	if err != nil {
		errorMsg := fmt.Sprintf("Error reading in file \"%s\" info: %s", source, err.Error())
		return errors.New(errorMsg)
	}

	destFile, err := os.OpenFile(dest, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, sourceInfo.Mode())
	if err != nil {
		errorMsg := fmt.Sprintf("Error making new file at \"%s\": %s", dest, err.Error())
		return errors.New(errorMsg)
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		errorMsg := fmt.Sprintf("Error copying contents to new file \"%s\" in archive: %s", dest, err.Error())
		return errors.New(errorMsg)
	}
	return nil
}

//CopyDir takes in a source and destination string an copies a directory and its contents to the destination
func CopyDir(source string, dest string) error {
	sourceInfo, err := os.Stat(source)
	if err != nil {
		errorMsg := fmt.Sprintf("Error reading in directory \"%s\" info: %s", source, err.Error())
		return errors.New(errorMsg)
	}

	if !sourceInfo.IsDir() {
		errorMsg := "Specified file is not a directory"
		return errors.New(errorMsg)
	}

	err = os.MkdirAll(dest, sourceInfo.Mode())
	if err != nil {
		errorMsg := fmt.Sprintf("Error making directory \"%s\": %s", dest, err.Error())
		return errors.New(errorMsg)
	}

	files, err := ioutil.ReadDir(source)
	if err != nil {
		errorMsg := fmt.Sprintf("Error reading in directory: %s", err.Error())
		return errors.New(errorMsg)
	}

	for _, file := range files {
		spath := source + string(os.PathSeparator) + file.Name()
		dpath := dest + string(os.PathSeparator) + file.Name()

		if file.IsDir() {
			err := CopyDir(spath, dpath)
			if err != nil {
				return err
			}
		} else {
			err := CopyFile(spath, dpath)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

var compressedFormats = map[string]struct{}{
	".7z":   {},
	".avi":  {},
	".bz2":  {},
	".cab":  {},
	".gif":  {},
	".gz":   {},
	".jar":  {},
	".jpeg": {},
	".jpg":  {},
	".lz":   {},
	".lzma": {},
	".mov":  {},
	".mp3":  {},
	".mp4":  {},
	".mpeg": {},
	".mpg":  {},
	".png":  {},
	".rar":  {},
	".tbz2": {},
	".tgz":  {},
	".txz":  {},
	".xz":   {},
	".zip":  {},
	".zipx": {},
	".war":  {},
}
