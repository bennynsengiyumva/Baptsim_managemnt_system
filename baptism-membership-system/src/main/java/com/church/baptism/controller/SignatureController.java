package com.church.baptism.controller;

import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/signature")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class SignatureController {

    @Autowired
    private UserRepository userRepository;

    private static final String UPLOAD_DIR = "uploads/signatures/";

    @GetMapping("/me")
    public ResponseEntity<?> getMySignature(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getSignaturePath() == null || user.getSignaturePath().isEmpty()) {
            return ResponseEntity.ok(Map.of("hasSignature", false));
        }

        try {
            Path filePath = Paths.get(user.getSignaturePath());
            if (Files.exists(filePath)) {
                byte[] fileBytes = Files.readAllBytes(filePath);
                String base64 = Base64.getEncoder().encodeToString(fileBytes);
                String ext = user.getSignaturePath().toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
                return ResponseEntity.ok(Map.of(
                    "hasSignature", true,
                    "signature", "data:" + ext + ";base64," + base64,
                    "path", user.getSignaturePath()
                ));
            }
        } catch (IOException e) {
            // Fall through
        }
        return ResponseEntity.ok(Map.of("hasSignature", false));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('HEAD_OF_DISTRICT', 'HEAD_OF_RUM', 'ADMIN')")
    public ResponseEntity<?> uploadSignature(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        if (user.getSignaturePath() != null && !user.getSignaturePath().isEmpty()) {
            Path oldFile = Paths.get(user.getSignaturePath());
            if (Files.exists(oldFile)) {
                Files.delete(oldFile);
            }
        }

        String filename = "sig_" + UUID.randomUUID().toString().substring(0, 8) +
                         getExtension(file.getOriginalFilename());
        Path filePath = uploadPath.resolve(filename);
        file.transferTo(filePath.toFile());

        user.setSignaturePath(filePath.toString());
        userRepository.save(user);

        byte[] fileBytes = Files.readAllBytes(filePath);
        String base64 = Base64.getEncoder().encodeToString(fileBytes);
        String ext = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

        return ResponseEntity.ok(Map.of(
            "hasSignature", true,
            "signature", "data:" + ext + ";base64," + base64,
            "message", "Signature uploaded successfully"
        ));
    }

    @PostMapping("/save-drawn")
    @PreAuthorize("hasAnyRole('HEAD_OF_DISTRICT', 'HEAD_OF_RUM', 'ADMIN')")
    public ResponseEntity<?> saveDrawnSignature(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) throws IOException {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String base64Data = body.get("signature");
        if (base64Data == null || base64Data.isEmpty()) {
            throw new RuntimeException("Signature data is required");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        if (user.getSignaturePath() != null && !user.getSignaturePath().isEmpty()) {
            Path oldFile = Paths.get(user.getSignaturePath());
            if (Files.exists(oldFile)) {
                Files.delete(oldFile);
            }
        }

        String dataUrl = base64Data;
        if (dataUrl.contains(",")) {
            dataUrl = dataUrl.split(",")[1];
        }
        byte[] imageBytes = Base64.getDecoder().decode(dataUrl);

        String filename = "sig_" + UUID.randomUUID().toString().substring(0, 8) + ".png";
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, imageBytes);

        user.setSignaturePath(filePath.toString());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "hasSignature", true,
            "signature", base64Data,
            "message", "Signature saved successfully"
        ));
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasAnyRole('HEAD_OF_DISTRICT', 'HEAD_OF_RUM', 'ADMIN')")
    public ResponseEntity<?> deleteMySignature(@AuthenticationPrincipal UserDetails userDetails) throws IOException {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getSignaturePath() != null && !user.getSignaturePath().isEmpty()) {
            Path oldFile = Paths.get(user.getSignaturePath());
            if (Files.exists(oldFile)) {
                Files.delete(oldFile);
            }
        }
        user.setSignaturePath(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Signature deleted successfully"));
    }

    private String getExtension(String filename) {
        if (filename == null) return ".png";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".png";
    }
}
