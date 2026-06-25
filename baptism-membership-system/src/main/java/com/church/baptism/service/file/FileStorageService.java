package com.church.baptism.service.file;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class FileStorageService {

    private final String UPLOAD_DIR = System.getProperty("user.home") + "/uploads/";

    public String uploadFile(MultipartFile file) {

        try {
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            File destination = new File(UPLOAD_DIR + fileName);

            file.transferTo(destination);

            return destination.getAbsolutePath();

        } catch (IOException e) {
            throw new RuntimeException("File upload failed");
        }
    }
}